import { Quaternion, Vector2, Vector3 } from "three";
import { vec3, quat } from "@react-three/rapier";
import { Individual } from "../neat/Population";
import {
  RigidBodyDesc,
  World,
  RigidBody,
  ColliderDesc,
} from "@dimforge/rapier3d-compat";
import { Agent } from "./Simulation";
import { ROCKET_MASK } from "../utils/BitMasks";
import _ from "lodash";
import { sigmoid } from "../neat/Neuron";

export type RocketConfig = {
  mass: number; // in Kg
  length: number; // in meters
  radius: number; // in meters
  maxAngle: number; // in radians
  maxThrust: number; // in newtons * ticks
  fuelCapacity: number; // cumulative amount of "thrust control" that can be used
};

export type SimulationConfig = {
  target: Vector3;
  boundsRadius: number; // how far from origin can the rocket be before going out of bounds
  maxSteps: number;
};

export class Rocket implements Agent {
  public thrustVector: Vector3 = new Vector3(); // world relative vector
  public rocketAlignedThrustVector = new Vector3(); // rocket relative vector

  public _fitness: number = 0;
  public alive: boolean = true;
  public fuel: number = 0;
  public vecToTarget = new Vector3();
  public distanceToTarget: number = Number.MAX_SAFE_INTEGER;
  public closestDistToTarget: number = Number.MAX_SAFE_INTEGER;
  public fuelAtClosest: number = 0;
  public orientation = new Quaternion();
  public angularVelocity = new Vector3();
  public velocity = new Vector3();
  public rigidBody: RigidBody | undefined;

  constructor(
    public readonly startPosition: Vector3,
    public readonly startVelocity: Vector3,
    public readonly config: RocketConfig,
    public readonly simConfig: SimulationConfig,
    public readonly brain?: Individual
  ) {
    this.fuel = config.fuelCapacity;
    this.distanceToTarget = this.simConfig.target
      .clone()
      .sub(this.startPosition)
      .length();
  }

  public fitness() {
    return this._fitness;
  }

  public init(world: World) {
    let rigidBodyDesc = RigidBodyDesc.dynamic().setTranslation(
      ...this.startPosition.toArray()
    );
    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    let colliderDesc = ColliderDesc.cylinder(
      this.config.length / 2,
      this.config.radius
    )
      .setDensity(1.0)
      .setCollisionGroups(ROCKET_MASK);
    world.createCollider(colliderDesc, this.rigidBody);
  }

  public step() {
    this.fixYAxis();
    this.updateStats();
    this.runAi();
    return this.alive;
  }

  // Numerical instability causes spin to accumulate in the y-axis.
  // This removes twist from the orientation and spin from the
  // angular velocity
  public fixYAxis() {
    if (!this.rigidBody) {
      return;
    }
    const rot = this.rigidBody.rotation();

    const orientation = quat(rot).normalize();
    // Remove all rotation in local y-axis
    const invOrientation = orientation.clone().invert();
    const up = new Vector3(0, 1, 0);
    const w = up.clone().applyQuaternion(invOrientation).normalize();
    const noTwistRotation = invOrientation.clone().setFromUnitVectors(w, up);
    this.rigidBody.setRotation(noTwistRotation, true);

    // find angular velocity in y-axis
    const angVel = vec3(this.rigidBody.angvel());
    const localAngVel = angVel.applyQuaternion(invOrientation);
    localAngVel.y = 0; // remove spin
    // transform it back
    this.rigidBody.setAngvel(
      localAngVel.applyQuaternion(noTwistRotation),
      true
    );
  }

  public updateStats() {
    // Freeze stats once dead
    if (!this.alive) {
      return;
    }

    if (!this.rigidBody) {
      return;
    }

    // Check for failure conditions
    // Out of bounds?
    const pos = vec3(this.rigidBody.translation());
    if (pos.length() > this.simConfig.boundsRadius) {
      this.alive = false;
      return;
    }

    // Crashed into ground?
    if (pos.y <= 0) {
      this.alive = false;
      return;
    }

    this.vecToTarget = this.simConfig.target.clone().sub(pos);

    // use a modified distance to target that rewards x/z distance over y distance
    const modifiedDist = new Vector3(
      this.vecToTarget.x * 10,
      this.vecToTarget.y,
      this.vecToTarget.z * 10
    );
    this.distanceToTarget = modifiedDist.length();
    this.angularVelocity = vec3(this.rigidBody.angvel());
    if (this.distanceToTarget < this.closestDistToTarget) {
      this.fuelAtClosest = this.fuel;
      this.closestDistToTarget = this.distanceToTarget;
      this._fitness =
        (this.fuelAtClosest * 100) /
        (this.closestDistToTarget + 1 + this.angularVelocity.length());
    }

    // collect other stats
    this.orientation = quat(this.rigidBody.rotation()).normalize();
    this.velocity = vec3(this.rigidBody.linvel());

    // Check if we hit target
    if (this.distanceToTarget < 1) {
      this.alive = false;
    }
  }

  // This should run after updateStats so that the info is fresh
  public runAi() {
    if (!this.brain?.kernel) {
      return;
    }
    // Prepare the inputs
    const inputs: number[] = [];
    inputs.push(...this.vecToTarget); // 3
    inputs.push(...this.orientation); // 4
    inputs.push(...this.angularVelocity); // 3
    inputs.push(...this.velocity); // 3
    inputs.push(this.fuel); // 1
    const outputs = this.brain.kernel.predict(inputs); // 14 inputs, 3 outputs
    this.control(
      sigmoid(outputs[0]),
      new Vector2(sigmoid(outputs[1]) * 2 - 1, sigmoid(outputs[2]) * 2 - 1)
    );
  }

  public control(rawThrust: number, rawThrustVector: Vector2) {
    if (!this.alive) {
      this.thrustVector.set(0, 0, 0);
      this.rocketAlignedThrustVector.set(0, 0, 0);
      return;
    }

    // Clamp thrust so we don't accept bad inputs
    let thrustVector =
      rawThrustVector.length() > 1
        ? rawThrustVector.clone().normalize()
        : rawThrustVector;
    // thrust is % of max
    let thrust = _.clamp(rawThrust, 0, 1) * this.config.maxThrust;

    // Manage fuel
    let thrustControl = thrust;
    if (this.fuel >= thrust) {
      this.fuel -= thrust;
    } else {
      // Use the last bit of fuel in this burn
      thrustControl = this.fuel;
      this.fuel = 0;
    }

    const x = Math.sin(thrustVector.x * this.config.maxAngle);
    const z = Math.sin(-thrustVector.y * this.config.maxAngle);
    const y = -(1 - x * x - z * z); // y should always be negative

    const thrustVDelta = new Vector3(x, y, z);

    this.rocketAlignedThrustVector = thrustVDelta
      .clone()
      .multiplyScalar(thrustControl);

    let netForceVector = this.rocketAlignedThrustVector.clone().negate();

    if (!this.rigidBody) {
      return;
    }
    this.rigidBody.resetForces(true);
    this.rigidBody.resetTorques(true);
    if (netForceVector.length() === 0) {
      return;
    }

    const rot = this.rigidBody.rotation();
    if (!rot) {
      return;
    }
    const orientation = quat(rot).normalize();

    const localPropulsiveVector = netForceVector.clone();
    localPropulsiveVector.x = 0;
    localPropulsiveVector.z = 0;
    const worldPropulsiveVector =
      localPropulsiveVector.applyQuaternion(orientation);
    this.rigidBody.addForce(worldPropulsiveVector, true);

    // The tangential force vector at the bottom of the rocket
    const localTangentVec = netForceVector.clone();
    localTangentVec.y = 0;
    // Taking the cross product with vector from center of mass gives torque vector
    const localImpulsePos = new Vector3(0, -this.config.length / 2, 0);
    const localTorque = localImpulsePos.clone().cross(localTangentVec);
    // Rotate it to get world torque
    const worldTorque = localTorque.applyQuaternion(orientation);

    this.rigidBody.addTorque(worldTorque, true);
  }
}

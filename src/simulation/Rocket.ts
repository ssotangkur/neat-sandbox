import { Quaternion, Vector2, Vector3 } from "three";
import { ThrustHandler } from "../components/three/RocketViz";
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

  private thrustHandler: ThrustHandler | undefined;
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

  public registerThrustHandler(handler: ThrustHandler) {
    this.thrustHandler = handler;
    const unregister = () => {
      if (this.thrustHandler === handler) {
        this.thrustHandler = undefined;
      }
    };
    return unregister;
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
    this.distanceToTarget = this.vecToTarget.length();
    if (this.distanceToTarget < this.closestDistToTarget) {
      this.fuelAtClosest = this.fuel;
      this.closestDistToTarget = this.distanceToTarget;
      this._fitness =
        (this.fuelAtClosest * 100) / (this.closestDistToTarget + 1);
    }

    // collect other stats
    this.orientation = quat(this.rigidBody.rotation()).normalize();
    this.angularVelocity = vec3(this.rigidBody.angvel());
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
    this.control(outputs[0], new Vector2(outputs[1], outputs[2]));
  }

  public control(thrust: number, thrustVector: Vector2) {
    if (thrust === 0 || !this.alive) {
      this.thrustVector.set(0, 0, 0);
      this.rocketAlignedThrustVector.set(0, 0, 0);
      this.thrustHandler?.(this.rocketAlignedThrustVector);
      return;
    }

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
    const clampedThrust = Math.min(this.config.maxThrust, thrustControl);
    this.rocketAlignedThrustVector = thrustVDelta
      .clone()
      .multiplyScalar(clampedThrust);

    let netForceVector = this.rocketAlignedThrustVector.clone().negate();
    this.thrustHandler?.(netForceVector);

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

import { Cylinder, Cone } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Mesh, Vector3 } from "three";
import { Rocket } from "../../simulation/Rocket";
import {
  RapierRigidBody,
  RigidBody,
  quat,
  useAfterPhysicsStep,
  vec3,
} from "@react-three/rapier";
import { ROCKET_MASK } from "../../utils/BitMasks";

export type ThrustHandler = (thrustVector: Vector3) => void;

export type RocketVizProps = {
  rocket: Rocket;
};

export const RocketViz = ({ rocket }: RocketVizProps) => {
  const cylRef = useRef<Mesh>(null!);
  const rigidBody = useRef<RapierRigidBody>(null);

  useAfterPhysicsStep(() => {
    if (!rigidBody.current) {
      return;
    }
    const rot = rigidBody.current.rotation();

    const orientation = quat(rot).normalize();
    // Remove all rotation in local y-axis
    const invOrientation = orientation.clone().invert();
    const w = up.clone().applyQuaternion(invOrientation).normalize();
    const noTwistRotation = invOrientation.clone().setFromUnitVectors(w, up);
    rigidBody.current.setRotation(noTwistRotation, true);

    // find angular velocity in y-axis
    const angVel = vec3(rigidBody.current.angvel());
    const localAngVel = angVel.applyQuaternion(invOrientation);
    localAngVel.y = 0; // remove spin
    // transform it back
    rigidBody.current.setAngvel(
      localAngVel.applyQuaternion(noTwistRotation),
      true
    );
  });

  const localImpulsePos = new Vector3(0, -rocket.config.length / 2, 0);
  const up = new Vector3(0, 1, 0);

  const onThrustInput: ThrustHandler = (thrustVector: Vector3) => {
    rigidBody.current?.resetForces(true);
    rigidBody.current?.resetTorques(true);
    if (thrustVector.length() === 0) {
      return;
    }

    const rot = rigidBody.current?.rotation();
    if (!rot) {
      return;
    }
    const orientation = quat(rot).normalize();

    const localPropulsiveVector = thrustVector.clone();
    localPropulsiveVector.x = 0;
    localPropulsiveVector.z = 0;
    const worldPropulsiveVector =
      localPropulsiveVector.applyQuaternion(orientation);
    rigidBody.current?.addForce(worldPropulsiveVector, true);

    // The tangential force vector at the bottom of the rocket
    const localTangentVec = thrustVector.clone();
    localTangentVec.y = 0;
    // Taking the cross product with vector from center of mass gives torque vector
    const localTorque = localImpulsePos.clone().cross(localTangentVec);
    // Rotate it to get world torque
    const worldTorque = localTorque.applyQuaternion(orientation);

    rigidBody.current?.addTorque(worldTorque, true);
  };

  useEffect(() => {
    return rocket.registerThrustHandler(onThrustInput);
  }, [rocket]);

  const radius = rocket.config.radius;
  const coneHeight = radius * 3;
  const bodyLength = rocket.config.length;

  return (
    <RigidBody
      type="dynamic"
      colliders="cuboid"
      collisionGroups={ROCKET_MASK}
      position={rocket.startPosition}
      linearDamping={0.5}
      angularDamping={1.0}
      enabledRotations={[true, false, true]}
      ref={rigidBody}
    >
      <Cylinder args={[radius, radius, bodyLength]} ref={cylRef}>
        <meshStandardMaterial color="hotpink" />
      </Cylinder>
      <Cone
        args={[radius, coneHeight]}
        position={[0, bodyLength / 2 + coneHeight / 2, 0]}
      >
        <meshStandardMaterial color="green" />
      </Cone>
    </RigidBody>
  );
};

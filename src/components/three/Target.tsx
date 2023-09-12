import { RigidBody } from "@react-three/rapier";
import { Rocket } from "../../simulation/Rocket";
import { Sphere } from "@react-three/drei";

export const Target = ({ rocket }: { rocket: Rocket }) => {
  return (
    <RigidBody type="fixed">
      <Sphere position={rocket.simConfig.target}>
        <meshLambertMaterial color="green" />
      </Sphere>
    </RigidBody>
  );
};

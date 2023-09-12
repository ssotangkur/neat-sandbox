import { Cylinder, Sphere } from "@react-three/drei";
import { Rocket } from "../../simulation/Rocket";
import { AgentRenderer } from "./SimRenderer";
import { useEffect, useRef } from "react";
import { vec3, quat } from "@react-three/rapier";
import { Mesh } from "three";

export const RocketAgentRenderer: AgentRenderer<Rocket> = (props) => {
  const rocket = props.agent;

  const cylRef = useRef<Mesh>(null!);

  const updatePositionOrientation = () => {
    if (!rocket.rigidBody) {
      return;
    }
    const pos = vec3(rocket.rigidBody?.translation());
    const orient = quat(rocket.rigidBody?.rotation());
    cylRef.current.position.set(...pos.toArray());
    cylRef.current.setRotationFromQuaternion(orient);
  };

  useEffect(() => {
    return props.subscribe(updatePositionOrientation);
  }, [props.subscribe]);

  const { radius, length } = rocket.config;

  return (
    <>
      <Cylinder args={[radius, radius, length]} ref={cylRef}>
        <meshLambertMaterial color="grey" />
      </Cylinder>

      <Sphere args={[1]} position={rocket.simConfig.target}>
        <meshLambertMaterial color="red" />
      </Sphere>
    </>
  );
};

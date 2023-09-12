import { Line } from "@react-three/drei";
import { Vector3 } from "three";

const origin = new Vector3(0, 0, 0);
const xAxis = new Vector3(1, 0, 0);
const yAxis = new Vector3(0, 1, 0);
const zAxis = new Vector3(0, 0, 1);

export const Axes = ({ length }: { length?: number }) => {
  const len = length ?? 10; // default 10

  return (
    <>
      <Line points={[origin, xAxis.clone().multiplyScalar(len)]} color="red" />
      <Line
        points={[origin, yAxis.clone().multiplyScalar(len)]}
        color="green"
      />
      <Line points={[origin, zAxis.clone().multiplyScalar(len)]} color="blue" />
    </>
  );
};

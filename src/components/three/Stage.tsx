import { Box } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { STAGE_MASK } from "../../utils/BitMasks";

export const Stage = () => {
  return (
    <RigidBody
      colliders={"cuboid"}
      restitution={0.1}
      type="fixed"
      position={[0, -10, 0]}
      collisionGroups={STAGE_MASK}
    >
      <Box args={[200, 1, 200]}>
        <meshPhongMaterial color="white" />
      </Box>
    </RigidBody>
  );
};

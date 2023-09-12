import { styled } from "styled-components";
import {
  CommonProps,
  RowColumnBase,
  spacingRightExceptLastChild,
} from "./Common";

export type RowProps = CommonProps;

export const Row = styled(RowColumnBase)`
  flex-direction: row;
  ${(props) => (props.spacing ? spacingRightExceptLastChild : "")}
`;

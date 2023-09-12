import { styled } from "styled-components";
import {
  CommonProps,
  RowColumnBase,
  spacingBottomExceptLastChild,
} from "./Common";

export type ColumnProps = CommonProps;

export const Column = styled(RowColumnBase)`
  flex-direction: column;
  ${(props) => (props.spacing ? spacingBottomExceptLastChild : "")}
`;

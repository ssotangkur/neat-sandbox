import styled, { css } from "styled-components";

export type OverflowOption = "auto" | "hidden";

export const overflow = css<{ overflow?: OverflowOption }>`
  overflow: ${(props) => props.overflow};
`;

export const overflowX = css<{ $overflowX?: OverflowOption }>`
  overflow-x: ${(props) => props.$overflowX};
`;

export const overflowY = css<{ $overflowY?: OverflowOption }>`
  overflow-y: ${(props) => props.$overflowY};
`;

export const padding = css<{ $padding?: number }>`
  padding: ${(props) => props.$padding}em;
`;

export const spacingRightExceptLastChild = css<{ spacing?: number }>`
  & > *:not(:last-child) {
    margin-right: ${(props) => props.spacing}em;
  }
`;

export const spacingBottomExceptLastChild = css<{ spacing?: number }>`
  & > *:not(:last-child) {
    margin-bottom: ${(props) => props.spacing}em;
  }
`;

export const maxWidth100Pct = css`
  max-width: 100%;
`;

export const maxHeight100Pct = css`
  max-height: 100%;
`;

export const wrap = css`
  flex-wrap: wrap;
`;

const height = css<{ height?: number | string }>`
  height: ${(props) => props.height}px;
`;

const width = css<{ width?: number | string }>`
  width: ${(props) =>
    typeof props.width === "string" ? props.width : props.width + "em"};
`;

const grow = css`
  flex-grow: 1;
`;

const shrink = css`
  flex-shrink: 1;
  min-height: 0;
  min-width: 0;
  flex-basis: 0; // Keeps content from limiting how much this can shrink
`;

const noshrink = css`
  flex-shrink: 0;
`;

export type CommonProps = {
  spacing?: number;
  overflow?: OverflowOption;
  $overflowX?: OverflowOption;
  $overflowY?: OverflowOption;
  $padding?: number;
  className?: string;
  $constrainchildwidth?: boolean;
  $constrainchildheight?: boolean;
  $wrap?: boolean;
  height?: string | number;
  width?: string | number;
  $grow?: boolean | string;
  $shrink?: boolean | string;
  $noshrink?: boolean | string;
};

export const RowColumnBase = styled.div<CommonProps>`
  display: flex;
  box-sizing: border-box;
  ${(props) => (props.overflow ? overflow : "")}
  ${(props) => (props.$overflowX ? overflowX : "")}
  ${(props) => (props.$overflowY ? overflowY : "")}
  ${(props) => (props.$padding ? padding : "")}
  ${(props) => (props.$constrainchildwidth ? maxWidth100Pct : "")}
  ${(props) => (props.$constrainchildheight ? maxHeight100Pct : "")}
  ${(props) => (props.$wrap ? wrap : "")}
  ${(props) => (props.height ? height : "")}
  ${(props) => (props.width ? width : "")}
  ${(props) => (props.$grow ? grow : "")}
  ${(props) => (props.$grow ? shrink : "")}
  ${(props) => (props.$grow ? noshrink : "")}
`;

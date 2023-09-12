import styled from "styled-components";

export const Button = styled.button<{ disabled?: boolean }>`
  line-height: 2em;
  font-weight: bold;
  background-color: var(--primary-background);
  color: var(--primary-text-color);
  border-radius: var(--border-radius);
  box-shadow: 3px 3px 5px grey;
  border: 0;
  width: fit-content;
  height: fit-content;
  ${(props) => props.disabled && "opacity: 0.3;"};
  &:hover {
    background-color: var(--focus-background);
    color: var(--focus-text-color);
    box-shadow: 3px 3px 4px grey;
  }
  &:focus,
  &:focus-visible {
    outline: 0;
  }
  &:active {
    transform: translateX(2px) translateY(2px);
    box-shadow: 1px 1px 3px #030f40;
  }
`;

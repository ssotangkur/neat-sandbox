import { styled } from "styled-components";

export type KeyValue = Record<string, any>;

export type KeyValueProps = {
  data: KeyValue;
};

const TH = styled.th`
  padding-left: 1em;
  padding-right: 2em;
  padding-top: 0.5em;
  padding-bottom: 0.5em;
`;

const TD = styled.td`
  padding-left: 1em;
  padding-right: 2em;
  border-left: solid 3px var(--accent-background-color);
`;

const THead = styled.thead`
  background-color: var(--accent-background-color);
  color: var(--accent-text-color);
`;

export const KeyValueTable = ({ data }: KeyValueProps) => {
  return (
    <table>
      <THead>
        <tr>
          {Object.entries(data).map(([key], i) => (
            <TH key={i}>{key}</TH>
          ))}
        </tr>
      </THead>
      <tbody>
        <tr>
          {Object.entries(data).map(([_, value], i) => (
            <TD key={i}>{value}</TD>
          ))}
        </tr>
      </tbody>
    </table>
  );
};

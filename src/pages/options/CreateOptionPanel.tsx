import { useState } from "react";
import { EvalType, createOptions } from "../../neat/Options";
import { Button } from "../../ui/Button";
import { Column } from "../../ui/Column";
import { Panel } from "../../ui/Panel";
import { Row } from "../../ui/Row";
import { KeyOption } from "./OptionsPage";

export type CreateOptionPanelProps = {
  addOption: (keyOptions: KeyOption) => void;
};

export type RequiredProps = {
  name?: string;
  count?: number;
  inputs?: number;
  outputs?: number;
  evalType?: EvalType;
};

export const CreateOptionPanel = ({
  addOption: onSubmit,
}: CreateOptionPanelProps) => {
  const [required, setRequired] = useState<RequiredProps>({});

  const createOnChange = (
    key: keyof RequiredProps
  ): React.ChangeEventHandler<HTMLInputElement> => {
    return (e) => {
      setRequired((prev) => {
        const next = { ...prev };
        switch (key) {
          case "name":
            next[key] = e.target.value;
            break;
          case "evalType":
            next[key] = e.target.value === "Rocket" ? "Rocket" : "XOR";
            break;
          default:
            next[key] = Number(e.target.value);
        }
        return next;
      });
    };
  };

  const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRequired((prev) => {
      const next: RequiredProps = {
        ...prev,
        evalType: e.target.value === "Rocket" ? "Rocket" : "XOR",
      };
      return next;
    });
  };

  const onClick = () => {
    const { name, ...reqProps } = required as Required<RequiredProps>;
    const option = createOptions(reqProps);
    onSubmit({ key: name, option });
  };

  const valid =
    required.count !== undefined &&
    required.inputs !== undefined &&
    required.outputs !== undefined;

  return (
    <Panel $padding={1}>
      <Column spacing={1}>
        <Row spacing={0.5}>
          <span>Name:</span>
          <input
            onChange={createOnChange("name")}
            value={required["name"] ?? ""}
          ></input>
        </Row>
        <Row spacing={0.5}>
          <span>Count:</span>
          <input
            onChange={createOnChange("count")}
            value={required["count"] ?? ""}
          ></input>
        </Row>
        <Row spacing={0.5}>
          <span>Num Inputs:</span>
          <input
            onChange={createOnChange("inputs")}
            value={required["inputs"] ?? ""}
          ></input>
        </Row>
        <Row spacing={0.5}>
          <span>Num Outputs:</span>
          <input
            onChange={createOnChange("outputs")}
            value={required["outputs"] ?? ""}
          ></input>
        </Row>
        <Row spacing={0.5}>
          <span>Eval Type:</span>
          <select onChange={onSelect} value={required["evalType"]}>
            <option value="XOR">XOR</option>
            <option value="Rocket">Rocket</option>
          </select>
        </Row>
        <Row>
          <Button disabled={!valid} onClick={onClick}>
            Add New Option
          </Button>
        </Row>
      </Column>
    </Panel>
  );
};

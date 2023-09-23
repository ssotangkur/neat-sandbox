import styled from "styled-components";
import { Panel } from "../../ui/Panel";
import { Row } from "../../ui/Row";
import { Button } from "../../ui/Button";
import { Column } from "../../ui/Column";
import { PopulationOptions, createOptions } from "../../neat/Options";
import { deleteOptionAtom, optionAtom } from "./OptionsPage";
import { atom, useAtom } from "jotai";

const FullWidthTextArea = styled.textarea`
  width: 100%;
  height: 100%;
  border: unset;
  padding: 1em;
  resize: none;
`;

const contentAtom = atom(
  (get) => {
    const options = get(optionAtom);
    return JSON.stringify(options, undefined, 4);
  },
  (_, set, update: string) => {
    const optionToSave: PopulationOptions = createOptions(JSON.parse(update));
    set(optionAtom, optionToSave);
  }
);

export const OptionEditor = () => {
  const [, saveOption] = useAtom(optionAtom);
  const [content, setContent] = useAtom(contentAtom);
  const [, deleteOption] = useAtom(deleteOptionAtom);

  const onSaveClicked = () => {
    const optionToSave: PopulationOptions = createOptions(JSON.parse(content));
    saveOption(optionToSave);
  };

  return (
    <Column $grow spacing={1}>
      <Panel $grow>
        <FullWidthTextArea
          onChange={(e) => setContent(e.target.value)}
          value={content}
          spellCheck={false}
        ></FullWidthTextArea>
      </Panel>
      <Row spacing={1}>
        <Button onClick={onSaveClicked} disabled={!content}>
          Save
        </Button>
        <Button onClick={deleteOption} disabled={!content}>
          Delete Option
        </Button>
      </Row>
    </Column>
  );
};

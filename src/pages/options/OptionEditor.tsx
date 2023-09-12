import styled from "styled-components";
import { Panel } from "../../ui/Panel";
import { Row } from "../../ui/Row";
import { Button } from "../../ui/Button";
import { Column } from "../../ui/Column";

const FullWidthTextArea = styled.textarea`
  width: 100%;
  height: 100%;
  border: unset;
  padding: 1em;
  resize: none;
`;

export type OptionEditorProps = {
  content: string | undefined;
  updateOption: (updatedContent: string) => void;
  saveOption: () => void;
  deleteOption: () => void;
};

export const OptionEditor = ({
  content,
  updateOption,
  saveOption,
  deleteOption,
}: OptionEditorProps) => {
  return (
    <Column $grow spacing={1}>
      <Panel $grow>
        <FullWidthTextArea
          onChange={(e) => updateOption(e.target.value)}
          value={content}
          spellCheck={false}
        ></FullWidthTextArea>
      </Panel>
      <Row spacing={1}>
        <Button onClick={saveOption} disabled={!content}>
          Save
        </Button>
        <Button onClick={deleteOption} disabled={!content}>
          Delete Option
        </Button>
      </Row>
    </Column>
  );
};

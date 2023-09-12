import styled from "styled-components";
import { Column } from "./Column";
import { Row } from "./Row";
import { useState } from "react";
import { Panel } from "./Panel";
import { CommonProps } from "./Common";

const TabPanel = styled(Panel)`
  border-top-left-radius: 0;
`;

export type TabsProps = {
  config: Record<string, JSX.Element>;
} & CommonProps;

const Tab = styled.div<{ $active: boolean }>`
  padding: 0.5em 1em;
  font-weight: 500;
  background-color: ${(props) =>
    props.$active ? "var(--primary-background)" : "var(--color-blue-5)"};
  color: ${(props) =>
    props.$active ? "var(--primary-text-color)" : "var(--color-black)"};
  border-top-right-radius: 8px;
  border-top-left-radius: 8px;
  box-shadow: ${(props) => (props.$active ? "4px -1px 4px" : "2px -1px 2px")}
    grey;
`;

export const Tabs = ({ config, ...props }: TabsProps) => {
  const [currentTab, setCurrentTab] = useState(Object.keys(config)[0]);

  const currentTextContent = Object.entries(config).find(
    ([text]) => text === currentTab
  );
  const currentText = currentTextContent?.[0];
  const currentContent = currentTextContent?.[1];

  return (
    <Column width="100%" {...props}>
      <Row spacing={0.5}>
        {Object.keys(config).map((t, i) => {
          return (
            <Tab
              key={i}
              $active={t === currentText}
              onClick={() => setCurrentTab(t)}
            >
              {t}
            </Tab>
          );
        })}
      </Row>
      <TabPanel {...props}>{currentContent}</TabPanel>
    </Column>
  );
};

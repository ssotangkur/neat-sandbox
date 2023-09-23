import { currentOptionKeyAtom, optionSetAtom } from "./OptionsPage";
import { useAtom } from "jotai";

export const OptionSelect = () => {
  const [optionSet] = useAtom(optionSetAtom);
  const [selectedKey, setKey] = useAtom(currentOptionKeyAtom);

  return (
    <select value={selectedKey} onChange={(e) => setKey(e.target.value)}>
      {Object.keys(optionSet).map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
};

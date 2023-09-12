import { OptionSet } from "../../neat/Options";

type OptionSelectProps = {
  optionSet: OptionSet;
  selectedKey: keyof OptionSet | undefined;
  onSelect: (key: keyof OptionSet) => void;
};

export const OptionSelect = ({
  optionSet,
  selectedKey,
  onSelect,
}: OptionSelectProps) => {
  return (
    <select value={selectedKey} onChange={(e) => onSelect(e.target.value)}>
      {Object.keys(optionSet).map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
};

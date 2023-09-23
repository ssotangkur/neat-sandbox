import {
  OptionSet,
  PopulationOptions,
  createOptions,
  OPTIONS_KEY,
  CURRENT_OPTION_KEY,
} from "../../neat/Options";
import { Column } from "../../ui/Column";
import { OptionSelect } from "./OptionSelect";
import { CreateOptionPanel } from "./CreateOptionPanel";
import { OptionEditor } from "./OptionEditor";
import { atomWithStorage } from "jotai/utils";
import { atom, useAtom } from "jotai";

export const optionSetAtom = atomWithStorage<OptionSet>(
  OPTIONS_KEY,
  {},
  undefined,
  { unstable_getOnInit: true }
);
export const currentOptionKeyAtom = atomWithStorage<
  keyof OptionSet | undefined
>(CURRENT_OPTION_KEY, undefined, undefined, { unstable_getOnInit: true });
export const optionAtom = atom(
  (get) => {
    const optionSet = get(optionSetAtom);
    const key = get(currentOptionKeyAtom);
    if (!key) {
      return createOptions({
        count: 100,
        inputs: 3,
        outputs: 2,
        evalType: "XOR",
      });
    }
    return optionSet[key] as PopulationOptions;
  },
  (get, set, update: PopulationOptions) => {
    const key = get(currentOptionKeyAtom);
    if (key) {
      set(optionSetAtom, (prev) => ({ ...prev, [key]: update } as OptionSet));
    }
  }
);
export type KeyOption = {
  key: string;
  option: PopulationOptions;
};
export const addOptionAtom = atom(
  null,
  (_, set, { key, option }: KeyOption) => {
    set(optionSetAtom, (prev) => ({ ...prev, [key]: option }));
  }
);
export const deleteOptionAtom = atom(null, (get, set) => {
  const key = get(currentOptionKeyAtom);
  if (key) {
    set(optionSetAtom, (prev) => {
      const result: OptionSet = { ...prev };
      delete result[key];
      return result;
    });
  }
});

/**
 * Sets and fine tunes what the global options are
 */
export const OptionsPage = () => {
  const [, addOption] = useAtom(addOptionAtom);

  return (
    <Column $padding={1} spacing={1} $grow>
      <OptionSelect></OptionSelect>
      <OptionEditor />
      <CreateOptionPanel addOption={addOption} />
    </Column>
  );
};

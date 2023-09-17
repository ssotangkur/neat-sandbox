import { useEffect, useReducer } from "react";
import {
  OptionSet,
  PartialPopulationOptions,
  PopulationOptions,
  SerializeablePopulationOptions,
  createOptions,
  materializeOption,
  serialize,
  serializeableOption,
  OPTIONS_KEY,
  readFromLocalStorage,
  CURRENT_OPTION_KEY,
} from "../../neat/Options";
import { Column } from "../../ui/Column";
import { OptionSelect } from "./OptionSelect";
import { CreateOptionPanel, RequiredProps } from "./CreateOptionPanel";
import { OptionEditor } from "./OptionEditor";

const getSerializedFromSet = (
  optionSet: OptionSet,
  key: keyof OptionSet | undefined
) => {
  if (key === undefined) {
    return "";
  }
  const option = optionSet[key];
  return JSON.stringify(serializeableOption(option), undefined, 4);
};

const updateLocal = (optionSet: OptionSet, currentKey: keyof OptionSet) => {
  localStorage.setItem(OPTIONS_KEY, serialize(optionSet));
  localStorage.setItem(CURRENT_OPTION_KEY, currentKey);
};

type OptionsPageState = {
  optionSet: OptionSet;
  content: string;
  selectedKey: keyof OptionSet | undefined;
};

type OptionsPageActions =
  | {
      type: "updateContent";
      payload: {
        content: string;
      };
    }
  | {
      type: "deleteOption";
      payload: undefined;
    }
  | {
      type: "addOption";
      payload: Required<RequiredProps>;
    }
  | {
      type: "selectOption";
      payload: {
        key: keyof OptionSet;
      };
    }
  | {
      type: "saveOption";
      payload: undefined;
    };

const reducer = (
  prev: OptionsPageState,
  action: OptionsPageActions
): OptionsPageState => {
  const { type, payload } = action;
  const next = { ...prev };
  switch (type) {
    case "updateContent":
      next.content = payload.content;
      break;
    case "deleteOption":
      if (prev.selectedKey) {
        next.optionSet = { ...prev.optionSet };
        delete next.optionSet[prev.selectedKey];
        const nextSelectedKey = Object.keys(next.optionSet)[0];
        next.selectedKey = nextSelectedKey;
        next.content = getSerializedFromSet(next.optionSet, nextSelectedKey);
        updateLocal(next.optionSet, next.selectedKey);
      }
      break;
    case "selectOption":
      next.selectedKey = payload.key;
      next.content = getSerializedFromSet(next.optionSet, payload.key);
      updateLocal(next.optionSet, payload.key);
      break;
    case "addOption":
      next.optionSet = { ...prev.optionSet };
      const { name, ...propsWithoutName } = payload;
      const p: PartialPopulationOptions = {
        ...propsWithoutName,
      };
      next.optionSet[payload.name] = createOptions(p);
      next.selectedKey = name;
      next.content = getSerializedFromSet(next.optionSet, name);
      updateLocal(next.optionSet, next.selectedKey);
      break;
    case "saveOption":
      const parsed: SerializeablePopulationOptions = JSON.parse(prev.content);
      if (prev.selectedKey) {
        next.optionSet = {
          ...prev.optionSet,
          [prev.selectedKey]: materializeOption(parsed),
        };
        updateLocal(next.optionSet, prev.selectedKey);
      }
      break;
  }

  return next;
};

const initialState: OptionsPageState = {
  optionSet: {},
  content: "",
  selectedKey: undefined,
};

const stateInitializer = (_: OptionsPageState): OptionsPageState => {
  const { optionSet, currentOption } = readFromLocalStorage();
  const content = getSerializedFromSet(optionSet, currentOption);
  return {
    optionSet,
    selectedKey: currentOption,
    content,
  };
};

export type OptionsPageProps = {
  setCurrentOptions: (options: PopulationOptions) => void;
};

/**
 * Sets and fine tunes what the global options are
 */
export const OptionsPage = ({ setCurrentOptions }: OptionsPageProps) => {
  const [state, dispatch] = useReducer(reducer, initialState, stateInitializer);

  // Change the global current options if it changes
  useEffect(() => {
    if (!state.selectedKey) {
      return;
    }
    setCurrentOptions(state.optionSet[state.selectedKey]);
  }, [state.optionSet, state.selectedKey]);

  const addOption = (r: Required<RequiredProps>) => {
    dispatch({
      type: "addOption",
      payload: r,
    });
  };

  const saveOption = () => {
    dispatch({
      type: "saveOption",
      payload: undefined,
    });
  };

  const selectOption = (key: keyof OptionSet) => {
    dispatch({
      type: "selectOption",
      payload: { key },
    });
  };

  const updateOption = (content: string) => {
    dispatch({
      type: "updateContent",
      payload: { content },
    });
  };

  const deleteOption = () => {
    dispatch({
      type: "deleteOption",
      payload: undefined,
    });
  };

  return (
    <Column $padding={1} spacing={1} $grow>
      <OptionSelect
        optionSet={state.optionSet}
        selectedKey={state.selectedKey}
        onSelect={selectOption}
      ></OptionSelect>
      <OptionEditor
        content={state.content}
        updateOption={updateOption}
        saveOption={saveOption}
        deleteOption={deleteOption}
      />
      <CreateOptionPanel addOption={addOption} />
    </Column>
  );
};

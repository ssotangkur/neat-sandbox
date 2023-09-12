import {
  Reducer,
  useReducer,
  useState,
  useCallback,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";

export type Message = {
  author: string;
  text: string;
};

export type Messages = Message[];

export type MessageAction =
  | {
      type: "messagePosted";
      payload: {
        message: Message;
      };
    }
  | {
      type: "messageRecalled";
      payload: {
        text: string;
      };
    };

const messagesReducer: Reducer<Messages, MessageAction> = (
  state: Messages,
  action: MessageAction
) => {
  switch (action.type) {
    case "messagePosted":
      return [...state, action.payload.message];
    case "messageRecalled":
      return state.filter((msg) => msg.text === action.payload.text);
  }
};

export type MessagesDispatch = {
  messages: Messages;
  dispatch: React.Dispatch<MessageAction>;
};

export const MessagesContext = createContext<MessagesDispatch | null>(null);

export const MessagesProvider = ({ children }: PropsWithChildren) => {
  const [messages, dispatch] = useReducer(messagesReducer, []);
  const messagesDispatch: MessagesDispatch = { messages, dispatch };

  return (
    <MessagesContext.Provider value={messagesDispatch}>
      {children}
    </MessagesContext.Provider>
  );
};

export const MessagesList = () => {
  const { messages } = useContext(MessagesContext)!;

  return (
    <>
      {messages.map((msg, i) => (
        <div key={i}>{`${msg.author}: ${msg.text}`}</div>
      ))}
    </>
  );
};

export const PostMessageButton = () => {
  const { dispatch } = useContext(MessagesContext)!;
  const [inputValue, setInputValue] = useState("");

  const postMessage = useCallback(() => {
    const action: MessageAction = {
      type: "messagePosted",
      payload: {
        message: {
          author: "foo",
          text: inputValue,
        },
      },
    };
    dispatch(action);
    setInputValue("");
  }, [inputValue, dispatch]);

  return (
    <>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      ></input>
      <button onClick={postMessage}>Post</button>
    </>
  );
};

export const ReducerExample = () => {
  return (
    <MessagesProvider>
      <MessagesList />
      <PostMessageButton />
    </MessagesProvider>
  );
};

import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
    line-height: 1.5;
    font-weight: 400;
    font-size: 14px;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;

    /* Colors */
    --color-blue-1: #03045e;
    --color-blue-2: #0077b6;
    --color-blue-3: #00b4d8;
    --color-blue-4: #90e0ef;
    --color-blue-5: #caf0f8;

    --color-white: #ffffff;
    --color-black: #000000;

    --color-orange-1: #f46036;
    --color-purple-1: #4D4487;
    --color-teal-1: #1b998b;
    --color-red-1: #e71d36;
    --color-yellow-1: #F5DA6F;

    /* Semantic Colors */
    --primary-text-color: var(--color-white);
    --primary-background: var(--color-blue-2);

    --secondary-text-color: var(--color-blue-1);
    --secondary-background: var(--color-white);

    --focus-text-color: var(--color-white);
    --focus-background: var(--color-blue-1);

    --accent-background-color: var(--color-blue-3);
    --accent-text-color: var(--color-white);

    /* Common Settings */
    --border-radius: 5px;

  }

* {
  box-sizing: border-box;
  /* scrollbar-gutter: stable; */
}

/*
 Get rid of extra white space below svg
*/
svg {
  display: block;
}

table {
  border-spacing: unset;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
  border-radius: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #c5c5c5;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #7bb4f6;
}

::-webkit-scrollbar-corner {
  background: var(--color-white);
  border-radius: 10px;
}
`;

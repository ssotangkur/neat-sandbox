import ReactDOM from "react-dom/client";
import "./index.css";
import React from "react";
import { Routes } from "./Routes";
import { GlobalStyles } from "./ui/GlobalStyles";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    {/* <React.StrictMode> */}
    <GlobalStyles />
    <Routes />
    {/* </React.StrictMode> */}
  </>
);

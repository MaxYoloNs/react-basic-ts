import * as React from "react";
import { createRoot } from "react-dom/client";
// 移除 BrowserRouter 导入
// import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render( <
    React.StrictMode >
    <
    App / >
    <
    /React.StrictMode>
);
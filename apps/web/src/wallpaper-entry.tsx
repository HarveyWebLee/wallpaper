import React from "react";
import ReactDOM from "react-dom/client";
import "antd/dist/reset.css";
import "./styles.less";
import "./styles/wallpaper.less";
import { WallpaperApp } from "./WallpaperApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WallpaperApp />
  </React.StrictMode>
);

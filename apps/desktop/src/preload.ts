import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("desktopApi", {
  platform: process.platform
});

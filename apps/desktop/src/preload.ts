import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings, SettingsPatch, WallpaperItem } from "./types";

export interface DesktopApi {
  platform: string;
  getSettings: () => Promise<AppSettings>;
  patchSettings: (patch: SettingsPatch) => Promise<AppSettings>;
  listWallpapers: () => Promise<WallpaperItem[]>;
  addWallpaperFiles: () => Promise<WallpaperItem[]>;
  removeWallpaper: (id: string) => Promise<WallpaperItem[]>;
  applyWallpapers: () => Promise<AppSettings>;
  pauseWallpapers: () => Promise<AppSettings>;
  resumeWallpapers: () => Promise<AppSettings>;
  refreshWallpapers: () => Promise<AppSettings>;
  openExternal: (url: string) => Promise<void>;
  setOpenAtLogin: (enabled: boolean) => Promise<AppSettings>;
  isWallpaperMode: boolean;
}

const desktopApi: DesktopApi = {
  platform: process.platform,
  getSettings: () => ipcRenderer.invoke("settings:get"),
  patchSettings: (patch) => ipcRenderer.invoke("settings:patch", patch),
  listWallpapers: () => ipcRenderer.invoke("wallpapers:list"),
  addWallpaperFiles: () => ipcRenderer.invoke("wallpapers:add-files"),
  removeWallpaper: (id) => ipcRenderer.invoke("wallpapers:remove", id),
  applyWallpapers: () => ipcRenderer.invoke("wallpapers:apply"),
  pauseWallpapers: () => ipcRenderer.invoke("wallpapers:pause"),
  resumeWallpapers: () => ipcRenderer.invoke("wallpapers:resume"),
  refreshWallpapers: () => ipcRenderer.invoke("wallpapers:refresh"),
  openExternal: (url) => ipcRenderer.invoke("system:open-external", url),
  setOpenAtLogin: (enabled) => ipcRenderer.invoke("system:open-at-login", enabled),
  isWallpaperMode: process.argv.includes("--wallpaper-mode")
};

contextBridge.exposeInMainWorld("desktopApi", desktopApi);

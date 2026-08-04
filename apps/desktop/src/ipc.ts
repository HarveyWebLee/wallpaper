import { ipcMain, dialog, shell, app } from "electron";
import crypto from "node:crypto";
import path from "node:path";
import {
  addWallpaperToLibrary,
  getAllWallpapers,
  getSettings,
  patchSettings,
  removeWallpaperFromLibrary
} from "./store";
import {
  applyWallpapers,
  pauseWallpapers,
  refreshWallpapers,
  resumeWallpapers
} from "./wallpaper/wallpaper-manager";
import type { AppSettings, SettingsPatch, WallpaperItem } from "./types";

export function registerIpcHandlers(): void {
  ipcMain.handle("settings:get", (): AppSettings => getSettings());

  ipcMain.handle("settings:patch", (_e, patch: SettingsPatch): AppSettings => {
    const updated = patchSettings(patch);
    return updated;
  });

  ipcMain.handle("wallpapers:list", () => getAllWallpapers());

  ipcMain.handle("wallpapers:add-files", async (): Promise<WallpaperItem[]> => {
    const result = await dialog.showOpenDialog({
      title: "选择壁纸文件",
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "壁纸文件",
          extensions: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov"]
        }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return getAllWallpapers();
    }

    for (const filePath of result.filePaths) {
      const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
      const isVideo = ["mp4", "webm", "mov"].includes(ext);
      const item: WallpaperItem = {
        id: `custom-${crypto.randomUUID()}`,
        name: path.basename(filePath),
        type: isVideo ? "video" : "image",
        filePath,
        addedAt: new Date().toISOString()
      };
      addWallpaperToLibrary(item);
    }

    return getAllWallpapers();
  });

  ipcMain.handle("wallpapers:remove", (_e, id: string) => {
    removeWallpaperFromLibrary(id);
    return getAllWallpapers();
  });

  ipcMain.handle("wallpapers:apply", () => {
    applyWallpapers();
    return getSettings();
  });

  ipcMain.handle("wallpapers:pause", () => {
    pauseWallpapers();
    return getSettings();
  });

  ipcMain.handle("wallpapers:resume", () => {
    resumeWallpapers();
    return getSettings();
  });

  ipcMain.handle("wallpapers:refresh", () => {
    refreshWallpapers();
    return getSettings();
  });

  ipcMain.handle("system:platform", () => process.platform);

  ipcMain.handle("system:open-external", (_e, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle("system:open-at-login", (_e, enabled: boolean) => {
    if (process.platform === "darwin" || process.platform === "win32") {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true
      });
    }
    return patchSettings({ openAtLogin: enabled });
  });
}

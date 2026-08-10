import { BrowserWindow, screen } from "electron";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import isDev from "electron-is-dev";
import { findWallpaper, getSettings, patchSettings } from "../store";
import { attachMacOSWallpaper, detachMacOSWallpaper } from "./macos-attach";
import { attachWindowsWallpaper, detachWindowsWallpaper } from "./windows-attach";

interface WallpaperWindowEntry {
  displayId: string;
  window: BrowserWindow;
}

let wallpaperWindows: WallpaperWindowEntry[] = [];
let paused = false;

function prodWallpaperHtmlPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web", "dist", "wallpaper.html");
  }
  // dist/wallpaper/ → apps/web/dist
  return path.join(__dirname, "..", "..", "..", "web", "dist", "wallpaper.html");
}

function devWallpaperUrl(displayId: string, wallpaperId: string): string {
  const params = new URLSearchParams({ displayId, wallpaperId });
  return `http://127.0.0.1:5173/wallpaper.html?${params.toString()}`;
}

function resolveWallpaperIdForDisplay(displayId: string): string {
  const settings = getSettings();
  const assigned = settings.wallpaperAssignments[displayId];
  if (assigned && findWallpaper(assigned)) {
    return assigned;
  }
  return settings.activeWallpaperId;
}

function attachPlatform(win: BrowserWindow): void {
  if (process.platform === "win32") {
    attachWindowsWallpaper(win);
  } else if (process.platform === "darwin") {
    attachMacOSWallpaper(win);
  }
}

function detachPlatform(win: BrowserWindow): void {
  if (process.platform === "win32") {
    detachWindowsWallpaper(win);
  } else if (process.platform === "darwin") {
    detachMacOSWallpaper(win);
  }
}

function createWallpaperWindow(display: Electron.Display, wallpaperId: string): BrowserWindow {
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    thickFrame: false,
    fullscreenable: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: true,
      additionalArguments: ["--wallpaper-mode"],
      webSecurity: false
    }
  });

  win.setMenuBarVisibility(false);

  const displayId = String(display.id);
  const params = new URLSearchParams({ displayId, wallpaperId });

  if (isDev) {
    win.loadURL(devWallpaperUrl(displayId, wallpaperId));
  } else {
    const htmlPath = prodWallpaperHtmlPath();
    win.loadFile(htmlPath, { search: params.toString() });
  }

  win.once("ready-to-show", () => {
    if (!paused) {
      attachPlatform(win);
      win.showInactive();
    }
  });

  return win;
}

export function destroyWallpaperWindows(): void {
  for (const entry of wallpaperWindows) {
    try {
      detachPlatform(entry.window);
    } catch {
      /* 忽略卸载时的平台 API 错误 */
    }
    if (!entry.window.isDestroyed()) {
      entry.window.destroy();
    }
  }
  wallpaperWindows = [];
}

export function applyWallpapers(): void {
  destroyWallpaperWindows();
  paused = getSettings().paused;

  const displays = screen.getAllDisplays();
  for (const display of displays) {
    const displayId = String(display.id);
    const wallpaperId = resolveWallpaperIdForDisplay(displayId);
    const win = createWallpaperWindow(display, wallpaperId);
    wallpaperWindows.push({ displayId, window: win });
  }

  patchSettings({ wallpaperApplied: true });
}

export function pauseWallpapers(): void {
  paused = true;
  patchSettings({ paused: true });
  for (const entry of wallpaperWindows) {
    if (!entry.window.isDestroyed()) {
      entry.window.hide();
    }
  }
}

export function resumeWallpapers(): void {
  paused = false;
  patchSettings({ paused: false });

  if (wallpaperWindows.length === 0) {
    applyWallpapers();
    return;
  }

  for (const entry of wallpaperWindows) {
    if (!entry.window.isDestroyed()) {
      if (process.platform === "win32" || process.platform === "darwin") {
        attachPlatform(entry.window);
      }
      entry.window.showInactive();
    }
  }
}

export function refreshWallpapers(): void {
  applyWallpapers();
}

export function isWallpaperPaused(): boolean {
  return paused;
}

export function getWallpaperHtmlExists(): boolean {
  const htmlPath = prodWallpaperHtmlPath();
  return fs.existsSync(htmlPath);
}

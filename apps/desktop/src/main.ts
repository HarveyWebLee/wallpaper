import { app, BrowserWindow, screen } from "electron";
import fs from "node:fs";
import path from "node:path";
import isDev from "electron-is-dev";
import { registerIpcHandlers } from "./ipc";
import { getSettings } from "./store";
import { createTray, destroyTray } from "./tray";
import { applyWallpapers, destroyWallpaperWindows } from "./wallpaper/wallpaper-manager";

let settingsWindow: BrowserWindow | null = null;
let displayRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleWallpaperRefresh(): void {
  if (displayRefreshTimer) {
    clearTimeout(displayRefreshTimer);
  }
  displayRefreshTimer = setTimeout(() => {
    displayRefreshTimer = null;
    applyWallpapers();
  }, 500);
}

/** 为 true 时：打开 DevTools、主进程打印加载路径、渲染进程控制台转发到终端 */
function isWallpaperDebug(): boolean {
  const v = process.env.WALLPAPER_DEVTOOLS;
  return v === "1" || v === "true";
}

function prodIndexHtmlPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web", "dist", "index.html");
  }
  return path.join(__dirname, "..", "..", "web", "dist", "index.html");
}

function attachDebugHandlers(win: BrowserWindow, indexPath: string) {
  const wc = win.webContents;
  if (isWallpaperDebug()) {
    wc.on("console-message", (_e, level, message, line, sourceId) => {
      const tag = ["log", "warn", "error"][level] ?? String(level);
      console.log(`[renderer ${tag}]`, message, sourceId ? `${sourceId}:${line}` : "");
    });
  }

  wc.on("did-fail-load", (_e, code, desc, url) => {
    console.error("[main] did-fail-load", { code, desc, url });
  });
  wc.on("did-fail-provisional-load", (_e, code, desc, url) => {
    console.error("[main] did-fail-provisional-load", { code, desc, url });
  });

  if (isWallpaperDebug()) {
    console.log("[main] isPackaged:", app.isPackaged);
    console.log("[main] index.html path:", indexPath);
    console.log("[main] index.html exists:", fs.existsSync(indexPath));
  }
}

function createSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return settingsWindow;
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#020617",
    autoHideMenuBar: true,
    show: false,
    title: "Wallpaper 动态壁纸",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:5173");
    if (isWallpaperDebug()) {
      win.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    const indexPath = prodIndexHtmlPath();
    attachDebugHandlers(win, indexPath);
    if (isWallpaperDebug()) {
      win.webContents.openDevTools({ mode: "detach" });
    }
    win.loadFile(indexPath);
  }

  win.once("ready-to-show", () => {
    win.show();
  });

  win.on("closed", () => {
    settingsWindow = null;
  });

  settingsWindow = win;
  return win;
}

function showSettingsWindow(): void {
  createSettingsWindow();
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createTray(showSettingsWindow);
  createSettingsWindow();

  const settings = getSettings();
  if (settings.startWallpaperOnLaunch && !settings.paused) {
    applyWallpapers();
  }

  screen.on("display-added", () => scheduleWallpaperRefresh());
  screen.on("display-removed", () => scheduleWallpaperRefresh());
  screen.on("display-metrics-changed", () => scheduleWallpaperRefresh());

  app.on("activate", () => {
    showSettingsWindow();
  });
});

app.on("window-all-closed", () => {
  /* 壁纸应用保持托盘运行，不随设置窗口关闭而退出 */
});

app.on("before-quit", () => {
  destroyTray();
  destroyWallpaperWindows();
});

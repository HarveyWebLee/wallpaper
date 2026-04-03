import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import isDev from "electron-is-dev";

/** 为 true 时：打开 DevTools、主进程打印加载路径、渲染进程控制台转发到终端（需从终端启动才能看到） */
function isWallpaperDebug(): boolean {
  const v = process.env.WALLPAPER_DEVTOOLS;
  return v === "1" || v === "true";
}

/** 生产环境 index.html：未打包时落在 monorepo apps/web/dist；asar 内为 app.asar/web/dist */
function prodIndexHtmlPath() {
  if (app.isPackaged) {
    return path.join(__dirname, "..", "web", "dist", "index.html");
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

  // 仅在调试时打印，避免用户从终端启动时泄露过多信息
  if (isWallpaperDebug()) {
    console.log("[main] isPackaged:", app.isPackaged);
    console.log("[main] __dirname:", __dirname);
    console.log("[main] app.getAppPath():", app.getAppPath());
    console.log("[main] index.html path:", indexPath);
    console.log("[main] index.html exists:", fs.existsSync(indexPath));
    const preloadPath = path.join(__dirname, "preload.js");
    console.log("[main] preload path:", preloadPath, "exists:", fs.existsSync(preloadPath));
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#111827",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:5173");
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  const indexPath = prodIndexHtmlPath();
  attachDebugHandlers(win, indexPath);

  if (isWallpaperDebug()) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

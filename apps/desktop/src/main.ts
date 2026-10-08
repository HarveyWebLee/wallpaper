import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import isDev from "electron-is-dev";

/** 为 true 时：打开 DevTools、主进程打印加载路径、渲染进程控制台转发到终端（需从终端启动才能看到） */
function isWallpaperDebug(): boolean {
  const v = process.env.WALLPAPER_DEVTOOLS;
  return v === "1" || v === "true";
}

/**
 * 生产环境 index.html。
 * 已安装包：前端静态资源经 electron-builder extraResources 放在 app.asar 同级的 Resources/web/dist（asar 外的 ../web/dist 通配在部分版本下不会进包，导致白屏）。
 * 未打包：相对 apps/desktop/dist 回到 monorepo 的 apps/web/dist。
 */
function prodIndexHtmlPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web", "dist", "index.html");
  }
  return path.join(__dirname, "..", "..", "web", "dist", "index.html");
}

/** 托盘图标：开发与打包均相对 dist 上一级的 build/icon.png（已列入 electron-builder files） */
function trayIconPath() {
  return path.join(__dirname, "..", "build", "icon.png");
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
/** 用户显式退出（托盘「退出」/ Cmd+Q）时为 true，此时允许真正关闭窗口 */
let isQuitting = false;

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
    console.log("[main] __dirname:", __dirname);
    console.log("[main] app.getAppPath():", app.getAppPath());
    console.log("[main] index.html path:", indexPath);
    console.log("[main] index.html exists:", fs.existsSync(indexPath));
    const preloadPath = path.join(__dirname, "preload.js");
    console.log("[main] preload path:", preloadPath, "exists:", fs.existsSync(preloadPath));
  }
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
    // 等退出全屏动画后再隐藏，避免 macOS 闪烁
    mainWindow.once("leave-full-screen", () => {
      if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
    });
    // 保险：若事件未触发仍隐藏
    setTimeout(() => {
      if (!isQuitting && mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        mainWindow.hide();
      }
    }, 800);
    return;
  }
  mainWindow.hide();
}

function createTray() {
  if (tray) return;

  const iconFile = trayIconPath();
  let image = nativeImage.createFromPath(iconFile);
  if (image.isEmpty()) {
    console.warn("[main] tray icon missing or empty:", iconFile);
    image = nativeImage.createEmpty();
  } else {
    image = image.resize({ width: 16, height: 16 });
  }

  tray = new Tray(image);
  tray.setToolTip("WallpaperScreensaver");
  tray.on("double-click", () => showMainWindow());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示窗口",
      click: () => showMainWindow()
    },
    {
      label: "后台配置",
      click: () => {
        showMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
          mainWindow.webContents.send("desktop:navigate", "#/admin");
        }
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#111827",
    autoHideMenuBar: true,
    fullscreenable: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow = win;

  // 点关闭：仅隐藏窗口，进程与托盘继续运行
  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      hideMainWindow();
    }
  });

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });

  win.on("enter-full-screen", () => {
    win.webContents.send("desktop:fullscreen-changed", true);
  });
  win.on("leave-full-screen", () => {
    win.webContents.send("desktop:fullscreen-changed", false);
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

function registerIpc() {
  ipcMain.handle("desktop:set-fullscreen", (_event, flag: boolean) => {
    const win = mainWindow;
    if (!win || win.isDestroyed()) return false;
    win.setFullScreen(Boolean(flag));
    return win.isFullScreen();
  });

  ipcMain.handle("desktop:is-fullscreen", () => {
    const win = mainWindow;
    if (!win || win.isDestroyed()) return false;
    return win.isFullScreen();
  });

  ipcMain.handle("desktop:hide-window", () => {
    hideMainWindow();
  });
}

// 单实例：再次启动时唤起已有窗口（Windows 托盘常驻场景）
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    if (process.platform === "win32") {
      app.setAppUserModelId("com.wallpaper.screensaver");
    }

    registerIpc();
    createTray();
    createWindow();

    app.on("activate", () => {
      // macOS：点击 Dock 图标时显示窗口
      showMainWindow();
    });
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  // 有托盘时常驻：任意平台都不要因「无窗口」而退出
  app.on("window-all-closed", () => {
    // no-op：关闭窗口后由托盘保活；显式退出走 before-quit + app.quit()
  });
}

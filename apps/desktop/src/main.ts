import { app, BrowserWindow } from "electron";
import path from "node:path";
import isDev from "electron-is-dev";

/** 生产环境 index.html：未打包时落在 monorepo apps/web/dist；asar 内为 app.asar/web/dist */
function prodIndexHtmlPath() {
  if (app.isPackaged) {
    return path.join(__dirname, "..", "web", "dist", "index.html");
  }
  return path.join(__dirname, "..", "..", "web", "dist", "index.html");
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
  } else {
    win.loadFile(prodIndexHtmlPath());
  }
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

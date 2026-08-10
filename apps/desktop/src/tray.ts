import { Menu, Tray, nativeImage, app } from "electron";
import {
  applyWallpapers,
  isWallpaperPaused,
  pauseWallpapers,
  resumeWallpapers
} from "./wallpaper/wallpaper-manager";

let tray: Tray | null = null;

function getTrayIcon(): Electron.NativeImage {
  // 16x16 青蓝渐变圆点图标（内嵌 base64，避免依赖外部资源）
  const dataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBw1gGEUGDUwKgCjBoZRAQMABqYBBg0fJ5QAAAAASUVORK5CYII=";
  return nativeImage.createFromDataURL(dataUrl);
}

export function createTray(showSettings: () => void): Tray {
  if (tray) return tray;

  tray = new Tray(getTrayIcon());
  tray.setToolTip("Wallpaper 动态壁纸");

  const rebuildMenu = () => {
    const paused = isWallpaperPaused();
    const menu = Menu.buildFromTemplate([
      {
        label: "打开设置",
        click: () => showSettings()
      },
      {
        label: paused ? "恢复壁纸" : "暂停壁纸",
        click: () => {
          if (paused) {
            resumeWallpapers();
          } else {
            pauseWallpapers();
          }
          rebuildMenu();
        }
      },
      {
        label: "重新应用壁纸",
        click: () => applyWallpapers()
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => app.quit()
      }
    ]);
    tray?.setContextMenu(menu);
  };

  tray.on("click", () => showSettings());
  rebuildMenu();

  return tray;
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

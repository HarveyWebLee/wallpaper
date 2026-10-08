import { contextBridge, ipcRenderer } from "electron";

export type DesktopApi = {
  platform: NodeJS.Platform;
  /** 进入/退出 Electron 真全屏（系统屏保式沉浸） */
  setFullscreen: (flag: boolean) => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  /** 隐藏窗口（进程留在托盘后台） */
  hideWindow: () => Promise<void>;
  /** 监听主进程导航请求（托盘「后台配置」等） */
  onNavigate: (handler: (hash: string) => void) => () => void;
  /** 监听全屏状态变化 */
  onFullscreenChanged: (handler: (isFullscreen: boolean) => void) => () => void;
};

const desktopApi: DesktopApi = {
  platform: process.platform,
  setFullscreen: (flag) => ipcRenderer.invoke("desktop:set-fullscreen", flag),
  isFullscreen: () => ipcRenderer.invoke("desktop:is-fullscreen"),
  hideWindow: () => ipcRenderer.invoke("desktop:hide-window"),
  onNavigate: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, hash: string) => {
      handler(hash);
    };
    ipcRenderer.on("desktop:navigate", listener);
    return () => {
      ipcRenderer.removeListener("desktop:navigate", listener);
    };
  },
  onFullscreenChanged: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, isFullscreen: boolean) => {
      handler(isFullscreen);
    };
    ipcRenderer.on("desktop:fullscreen-changed", listener);
    return () => {
      ipcRenderer.removeListener("desktop:fullscreen-changed", listener);
    };
  }
};

contextBridge.exposeInMainWorld("desktopApi", desktopApi);

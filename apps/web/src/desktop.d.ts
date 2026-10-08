/** Electron preload 注入的桌面 API（仅在 Electron 壳内存在） */
type DesktopApi = {
  platform: string;
  setFullscreen: (flag: boolean) => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  hideWindow: () => Promise<void>;
  onNavigate: (handler: (hash: string) => void) => () => void;
  onFullscreenChanged: (handler: (isFullscreen: boolean) => void) => () => void;
};

interface Window {
  desktopApi?: DesktopApi;
}

import type { BrowserWindow } from "electron";

/** 桌面层窗口级别（位于桌面图标之下） */
const K_CG_DESKTOP_WINDOW_LEVEL = -2147483624;

function getNativeView(win: BrowserWindow): unknown {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const koffi = require("koffi") as typeof import("koffi");
  const handle = win.getNativeWindowHandle();
  if (handle.length >= 8) {
    return koffi.decode(handle, "void*");
  }
  const padded = Buffer.alloc(8);
  handle.copy(padded);
  return koffi.decode(padded, "void*");
}

/**
 * macOS：将窗口置于桌面层，并跨 Space 显示。
 */
export function attachMacOSWallpaper(win: BrowserWindow): void {
  if (process.platform !== "darwin") return;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const koffi = require("koffi") as typeof import("koffi");
  const libobjc = koffi.load("libobjc.A.dylib");

  const sel_registerName = libobjc.func("sel_registerName", "void*", ["str"]);
  const objc_msgSend_void_ptr = libobjc.func("objc_msgSend", "void*", ["void*", "void*"]);
  const objc_msgSend_int64 = libobjc.func("objc_msgSend", "int64", ["void*", "void*", "int64"]);

  const view = getNativeView(win);
  const selWindow = sel_registerName("window");
  const selSetLevel = sel_registerName("setLevel:");
  const nsWindow = objc_msgSend_void_ptr(view, selWindow);

  if (nsWindow) {
    objc_msgSend_int64(nsWindow, selSetLevel, K_CG_DESKTOP_WINDOW_LEVEL);
  }

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(false, "normal", 0);
}

export function detachMacOSWallpaper(win: BrowserWindow): void {
  if (process.platform !== "darwin") return;
  win.setVisibleOnAllWorkspaces(false);
}

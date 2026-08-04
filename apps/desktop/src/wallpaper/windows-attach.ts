import type { BrowserWindow } from "electron";
import koffi from "koffi";

const user32 = koffi.load("user32.dll");

const FindWindowExW = user32.func("FindWindowExW", "void*", ["void*", "void*", "str16", "str16"]);
const SendMessageTimeoutW = user32.func("SendMessageTimeoutW", "intptr", [
  "void*",
  "uint32",
  "intptr",
  "intptr",
  "uint32",
  "uint32",
  "uintptr*"
]);
const SetParent = user32.func("SetParent", "void*", ["void*", "void*"]);
const ShowWindow = user32.func("ShowWindow", "int", ["void*", "int"]);
const SetWindowLongW = user32.func("SetWindowLongW", "int32", ["void*", "int32", "int32"]);
const GetWindowLongW = user32.func("GetWindowLongW", "int32", ["void*", "int32"]);

const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x00000080;
const WS_EX_NOACTIVATE = 0x08000000;
const SW_SHOW = 5;

let workerW: unknown = null;

function findWorkerW(): unknown {
  const progman = FindWindowExW(null, null, "Progman", null);
  if (!progman) {
    throw new Error("未找到 Progman 窗口");
  }

  const resultPtr = koffi.alloc("uintptr", 1);
  SendMessageTimeoutW(progman, 0x052c, 0, 0, 0, 1000, resultPtr);
  koffi.free(resultPtr);

  const shellDefView = FindWindowExW(progman, null, "SHELLDLL_DefView", null);
  if (!shellDefView) {
    const worker = FindWindowExW(null, null, "WorkerW", null);
    if (worker) return worker;
    throw new Error("未找到 WorkerW 桌面层");
  }

  let worker = FindWindowExW(null, shellDefView, "WorkerW", null);
  if (!worker) {
    worker = FindWindowExW(null, null, "WorkerW", null);
  }
  if (!worker) {
    throw new Error("WorkerW 注入失败");
  }
  return worker;
}

function getElectronHwnd(win: BrowserWindow): unknown {
  const handle = win.getNativeWindowHandle();
  if (handle.length >= 8) {
    return koffi.decode(handle, "void*");
  }
  const padded = Buffer.alloc(8);
  handle.copy(padded);
  return koffi.decode(padded, "void*");
}

/**
 * Windows：将窗口挂到 WorkerW 层，显示在桌面图标下方。
 */
export function attachWindowsWallpaper(win: BrowserWindow): void {
  if (!workerW) {
    workerW = findWorkerW();
  }

  const hwnd = getElectronHwnd(win);
  const exStyle = GetWindowLongW(hwnd, GWL_EXSTYLE);
  SetWindowLongW(hwnd, GWL_EXSTYLE, exStyle | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE);

  SetParent(hwnd, workerW);
  ShowWindow(hwnd, SW_SHOW);
}

export function detachWindowsWallpaper(win: BrowserWindow): void {
  const hwnd = getElectronHwnd(win);
  SetParent(hwnd, null);
}

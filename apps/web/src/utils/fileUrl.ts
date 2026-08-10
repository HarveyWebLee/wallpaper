/**
 * 将本地文件路径转为可在 Electron 渲染进程使用的 file:// URL。
 * Windows 路径需转为 file:///C:/... 格式。
 */
export function toMediaFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  if (normalized.startsWith("/")) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}

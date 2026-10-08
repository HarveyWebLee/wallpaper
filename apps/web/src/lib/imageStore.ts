/**
 * 屏保图片二进制存储：使用 IndexedDB（容量远大于 localStorage，file:// 下可用）。
 * 配置源仅保存图片元数据（见 config.ts），此处按 id 存取 blob，两窗口共享同一库。
 */
const DB_NAME = "wallpaper-screensaver";
const DB_VERSION = 1;
const STORE = "images";

export function isImageStoreAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexedDB open failed"));
  });
}

export async function putImage(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("put failed"));
      tx.onabort = () => reject(tx.error ?? new Error("put aborted"));
    });
  } finally {
    db.close();
  }
}

export async function getImage(id: string): Promise<Blob | undefined> {
  const db = await openDB();
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () =>
        resolve(request.result instanceof Blob ? request.result : undefined);
      request.onerror = () => reject(request.error ?? new Error("get failed"));
    });
  } finally {
    db.close();
  }
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("delete failed"));
      tx.onabort = () => reject(tx.error ?? new Error("delete aborted"));
    });
  } finally {
    db.close();
  }
}

/** 生成图片 id；file:// 下 crypto.randomUUID 不一定可用，提供回退 */
export function genImageId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

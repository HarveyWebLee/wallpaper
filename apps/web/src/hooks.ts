import { useCallback, useEffect, useRef, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  loadConfig,
  saveConfig,
  subscribeConfig,
  type RetirementConfig,
  type ScreensaverImage
} from "./lib/config";
import { getImage } from "./lib/imageStore";

/** 每 intervalMs 刷新一次的「当前时刻」，驱动倒计时、进度与顶栏时钟 */
export function useNow(intervalMs = 1000): Dayjs {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export type SetConfig = (
  updater: RetirementConfig | ((prev: RetirementConfig) => RetirementConfig)
) => void;

/**
 * 读取并订阅唯一配置源。
 * setConfig 会同步到本地状态、持久化并广播到其它窗口，保证展示与配置一致。
 */
export function useRetirementConfig(): { config: RetirementConfig; setConfig: SetConfig } {
  const [config, setConfigState] = useState<RetirementConfig>(() => loadConfig());

  useEffect(() => subscribeConfig(setConfigState), []);

  const setConfig = useCallback<SetConfig>((updater) => {
    setConfigState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveConfig(next);
      return next;
    });
  }, []);

  return { config, setConfig };
}

/**
 * 按配置中的图片元数据，从 IndexedDB 加载 blob 并生成有序 object URL。
 * 仅在图片集合（id 序列）变化时重建，并在替换/卸载后回收旧 URL 避免内存泄漏。
 */
export function useScreensaverImages(images: ScreensaverImage[]): string[] {
  const ids = images.map((image) => image.id).join("|");
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const urlsRef = useRef<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result: string[] = [];
      for (const image of imagesRef.current) {
        try {
          const blob = await getImage(image.id);
          if (blob) result.push(URL.createObjectURL(blob));
        } catch {
          // 单张加载失败不影响其余图片
        }
      }
      if (!active) {
        result.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      const previous = urlsRef.current;
      urlsRef.current = result;
      setUrls(result);
      // 新 URL 就绪后再回收旧 URL，避免轮播出现破图闪烁
      previous.forEach((url) => URL.revokeObjectURL(url));
    };
    void load();
    return () => {
      active = false;
    };
  }, [ids]);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return urls;
}

/** 极简 hash 路由：在 file:// 下可靠，无需引入额外依赖（适配 Electron 打包） */
export function useHashRoute(): string {
  const [hash, setHash] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash
  );
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

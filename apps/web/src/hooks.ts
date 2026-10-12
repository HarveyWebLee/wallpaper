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
import {
  buildReminderPayload,
  loadFiredRecord,
  saveFiredRecord,
  showReminderNotification,
  wholeDaysUntilRetirement,
  type ReminderConfig
} from "./lib/reminders";
import { computeRetirementDate } from "./lib/compute";
import { antThemeForResolved, resolveAppearanceTheme } from "./lib/theme";
import type { ThemeConfig } from "antd";

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

/** 根据配置与系统偏好解析主题，并同步到 documentElement 的 data-theme */
export function useAppearanceTheme(themeMode: RetirementConfig["appearance"]["theme"]): {
  resolved: "dark" | "light";
  antTheme: ThemeConfig;
} {
  const [resolved, setResolved] = useState(() => resolveAppearanceTheme(themeMode));

  useEffect(() => {
    const apply = () => setResolved(resolveAppearanceTheme(themeMode));
    apply();
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [resolved]);

  return { resolved, antTheme: antThemeForResolved(resolved) };
}

function runReminderTick(now: Dayjs, config: RetirementConfig): void {
  if (!config.reminders.enabled) return;
  const retirementDate = computeRetirementDate(config);
  if (!retirementDate) return;

  const retirementIso = retirementDate.toISOString();
  const daysLeft = wholeDaysUntilRetirement(now, retirementDate);
  const record = loadFiredRecord();
  const fired = record?.retirementIso === retirementIso ? new Set(record.days) : new Set<number>();

  for (const milestone of config.reminders.milestoneDays) {
    if (daysLeft !== milestone || fired.has(milestone)) continue;
    fired.add(milestone);
    void showReminderNotification(
      buildReminderPayload(milestone, retirementDate, config.reminders.customNote)
    );
  }

  saveFiredRecord({ retirementIso, days: [...fired] });
}

/** 桌面/浏览器本地退休里程碑提醒（同一退休目标各 milestone 仅一次） */
export function useRetirementReminders(config: RetirementConfig, now: Dayjs): void {
  const remindersRef = useRef(config.reminders);
  remindersRef.current = config.reminders;

  useEffect(() => {
    runReminderTick(now, { ...config, reminders: remindersRef.current });
  }, [now, config]);
}

export type { ReminderConfig };

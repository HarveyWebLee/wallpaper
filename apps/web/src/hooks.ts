import { useCallback, useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { loadConfig, saveConfig, subscribeConfig, type RetirementConfig } from "./lib/config";

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

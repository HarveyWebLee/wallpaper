import dayjs from "dayjs";

/**
 * 退休倒计时的用户配置：作为「后台配置」与「屏保展示」两页的唯一数据源。
 * 持久化在 localStorage，并通过 storage 事件 / BroadcastChannel 在多窗口间同步。
 */
export type RetirementConfig = {
  /** 出生日期与时间，ISO 字符串；为 null 表示尚未设置 */
  birthday: string | null;
  /** 退休年龄（周岁） */
  retirementAge: number;
};

export const RETIREMENT_AGE_MIN = 30;
export const RETIREMENT_AGE_MAX = 100;

/** 默认出生时间与此前展示保持一致，保证老用户升级无感 */
const DEFAULT_BIRTHDAY_ISO = dayjs("1995-06-15 08:00:00").toISOString();

export const DEFAULT_CONFIG: RetirementConfig = {
  birthday: DEFAULT_BIRTHDAY_ISO,
  retirementAge: 60
};

const STORAGE_KEY = "wallpaper:retirement-config:v1";
const CHANNEL_NAME = "wallpaper:retirement-config";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function clampAge(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_CONFIG.retirementAge;
  return Math.min(RETIREMENT_AGE_MAX, Math.max(RETIREMENT_AGE_MIN, Math.round(n)));
}

function normalizeBirthday(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toISOString() : null;
}

/** 将任意来源（存储/广播）的数据规整为合法配置，非法字段回退默认，避免渲染崩溃 */
export function normalizeConfig(raw: unknown): RetirementConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CONFIG };
  const source = raw as Record<string, unknown>;
  return {
    birthday: "birthday" in source ? normalizeBirthday(source.birthday) : DEFAULT_CONFIG.birthday,
    retirementAge:
      "retirementAge" in source ? clampAge(source.retirementAge) : DEFAULT_CONFIG.retirementAge
  };
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (!hasWindow() || typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      channel = null;
    }
  }
  return channel;
}

/** 读取当前配置；无存储或损坏时回退默认 */
export function loadConfig(): RetirementConfig {
  if (!hasWindow()) return { ...DEFAULT_CONFIG };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return normalizeConfig(safeParse(raw));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** 持久化并广播配置变更，使其它窗口（如屏保页）即时同步 */
export function saveConfig(config: RetirementConfig): void {
  if (!hasWindow()) return;
  const normalized = normalizeConfig(config);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // 隐私模式等场景下 localStorage 不可用；仍通过广播在当前会话内同步
  }
  getChannel()?.postMessage(normalized);
}

/**
 * 订阅其它窗口/标签页的配置变更。
 * - storage 事件：仅在「其它文档」触发，用于跨窗口同步；
 * - BroadcastChannel：跨同源上下文同步，兜底不支持 storage 事件的场景。
 */
export function subscribeConfig(onChange: (config: RetirementConfig) => void): () => void {
  if (!hasWindow()) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    onChange(event.newValue ? normalizeConfig(safeParse(event.newValue)) : { ...DEFAULT_CONFIG });
  };
  window.addEventListener("storage", handleStorage);

  const ch = getChannel();
  const handleMessage = (event: MessageEvent) => onChange(normalizeConfig(event.data));
  ch?.addEventListener("message", handleMessage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    ch?.removeEventListener("message", handleMessage);
  };
}

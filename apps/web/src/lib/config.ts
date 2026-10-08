import dayjs from "dayjs";

/**
 * 退休倒计时的用户配置：作为「后台配置」与「屏保展示」两页的唯一数据源。
 * 持久化在 localStorage，并通过 storage 事件 / BroadcastChannel 在多窗口间同步。
 * 注意：图片二进制不放这里（存于 IndexedDB），这里仅保存有序的图片元数据与轮播设置。
 */
export type ImageFit = "cover" | "contain";

/** 屏保图片元数据；二进制 blob 按 id 存于 IndexedDB */
export type ScreensaverImage = {
  id: string;
  name: string;
  type: string;
  addedAt: number;
};

export type CarouselConfig = {
  /** 轮播间隔（毫秒） */
  intervalMs: number;
  /** 图片填充方式：cover 铺满裁切 / contain 完整显示 */
  fit: ImageFit;
  /** 是否在图片上叠加倒计时展示 */
  showCountdown: boolean;
};

export type RetirementConfig = {
  /** 出生日期与时间，ISO 字符串；为 null 表示尚未设置 */
  birthday: string | null;
  /** 退休年龄（周岁） */
  retirementAge: number;
  /** 屏保背景图片（有序，用于轮播） */
  images: ScreensaverImage[];
  /** 轮播设置 */
  carousel: CarouselConfig;
};

export const RETIREMENT_AGE_MIN = 30;
export const RETIREMENT_AGE_MAX = 100;

export const CAROUSEL_INTERVAL_MIN = 2;
export const CAROUSEL_INTERVAL_MAX = 120;

/** 图片数量与单张体积上限，避免撑爆存储与卡顿 */
export const MAX_IMAGES = 30;
export const MAX_IMAGE_MB = 8;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

/** 默认出生时间与此前展示保持一致，保证老用户升级无感 */
const DEFAULT_BIRTHDAY_ISO = dayjs("1995-06-15 08:00:00").toISOString();

export const DEFAULT_CAROUSEL: CarouselConfig = {
  intervalMs: 8000,
  fit: "cover",
  showCountdown: true
};

export const DEFAULT_CONFIG: RetirementConfig = {
  birthday: DEFAULT_BIRTHDAY_ISO,
  retirementAge: 60,
  images: [],
  carousel: { ...DEFAULT_CAROUSEL }
};

const STORAGE_KEY = "wallpaper:retirement-config:v1";
const CHANNEL_NAME = "wallpaper:retirement-config";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

/** 深拷贝默认配置，避免共享 images 数组 / carousel 对象被意外改动 */
function cloneDefault(): RetirementConfig {
  return {
    birthday: DEFAULT_CONFIG.birthday,
    retirementAge: DEFAULT_CONFIG.retirementAge,
    images: [],
    carousel: { ...DEFAULT_CAROUSEL }
  };
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

function clampInterval(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_CAROUSEL.intervalMs;
  const minMs = CAROUSEL_INTERVAL_MIN * 1000;
  const maxMs = CAROUSEL_INTERVAL_MAX * 1000;
  return Math.min(maxMs, Math.max(minMs, Math.round(n)));
}

function normalizeImage(raw: unknown): ScreensaverImage | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  if (typeof source.id !== "string" || source.id === "") return null;
  return {
    id: source.id,
    name: typeof source.name === "string" ? source.name : "image",
    type: typeof source.type === "string" ? source.type : "image/*",
    addedAt:
      typeof source.addedAt === "number" && Number.isFinite(source.addedAt)
        ? source.addedAt
        : Date.now()
  };
}

function normalizeImages(raw: unknown): ScreensaverImage[] {
  if (!Array.isArray(raw)) return [];
  const list: ScreensaverImage[] = [];
  for (const item of raw) {
    const image = normalizeImage(item);
    if (image) list.push(image);
    if (list.length >= MAX_IMAGES) break;
  }
  return list;
}

function normalizeCarousel(raw: unknown): CarouselConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CAROUSEL };
  const source = raw as Record<string, unknown>;
  return {
    intervalMs:
      "intervalMs" in source ? clampInterval(source.intervalMs) : DEFAULT_CAROUSEL.intervalMs,
    fit: source.fit === "contain" ? "contain" : "cover",
    showCountdown:
      typeof source.showCountdown === "boolean"
        ? source.showCountdown
        : DEFAULT_CAROUSEL.showCountdown
  };
}

/** 将任意来源（存储/广播）的数据规整为合法配置，非法字段回退默认，避免渲染崩溃 */
export function normalizeConfig(raw: unknown): RetirementConfig {
  if (!raw || typeof raw !== "object") return cloneDefault();
  const source = raw as Record<string, unknown>;
  return {
    birthday: "birthday" in source ? normalizeBirthday(source.birthday) : DEFAULT_CONFIG.birthday,
    retirementAge:
      "retirementAge" in source ? clampAge(source.retirementAge) : DEFAULT_CONFIG.retirementAge,
    images: normalizeImages(source.images),
    carousel: normalizeCarousel(source.carousel)
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
  if (!hasWindow()) return cloneDefault();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    return normalizeConfig(safeParse(raw));
  } catch {
    return cloneDefault();
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
    onChange(event.newValue ? normalizeConfig(safeParse(event.newValue)) : cloneDefault());
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

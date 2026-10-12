import {
  getBuiltinRulePack,
  normalizeRulePack,
  type RetirementRulePack
} from "./retirementRulePack";

const ONLINE_CACHE_KEY = "wallpaper:retirement-rule-pack:online-cache:v1";
const ONLINE_META_KEY = "wallpaper:retirement-rule-pack:online-meta:v1";
const AUTO_CHECK_KEY = "wallpaper:retirement-rule-pack:online-last-check:v1";

/** 自动检查间隔：24 小时 */
export const RULE_PACK_AUTO_CHECK_MS = 24 * 60 * 60 * 1000;

const FETCH_TIMEOUT_MS = 15_000;

export type RulePackRemoteMeta = {
  sourceUrl: string;
  fetchedAt: number;
  packId: string;
  packTitle: string;
  packVersion: number;
};

export type RulePackSyncResult =
  | { status: "updated"; pack: RetirementRulePack; meta: RulePackRemoteMeta }
  | { status: "unchanged"; pack: RetirementRulePack; meta: RulePackRemoteMeta }
  | { status: "cached_fallback"; pack: RetirementRulePack; meta: RulePackRemoteMeta; error: string }
  | { status: "failed"; error: string; cached: RetirementRulePack | null };

export const RULE_PACK_CACHE_CHANGED_EVENT = "wallpaper:rule-pack-cache-changed";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function getDefaultRulePackRemoteUrl(): string {
  const fromEnv = import.meta.env.VITE_RETIREMENT_RULE_PACK_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.trim();
  }
  return "https://raw.githubusercontent.com/HarveyWebLee/wallpaper/main/apps/web/src/data/retirement-rule-pack.default.json";
}

export function notifyRulePackCacheChanged(): void {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event(RULE_PACK_CACHE_CHANGED_EVENT));
}

export function subscribeRulePackCacheChanged(onChange: () => void): () => void {
  if (!hasWindow()) return () => {};
  window.addEventListener(RULE_PACK_CACHE_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(RULE_PACK_CACHE_CHANGED_EVENT, onChange);
}

export function loadOnlineCachedRulePack(): RetirementRulePack | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(ONLINE_CACHE_KEY);
    if (!raw) return null;
    return normalizeRulePack(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getOnlineCacheMeta(): RulePackRemoteMeta | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(ONLINE_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RulePackRemoteMeta;
    if (!parsed || typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveOnlineCache(pack: RetirementRulePack, meta: RulePackRemoteMeta): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(ONLINE_CACHE_KEY, JSON.stringify(pack));
  window.localStorage.setItem(ONLINE_META_KEY, JSON.stringify(meta));
  notifyRulePackCacheChanged();
}

export function clearOnlineRulePackCache(): void {
  if (!hasWindow()) return;
  window.localStorage.removeItem(ONLINE_CACHE_KEY);
  window.localStorage.removeItem(ONLINE_META_KEY);
  window.localStorage.removeItem(AUTO_CHECK_KEY);
  notifyRulePackCacheChanged();
}

export function isRemotePackNewer(
  remote: RetirementRulePack,
  local: RetirementRulePack | null
): boolean {
  if (!local) return true;
  if (remote.id !== local.id) return remote.version >= local.version;
  return remote.version > local.version;
}

function buildMeta(pack: RetirementRulePack, sourceUrl: string): RulePackRemoteMeta {
  return {
    sourceUrl,
    fetchedAt: Date.now(),
    packId: pack.id,
    packTitle: pack.title,
    packVersion: pack.version
  };
}

async function fetchRemotePackJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * 从远程拉取规则包并写入本地缓存（有更新才覆盖；force 时强制覆盖）。
 * 网络失败时若有本地缓存则返回 cached_fallback。
 */
export async function syncRemoteRulePack(options?: {
  force?: boolean;
  url?: string;
}): Promise<RulePackSyncResult> {
  if (!hasWindow()) {
    return { status: "failed", error: "非浏览器环境", cached: null };
  }

  const sourceUrl = options?.url?.trim() || getDefaultRulePackRemoteUrl();
  const cached = loadOnlineCachedRulePack();
  const cachedMeta = getOnlineCacheMeta();

  try {
    const raw = await fetchRemotePackJson(sourceUrl);
    const remote = normalizeRulePack(raw);
    if (!remote) {
      throw new Error("远程规则包 JSON 校验失败");
    }

    const shouldWrite = Boolean(options?.force) || isRemotePackNewer(remote, cached) || !cachedMeta;

    if (!shouldWrite && cached && cachedMeta) {
      return { status: "unchanged", pack: cached, meta: cachedMeta };
    }

    const meta = buildMeta(remote, sourceUrl);
    saveOnlineCache(remote, meta);
    window.localStorage.setItem(AUTO_CHECK_KEY, String(Date.now()));
    return { status: "updated", pack: remote, meta };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    if (cached && cachedMeta) {
      return { status: "cached_fallback", pack: cached, meta: cachedMeta, error: message };
    }
    return { status: "failed", error: message, cached: null };
  }
}

/** 是否到达自动检查时间 */
export function shouldAutoCheckRemoteRulePack(): boolean {
  if (!hasWindow()) return false;
  const last = Number(window.localStorage.getItem(AUTO_CHECK_KEY) || 0);
  if (!Number.isFinite(last) || last <= 0) return true;
  return Date.now() - last >= RULE_PACK_AUTO_CHECK_MS;
}

/** 与内置包对比，用于展示「远程是否有新版本」提示（需已成功缓存过远程包） */
export function remoteAheadOfBuiltin(pack: RetirementRulePack): boolean {
  const builtin = getBuiltinRulePack();
  return isRemotePackNewer(pack, builtin);
}

export function formatRulePackMetaLine(meta: RulePackRemoteMeta | null): string {
  if (!meta) return "尚未同步在线规则包";
  const time = new Date(meta.fetchedAt).toLocaleString();
  return `${meta.packTitle} · v${meta.packVersion} · 上次同步 ${time}`;
}

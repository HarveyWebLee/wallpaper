import dayjs, { type Dayjs } from "dayjs";
import defaultPackJson from "../data/retirement-rule-pack.default.json";
import { loadOnlineCachedRulePack } from "./rulePackRemote";
import type { Gender, JobCategory, RetirementPolicy } from "./retirementPolicy";
import { getPresetRetirementAge } from "./retirementPolicy";

export type RulePackSegment = {
  gender: Gender;
  jobCategory: JobCategory;
  cohortFrom: string;
  cohortTo: string;
  startAgeMonths: number;
  endAgeMonths: number;
  stepBirthMonths: number;
};

export type RulePackOverride = {
  gender: Gender;
  jobCategory: JobCategory;
  /** 出生月 YYYY-MM */
  birthMonth: string;
  retirementAgeMonths: number;
};

export type RetirementRulePack = {
  version: number;
  id: string;
  title: string;
  disclaimer: string;
  segments: RulePackSegment[];
  overrides: RulePackOverride[];
};

const CUSTOM_PACK_KEY = "wallpaper:retirement-rule-pack:custom:v1";

let cachedBuiltin: RetirementRulePack | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function isGender(value: unknown): value is Gender {
  return value === "male" || value === "female";
}

function isJobCategory(value: unknown): value is JobCategory {
  return value === "general" || value === "management" || value === "special_early";
}

function normalizeSegment(raw: unknown): RulePackSegment | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (!isGender(s.gender) || !isJobCategory(s.jobCategory)) return null;
  const nums = ["startAgeMonths", "endAgeMonths", "stepBirthMonths"] as const;
  for (const key of nums) {
    if (typeof s[key] !== "number" || !Number.isFinite(s[key])) return null;
  }
  if (typeof s.cohortFrom !== "string" || typeof s.cohortTo !== "string") return null;
  const step = Math.max(1, Math.round(s.stepBirthMonths as number));
  return {
    gender: s.gender,
    jobCategory: s.jobCategory,
    cohortFrom: s.cohortFrom,
    cohortTo: s.cohortTo,
    startAgeMonths: Math.round(s.startAgeMonths as number),
    endAgeMonths: Math.round(s.endAgeMonths as number),
    stepBirthMonths: step
  };
}

function normalizeOverride(raw: unknown): RulePackOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!isGender(o.gender) || !isJobCategory(o.jobCategory)) return null;
  if (typeof o.birthMonth !== "string" || !/^\d{4}-\d{2}$/.test(o.birthMonth)) return null;
  if (typeof o.retirementAgeMonths !== "number" || !Number.isFinite(o.retirementAgeMonths))
    return null;
  return {
    gender: o.gender,
    jobCategory: o.jobCategory,
    birthMonth: o.birthMonth,
    retirementAgeMonths: Math.round(o.retirementAgeMonths)
  };
}

/** 校验并规整外部/导入的规则包 JSON */
export function normalizeRulePack(raw: unknown): RetirementRulePack | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  if (typeof source.version !== "number") return null;
  if (typeof source.id !== "string" || typeof source.title !== "string") return null;
  const disclaimer = typeof source.disclaimer === "string" ? source.disclaimer : "";
  if (!Array.isArray(source.segments) || source.segments.length === 0) return null;
  const segments: RulePackSegment[] = [];
  for (const item of source.segments) {
    const seg = normalizeSegment(item);
    if (seg) segments.push(seg);
  }
  if (segments.length === 0) return null;
  const overrides: RulePackOverride[] = [];
  if (Array.isArray(source.overrides)) {
    for (const item of source.overrides) {
      const ov = normalizeOverride(item);
      if (ov) overrides.push(ov);
    }
  }
  return {
    version: source.version,
    id: source.id,
    title: source.title,
    disclaimer,
    segments,
    overrides
  };
}

export function parseRulePackJson(text: string): RetirementRulePack | null {
  try {
    return normalizeRulePack(JSON.parse(text));
  } catch {
    return null;
  }
}

export function getBuiltinRulePack(): RetirementRulePack {
  if (!cachedBuiltin) {
    const normalized = normalizeRulePack(defaultPackJson);
    cachedBuiltin = normalized ?? {
      version: 1,
      id: "fallback",
      title: "内置回退",
      disclaimer: "",
      segments: [],
      overrides: []
    };
  }
  return cachedBuiltin;
}

export function loadCustomRulePack(): RetirementRulePack | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(CUSTOM_PACK_KEY);
    if (!raw) return null;
    return normalizeRulePack(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCustomRulePack(pack: RetirementRulePack): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(CUSTOM_PACK_KEY, JSON.stringify(pack));
}

export function clearCustomRulePack(): void {
  if (!hasWindow()) return;
  window.localStorage.removeItem(CUSTOM_PACK_KEY);
}

export function getActiveRulePack(
  policy: Pick<RetirementPolicy, "rulePackSource">
): RetirementRulePack {
  if (policy.rulePackSource === "custom") {
    const custom = loadCustomRulePack();
    if (custom) return custom;
  }
  if (policy.rulePackSource === "online") {
    const online = loadOnlineCachedRulePack();
    if (online) return online;
  }
  return getBuiltinRulePack();
}

function monthStart(value: string | Dayjs): Dayjs {
  return dayjs(value).startOf("month");
}

function matchOverride(
  birthday: Dayjs,
  policy: RetirementPolicy,
  pack: RetirementRulePack
): number | null {
  const birthMonth = monthStart(birthday).format("YYYY-MM");
  for (const ov of pack.overrides) {
    if (
      ov.gender === policy.gender &&
      ov.jobCategory === policy.jobCategory &&
      ov.birthMonth === birthMonth
    ) {
      return ov.retirementAgeMonths;
    }
  }
  return null;
}

function matchSegment(
  birthday: Dayjs,
  policy: RetirementPolicy,
  pack: RetirementRulePack
): number | null {
  const birth = monthStart(birthday);
  for (const rule of pack.segments) {
    if (rule.gender !== policy.gender || rule.jobCategory !== policy.jobCategory) continue;
    const from = monthStart(rule.cohortFrom);
    const to = monthStart(rule.cohortTo);
    if (birth.isBefore(from, "month")) return rule.startAgeMonths;
    if (birth.isAfter(to, "month")) return rule.endAgeMonths;
    const birthIndex = birth.diff(from, "month");
    const extraMonths = Math.floor(birthIndex / rule.stepBirthMonths);
    return Math.min(rule.endAgeMonths, rule.startAgeMonths + extraMonths);
  }
  return null;
}

/** 规则包查表：override 优先，否则 segment；无匹配回退预设周岁 */
export function lookupRetirementAgeMonthsFromPack(
  birthday: Dayjs,
  policy: RetirementPolicy,
  pack: RetirementRulePack
): number {
  const override = matchOverride(birthday, policy, pack);
  if (override !== null) return override;
  const fromSegment = matchSegment(birthday, policy, pack);
  if (fromSegment !== null) return fromSegment;
  return getPresetRetirementAge(policy) * 12;
}

export function describeActiveRulePack(policy: Pick<RetirementPolicy, "rulePackSource">): string {
  const pack = getActiveRulePack(policy);
  const sourceLabel =
    policy.rulePackSource === "custom"
      ? "自定义规则包"
      : policy.rulePackSource === "online"
        ? "在线规则包（本地缓存）"
        : "内置规则包";
  return `${sourceLabel} · ${pack.title}（v${pack.version}）`;
}

export function exportRulePackJson(pack: RetirementRulePack): string {
  return JSON.stringify(pack, null, 2);
}

export function downloadRulePackFile(pack: RetirementRulePack, filename?: string): void {
  if (!hasWindow()) return;
  const blob = new Blob([exportRulePackJson(pack)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `${pack.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

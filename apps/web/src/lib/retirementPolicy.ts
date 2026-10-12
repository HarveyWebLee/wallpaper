import type { Dayjs } from "dayjs";

/** 政策计算方式：手动指定周岁 / 按性别与岗位预设 */
export type PolicySource = "manual" | "preset";

export type Gender = "male" | "female";

/** 岗位类别（简化口径，便于用户快速选型） */
export type JobCategory = "general" | "management" | "special_early";

export type RetirementPolicy = {
  source: PolicySource;
  gender: Gender;
  jobCategory: JobCategory;
};

export const DEFAULT_RETIREMENT_POLICY: RetirementPolicy = {
  source: "manual",
  gender: "male",
  jobCategory: "general"
};

/** 预设退休年龄说明（参考国内渐进式延迟退休常见讨论口径，非官方精确算法） */
export const POLICY_PRESET_AGES: Record<Gender, Record<JobCategory, number>> = {
  male: {
    general: 63,
    management: 63,
    special_early: 55
  },
  female: {
    general: 55,
    management: 58,
    special_early: 50
  }
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "男",
  female: "女"
};

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  general: "一般职工",
  management: "管理/干部岗",
  special_early: "特殊工种（提前退休）"
};

export function normalizePolicy(raw: unknown): RetirementPolicy {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_RETIREMENT_POLICY };
  const source = raw as Record<string, unknown>;
  const gender = source.gender === "female" ? "female" : "male";
  let jobCategory: JobCategory = "general";
  if (source.jobCategory === "management") jobCategory = "management";
  else if (source.jobCategory === "special_early") jobCategory = "special_early";
  const policySource = source.source === "preset" ? "preset" : "manual";
  return { source: policySource, gender, jobCategory };
}

/** 根据性别与岗位读取预设退休年龄（周岁） */
export function getPresetRetirementAge(policy: RetirementPolicy): number {
  return POLICY_PRESET_AGES[policy.gender][policy.jobCategory];
}

/** 实际用于倒计时的退休年龄：预设模式取规则表，手动模式取用户输入 */
export function getEffectiveRetirementAge(policy: RetirementPolicy, manualAge: number): number {
  if (policy.source === "preset") return getPresetRetirementAge(policy);
  return manualAge;
}

/** 政策摘要，供配置页展示 */
export function describePolicy(policy: RetirementPolicy, manualAge: number): string {
  if (policy.source === "manual") {
    return `手动指定 · 满 ${manualAge} 周岁`;
  }
  const age = getPresetRetirementAge(policy);
  return `预设规则 · ${GENDER_LABELS[policy.gender]} · ${JOB_CATEGORY_LABELS[policy.jobCategory]} · 满 ${age} 周岁`;
}

/** 渐进式延迟退休（教学演示）：在基准年龄上按出生年份微调（可选扩展点） */
export function applyGradualDelay(baseAge: number, birthday: Dayjs | null): number {
  if (!birthday) return baseAge;
  const birthYear = birthday.year();
  // 1965 年及以前出生：不加延迟；之后每 4 年约 +1 岁（极简模型，与真实政策表格不同）
  if (birthYear <= 1965) return baseAge;
  const extra = Math.min(3, Math.floor((birthYear - 1965) / 4));
  return baseAge + extra;
}

export function getEffectiveRetirementAgeWithDelay(
  policy: RetirementPolicy,
  manualAge: number,
  birthday: Dayjs | null,
  useGradualDelay: boolean
): number {
  const base = policy.source === "preset" ? getPresetRetirementAge(policy) : manualAge;
  if (!useGradualDelay || policy.source === "manual") return base;
  return applyGradualDelay(base, birthday);
}

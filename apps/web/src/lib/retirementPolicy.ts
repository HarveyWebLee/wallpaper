import type { Dayjs } from "dayjs";

/** 政策计算方式：手动指定周岁 / 按性别与岗位预设 */
export type PolicySource = "manual" | "preset";

export type Gender = "male" | "female";

/** 岗位类别（简化口径，便于用户快速选型） */
export type JobCategory = "general" | "management" | "special_early";

export type RulePackSource = "builtin" | "custom" | "online";

export type RetirementPolicy = {
  source: PolicySource;
  gender: Gender;
  jobCategory: JobCategory;
  /** 查表使用的规则包：内置 / 在线缓存 / 用户导入自定义 */
  rulePackSource: RulePackSource;
};

export const DEFAULT_RETIREMENT_POLICY: RetirementPolicy = {
  source: "manual",
  gender: "male",
  jobCategory: "general",
  rulePackSource: "builtin"
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
  let rulePackSource: RulePackSource = "builtin";
  if (source.rulePackSource === "custom") rulePackSource = "custom";
  else if (source.rulePackSource === "online") rulePackSource = "online";
  return { source: policySource, gender, jobCategory, rulePackSource };
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

/** 手动/预设下的整数周岁（不含查表到月；查表见 retirementDelayTable） */
export function getEffectiveRetirementAgeWithDelay(
  policy: RetirementPolicy,
  manualAge: number,
  _birthday: Dayjs | null,
  _useGradualDelay: boolean
): number {
  void _birthday;
  void _useGradualDelay;
  if (policy.source === "preset") return getPresetRetirementAge(policy);
  return manualAge;
}

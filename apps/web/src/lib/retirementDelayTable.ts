import dayjs, { type Dayjs } from "dayjs";
import type { Gender, JobCategory, RetirementPolicy } from "./retirementPolicy";
import { getPresetRetirementAge } from "./retirementPolicy";

/** 渐进延迟规则：出生 cohort 从 start 到 end 月龄，按 birth 步长递增 */
type DelayRule = {
  /** 最早 cohort 退休月龄（出生当月月底满龄） */
  startAgeMonths: number;
  /** 最晚 cohort 封顶月龄 */
  endAgeMonths: number;
  /** 纳入渐进计算的出生月起始（含） */
  cohortFrom: string;
  /** 纳入渐进计算的出生月结束（含） */
  cohortTo: string;
  /** 出生每推进 stepBirthMonths 月，退休月龄 +1 */
  stepBirthMonths: number;
};

/**
 * 简化查表（非官方）：模拟「满龄年月逐步后移」。
 * 男职工一般岗：60 周岁 → 63 周岁；女工人 50→55；女干部 55→58；特殊工种不做渐进。
 */
const DELAY_RULES: Partial<Record<Gender, Partial<Record<JobCategory, DelayRule>>>> = {
  male: {
    general: {
      startAgeMonths: 60 * 12,
      endAgeMonths: 63 * 12,
      cohortFrom: "1965-01",
      cohortTo: "1976-12",
      stepBirthMonths: 4
    },
    management: {
      startAgeMonths: 60 * 12,
      endAgeMonths: 63 * 12,
      cohortFrom: "1965-01",
      cohortTo: "1976-12",
      stepBirthMonths: 4
    }
  },
  female: {
    general: {
      startAgeMonths: 50 * 12,
      endAgeMonths: 55 * 12,
      cohortFrom: "1970-01",
      cohortTo: "1981-12",
      stepBirthMonths: 4
    },
    management: {
      startAgeMonths: 55 * 12,
      endAgeMonths: 58 * 12,
      cohortFrom: "1970-01",
      cohortTo: "1981-12",
      stepBirthMonths: 4
    }
  }
};

function monthStart(value: string | Dayjs): Dayjs {
  return dayjs(value).startOf("month");
}

/** 查表得到退休月龄（自出生起） */
export function lookupRetirementAgeMonths(birthday: Dayjs, policy: RetirementPolicy): number {
  const fallbackYears = getPresetRetirementAge(policy);
  const rule = DELAY_RULES[policy.gender]?.[policy.jobCategory];
  if (!rule) return fallbackYears * 12;

  const birth = monthStart(birthday);
  const from = monthStart(rule.cohortFrom);
  const to = monthStart(rule.cohortTo);

  if (birth.isBefore(from, "month")) return rule.startAgeMonths;
  if (birth.isAfter(to, "month")) return rule.endAgeMonths;

  const birthIndex = birth.diff(from, "month");
  const extraMonths = Math.floor(birthIndex / rule.stepBirthMonths);
  return Math.min(rule.endAgeMonths, rule.startAgeMonths + extraMonths);
}

/** 精确到月的退休时刻：出生时刻 + 查表月龄 */
export function lookupRetirementDate(birthday: Dayjs, policy: RetirementPolicy): Dayjs {
  const months = lookupRetirementAgeMonths(birthday, policy);
  return birthday.add(months, "month");
}

export type RetirementAgeParts = {
  years: number;
  months: number;
};

/** 将退休时刻相对出生拆解为「X 岁 Y 个月」 */
export function retirementAgeParts(birthday: Dayjs, retirementDate: Dayjs): RetirementAgeParts {
  const years = retirementDate.diff(birthday, "year");
  const afterYears = birthday.add(years, "year");
  const months = retirementDate.diff(afterYears, "month");
  return { years, months };
}

export function formatRetirementAgeLabel(parts: RetirementAgeParts): string {
  if (parts.months === 0) return `满 ${parts.years} 周岁`;
  return `满 ${parts.years} 岁 ${parts.months} 个月`;
}

export function describeDelayTable(policy: RetirementPolicy): string {
  const rule = DELAY_RULES[policy.gender]?.[policy.jobCategory];
  if (!rule) return "当前岗位类别使用固定预设年龄，不参与渐进查表";
  return `出生 ${rule.cohortFrom}～${rule.cohortTo} 按 ${rule.stepBirthMonths} 个月一档渐进`;
}

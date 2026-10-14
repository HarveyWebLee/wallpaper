import type { Dayjs } from "dayjs";
import type { Gender, JobCategory, RetirementPolicy } from "./retirementPolicy";
import {
  describeActiveRulePack,
  getActiveRulePack,
  lookupRetirementAgeMonthsFromPack
} from "./retirementRulePack";

export type RetirementAgeParts = {
  years: number;
  months: number;
};

/** 查表得到退休月龄（自出生起） */
export function lookupRetirementAgeMonths(birthday: Dayjs, policy: RetirementPolicy): number {
  const pack = getActiveRulePack(policy);
  return lookupRetirementAgeMonthsFromPack(birthday, policy, pack);
}

/** 精确到月的退休时刻：出生时刻 + 查表月龄 */
export function lookupRetirementDate(birthday: Dayjs, policy: RetirementPolicy): Dayjs {
  const months = lookupRetirementAgeMonths(birthday, policy);
  return birthday.add(months, "month");
}

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
  const pack = getActiveRulePack(policy);
  const segment = pack.segments.find(
    (s) => s.gender === policy.gender && s.jobCategory === policy.jobCategory
  );
  if (!segment) return `${describeActiveRulePack(policy)} · 当前岗位使用固定预设年龄`;
  return `${describeActiveRulePack(policy)} · 出生 ${segment.cohortFrom}～${segment.cohortTo} 逐 ${segment.stepBirthMonths} 月递进`;
}

/** 供配置页展示规则包免责声明 */
export function getActiveRulePackDisclaimer(policy: RetirementPolicy): string {
  return getActiveRulePack(policy).disclaimer;
}

export type { Gender, JobCategory };

import dayjs, { type Dayjs } from "dayjs";
import type { RetirementConfig } from "./config";

export type RemainingBreakdown = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const EMPTY_BREAKDOWN: RemainingBreakdown = {
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
};

/** 配置中的出生时间 → Dayjs；未设置或非法返回 null */
export function toBirthday(config: RetirementConfig): Dayjs | null {
  if (!config.birthday) return null;
  const parsed = dayjs(config.birthday);
  return parsed.isValid() ? parsed : null;
}

/** 满 retirementAge 周岁的退休时刻；未设置出生时间返回 null */
export function computeRetirementDate(config: RetirementConfig): Dayjs | null {
  const birthday = toBirthday(config);
  if (!birthday) return null;
  return birthday.add(config.retirementAge, "year");
}

/**
 * 将「当前时刻」到「退休时刻」之间的剩余时间，
 * 拆成 年 / 月 / 日 / 时 / 分 / 秒（按日历逐级推进，避免简单除法失真）。
 */
export function breakdownRemaining(from: Dayjs, to: Dayjs): RemainingBreakdown {
  if (!to.isAfter(from)) return { ...EMPTY_BREAKDOWN };

  let cursor = from.clone();
  let years = 0;
  /** 逐级推进：下一单位时刻若仍不晚于终点，则累加 */
  while (!cursor.add(1, "year").isAfter(to)) {
    years += 1;
    cursor = cursor.add(1, "year");
  }
  let months = 0;
  while (!cursor.add(1, "month").isAfter(to)) {
    months += 1;
    cursor = cursor.add(1, "month");
  }
  let days = 0;
  while (!cursor.add(1, "day").isAfter(to)) {
    days += 1;
    cursor = cursor.add(1, "day");
  }
  let hours = 0;
  while (!cursor.add(1, "hour").isAfter(to)) {
    hours += 1;
    cursor = cursor.add(1, "hour");
  }
  let minutes = 0;
  while (!cursor.add(1, "minute").isAfter(to)) {
    minutes += 1;
    cursor = cursor.add(1, "minute");
  }
  const seconds = to.diff(cursor, "second");

  return { years, months, days, hours, minutes, seconds };
}

/** 从出生到退休的人生进度（0-100） */
export function computeLifeProgress(now: Dayjs, config: RetirementConfig): number {
  const birthday = toBirthday(config);
  const retirementDate = computeRetirementDate(config);
  if (!birthday || !retirementDate) return 0;
  const total = retirementDate.diff(birthday);
  if (total <= 0) return 100;
  const ratio = (now.diff(birthday) / total) * 100;
  return Math.min(100, Math.max(0, ratio));
}

export function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

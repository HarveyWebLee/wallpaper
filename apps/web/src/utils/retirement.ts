import type { Dayjs } from "dayjs";

export function breakdownRemaining(from: Dayjs, to: Dayjs) {
  if (!to.isAfter(from)) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  let cur = from.clone();
  let years = 0;
  while (!cur.add(1, "year").isAfter(to)) {
    years += 1;
    cur = cur.add(1, "year");
  }
  let months = 0;
  while (!cur.add(1, "month").isAfter(to)) {
    months += 1;
    cur = cur.add(1, "month");
  }
  let days = 0;
  while (!cur.add(1, "day").isAfter(to)) {
    days += 1;
    cur = cur.add(1, "day");
  }
  let hours = 0;
  while (!cur.add(1, "hour").isAfter(to)) {
    hours += 1;
    cur = cur.add(1, "hour");
  }
  let minutes = 0;
  while (!cur.add(1, "minute").isAfter(to)) {
    minutes += 1;
    cur = cur.add(1, "minute");
  }
  const seconds = to.diff(cur, "second");

  return { years, months, days, hours, minutes, seconds };
}

export function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function formatPlatformLabel(platform?: string): string {
  switch (platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return platform ?? "未知";
  }
}

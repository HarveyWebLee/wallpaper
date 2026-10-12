import type { Dayjs } from "dayjs";

export type ReminderConfig = {
  enabled: boolean;
  /** 预设政策下按出生年月查表（精确到月） */
  useGradualDelay: boolean;
  /** 距离退休剩余整天数达到下列值时各提醒一次（0 = 退休当天） */
  milestoneDays: number[];
  /** 追加到通知正文的自定义附言 */
  customNote: string;
};

export const REMINDER_MILESTONE_PRESETS = [365, 100, 30, 7, 1, 0] as const;

export const REMINDER_MILESTONE_OPTIONS = [...REMINDER_MILESTONE_PRESETS];

export const DEFAULT_REMINDERS: ReminderConfig = {
  enabled: false,
  useGradualDelay: false,
  milestoneDays: [...REMINDER_MILESTONE_PRESETS],
  customNote: ""
};

const FIRED_STORAGE_KEY = "wallpaper:reminder-fired:v1";

export type ReminderFiredRecord = {
  /** 对应的目标退休时刻 ISO，变更后重新计发 */
  retirementIso: string;
  /** 已触发的 milestone 天数 */
  days: number[];
};

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function normalizeReminders(raw: unknown): ReminderConfig {
  if (!raw || typeof raw !== "object")
    return { ...DEFAULT_REMINDERS, milestoneDays: [...DEFAULT_REMINDERS.milestoneDays] };
  const source = raw as Record<string, unknown>;
  const enabled = Boolean(source.enabled);
  const useGradualDelay = Boolean(source.useGradualDelay);
  let milestoneDays = DEFAULT_REMINDERS.milestoneDays;
  if (Array.isArray(source.milestoneDays)) {
    const parsed = source.milestoneDays
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 3650);
    const unique = [...new Set(parsed.map((n) => Math.round(n)))].sort((a, b) => b - a);
    if (unique.length > 0) milestoneDays = unique;
  }
  const customNote = typeof source.customNote === "string" ? source.customNote.slice(0, 120) : "";
  return { enabled, useGradualDelay, milestoneDays, customNote };
}

export function toggleMilestoneDay(current: number[], day: number, on: boolean): number[] {
  const set = new Set(current);
  if (on) set.add(day);
  else set.delete(day);
  const next = [...set].sort((a, b) => b - a);
  return next.length > 0 ? next : [...DEFAULT_REMINDERS.milestoneDays];
}

export function loadFiredRecord(): ReminderFiredRecord | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(FIRED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReminderFiredRecord;
    if (!parsed || typeof parsed.retirementIso !== "string" || !Array.isArray(parsed.days)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveFiredRecord(record: ReminderFiredRecord): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

/** 当前剩余整天数（向上取整，退休当天为 0） */
export function wholeDaysUntilRetirement(now: Dayjs, retirementDate: Dayjs): number {
  if (!retirementDate.isAfter(now)) return 0;
  return Math.ceil(retirementDate.diff(now, "day", true));
}

export type ReminderPayload = {
  milestoneDay: number;
  title: string;
  body: string;
};

export function buildReminderPayload(
  milestoneDay: number,
  retirementDate: Dayjs,
  customNote?: string
): ReminderPayload {
  const dateStr = retirementDate.format("YYYY-MM-DD HH:mm");
  const suffix = customNote?.trim() ? `\n${customNote.trim()}` : "";
  if (milestoneDay === 0) {
    return {
      milestoneDay: 0,
      title: "今天退休啦 🎉",
      body: `目标退休时刻：${dateStr}。祝你开启人生新篇章！${suffix}`
    };
  }
  return {
    milestoneDay,
    title: `距离退休还有 ${milestoneDay} 天`,
    body: `目标退休时刻：${dateStr}。屏保倒计时已为你同步。${suffix}`
  };
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export async function showReminderNotification(payload: ReminderPayload): Promise<void> {
  const api = window.desktopApi;
  if (api?.showNotification) {
    await api.showNotification({ title: payload.title, body: payload.body });
    return;
  }
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(payload.title, { body: payload.body });
  }
}

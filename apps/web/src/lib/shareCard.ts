import type { Dayjs } from "dayjs";
import type { RemainingBreakdown } from "./compute";

export type ShareCardInput = {
  ageLabel: string;
  birthday: Dayjs | null;
  retirementDate: Dayjs | null;
  isRetired: boolean;
  remain: RemainingBreakdown | null;
  now: Dayjs;
  ruleHint?: string;
};

const WIDTH = 1080;
const HEIGHT = 1440;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = [...text];
  let line = "";
  let cursorY = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = ch;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

/** 绘制退休分享海报并导出 PNG Blob */
export async function renderShareCardPng(input: ShareCardInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#020617");
  gradient.addColorStop(0.45, "#0f172a");
  gradient.addColorStop(1, "#134e4a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.arc(80 + i * 86, 120 + (i % 3) * 40, 36 + (i % 4) * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRoundedRect(ctx, 64, 120, WIDTH - 128, HEIGHT - 240, 28);
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(45, 212, 191, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
  ctx.font = '700 56px ui-sans-serif, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(input.isRetired ? "恭喜退休" : "退休倒计时", 120, 240);

  ctx.font = '500 28px ui-sans-serif, "PingFang SC", sans-serif';
  ctx.fillStyle = "rgba(148, 163, 184, 0.95)";
  ctx.fillText("Wallpaper Screensaver", 120, 290);

  ctx.fillStyle = "#2dd4bf";
  ctx.font = '700 44px ui-sans-serif, "PingFang SC", sans-serif';
  ctx.fillText(input.ageLabel, 120, 380);

  ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
  ctx.font = '500 32px ui-sans-serif, "PingFang SC", sans-serif';
  const birthStr = input.birthday ? input.birthday.format("YYYY-MM-DD HH:mm") : "未设置";
  const retireStr = input.retirementDate ? input.retirementDate.format("YYYY-MM-DD HH:mm") : "—";
  ctx.fillText(`出生 ${birthStr}`, 120, 470);
  ctx.fillText(`目标 ${retireStr}`, 120, 530);

  if (!input.isRetired && input.remain) {
    ctx.fillStyle = "#38bdf8";
    ctx.font = "700 36px ui-monospace, monospace";
    const line = `${input.remain.years} 年 ${input.remain.months} 月 ${input.remain.days} 日 ${String(input.remain.hours).padStart(2, "0")}:${String(input.remain.minutes).padStart(2, "0")}:${String(input.remain.seconds).padStart(2, "0")}`;
    ctx.fillText(`还剩 ${line}`, 120, 620);
  } else if (input.isRetired) {
    ctx.fillStyle = "#4ade80";
    ctx.font = '600 34px ui-sans-serif, "PingFang SC", sans-serif';
    ctx.fillText("已到或超过退休目标时刻", 120, 620);
  }

  if (input.ruleHint) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.88)";
    ctx.font = '400 24px ui-sans-serif, "PingFang SC", sans-serif';
    wrapText(ctx, input.ruleHint, 120, 720, WIDTH - 240, 34);
  }

  ctx.fillStyle = "rgba(100, 116, 139, 0.9)";
  ctx.font = '400 22px ui-sans-serif, "PingFang SC", sans-serif';
  ctx.fillText(`生成于 ${input.now.format("YYYY-MM-DD HH:mm")}`, 120, HEIGHT - 160);
  ctx.fillText("仅供个人分享 · 政策结果以官方为准", 120, HEIGHT - 120);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("导出 PNG 失败"));
      else resolve(blob);
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportShareCardPng(input: ShareCardInput): Promise<void> {
  const blob = await renderShareCardPng(input);
  const stamp = input.now.format("YYYYMMDD-HHmm");
  const suffix = input.isRetired ? "retired" : "countdown";
  downloadBlob(blob, `wallpaper-retirement-${suffix}-${stamp}.png`);
}

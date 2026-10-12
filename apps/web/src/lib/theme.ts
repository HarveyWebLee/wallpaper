import { theme, type ThemeConfig } from "antd";
import type { AppearanceTheme } from "./config";

/** 大屏暗色主题：与自定义 Less 面板统一冷色与青蓝主色 */
export const dashboardThemeDark: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#2dd4bf",
    colorInfo: "#38bdf8",
    colorSuccess: "#4ade80",
    colorBgBase: "#030712",
    colorBgContainer: "rgba(15, 23, 42, 0.75)",
    colorBgElevated: "rgba(30, 41, 59, 0.92)",
    colorBorder: "rgba(56, 189, 248, 0.22)",
    colorBorderSecondary: "rgba(148, 163, 184, 0.12)",
    colorText: "rgba(226, 232, 240, 0.95)",
    colorTextSecondary: "rgba(148, 163, 184, 0.9)",
    colorTextTertiary: "rgba(100, 116, 139, 0.85)",
    borderRadiusLG: 10,
    fontFamily:
      'ui-sans-serif, system-ui, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
    fontFamilyCode: 'ui-monospace, "SF Mono", "Cascadia Code", monospace',
    boxShadowSecondary: "0 0 0 1px rgba(56, 189, 248, 0.06), 0 16px 48px rgba(0, 0, 0, 0.45)"
  },
  components: {
    Card: {
      headerBg: "transparent"
    },
    DatePicker: {
      activeBorderColor: "rgba(45, 212, 191, 0.55)",
      hoverBorderColor: "rgba(56, 189, 248, 0.45)"
    },
    Tag: {
      defaultBg: "rgba(30, 41, 59, 0.9)"
    }
  }
};

/** 亮色主题：浅灰底 + 同一套青蓝强调色 */
export const dashboardThemeLight: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#0d9488",
    colorInfo: "#0284c7",
    colorSuccess: "#16a34a",
    colorBgBase: "#f8fafc",
    colorBgContainer: "rgba(255, 255, 255, 0.92)",
    colorBgElevated: "#ffffff",
    colorBorder: "rgba(14, 165, 233, 0.25)",
    colorBorderSecondary: "rgba(148, 163, 184, 0.35)",
    colorText: "rgba(15, 23, 42, 0.92)",
    colorTextSecondary: "rgba(51, 65, 85, 0.85)",
    colorTextTertiary: "rgba(100, 116, 139, 0.8)",
    borderRadiusLG: 10,
    fontFamily:
      'ui-sans-serif, system-ui, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
    fontFamilyCode: 'ui-monospace, "SF Mono", "Cascadia Code", monospace',
    boxShadowSecondary: "0 0 0 1px rgba(14, 165, 233, 0.08), 0 12px 40px rgba(15, 23, 42, 0.08)"
  },
  components: {
    Card: {
      headerBg: "transparent"
    },
    DatePicker: {
      activeBorderColor: "rgba(13, 148, 136, 0.55)",
      hoverBorderColor: "rgba(2, 132, 199, 0.45)"
    }
  }
};

/** @deprecated 使用 dashboardThemeDark */
export const dashboardTheme = dashboardThemeDark;

export type ResolvedAppearance = "dark" | "light";

export function resolveAppearanceTheme(mode: AppearanceTheme): ResolvedAppearance {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

export function antThemeForResolved(resolved: ResolvedAppearance): ThemeConfig {
  return resolved === "light" ? dashboardThemeLight : dashboardThemeDark;
}

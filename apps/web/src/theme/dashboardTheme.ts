import { theme } from "antd";

export const dashboardTheme = {
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
    Card: { headerBg: "transparent" },
    DatePicker: {
      activeBorderColor: "rgba(45, 212, 191, 0.55)",
      hoverBorderColor: "rgba(56, 189, 248, 0.45)"
    },
    Tag: { defaultBg: "rgba(30, 41, 59, 0.9)" },
    Menu: {
      itemBg: "transparent",
      subMenuItemBg: "transparent"
    }
  }
};

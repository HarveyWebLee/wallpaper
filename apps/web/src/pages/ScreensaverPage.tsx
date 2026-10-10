import { useCallback, useEffect, useMemo } from "react";
import { Card, Space, Typography } from "antd";
import AppShell from "../components/AppShell";
import SettingsGear from "../components/SettingsGear";
import ImageCarousel from "../components/ImageCarousel";
import { FlipCountUnit } from "../components/flip";
import { useNow, useRetirementConfig, useScreensaverImages } from "../hooks";
import {
  breakdownRemaining,
  computeLifeProgress,
  computeRetirementDate,
  pad2
} from "../lib/compute";

/** 屏保页：仅做展示，所有计算来源于唯一配置源（localStorage），与后台配置实时同步 */
export default function ScreensaverPage() {
  const now = useNow();

  /**
   * 快速「显示/隐藏」屏保：
   * - 桌面端（Electron）：隐藏窗口到托盘（再次显示由单击托盘图标完成，见主进程）；
   * - 浏览器端：用全屏 API 近似切换沉浸屏保（进入/退出全屏），无桌面壳时也能快捷收起。
   * 供鼠标双击与键盘快捷键共用。
   */
  const toggleScreensaver = useCallback(() => {
    const api = window.desktopApi;
    if (api?.hideWindow) {
      void api.hideWindow();
      return;
    }
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // 鼠标双击任意空白处、或按 F 键，快速显示/隐藏屏保（避开齿轮入口等可交互元素）
  useEffect(() => {
    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest("a, button, input, .ant-select, .settings-gear-zone");

    const onDblClick = (event: MouseEvent) => {
      if (isInteractive(event.target)) return;
      toggleScreensaver();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleScreensaver();
      }
    };

    window.addEventListener("dblclick", onDblClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("dblclick", onDblClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toggleScreensaver]);

  // Electron：屏保页进入系统级真全屏；Esc 关闭到托盘；从托盘再次显示时重新全屏
  useEffect(() => {
    const api = window.desktopApi;
    if (!api?.setFullscreen) return;

    const enter = () => {
      void api.setFullscreen(true);
    };
    enter();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void api.hideWindow();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") enter();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      void api.setFullscreen(false);
    };
  }, []);

  const { config } = useRetirementConfig();

  const imageUrls = useScreensaverImages(config.images);
  const hasImages = imageUrls.length > 0;
  /** 纯图片模式：有图片且用户关闭倒计时叠加 */
  const photoOnly = hasImages && !config.carousel.showCountdown;

  const retirementDate = useMemo(() => computeRetirementDate(config), [config]);

  const remainingSeconds = useMemo(
    () => (retirementDate ? retirementDate.diff(now, "second") : 0),
    [retirementDate, now]
  );

  const remain = useMemo(
    () => (retirementDate ? breakdownRemaining(now, retirementDate) : null),
    [retirementDate, now]
  );

  const lifeProgress = useMemo(() => computeLifeProgress(now, config), [now, config]);

  const isRetired = Boolean(retirementDate) && remainingSeconds <= 0;

  const headerExtra = (
    <div className="dash-header__meta">
      <div className="dash-header__clock" aria-live="off">
        {now.format("HH:mm:ss")}
      </div>
      <div className="dash-header__today">{now.format("YYYY / MM / DD")}</div>
      <div className="dash-header__accent" aria-hidden />
    </div>
  );

  const backdrop = hasImages ? (
    <ImageCarousel
      urls={imageUrls}
      intervalMs={config.carousel.intervalMs}
      fit={config.carousel.fit}
    />
  ) : undefined;

  // 纯图片模式：仅沉浸展示轮播，保留右下角设置入口
  if (photoOnly) {
    return (
      <AppShell backdrop={backdrop} immersive hideHeader>
        <SettingsGear />
      </AppShell>
    );
  }

  return (
    <AppShell headerExtra={headerExtra} backdrop={backdrop} immersive={hasImages}>
      <Card className={`main-card${hasImages ? " main-card--immersive" : ""}`} bordered={false}>
        <Space className="dash-stack" orientation="vertical" size={28} style={{ width: "100%" }}>
          <Card
            className="stat-card retirement-highlight dash-panel dash-panel--cartoon"
            bordered={false}
          >
            <div className="dash-panel__label">目标时刻 · 满 {config.retirementAge} 周岁</div>
            <Typography.Title
              className="dash-panel__value"
              level={3}
              style={{ margin: "12px 0 0" }}
            >
              {retirementDate ? retirementDate.format("YYYY-MM-DD HH:mm:ss") : "尚未配置出生时间"}
            </Typography.Title>
          </Card>

          {retirementDate && !isRetired ? (
            <div className="dash-progress" role="group" aria-label="人生进度">
              <div className="dash-progress__head">
                <span className="dash-progress__label">
                  人生进度 · 距满 {config.retirementAge} 周岁
                </span>
                <span className="dash-progress__value">{lifeProgress.toFixed(1)}%</span>
              </div>
              <div className="dash-progress__track">
                <div
                  className="dash-progress__fill"
                  style={{ width: `${lifeProgress}%` }}
                  aria-hidden
                >
                  <span className="dash-progress__spark" />
                </div>
              </div>
            </div>
          ) : null}

          <div className="dash-hero-slot">
            <Card className="countdown-card dash-hero" bordered={false}>
              <div className="dash-hero__glow" aria-hidden />
              <Typography.Title className="dash-hero__heading" level={3}>
                距离退休还有
              </Typography.Title>
              {retirementDate && remain && !isRetired ? (
                <div className="flip-row" aria-live="polite">
                  <FlipCountUnit
                    label="年"
                    display={String(remain.years)}
                    minDigits={1}
                    tone="year"
                  />
                  <FlipCountUnit
                    label="月"
                    display={String(remain.months)}
                    minDigits={2}
                    tone="month"
                  />
                  <FlipCountUnit
                    label="日"
                    display={String(remain.days)}
                    minDigits={2}
                    tone="day"
                  />
                  <FlipCountUnit
                    label="时"
                    display={pad2(remain.hours)}
                    minDigits={2}
                    tone="hour"
                  />
                  <FlipCountUnit
                    label="分"
                    display={pad2(remain.minutes)}
                    minDigits={2}
                    tone="minute"
                  />
                  <FlipCountUnit
                    label="秒"
                    display={pad2(remain.seconds)}
                    minDigits={2}
                    tone="second"
                  />
                </div>
              ) : isRetired ? (
                <Typography.Text className="dash-hero__hint">
                  已到或已超过退休时间。
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary" className="dash-hero__hint">
                  尚未设置出生时间，请前往
                  <a className="dash-hero__link" href="#/admin">
                    后台配置
                  </a>
                  。
                </Typography.Text>
              )}
            </Card>
          </div>
        </Space>
      </Card>
      <SettingsGear />
    </AppShell>
  );
}

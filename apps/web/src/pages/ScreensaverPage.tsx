import { useMemo } from "react";
import { Card, Space, Typography } from "antd";
import AppShell from "../components/AppShell";
import SettingsGear from "../components/SettingsGear";
import { FlipCountUnit } from "../components/flip";
import { useNow, useRetirementConfig } from "../hooks";
import {
  breakdownRemaining,
  computeLifeProgress,
  computeRetirementDate,
  pad2
} from "../lib/compute";

/** 屏保页：仅做展示，所有计算来源于唯一配置源（localStorage），与后台配置实时同步 */
export default function ScreensaverPage() {
  const now = useNow();
  const { config } = useRetirementConfig();

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

  return (
    <AppShell headerExtra={headerExtra}>
      <Card className="main-card" bordered={false}>
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

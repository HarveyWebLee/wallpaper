import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  ConfigProvider,
  Layout,
  Space,
  Typography,
  Card,
  DatePicker,
  Row,
  Col,
  Tag,
  theme
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import "antd/dist/reset.css";
import "./styles.less";
import { FlipCountUnit } from "./components/flip";

const { Header, Content } = Layout;
const RETIREMENT_AGE = 60;

/**
 * 将「当前时刻」到「退休时刻」之间的剩余时间，
 * 拆成 年 / 月 / 日 / 时 / 分 / 秒（按日历逐级推进，避免简单除法失真）。
 */
function breakdownRemaining(from: Dayjs, to: Dayjs) {
  if (!to.isAfter(from)) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  let cur = from.clone();
  let years = 0;
  /** 逐级推进：下一单位时刻若仍不晚于终点，则累加 */
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

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function App() {
  /** 每秒刷新，驱动倒计时与翻牌动画 */
  const [now, setNow] = useState(dayjs());
  const [birthday, setBirthday] = useState<Dayjs | null>(dayjs("1995-06-15 08:00:00"));
  /** 与触发器同宽：下拉挂载在 body，须用测量值同步 popupStyle */
  const birthBlockRef = useRef<HTMLDivElement>(null);
  const [birthPickerPopupWidth, setBirthPickerPopupWidth] = useState<number>();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(dayjs());
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const el = birthBlockRef.current;
    if (!el) return;
    const sync = () => setBirthPickerPopupWidth(Math.round(el.getBoundingClientRect().width));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** 满 60 周岁同一时刻退休 */
  const retirementDate = useMemo(() => {
    if (!birthday) return null;
    return birthday.add(RETIREMENT_AGE, "year");
  }, [birthday]);

  const remainingSeconds = useMemo(() => {
    if (!retirementDate) return 0;
    return retirementDate.diff(now, "second");
  }, [retirementDate, now]);

  const remain = useMemo(
    () => (retirementDate ? breakdownRemaining(now, retirementDate) : null),
    [retirementDate, now]
  );

  const isRetired = remainingSeconds <= 0;

  return (
    <Layout className="app-shell">
      {/* 大屏底纹：科技网格 + 暗角，不参与交互 */}
      <div className="app-shell__grid" aria-hidden />
      <div className="app-shell__scanline" aria-hidden />
      <div className="app-shell__vignette" aria-hidden />
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />
      <Header className="dash-header">
        <div className="dash-header__inner">
          <div className="dash-header__brand">
            <Typography.Title className="dash-header__title" level={4}>
              退休倒计时
            </Typography.Title>
            <span className="dash-header__subtitle">RETIREMENT · DESKTOP VISUALIZATION</span>
          </div>
          <div className="dash-header__accent" aria-hidden />
        </div>
      </Header>
      <Content className="main-content">
        <Card className="main-card" bordered={false}>
          <Space className="dash-stack" orientation="vertical" size={28} style={{ width: "100%" }}>
            <div className="dash-section dash-section--config">
              <div className="dash-section__head">
                <span className="dash-section__index">01</span>
                <Typography.Title className="dash-section__title" level={4}>
                  参数配置
                </Typography.Title>
                <Tag className="dash-status-tag" color={isRetired ? "success" : "processing"}>
                  {isRetired ? "已到/已过退休时间" : "运行中 · 未到退休时间"}
                </Tag>
              </div>
              <Typography.Paragraph type="secondary" className="dash-section__desc">
                选择出生日期与时间，系统将按满 {RETIREMENT_AGE} 周岁推算退休时刻。
              </Typography.Paragraph>
            </div>

            <Row gutter={[20, 20]} wrap>
              <Col span={24}>
                <div ref={birthBlockRef} className="dash-block--birth">
                  <Typography.Text type="secondary" className="dash-block--birth__hint">
                    出生日期与时间
                  </Typography.Text>
                  <DatePicker
                    showTime
                    className="dash-datepicker--toon"
                    popupClassName="toon-picker-popup"
                    popupStyle={
                      birthPickerPopupWidth
                        ? { width: birthPickerPopupWidth, minWidth: birthPickerPopupWidth }
                        : undefined
                    }
                    style={{ width: "100%", marginTop: 8 }}
                    value={birthday}
                    onChange={setBirthday}
                    placeholder="点我选日期和具体时间～"
                    allowClear
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </div>
              </Col>
              <Col span={24}>
                <Card
                  className="stat-card retirement-highlight dash-panel dash-panel--cartoon"
                  bordered={false}
                >
                  <div className="dash-panel__label">目标时刻 · 满 {RETIREMENT_AGE} 周岁</div>
                  <Typography.Title
                    className="dash-panel__value"
                    level={3}
                    style={{ margin: "12px 0 0" }}
                  >
                    {retirementDate
                      ? retirementDate.format("YYYY-MM-DD HH:mm:ss")
                      : "等待选择出生时间"}
                  </Typography.Title>
                </Card>
              </Col>
            </Row>

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
                ) : retirementDate && isRetired ? (
                  <Typography.Text>已到或已超过退休时间。</Typography.Text>
                ) : (
                  <Typography.Text type="secondary">选择出生时间后显示倒计时。</Typography.Text>
                )}
              </Card>
            </div>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}

/** 大屏暗色主题：与自定义 Less 面板统一冷色与青蓝主色 */
const dashboardTheme = {
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={dashboardTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, DatePicker, InputNumber, Tag, Typography } from "antd";
import type { Dayjs } from "dayjs";
import AppShell from "../components/AppShell";
import { useNow, useRetirementConfig } from "../hooks";
import { DEFAULT_CONFIG, RETIREMENT_AGE_MAX, RETIREMENT_AGE_MIN } from "../lib/config";
import { computeLifeProgress, computeRetirementDate, toBirthday } from "../lib/compute";

/** 后台配置页：唯一写入配置源的入口，修改即时保存并同步到屏保页 */
export default function AdminPage() {
  const now = useNow();
  const { config, setConfig } = useRetirementConfig();

  const birthday = useMemo(() => toBirthday(config), [config]);
  const retirementDate = useMemo(() => computeRetirementDate(config), [config]);
  const lifeProgress = useMemo(() => computeLifeProgress(now, config), [now, config]);

  /** 与触发器同宽：下拉挂载在 body，须用测量值同步 popupStyle */
  const birthBlockRef = useRef<HTMLDivElement>(null);
  const [birthPickerPopupWidth, setBirthPickerPopupWidth] = useState<number>();

  useEffect(() => {
    const el = birthBlockRef.current;
    if (!el) return;
    const sync = () => setBirthPickerPopupWidth(Math.round(el.getBoundingClientRect().width));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleBirthdayChange = (value: Dayjs | null) => {
    setConfig((prev) => ({ ...prev, birthday: value ? value.toISOString() : null }));
  };

  const handleAgeChange = (value: number | null) => {
    if (value === null) return;
    setConfig((prev) => ({ ...prev, retirementAge: value }));
  };

  const handleReset = () => setConfig({ ...DEFAULT_CONFIG });

  const headerExtra = (
    <a className="dash-nav-link" href="#/">
      返回屏保
    </a>
  );

  return (
    <AppShell headerExtra={headerExtra}>
      <div className="admin-wrap">
        <Card className="admin-card" bordered={false}>
          <div className="dash-section dash-section--config">
            <div className="dash-section__head">
              <span className="dash-section__index">后台配置</span>
              <Typography.Title className="dash-section__title" level={4}>
                参数配置
              </Typography.Title>
              <Tag className="dash-status-tag" color="processing">
                修改后自动保存并同步至屏保
              </Tag>
            </div>
            <Typography.Paragraph type="secondary" className="dash-section__desc">
              设置出生日期与退休年龄，屏保页面将据此实时计算并展示退休倒计时。
            </Typography.Paragraph>
          </div>

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
              onChange={handleBirthdayChange}
              placeholder="点我选日期和具体时间～"
              allowClear
              format="YYYY-MM-DD HH:mm:ss"
            />
          </div>

          <div className="admin-field">
            <Typography.Text type="secondary" className="dash-block--birth__hint">
              退休年龄（周岁）
            </Typography.Text>
            <InputNumber
              className="admin-age-input"
              min={RETIREMENT_AGE_MIN}
              max={RETIREMENT_AGE_MAX}
              value={config.retirementAge}
              onChange={handleAgeChange}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>

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
              {retirementDate ? retirementDate.format("YYYY-MM-DD HH:mm:ss") : "请选择出生时间"}
            </Typography.Title>
          </Card>

          {retirementDate ? (
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

          <div className="admin-actions">
            <Button className="admin-btn" onClick={handleReset}>
              重置为默认
            </Button>
            <Button className="admin-btn admin-btn--primary" type="primary" href="#/">
              查看屏保
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

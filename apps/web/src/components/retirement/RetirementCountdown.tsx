import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, DatePicker, Space, Tag, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { FlipCountUnit } from "../flip";
import { breakdownRemaining, pad2 } from "../../utils/retirement";

interface RetirementCountdownProps {
  birthDate: string;
  retirementAge: number;
  compact?: boolean;
  onBirthDateChange?: (value: string) => void;
  editable?: boolean;
}

export function RetirementCountdown({
  birthDate,
  retirementAge,
  compact = false,
  onBirthDateChange,
  editable = false
}: RetirementCountdownProps) {
  const [now, setNow] = useState(dayjs());
  const [birthday, setBirthday] = useState<Dayjs | null>(dayjs(birthDate));
  const birthBlockRef = useRef<HTMLDivElement>(null);
  const [birthPickerPopupWidth, setBirthPickerPopupWidth] = useState<number>();

  useEffect(() => {
    setBirthday(dayjs(birthDate));
  }, [birthDate]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
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

  const retirementDate = useMemo(() => {
    if (!birthday) return null;
    return birthday.add(retirementAge, "year");
  }, [birthday, retirementAge]);

  const remainingSeconds = useMemo(() => {
    if (!retirementDate) return 0;
    return retirementDate.diff(now, "second");
  }, [retirementDate, now]);

  const remain = useMemo(
    () => (retirementDate ? breakdownRemaining(now, retirementDate) : null),
    [retirementDate, now]
  );

  const isRetired = remainingSeconds <= 0;

  const handleBirthChange = (value: Dayjs | null) => {
    setBirthday(value);
    if (value && onBirthDateChange) {
      onBirthDateChange(value.format("YYYY-MM-DD HH:mm:ss"));
    }
  };

  return (
    <Space
      className="dash-stack"
      orientation="vertical"
      size={compact ? 16 : 28}
      style={{ width: "100%" }}
    >
      {!compact && (
        <div className="dash-section dash-section--config">
          <div className="dash-section__head">
            <span className="dash-section__index">01</span>
            <Typography.Title className="dash-section__title" level={4}>
              退休场景参数
            </Typography.Title>
            <Tag className="dash-status-tag" color={isRetired ? "success" : "processing"}>
              {isRetired ? "已到/已过退休时间" : "运行中"}
            </Tag>
          </div>
          <Typography.Paragraph type="secondary" className="dash-section__desc">
            出生日期将同步到壁纸场景；满 {retirementAge} 周岁为退休时刻。
          </Typography.Paragraph>
        </div>
      )}

      {editable && (
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
            onChange={handleBirthChange}
            placeholder="选择出生日期与时间"
            allowClear
            format="YYYY-MM-DD HH:mm:ss"
          />
        </div>
      )}

      {!compact && retirementDate && (
        <Card
          className="stat-card retirement-highlight dash-panel dash-panel--cartoon"
          bordered={false}
        >
          <div className="dash-panel__label">目标时刻 · 满 {retirementAge} 周岁</div>
          <Typography.Title className="dash-panel__value" level={3} style={{ margin: "12px 0 0" }}>
            {retirementDate.format("YYYY-MM-DD HH:mm:ss")}
          </Typography.Title>
        </Card>
      )}

      <div className="dash-hero-slot">
        <Card className="countdown-card dash-hero" bordered={false}>
          <div className="dash-hero__glow" aria-hidden />
          <Typography.Title className="dash-hero__heading" level={3}>
            距离退休还有
          </Typography.Title>
          {retirementDate && remain && !isRetired ? (
            <div className="flip-row" aria-live="polite">
              <FlipCountUnit label="年" display={String(remain.years)} minDigits={1} tone="year" />
              <FlipCountUnit
                label="月"
                display={String(remain.months)}
                minDigits={2}
                tone="month"
              />
              <FlipCountUnit label="日" display={String(remain.days)} minDigits={2} tone="day" />
              <FlipCountUnit label="时" display={pad2(remain.hours)} minDigits={2} tone="hour" />
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
            <Typography.Text type="secondary">等待出生时间配置。</Typography.Text>
          )}
        </Card>
      </div>
    </Space>
  );
}

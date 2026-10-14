import { useState } from "react";
import { Button, message } from "antd";
import type { Dayjs } from "dayjs";
import type { RetirementConfig } from "../lib/config";
import {
  breakdownRemaining,
  computeRetirementDate,
  getDisplayRetirementAgeLabel,
  toBirthday
} from "../lib/compute";
import { describeDelayTable, getActiveRulePackDisclaimer } from "../lib/retirementDelayTable";
import { exportShareCardPng } from "../lib/shareCard";

export type ShareCardButtonProps = {
  config: RetirementConfig;
  now: Dayjs;
  className?: string;
};

/** 导出退休倒计时/达成分享海报 PNG */
export default function ShareCardButton({ config, now, className }: ShareCardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const birthday = toBirthday(config);
    const retirementDate = computeRetirementDate(config);
    if (!birthday || !retirementDate) {
      message.warning("请先配置出生时间与退休目标");
      return;
    }
    setLoading(true);
    try {
      const remainingSeconds = retirementDate.diff(now, "second");
      const isRetired = remainingSeconds <= 0;
      const remain = isRetired ? null : breakdownRemaining(now, retirementDate);
      const ruleHint =
        config.policy.source === "preset" && config.reminders.useGradualDelay
          ? `${describeDelayTable(config.policy)}。${getActiveRulePackDisclaimer(config.policy)}`
          : undefined;
      await exportShareCardPng({
        ageLabel: getDisplayRetirementAgeLabel(config),
        birthday,
        retirementDate,
        isRetired,
        remain,
        now,
        ruleHint
      });
      message.success("分享卡片已下载");
    } catch {
      message.error("导出失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className={className} loading={loading} onClick={() => void handleExport()}>
      导出分享卡片
    </Button>
  );
}

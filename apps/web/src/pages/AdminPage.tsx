import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Tag,
  Typography,
  message
} from "antd";
import type { Dayjs } from "dayjs";
import AppShell from "../components/AppShell";
import ShareCardButton from "../components/ShareCardButton";
import ScreensaverImageManager from "../components/ScreensaverImageManager";
import { useNow, useRetirementConfig } from "../hooks";
import {
  DEFAULT_CONFIG,
  MAX_IMAGES,
  RETIREMENT_AGE_MAX,
  RETIREMENT_AGE_MIN,
  type CarouselConfig,
  type ScreensaverImage
} from "../lib/config";
import {
  computeLifeProgress,
  computeRetirementDate,
  getDisplayRetirementAge,
  getDisplayRetirementAgeLabel,
  toBirthday
} from "../lib/compute";
import { describeDelayTable, getActiveRulePackDisclaimer } from "../lib/retirementDelayTable";
import {
  clearCustomRulePack,
  downloadRulePackFile,
  getActiveRulePack,
  getBuiltinRulePack,
  parseRulePackJson,
  saveCustomRulePack
} from "../lib/retirementRulePack";
import {
  GENDER_LABELS,
  JOB_CATEGORY_LABELS,
  describePolicy,
  type Gender,
  type JobCategory,
  type PolicySource,
  type RulePackSource
} from "../lib/retirementPolicy";
import {
  REMINDER_MILESTONE_OPTIONS,
  REMINDER_MILESTONE_PRESETS,
  toggleMilestoneDay,
  requestNotificationPermission
} from "../lib/reminders";
import type { AppearanceTheme } from "../lib/config";
import { deleteImage, genImageId, putImage } from "../lib/imageStore";

/** 后台配置页：唯一写入配置源的入口，修改即时保存并同步到屏保页 */
export default function AdminPage() {
  const now = useNow();
  const { config, setConfig } = useRetirementConfig();

  const birthday = useMemo(() => toBirthday(config), [config]);
  const retirementDate = useMemo(() => computeRetirementDate(config), [config]);
  const lifeProgress = useMemo(() => computeLifeProgress(now, config), [now, config]);
  const displayAge = useMemo(() => getDisplayRetirementAge(config), [config]);
  const ageLabel = useMemo(() => getDisplayRetirementAgeLabel(config), [config]);
  const policySummary = useMemo(
    () => describePolicy(config.policy, config.retirementAge),
    [config.policy, config.retirementAge]
  );
  const delayTableHint = useMemo(() => describeDelayTable(config.policy), [config.policy]);
  const rulePackDisclaimer = useMemo(
    () => getActiveRulePackDisclaimer(config.policy),
    [config.policy]
  );

  const [imageError, setImageError] = useState<string | null>(null);
  const [customMilestoneDay, setCustomMilestoneDay] = useState<number | null>(null);

  /** 与触发器同宽：下拉挂载在 body，须用测量值同步 popupStyle */
  const birthBlockRef = useRef<HTMLDivElement>(null);
  const rulePackFileRef = useRef<HTMLInputElement>(null);
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

  // 重置仅恢复出生日期与退休年龄，保留已上传图片，避免误删与孤儿 blob
  const handleReset = () =>
    setConfig((prev) => ({
      ...prev,
      birthday: DEFAULT_CONFIG.birthday,
      retirementAge: DEFAULT_CONFIG.retirementAge,
      policy: { ...DEFAULT_CONFIG.policy },
      reminders: {
        ...DEFAULT_CONFIG.reminders,
        milestoneDays: [...DEFAULT_CONFIG.reminders.milestoneDays]
      },
      appearance: { ...DEFAULT_CONFIG.appearance }
    }));

  const handlePolicySource = (source: PolicySource) => {
    setConfig((prev) => ({ ...prev, policy: { ...prev.policy, source } }));
  };

  const handlePolicyGender = (gender: Gender) => {
    setConfig((prev) => ({ ...prev, policy: { ...prev.policy, gender } }));
  };

  const handlePolicyJob = (jobCategory: JobCategory) => {
    setConfig((prev) => ({ ...prev, policy: { ...prev.policy, jobCategory } }));
  };

  const handleGradualDelay = (checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      reminders: { ...prev.reminders, useGradualDelay: checked }
    }));
  };

  const handleRemindersEnabled = async (checked: boolean) => {
    if (checked) {
      const perm = await requestNotificationPermission();
      if (perm === "denied") {
        message.warning("通知权限被拒绝，请在系统设置中允许本应用通知");
        return;
      }
      if (perm === "unsupported" && !window.desktopApi?.showNotification) {
        message.info("当前环境不支持浏览器通知，请使用桌面端获得完整提醒");
      }
    }
    setConfig((prev) => ({
      ...prev,
      reminders: { ...prev.reminders, enabled: checked }
    }));
  };

  const handleThemeChange = (theme: AppearanceTheme) => {
    setConfig((prev) => ({ ...prev, appearance: { theme } }));
  };

  const handleResetMilestones = () => {
    setConfig((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        milestoneDays: [...REMINDER_MILESTONE_PRESETS]
      }
    }));
  };

  const handleAddCustomMilestone = () => {
    if (customMilestoneDay === null || !Number.isFinite(customMilestoneDay)) return;
    const day = Math.min(3650, Math.max(0, Math.round(customMilestoneDay)));
    setConfig((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        milestoneDays: toggleMilestoneDay(prev.reminders.milestoneDays, day, true)
      }
    }));
    setCustomMilestoneDay(null);
  };

  const handleReminderNote = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      reminders: { ...prev.reminders, customNote: value.slice(0, 120) }
    }));
  };

  const handleRulePackSource = (rulePackSource: RulePackSource) => {
    setConfig((prev) => ({ ...prev, policy: { ...prev.policy, rulePackSource } }));
  };

  const handleImportRulePackFile = async (file: File) => {
    try {
      const pack = parseRulePackJson(await file.text());
      if (!pack) {
        message.error("规则包 JSON 格式无效，请对照内置包结构");
        return;
      }
      saveCustomRulePack(pack);
      setConfig((prev) => ({
        ...prev,
        policy: { ...prev.policy, rulePackSource: "custom" }
      }));
      message.success(`已导入规则包：${pack.title}`);
    } catch {
      message.error("读取文件失败");
    }
  };

  const handleExportRulePack = () => {
    downloadRulePackFile(getActiveRulePack(config.policy));
  };

  const handleExportBuiltinTemplate = () => {
    downloadRulePackFile(getBuiltinRulePack(), "retirement-rule-pack.template.json");
  };

  const handleClearCustomRulePack = () => {
    clearCustomRulePack();
    setConfig((prev) => ({
      ...prev,
      policy: { ...prev.policy, rulePackSource: "builtin" }
    }));
    message.success("已恢复内置规则包");
  };

  const addFiles = async (files: File[]) => {
    setImageError(null);
    const remaining = MAX_IMAGES - config.images.length;
    if (remaining <= 0) {
      setImageError(`最多可添加 ${MAX_IMAGES} 张图片`);
      return;
    }
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        setImageError("仅支持图片文件");
        continue;
      }
      const id = genImageId();
      try {
        await putImage(id, file);
      } catch {
        setImageError("图片保存失败，请重试");
        continue;
      }
      const meta: ScreensaverImage = {
        id,
        name: file.name,
        type: file.type,
        addedAt: Date.now()
      };
      setConfig((prev) => ({ ...prev, images: [...prev.images, meta] }));
    }
  };

  const removeImage = async (id: string) => {
    setConfig((prev) => ({ ...prev, images: prev.images.filter((image) => image.id !== id) }));
    try {
      await deleteImage(id);
    } catch {
      // 元数据已移除；残留 blob 可忽略，不影响展示
    }
  };

  const moveImage = (id: string, dir: -1 | 1) => {
    setConfig((prev) => {
      const index = prev.images.findIndex((image) => image.id === id);
      const target = index + dir;
      if (index < 0 || target < 0 || target >= prev.images.length) return prev;
      const next = [...prev.images];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...prev, images: next };
    });
  };

  const changeCarousel = (patch: Partial<CarouselConfig>) => {
    setConfig((prev) => ({ ...prev, carousel: { ...prev.carousel, ...patch } }));
  };

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

          <div className="admin-field admin-field--policy">
            <Typography.Text type="secondary" className="dash-block--birth__hint">
              退休政策
            </Typography.Text>
            <Radio.Group
              className="admin-policy-source"
              value={config.policy.source}
              onChange={(e) => handlePolicySource(e.target.value as PolicySource)}
              style={{ marginTop: 8 }}
            >
              <Radio.Button value="manual">手动指定年龄</Radio.Button>
              <Radio.Button value="preset">性别 / 岗位预设</Radio.Button>
            </Radio.Group>
            {config.policy.source === "preset" ? (
              <div className="admin-policy-preset">
                <Select
                  className="admin-policy-select"
                  value={config.policy.gender}
                  onChange={handlePolicyGender}
                  options={(Object.entries(GENDER_LABELS) as [Gender, string][]).map(
                    ([value, label]) => ({ value, label })
                  )}
                />
                <Select
                  className="admin-policy-select"
                  value={config.policy.jobCategory}
                  onChange={handlePolicyJob}
                  options={(Object.entries(JOB_CATEGORY_LABELS) as [JobCategory, string][]).map(
                    ([value, label]) => ({ value, label })
                  )}
                />
                <div className="admin-policy-hint">
                  <Switch
                    size="small"
                    checked={config.reminders.useGradualDelay}
                    onChange={handleGradualDelay}
                  />
                  <Typography.Text type="secondary">
                    按出生年月查表（精确到月，简化非官方表格）
                  </Typography.Text>
                </div>
                {config.reminders.useGradualDelay ? (
                  <>
                    <Typography.Text type="secondary" className="admin-policy-table-hint">
                      {delayTableHint}
                    </Typography.Text>
                    <Typography.Paragraph type="secondary" className="admin-rule-pack-disclaimer">
                      {rulePackDisclaimer}
                    </Typography.Paragraph>
                    <Radio.Group
                      className="admin-rule-pack-source"
                      value={config.policy.rulePackSource}
                      onChange={(e) => handleRulePackSource(e.target.value as RulePackSource)}
                    >
                      <Radio.Button value="builtin">内置规则包</Radio.Button>
                      <Radio.Button value="custom">自定义导入</Radio.Button>
                    </Radio.Group>
                    <div className="admin-rule-pack-actions">
                      <input
                        ref={rulePackFileRef}
                        type="file"
                        accept="application/json,.json"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleImportRulePackFile(file);
                          e.target.value = "";
                        }}
                      />
                      <Button onClick={() => rulePackFileRef.current?.click()}>导入 JSON</Button>
                      <Button onClick={handleExportRulePack}>导出当前包</Button>
                      <Button type="link" onClick={handleExportBuiltinTemplate}>
                        下载模板
                      </Button>
                      {config.policy.rulePackSource === "custom" ? (
                        <Button type="link" danger onClick={handleClearCustomRulePack}>
                          清除自定义
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
            <Tag className="admin-policy-tag" color="blue">
              {policySummary} · 生效 {ageLabel}
            </Tag>
          </div>

          <div className="admin-field">
            <Typography.Text type="secondary" className="dash-block--birth__hint">
              退休年龄（周岁）{config.policy.source === "preset" ? "· 预设模式下由规则计算" : ""}
            </Typography.Text>
            <InputNumber
              className="admin-age-input"
              min={RETIREMENT_AGE_MIN}
              max={RETIREMENT_AGE_MAX}
              value={config.policy.source === "preset" ? displayAge : config.retirementAge}
              onChange={handleAgeChange}
              disabled={config.policy.source === "preset"}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>

          <div className="admin-field admin-field--reminders">
            <Typography.Text type="secondary" className="dash-block--birth__hint">
              退休提醒
            </Typography.Text>
            <div className="admin-reminder-row">
              <Switch
                checked={config.reminders.enabled}
                onChange={(v) => void handleRemindersEnabled(v)}
              />
              <Typography.Text type="secondary">开启后，在下列剩余天数各通知一次</Typography.Text>
            </div>
            <Checkbox.Group
              className="admin-milestone-group"
              value={config.reminders.milestoneDays}
              options={REMINDER_MILESTONE_OPTIONS.map((day) => ({
                label: day === 0 ? "当天 (0)" : `${day} 天`,
                value: day
              }))}
              onChange={(values) =>
                setConfig((prev) => ({
                  ...prev,
                  reminders: {
                    ...prev.reminders,
                    milestoneDays: (values as number[]).length
                      ? ([...values] as number[]).sort((a, b) => b - a)
                      : [...REMINDER_MILESTONE_PRESETS]
                  }
                }))
              }
            />
            <div className="admin-milestone-custom">
              <InputNumber
                min={0}
                max={3650}
                placeholder="自定义天数"
                value={customMilestoneDay}
                onChange={(v) => setCustomMilestoneDay(v)}
              />
              <Button onClick={handleAddCustomMilestone}>添加节点</Button>
              <Button type="link" onClick={handleResetMilestones}>
                恢复默认节点
              </Button>
            </div>
            <Input.TextArea
              className="admin-reminder-note"
              placeholder="通知附言（可选，最多 120 字）"
              value={config.reminders.customNote}
              onChange={(e) => handleReminderNote(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 3 }}
              maxLength={120}
              showCount
            />
          </div>

          <div className="admin-field">
            <Typography.Text type="secondary" className="dash-block--birth__hint">
              界面主题
            </Typography.Text>
            <Select
              className="admin-theme-select"
              value={config.appearance.theme}
              onChange={handleThemeChange}
              style={{ width: "100%", marginTop: 8 }}
              options={[
                { value: "dark", label: "深色（默认大屏）" },
                { value: "light", label: "浅色" },
                { value: "system", label: "跟随系统" }
              ]}
            />
          </div>

          <ScreensaverImageManager
            images={config.images}
            carousel={config.carousel}
            error={imageError}
            onAddFiles={addFiles}
            onRemove={removeImage}
            onMove={moveImage}
            onCarouselChange={changeCarousel}
          />

          <Card
            className="stat-card retirement-highlight dash-panel dash-panel--cartoon"
            bordered={false}
          >
            <div className="dash-panel__label">目标时刻 · {ageLabel}</div>
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
                <span className="dash-progress__label">人生进度 · 距{ageLabel}</span>
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
            <ShareCardButton className="admin-btn" config={config} now={now} />
            <Button className="admin-btn admin-btn--primary" type="primary" href="#/">
              查看屏保
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

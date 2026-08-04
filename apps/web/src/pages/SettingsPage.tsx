import { Card, Col, Row, Select, Slider, Space, Switch, Typography, message } from "antd";
import { useDesktopApi, useSettings } from "../hooks/useDesktopApi";
import type { PerformanceMode } from "../types/desktop";

export function SettingsPage() {
  const api = useDesktopApi();
  const { settings, patch } = useSettings();

  if (!settings) return null;

  const update = async (data: Parameters<typeof patch>[0]) => {
    await patch(data);
    message.success("设置已保存");
  };

  return (
    <div className="page-settings">
      <div className="page-header">
        <Typography.Title level={3} className="page-header__title">
          偏好设置
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          启动、性能与行为配置，修改后即时生效
        </Typography.Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card className="glass-card settings-group" bordered={false} title="启动与行为">
            <Space orientation="vertical" size={20} style={{ width: "100%" }}>
              <div className="settings-row">
                <div>
                  <Typography.Text strong>登录时自动启动</Typography.Text>
                  <Typography.Text type="secondary" className="settings-row__hint">
                    开机后静默启动到托盘
                  </Typography.Text>
                </div>
                <Switch
                  checked={settings.openAtLogin}
                  onChange={async (v) => {
                    await api.setOpenAtLogin(v);
                    message.success("已更新启动项");
                  }}
                />
              </div>
              <div className="settings-row">
                <div>
                  <Typography.Text strong>启动时应用壁纸</Typography.Text>
                </div>
                <Switch
                  checked={settings.startWallpaperOnLaunch}
                  onChange={(v) => update({ startWallpaperOnLaunch: v })}
                />
              </div>
              <div className="settings-row">
                <div>
                  <Typography.Text strong>全屏应用时暂停</Typography.Text>
                  <Typography.Text type="secondary" className="settings-row__hint">
                    游戏全屏时降低资源占用
                  </Typography.Text>
                </div>
                <Switch
                  checked={settings.pauseOnFullscreen}
                  onChange={(v) => update({ pauseOnFullscreen: v })}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="glass-card settings-group" bordered={false} title="性能与媒体">
            <Space orientation="vertical" size={20} style={{ width: "100%" }}>
              <div className="settings-row">
                <Typography.Text strong>性能模式</Typography.Text>
                <Select<PerformanceMode>
                  value={settings.performanceMode}
                  style={{ width: 160 }}
                  onChange={(v) => update({ performanceMode: v })}
                  options={[
                    { value: "low", label: "省电" },
                    { value: "balanced", label: "平衡" },
                    { value: "high", label: "高画质" }
                  ]}
                />
              </div>
              <div className="settings-row settings-row--column">
                <Typography.Text strong>视频壁纸音量</Typography.Text>
                <Slider
                  min={0}
                  max={100}
                  value={settings.videoVolume}
                  onChangeComplete={(v) => update({ videoVolume: v })}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

import { Button, Card, Col, Row, Space, Tag, Typography, message } from "antd";
import {
  AppstoreOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { useDesktopApi, useSettings, useWallpapers } from "../hooks/useDesktopApi";
import { formatPlatformLabel } from "../utils/retirement";

export function HomePage() {
  const api = useDesktopApi();
  const { settings, refresh: refreshSettings } = useSettings();
  const { wallpapers } = useWallpapers();

  if (!settings) return null;

  const active = wallpapers.find((w) => w.id === settings.activeWallpaperId);

  const handleApply = async () => {
    await api.applyWallpapers();
    await refreshSettings();
    message.success("壁纸已应用到桌面");
  };

  const handleTogglePause = async () => {
    if (settings.paused) {
      await api.resumeWallpapers();
      message.success("壁纸已恢复");
    } else {
      await api.pauseWallpapers();
      message.info("壁纸已暂停");
    }
    await refreshSettings();
  };

  return (
    <div className="page-home">
      <div className="page-header">
        <Typography.Title level={3} className="page-header__title">
          控制中心
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          跨平台动态壁纸 · 当前运行于 {formatPlatformLabel(api.platform)}
        </Typography.Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card className="dash-panel glass-card" bordered={false}>
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              <div className="dash-section__head">
                <span className="dash-section__index">状态</span>
                <Tag color={settings.paused ? "default" : "processing"}>
                  {settings.paused ? "已暂停" : "运行中"}
                </Tag>
                <Tag color={settings.wallpaperApplied ? "success" : "warning"}>
                  {settings.wallpaperApplied ? "已应用" : "未应用"}
                </Tag>
              </div>
              <Typography.Text type="secondary">
                当前壁纸：{active?.name ?? "未选择"}
              </Typography.Text>
              <Space wrap>
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleApply}>
                  应用壁纸
                </Button>
                <Button
                  icon={settings.paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={handleTogglePause}
                >
                  {settings.paused ? "恢复" : "暂停"}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => api.refreshWallpapers()}>
                  刷新显示器
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="dash-panel glass-card" bordered={false}>
            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                <AppstoreOutlined /> 快速概览
              </Typography.Title>
              <Typography.Text type="secondary">壁纸库 {wallpapers.length} 项</Typography.Text>
              <Typography.Text type="secondary">
                性能模式：{settings.performanceMode}
              </Typography.Text>
              <Typography.Text type="secondary">
                启动时应用：{settings.startWallpaperOnLaunch ? "是" : "否"}
              </Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

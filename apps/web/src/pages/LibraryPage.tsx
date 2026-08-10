import { Button, Card, Col, Empty, Row, Space, Tag, Typography, message, Popconfirm } from "antd";
import {
  DeleteOutlined,
  FileImageOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { useDesktopApi, useSettings, useWallpapers } from "../hooks/useDesktopApi";
import type { WallpaperItem } from "../types/desktop";
import { BUILTIN_WALLPAPERS } from "../types/desktop";
import { toMediaFileUrl } from "../utils/fileUrl";

function WallpaperCard({
  item,
  active,
  onApply,
  onRemove
}: {
  item: WallpaperItem;
  active: boolean;
  onApply: () => void;
  onRemove?: () => void;
}) {
  const isBuiltin = BUILTIN_WALLPAPERS.some((w) => w.id === item.id);
  const icon = item.type === "video" ? <VideoCameraOutlined /> : <FileImageOutlined />;

  return (
    <Card className={`wallpaper-card ${active ? "wallpaper-card--active" : ""}`} bordered={false}>
      <div className="wallpaper-card__preview">
        {item.type === "scene" && item.scene === "gradient" && <div className="preview-gradient" />}
        {item.type === "scene" && item.scene === "particles" && (
          <div className="preview-particles" />
        )}
        {item.type === "scene" && item.scene === "retirement" && (
          <div className="preview-retirement" />
        )}
        {item.type === "image" && item.filePath && (
          <img src={toMediaFileUrl(item.filePath)} alt={item.name} />
        )}
        {item.type === "video" && <div className="preview-video">{icon}</div>}
      </div>
      <div className="wallpaper-card__body">
        <Space orientation="vertical" size={4} style={{ width: "100%" }}>
          <Typography.Text strong ellipsis>
            {item.name}
          </Typography.Text>
          <Space size={4}>
            <Tag>{item.type === "scene" ? "内置场景" : item.type}</Tag>
            {active && <Tag color="processing">当前</Tag>}
          </Space>
          <Space>
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={onApply}>
              应用
            </Button>
            {!isBuiltin && onRemove && (
              <Popconfirm title="从库中移除？" onConfirm={onRemove}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        </Space>
      </div>
    </Card>
  );
}

export function LibraryPage() {
  const api = useDesktopApi();
  const { settings, patch, refresh: refreshSettings } = useSettings();
  const { wallpapers, refresh } = useWallpapers();

  if (!settings) return null;

  const handleAdd = async () => {
    await api.addWallpaperFiles();
    await refresh();
    message.success("已添加到壁纸库");
  };

  const handleApply = async (id: string) => {
    await patch({ activeWallpaperId: id });
    await api.applyWallpapers();
    await refreshSettings();
    message.success("壁纸已应用");
  };

  const handleRemove = async (id: string) => {
    await api.removeWallpaper(id);
    await refresh();
    await refreshSettings();
    message.success("已移除");
  };

  return (
    <div className="page-library">
      <div className="page-header page-header--row">
        <div>
          <Typography.Title level={3} className="page-header__title">
            壁纸库
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            支持图片与视频壁纸，一键应用到桌面层（Windows WorkerW / macOS 桌面层）
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          导入壁纸
        </Button>
      </div>

      {wallpapers.length === 0 ? (
        <Empty description="暂无壁纸，点击导入添加" />
      ) : (
        <Row gutter={[16, 16]}>
          {wallpapers.map((item) => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <WallpaperCard
                item={item}
                active={settings.activeWallpaperId === item.id}
                onApply={() => handleApply(item.id)}
                onRemove={() => handleRemove(item.id)}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

import { Segmented, Switch, InputNumber, Typography, Upload } from "antd";
import { useScreensaverImages } from "../hooks";
import {
  CAROUSEL_INTERVAL_MAX,
  CAROUSEL_INTERVAL_MIN,
  MAX_IMAGES,
  type CarouselConfig,
  type ScreensaverImage
} from "../lib/config";
import { isImageStoreAvailable } from "../lib/imageStore";

export type ScreensaverImageManagerProps = {
  images: ScreensaverImage[];
  carousel: CarouselConfig;
  error: string | null;
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onCarouselChange: (patch: Partial<CarouselConfig>) => void;
};

/** 后台图片管理：上传、排序、删除与轮播参数设置 */
export default function ScreensaverImageManager({
  images,
  carousel,
  error,
  onAddFiles,
  onRemove,
  onMove,
  onCarouselChange
}: ScreensaverImageManagerProps) {
  const urls = useScreensaverImages(images);
  const idbReady = isImageStoreAvailable();
  const intervalSeconds = Math.round(carousel.intervalMs / 1000);

  return (
    <div className="admin-images">
      <div className="admin-field__head">
        <Typography.Text type="secondary" className="dash-block--birth__hint">
          屏保图片（多张自动轮播）
        </Typography.Text>
        <span className="admin-images__count">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      {idbReady ? (
        <Upload.Dragger
          className="admin-dropzone"
          multiple
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file) => {
            onAddFiles([file]);
            return false;
          }}
        >
          <div className="admin-dropzone__inner">
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden focusable="false">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V5m0 0 4 4m-4-4-4 4M5 15v2.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15"
              />
            </svg>
            <div className="admin-dropzone__title">点击或拖拽图片到此处上传</div>
            <div className="admin-dropzone__hint">支持 JPG / PNG / WebP 等常见图片格式</div>
          </div>
        </Upload.Dragger>
      ) : (
        <div className="admin-dropzone admin-dropzone--disabled">
          当前环境不支持本地图片存储（IndexedDB 不可用）
        </div>
      )}

      {error ? <div className="admin-images__error">{error}</div> : null}

      {images.length > 0 ? (
        <div className="admin-thumbs">
          {images.map((image, i) => (
            <div className="admin-thumb" key={image.id}>
              <div
                className="admin-thumb__img"
                style={urls[i] ? { backgroundImage: `url("${urls[i]}")` } : undefined}
                aria-label={image.name}
              />
              {i === 0 ? <span className="admin-thumb__badge">首张</span> : null}
              <div className="admin-thumb__bar">
                <button
                  type="button"
                  className="admin-thumb__btn"
                  onClick={() => onMove(image.id, -1)}
                  disabled={i === 0}
                  aria-label="前移"
                  title="前移"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="admin-thumb__btn"
                  onClick={() => onMove(image.id, 1)}
                  disabled={i === images.length - 1}
                  aria-label="后移"
                  title="后移"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="admin-thumb__btn admin-thumb__btn--danger"
                  onClick={() => onRemove(image.id)}
                  aria-label="删除"
                  title="删除"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="admin-carousel-settings">
          <div className="admin-setting-row">
            <span className="admin-setting__label">轮播间隔</span>
            <InputNumber
              className="admin-interval-input"
              min={CAROUSEL_INTERVAL_MIN}
              max={CAROUSEL_INTERVAL_MAX}
              value={intervalSeconds}
              onChange={(value) =>
                value != null ? onCarouselChange({ intervalMs: value * 1000 }) : undefined
              }
              addonAfter="秒"
            />
          </div>
          <div className="admin-setting-row">
            <span className="admin-setting__label">填充方式</span>
            <Segmented
              value={carousel.fit}
              onChange={(value) =>
                onCarouselChange({ fit: value === "contain" ? "contain" : "cover" })
              }
              options={[
                { label: "铺满", value: "cover" },
                { label: "完整", value: "contain" }
              ]}
            />
          </div>
          <div className="admin-setting-row">
            <span className="admin-setting__label">在图片上显示倒计时</span>
            <Switch
              checked={carousel.showCountdown}
              onChange={(checked) => onCarouselChange({ showCountdown: checked })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

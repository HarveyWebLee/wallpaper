import { useEffect, useRef, useState } from "react";
import { RetirementCountdown } from "./components/retirement/RetirementCountdown";
import { GradientScene } from "./components/scenes/GradientScene";
import { ParticlesScene } from "./components/scenes/ParticlesScene";
import { useDesktopApi } from "./hooks/useDesktopApi";
import type { AppSettings, WallpaperItem } from "./types/desktop";
import { BUILTIN_WALLPAPERS } from "./types/desktop";
import { toMediaFileUrl } from "./utils/fileUrl";

function getQueryParams(): { displayId: string; wallpaperId: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    displayId: params.get("displayId") ?? "0",
    wallpaperId: params.get("wallpaperId") ?? "builtin-gradient"
  };
}

function resolveWallpaper(list: WallpaperItem[], wallpaperId: string): WallpaperItem {
  return (
    list.find((w) => w.id === wallpaperId) ??
    BUILTIN_WALLPAPERS.find((w) => w.id === wallpaperId) ??
    BUILTIN_WALLPAPERS.find((w) => w.id === "builtin-gradient")!
  );
}

function MediaWallpaper({ item, volume }: { item: WallpaperItem; volume: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumeNormalized = Math.min(1, Math.max(0, volume / 100));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volumeNormalized;
    video.muted = volumeNormalized === 0;
  }, [volumeNormalized]);

  if (item.type === "image" && item.filePath) {
    return (
      <div
        className="wallpaper-media wallpaper-media--image"
        style={{ backgroundImage: `url(${toMediaFileUrl(item.filePath)})` }}
      />
    );
  }

  if (item.type === "video" && item.filePath) {
    return (
      <video
        ref={videoRef}
        className="wallpaper-media wallpaper-media--video"
        src={toMediaFileUrl(item.filePath)}
        autoPlay
        loop
        muted={volumeNormalized === 0}
        playsInline
      />
    );
  }

  return <GradientScene />;
}

function SceneWallpaper({ scene, settings }: { scene: string | undefined; settings: AppSettings }) {
  switch (scene) {
    case "retirement":
      return (
        <div className="wallpaper-scene wallpaper-scene--retirement">
          <RetirementCountdown
            birthDate={settings.birthDate}
            retirementAge={settings.retirementAge}
            compact
          />
        </div>
      );
    case "particles":
      return <ParticlesScene />;
    case "gradient":
    default:
      return <GradientScene />;
  }
}

export function WallpaperApp() {
  const api = useDesktopApi();
  const { displayId, wallpaperId } = getQueryParams();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [wallpaper, setWallpaper] = useState<WallpaperItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = await api.getSettings();
      setSettings(s);
      const list = await api.listWallpapers();
      setWallpaper(resolveWallpaper(list, wallpaperId));
    };
    void load();

    const interval = window.setInterval(() => {
      void api.getSettings().then(setSettings);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [api, wallpaperId]);

  if (!settings || !wallpaper) {
    return (
      <div className="wallpaper-root wallpaper-root--loading" data-display={displayId}>
        <GradientScene />
      </div>
    );
  }

  return (
    <div className="wallpaper-root" data-display={displayId} data-wallpaper={wallpaper.id}>
      {wallpaper.type === "scene" ? (
        <SceneWallpaper scene={wallpaper.scene} settings={settings} />
      ) : (
        <MediaWallpaper item={wallpaper} volume={settings.videoVolume} />
      )}
    </div>
  );
}

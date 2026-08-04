import { useCallback, useEffect, useState } from "react";
import type { AppSettings, DesktopApi, SettingsPatch, WallpaperItem } from "../types/desktop";

const defaultApi: DesktopApi = {
  platform: "web",
  getSettings: async () => ({
    birthDate: "1995-06-15 08:00:00",
    retirementAge: 60,
    activeWallpaperId: "builtin-retirement",
    wallpaperAssignments: {},
    library: [],
    paused: false,
    openAtLogin: false,
    startWallpaperOnLaunch: true,
    pauseOnFullscreen: true,
    performanceMode: "balanced",
    videoVolume: 0,
    wallpaperApplied: false
  }),
  patchSettings: async (patch) => ({ ...(await defaultApi.getSettings()), ...patch }),
  listWallpapers: async () => [],
  addWallpaperFiles: async () => [],
  removeWallpaper: async () => [],
  applyWallpapers: async () => defaultApi.getSettings(),
  pauseWallpapers: async () => defaultApi.getSettings(),
  resumeWallpapers: async () => defaultApi.getSettings(),
  refreshWallpapers: async () => defaultApi.getSettings(),
  openExternal: async () => {},
  setOpenAtLogin: async (enabled) => ({
    ...(await defaultApi.getSettings()),
    openAtLogin: enabled
  }),
  isWallpaperMode: false
};

export function useDesktopApi(): DesktopApi {
  return window.desktopApi ?? defaultApi;
}

export function useSettings() {
  const api = useDesktopApi();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data);
    setLoading(false);
    return data;
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patch = useCallback(
    async (patchData: SettingsPatch) => {
      const data = await api.patchSettings(patchData);
      setSettings(data);
      return data;
    },
    [api]
  );

  return { settings, loading, refresh, patch };
}

export function useWallpapers() {
  const api = useDesktopApi();
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await api.listWallpapers();
    setWallpapers(list);
    setLoading(false);
    return list;
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { wallpapers, loading, refresh, api };
}

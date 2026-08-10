/** 壁纸类型 */
export type WallpaperType = "scene" | "image" | "video";

export type BuiltinSceneId = "retirement" | "gradient" | "particles";

export interface WallpaperItem {
  id: string;
  name: string;
  type: WallpaperType;
  filePath?: string;
  scene?: BuiltinSceneId;
  thumbnail?: string;
  addedAt: string;
}

export type PerformanceMode = "low" | "balanced" | "high";

export interface AppSettings {
  birthDate: string;
  retirementAge: number;
  activeWallpaperId: string;
  wallpaperAssignments: Record<string, string>;
  library: WallpaperItem[];
  paused: boolean;
  openAtLogin: boolean;
  startWallpaperOnLaunch: boolean;
  pauseOnFullscreen: boolean;
  performanceMode: PerformanceMode;
  videoVolume: number;
  wallpaperApplied: boolean;
}

export type SettingsPatch = Partial<AppSettings>;

export interface DesktopApi {
  platform: string;
  getSettings: () => Promise<AppSettings>;
  patchSettings: (patch: SettingsPatch) => Promise<AppSettings>;
  listWallpapers: () => Promise<WallpaperItem[]>;
  addWallpaperFiles: () => Promise<WallpaperItem[]>;
  removeWallpaper: (id: string) => Promise<WallpaperItem[]>;
  applyWallpapers: () => Promise<AppSettings>;
  pauseWallpapers: () => Promise<AppSettings>;
  resumeWallpapers: () => Promise<AppSettings>;
  refreshWallpapers: () => Promise<AppSettings>;
  openExternal: (url: string) => Promise<void>;
  setOpenAtLogin: (enabled: boolean) => Promise<AppSettings>;
  isWallpaperMode: boolean;
}

declare global {
  interface Window {
    desktopApi?: DesktopApi;
  }
}

export const BUILTIN_WALLPAPERS: WallpaperItem[] = [
  {
    id: "builtin-retirement",
    name: "退休倒计时",
    type: "scene",
    scene: "retirement",
    addedAt: "1970-01-01T00:00:00.000Z"
  },
  {
    id: "builtin-gradient",
    name: "极光渐变",
    type: "scene",
    scene: "gradient",
    addedAt: "1970-01-01T00:00:00.000Z"
  },
  {
    id: "builtin-particles",
    name: "粒子星空",
    type: "scene",
    scene: "particles",
    addedAt: "1970-01-01T00:00:00.000Z"
  }
];

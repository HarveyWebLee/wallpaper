/** 壁纸类型 */
export type WallpaperType = "scene" | "image" | "video";

/** 内置场景标识 */
export type BuiltinSceneId = "retirement" | "gradient" | "particles";

/** 壁纸库条目 */
export interface WallpaperItem {
  id: string;
  name: string;
  type: WallpaperType;
  /** 本地文件路径（image / video） */
  filePath?: string;
  /** 内置场景（scene） */
  scene?: BuiltinSceneId;
  /** 缩略图 data URL 或内置图标 key */
  thumbnail?: string;
  addedAt: string;
}

/** 性能预设 */
export type PerformanceMode = "low" | "balanced" | "high";

/** 应用设置（持久化） */
export interface AppSettings {
  birthDate: string;
  retirementAge: number;
  activeWallpaperId: string;
  /** 显示器 ID → 壁纸 ID */
  wallpaperAssignments: Record<string, string>;
  library: WallpaperItem[];
  paused: boolean;
  openAtLogin: boolean;
  startWallpaperOnLaunch: boolean;
  pauseOnFullscreen: boolean;
  performanceMode: PerformanceMode;
  videoVolume: number;
  /** 壁纸窗口是否已应用 */
  wallpaperApplied: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
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
};

/** 内置壁纸目录 */
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

export type SettingsPatch = Partial<AppSettings>;

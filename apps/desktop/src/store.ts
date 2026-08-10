import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import {
  AppSettings,
  BUILTIN_WALLPAPERS,
  DEFAULT_SETTINGS,
  SettingsPatch,
  WallpaperItem
} from "./types";

function settingsFilePath(): string {
  return path.join(app.getPath("userData"), "wallpaper-settings.json");
}

function readRawSettings(): Partial<AppSettings> {
  const filePath = settingsFilePath();
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as Partial<AppSettings>;
  } catch {
    return {};
  }
}

function writeSettings(settings: AppSettings): void {
  const filePath = settingsFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf8");
}

export function getSettings(): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...readRawSettings() };
  return merged;
}

export function patchSettings(patch: SettingsPatch): AppSettings {
  const merged = { ...getSettings(), ...patch };
  writeSettings(merged);
  return merged;
}

export function getAllWallpapers(): WallpaperItem[] {
  const settings = getSettings();
  const custom = settings.library;
  const ids = new Set<string>();
  const merged: WallpaperItem[] = [];

  for (const item of BUILTIN_WALLPAPERS) {
    ids.add(item.id);
    merged.push(item);
  }
  for (const item of custom) {
    if (!ids.has(item.id)) {
      merged.push(item);
    }
  }
  return merged;
}

export function findWallpaper(id: string): WallpaperItem | undefined {
  return getAllWallpapers().find((w) => w.id === id);
}

export function addWallpaperToLibrary(item: WallpaperItem): AppSettings {
  const settings = getSettings();
  const exists = settings.library.some((w) => w.id === item.id);
  if (exists) {
    const library = settings.library.map((w) => (w.id === item.id ? item : w));
    return patchSettings({ library });
  }
  return patchSettings({ library: [...settings.library, item] });
}

export function removeWallpaperFromLibrary(id: string): AppSettings {
  const settings = getSettings();
  const isBuiltin = BUILTIN_WALLPAPERS.some((w) => w.id === id);
  if (isBuiltin) return settings;

  const library = settings.library.filter((w) => w.id !== id);
  const patch: SettingsPatch = { library };

  if (settings.activeWallpaperId === id) {
    patch.activeWallpaperId = "builtin-gradient";
  }

  const assignments = { ...settings.wallpaperAssignments };
  for (const [displayId, wallpaperId] of Object.entries(assignments)) {
    if (wallpaperId === id) {
      delete assignments[displayId];
    }
  }
  patch.wallpaperAssignments = assignments;

  return patchSettings(patch);
}

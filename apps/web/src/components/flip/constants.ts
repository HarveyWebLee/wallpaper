/**
 * 须与 `styles/flip-clock.less` 中 `--ch-anim` 及 `ch-flap-flip-down` 关键帧时长一致。
 */
export const FLIP_ANIM_MS = 900;

/** `animationName` 片段，用于在 `animationend` 中识别翻页动画（避免子层冒泡误判） */
export const FLIP_KEYFRAME_PREFIX = "ch-flap-flip-down";

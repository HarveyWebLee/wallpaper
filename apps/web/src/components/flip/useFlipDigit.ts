import { useEffect, useState, type AnimationEvent } from "react";
import { flushSync } from "react-dom";
import { FLIP_ANIM_MS, FLIP_KEYFRAME_PREFIX } from "./constants";

const DIGIT = /^[0-9]$/;

/**
 * 单字符数字翻页状态：committed 为稳定显示值；flipping 期间配合 CSS 3D 与半程 pastMid。
 */
export function useFlipDigit(char: string) {
  const [committed, setCommitted] = useState(char);
  const [flipping, setFlipping] = useState(false);
  const [flipFrom, setFlipFrom] = useState(char);
  const [flipTo, setFlipTo] = useState(char);
  const [pastMid, setPastMid] = useState(false);

  useEffect(() => {
    if (char === committed || flipping) return;
    if (!DIGIT.test(char) || !DIGIT.test(committed)) {
      setCommitted(char);
      return;
    }
    setFlipFrom(committed);
    setFlipTo(char);
    setFlipping(true);
  }, [char, committed, flipping]);

  useEffect(() => {
    if (!flipping) return;
    setPastMid(false);
    const t = window.setTimeout(() => {
      flushSync(() => setPastMid(true));
    }, FLIP_ANIM_MS / 2);
    return () => window.clearTimeout(t);
  }, [flipping, flipFrom, flipTo]);

  const onFlipEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!e.animationName.includes(FLIP_KEYFRAME_PREFIX)) return;
    setCommitted(flipTo);
    setFlipping(false);
  };

  return {
    committed,
    flipping,
    flipFrom,
    flipTo,
    pastMid,
    onFlipEnd
  };
}

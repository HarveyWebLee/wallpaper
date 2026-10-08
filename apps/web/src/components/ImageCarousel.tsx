import { useEffect, useState, type CSSProperties } from "react";
import type { ImageFit } from "../lib/config";

export type ImageCarouselProps = {
  urls: string[];
  intervalMs: number;
  fit: ImageFit;
};

/** 全屏图片轮播：Ken Burns 缓动 + 交叉淡入，单图则静态缓慢推拉 */
export default function ImageCarousel({ urls, intervalMs, fit }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  // 图片数量变化时夹取下标，避免越界黑屏
  useEffect(() => {
    setIndex((current) => (urls.length ? current % urls.length : 0));
  }, [urls.length]);

  useEffect(() => {
    if (urls.length <= 1) return;
    const delay = Math.max(2000, intervalMs);
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % urls.length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [urls.length, intervalMs]);

  if (urls.length === 0) return null;

  const kenBurnsMs = Math.max(2000, intervalMs) + 1600;

  return (
    <div className={`carousel carousel--${fit}`}>
      {urls.map((url, i) => {
        const style = {
          "--carousel-img": `url("${url}")`,
          animationDuration: `${kenBurnsMs}ms`
        } as CSSProperties;
        return (
          <div
            key={url}
            className={`carousel__slide${i === index ? " is-active" : ""}`}
            style={style}
            aria-hidden
          />
        );
      })}
      <div className="carousel__scrim" aria-hidden />
    </div>
  );
}

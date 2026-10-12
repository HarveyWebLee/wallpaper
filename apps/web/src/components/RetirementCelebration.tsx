import { useEffect, useMemo, useState } from "react";

const CONFETTI_COUNT = 48;

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  hue: number;
  size: number;
};

function buildParticles(): Particle[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.4 + Math.random() * 2.2,
    hue: Math.floor(Math.random() * 360),
    size: 6 + Math.random() * 8
  }));
}

export type RetirementCelebrationProps = {
  active: boolean;
  headline?: string;
  subline?: string;
};

/** 退休达成庆祝层： confetti + 文案，不阻挡设置齿轮等固定入口 */
export default function RetirementCelebration({
  active,
  headline = "恭喜退休！",
  subline = "人生新章节，从此刻开始"
}: RetirementCelebrationProps) {
  const particles = useMemo(() => buildParticles(), []);
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setVisible(true);
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), 400);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className={`retirement-celebration${active ? " retirement-celebration--active" : ""}`}
      aria-live="polite"
      role="status"
    >
      <div className="retirement-celebration__confetti" aria-hidden>
        {particles.map((p) => (
          <span
            key={p.id}
            className="retirement-celebration__bit"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: p.size,
              height: p.size * 0.55,
              background: `hsl(${p.hue} 85% 58%)`
            }}
          />
        ))}
      </div>
      <div className="retirement-celebration__card">
        <div className="retirement-celebration__emoji" aria-hidden>
          🎉
        </div>
        <h2 className="retirement-celebration__title">{headline}</h2>
        <p className="retirement-celebration__sub">{subline}</p>
      </div>
    </div>
  );
}

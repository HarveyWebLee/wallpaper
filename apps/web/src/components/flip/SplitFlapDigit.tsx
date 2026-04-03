import type { FlipTone } from "./types";
import { useFlipDigit } from "./useFlipDigit";

const DIGIT = /^[0-9]$/;

export type SplitFlapDigitProps = {
  char: string;
  tone: FlipTone;
};

/** 单格机械翻牌（Clockhub 式：upper 全高 + origin center、双 half-wrapper、内层 200%、背面上移）。 */
export default function SplitFlapDigit({ char, tone }: SplitFlapDigitProps) {
  const { committed, flipping, flipFrom, flipTo, pastMid, onFlipEnd } = useFlipDigit(char);

  if (!DIGIT.test(char)) {
    return (
      <div className="ch-flap-cell ch-flap-cell-plain" data-tone={tone} aria-hidden>
        {char}
      </div>
    );
  }

  if (!flipping) {
    return (
      <div className="ch-flap-cell" data-tone={tone} aria-hidden>
        <div className="ch-flap-upper ch-flap-upper--idle">
          <div className="ch-flap-front-wrap">
            <div className="ch-flap-digit">{committed}</div>
          </div>
        </div>
        <div className="ch-flap-hinge" aria-hidden />
        <div className="ch-flap-lower">
          <div className="ch-flap-lower-inner">
            <span className="ch-flap-lower-text">{committed}</span>
          </div>
        </div>
      </div>
    );
  }

  const syncChar = pastMid ? flipTo : flipFrom;

  return (
    <div className="ch-flap-cell" data-tone={tone} aria-hidden>
      <div className="ch-flap-shadow-stack" aria-hidden>
        <div className="ch-flap-shadow-middle" />
        <div className="ch-flap-shadow-dark" />
      </div>

      <div className="ch-flap-upper-backdrop">
        <div className="ch-flap-digit">{syncChar}</div>
      </div>

      <div
        className={`ch-flap-upper ch-flap-upper--flip${pastMid ? " ch-flap-upper--past-mid" : ""}`}
        key={`${flipFrom}-${flipTo}`}
        onAnimationEnd={onFlipEnd}
      >
        <div className="ch-flap-back-wrap">
          <div className="ch-flap-card-inner ch-flap-card-inner--back">
            <span>{flipTo}</span>
          </div>
        </div>
        <div className="ch-flap-front-wrap">
          <div className="ch-flap-card-inner ch-flap-card-inner--front">
            <span>{flipFrom}</span>
          </div>
        </div>
      </div>

      <div className="ch-flap-hinge" aria-hidden />

      <div className="ch-flap-lower">
        <div className="ch-flap-shadow-bottom" />
        <div className="ch-flap-lower-inner">
          <span className="ch-flap-lower-text">{syncChar}</span>
        </div>
      </div>
    </div>
  );
}

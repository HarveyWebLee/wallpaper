import React, { useMemo } from "react";
import SplitFlapDigit from "./SplitFlapDigit";
import type { FlipTone } from "./types";

export type FlipCountUnitProps = {
  label: string;
  display: string;
  minDigits: number;
  tone: FlipTone;
};

export default function FlipCountUnit({ label, display, minDigits, tone }: FlipCountUnitProps) {
  const digits = useMemo(() => display.padStart(minDigits, "0").split(""), [display, minDigits]);

  return (
    <div className="flip-unit" data-tone={tone}>
      <div className="flip-digit-row" role="group" aria-label={label}>
        {digits.map((ch, i) => (
          <SplitFlapDigit key={`${label}-${i}`} char={ch} tone={tone} />
        ))}
      </div>
      <div className="flip-label">{label}</div>
    </div>
  );
}

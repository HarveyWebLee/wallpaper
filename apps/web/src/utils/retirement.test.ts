import { describe, it } from "node:test";
import assert from "node:assert/strict";
import dayjs from "dayjs";
import { breakdownRemaining, pad2 } from "./retirement.ts";

describe("breakdownRemaining", () => {
  it("满 60 周岁时刻应剩余全零", () => {
    const birth = dayjs("1995-06-15 08:00:00");
    const retirement = birth.add(60, "year");
    const result = breakdownRemaining(retirement, retirement);
    assert.deepEqual(result, {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    });
  });

  it("应正确拆分年月日时分秒", () => {
    const from = dayjs("2026-01-01 00:00:00");
    const to = dayjs("2027-02-03 04:05:06");
    const result = breakdownRemaining(from, to);
    assert.equal(result.years, 1);
    assert.equal(result.months, 1);
    assert.equal(result.days, 2);
    assert.equal(result.hours, 4);
    assert.equal(result.minutes, 5);
    assert.equal(result.seconds, 6);
  });

  it("终点早于起点时返回全零", () => {
    const from = dayjs("2026-06-01");
    const to = dayjs("2025-06-01");
    const result = breakdownRemaining(from, to);
    assert.equal(result.years, 0);
    assert.equal(result.seconds, 0);
  });
});

describe("pad2", () => {
  it("个位数前补零", () => {
    assert.equal(pad2(5), "05");
    assert.equal(pad2(12), "12");
    assert.equal(pad2(-1), "00");
  });
});

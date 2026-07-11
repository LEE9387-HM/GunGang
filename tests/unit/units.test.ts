import { describe, expect, it } from "vitest";
import { SEED_CONVERSIONS, convertAmount } from "../../src/domain/units";

describe("convertAmount", () => {
  it("비타민D 1,000IU → 25μg", () => {
    const r = convertAmount(1000, "IU", "vitamin-d", SEED_CONVERSIONS);
    expect(r.amount).toBe(25);
    expect(r.unit).toBe("μg");
    expect(r.conversionId).toContain("vitamin-d");
  });

  it("변환 규칙이 없으면 오류 — 임의 추정 금지", () => {
    expect(() => convertAmount(10, "IU", "vitamin-e", SEED_CONVERSIONS)).toThrow(
      /no conversion rule/,
    );
  });
});

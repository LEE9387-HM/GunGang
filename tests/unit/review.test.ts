import { describe, expect, it } from "vitest";
import { autoVerifyEligibility, type ReviewCandidate } from "../../src/domain/review";

const base: ReviewCandidate = {
  name: "테스트 비타민D",
  categorySlug: "vitamin-d",
  ingredients: [
    { isKeyFunctional: true, parseConfidence: "exact", amountNormalized: 25, unitNormalized: "μg" },
  ],
};

describe("autoVerifyEligibility", () => {
  it("단일 핵심성분 + exact + 카테고리 있음 → 적격", () => {
    expect(autoVerifyEligibility(base)).toEqual({ eligible: true, reasons: [] });
  });

  it("카테고리 없으면 부적격", () => {
    const r = autoVerifyEligibility({ ...base, categorySlug: null });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain("카테고리 미배정");
  });

  it("복합제품(핵심성분 2종)은 수동 검수", () => {
    const r = autoVerifyEligibility({
      ...base,
      ingredients: [
        { isKeyFunctional: true, parseConfidence: "exact", amountNormalized: 25, unitNormalized: "μg" },
        { isKeyFunctional: true, parseConfidence: "exact", amountNormalized: 600, unitNormalized: "mg" },
      ],
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons[0]).toContain("복합제품");
  });

  it("loose 신뢰도는 부적격", () => {
    const r = autoVerifyEligibility({
      ...base,
      ingredients: [{ isKeyFunctional: true, parseConfidence: "loose", amountNormalized: 200, unitNormalized: "μg" }],
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.some((x) => x.includes("신뢰도"))).toBe(true);
  });

  it("핵심성분 없으면 부적격", () => {
    const r = autoVerifyEligibility({ ...base, ingredients: [] });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain("핵심 기능성 성분 없음");
  });

  it("함량 수치 0/무효는 부적격", () => {
    const r = autoVerifyEligibility({
      ...base,
      ingredients: [{ isKeyFunctional: true, parseConfidence: "exact", amountNormalized: 0, unitNormalized: "μg" }],
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons).toContain("함량 수치 무효");
  });
});

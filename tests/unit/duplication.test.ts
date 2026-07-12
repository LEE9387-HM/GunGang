import { describe, expect, it } from "vitest";
import {
  analyzeSupplements,
  toMicrograms,
  formatFromMicrograms,
  type AnalysisItem,
  type UpperLimit,
} from "../../src/domain/duplication";

describe("단위 환산", () => {
  it("μg/mg/g → μg", () => {
    expect(toMicrograms(25, "μg")).toBe(25);
    expect(toMicrograms(1, "mg")).toBe(1000);
    expect(toMicrograms(2, "g")).toBe(2_000_000);
    expect(toMicrograms(100, "CFU")).toBeNull();
  });
  it("μg → 표시 단위", () => {
    expect(formatFromMicrograms(25)).toEqual({ amount: 25, unit: "μg" });
    expect(formatFromMicrograms(1500)).toEqual({ amount: 1.5, unit: "mg" });
    expect(formatFromMicrograms(2_400_000)).toEqual({ amount: 2.4, unit: "g" });
  });
});

describe("analyzeSupplements", () => {
  const limits: UpperLimit[] = [
    { ingredientSlug: "vitamin-d", maxAmount: 10, unit: "μg", message: "비타민D 합산 {total}이 기준 {limit} 초과" },
    { ingredientSlug: "epa-dha", maxAmount: 2.24, unit: "g", message: "EPA+DHA 합산 {total}이 기준 {limit} 초과" },
  ];

  it("같은 성분 2개 제품 → 중복 + 합산", () => {
    const items: AnalysisItem[] = [
      { productId: "1", productName: "A 비타민D", ingredients: [{ ingredientSlug: "vitamin-d", ingredientName: "비타민D", amount: 25, unit: "μg" }] },
      { productId: "2", productName: "B 비타민D", ingredients: [{ ingredientSlug: "vitamin-d", ingredientName: "비타민D", amount: 100, unit: "μg" }] },
    ];
    const r = analyzeSupplements(items, limits);
    expect(r.duplicates).toHaveLength(1);
    expect(r.duplicates[0]).toMatchObject({ totalAmount: 125, unit: "μg", productNames: ["A 비타민D", "B 비타민D"] });
  });

  it("상한 초과 → 경고 (판정 아닌 기준 초과 문구)", () => {
    const items: AnalysisItem[] = [
      { productId: "1", productName: "A", ingredients: [{ ingredientSlug: "vitamin-d", ingredientName: "비타민D", amount: 125, unit: "μg" }] },
    ];
    const r = analyzeSupplements(items, limits);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]?.message).toContain("125μg");
    expect(r.warnings[0]?.message).toContain("10μg");
  });

  it("단위 다른 제품 합산 (mg + g → EPA·DHA)", () => {
    const items: AnalysisItem[] = [
      { productId: "1", productName: "오메가A", ingredients: [{ ingredientSlug: "epa-dha", ingredientName: "EPA와 DHA의 합", amount: 1200, unit: "mg" }] },
      { productId: "2", productName: "오메가B", ingredients: [{ ingredientSlug: "epa-dha", ingredientName: "EPA와 DHA의 합", amount: 1.5, unit: "g" }] },
    ];
    const r = analyzeSupplements(items, limits);
    // 1200mg + 1.5g = 2.7g → 상한 2.24g 초과
    expect(r.totals[0]).toMatchObject({ totalAmount: 2.7, unit: "g" });
    expect(r.warnings).toHaveLength(1);
  });

  it("중복·초과 없으면 빈 배열", () => {
    const items: AnalysisItem[] = [
      { productId: "1", productName: "A", ingredients: [{ ingredientSlug: "vitamin-d", ingredientName: "비타민D", amount: 5, unit: "μg" }] },
      { productId: "2", productName: "B", ingredients: [{ ingredientSlug: "epa-dha", ingredientName: "EPA와 DHA의 합", amount: 500, unit: "mg" }] },
    ];
    const r = analyzeSupplements(items, limits);
    expect(r.duplicates).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
    expect(r.totals).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";
import {
  costPerAmountKrw,
  dailyCostKrw,
  totalIntakeDays,
} from "../../src/domain/pricing";

describe("pricing — 정수 원 단위 (D-010)", () => {
  const serving = { servingsPerDay: 1, unitsPerServing: 2 };

  it("총 섭취일수: 120캡슐 ÷ (1회×2캡슐) = 60일", () => {
    expect(totalIntakeDays(120, serving)).toBe(60);
  });

  it("1일 비용: 21,000원 / 60일 = 350원", () => {
    expect(dailyCostKrw({ totalPriceKrw: 21000, totalUnits: 120 }, serving)).toBe(350);
  });

  it("단위당 가격: 1일 350원, EPA+DHA 1,200mg → 100mg당 29원", () => {
    expect(costPerAmountKrw(350, 1200, 100)).toBe(29);
  });

  it("섭취일수가 0이면 오류 (0 나눗셈 방지)", () => {
    expect(() => dailyCostKrw({ totalPriceKrw: 10000, totalUnits: 1 }, serving)).toThrow();
  });

  it("잘못된 섭취 정보는 오류", () => {
    expect(() => totalIntakeDays(100, { servingsPerDay: 0, unitsPerServing: 2 })).toThrow();
  });
});

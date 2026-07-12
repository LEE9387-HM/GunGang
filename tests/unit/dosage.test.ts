import { describe, expect, it } from "vitest";
import { parseServing, unitsPerDay } from "../../src/domain/dosage";

describe("parseServing — 실제 SRV_USE 표기", () => {
  it("1일 1회, 1회 2정", () => {
    expect(parseServing("1일 1회, 1회 2정을 충분한 물과 함께 섭취하십시오.")).toEqual({
      servingsPerDay: 1,
      unitsPerServing: 2,
    });
  });

  it("1일 1회, 1회 1포", () => {
    expect(parseServing("1일 1회, 1회 1포를 직접 또는 물과 함께 섭취하십시오.")).toEqual({
      servingsPerDay: 1,
      unitsPerServing: 1,
    });
  });

  it("1일 2회 1캡슐", () => {
    expect(parseServing("1일 2회 1캡슐씩 섭취")).toEqual({ servingsPerDay: 2, unitsPerServing: 1 });
  });

  it("범위 표기(1일 1~2회)는 null", () => {
    expect(parseServing("1일 1~2회, 1회 1정")).toBeNull();
  });

  it("빈 값·무형식은 null", () => {
    expect(parseServing("")).toBeNull();
    expect(parseServing(null)).toBeNull();
    expect(parseServing("충분한 물과 함께 드세요")).toBeNull();
  });

  it("unitsPerDay = 횟수 × 회당 단위", () => {
    expect(unitsPerDay({ servingsPerDay: 2, unitsPerServing: 2 })).toBe(4);
  });
});

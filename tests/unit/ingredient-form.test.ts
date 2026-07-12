import { describe, expect, it } from "vitest";
import { extractIngredientForm } from "../../src/domain/ingredient-form";

describe("extractIngredientForm — 오메가3", () => {
  it("알티지 → rTG", () => {
    const t = extractIngredientForm("omega3", "초임계 알티지 오메가3", null);
    expect(t.map((x) => x.label)).toContain("rTG");
  });

  it("식물성 → 식물성(조류)", () => {
    const t = extractIngredientForm("omega3", "식물성 오메가3", null);
    expect(t.map((x) => x.label)).toContain("식물성(조류)");
  });

  it("근거(evidence) 포함", () => {
    const t = extractIngredientForm("omega3", "rTG 오메가3", null);
    expect(t[0]?.evidence).toContain("제품명");
  });

  it("형태 표기 없으면 빈 배열 (단정 안 함)", () => {
    expect(extractIngredientForm("omega3", "프리미엄 오메가3", null)).toEqual([]);
  });

  it("rTG + 식물성 동시", () => {
    const t = extractIngredientForm("omega3", "식물성 알티지 오메가3", null);
    const labels = t.map((x) => x.label);
    expect(labels).toContain("rTG");
    expect(labels).toContain("식물성(조류)");
  });
});

describe("extractIngredientForm — 비타민D", () => {
  it("D3", () => {
    const t = extractIngredientForm("vitamin-d", "메가 비타민D3 5000IU", null);
    expect(t.map((x) => x.label)).toContain("비타민 D3");
  });

  it("버섯유래", () => {
    const t = extractIngredientForm("vitamin-d", "표고버섯 비타민D", null);
    expect(t.map((x) => x.label)).toContain("버섯·효모 유래");
  });

  it("D 뒤 알파벳(단어 일부)은 오탐 안 함", () => {
    // "VITAMIND" 같은 통짜 영문에서 D3/D2 아님
    expect(extractIngredientForm("vitamin-d", "GOOD 비타민 데일리", null)).toEqual([]);
  });
});

describe("extractIngredientForm — 범위 밖", () => {
  it("카테고리 없거나 미지원이면 빈 배열", () => {
    expect(extractIngredientForm(null, "제품", null)).toEqual([]);
    expect(extractIngredientForm("magnesium", "제품", null)).toEqual([]);
  });
});

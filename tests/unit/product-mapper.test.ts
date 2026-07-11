import { describe, expect, it } from "vitest";
import {
  mapRecord,
  matchIngredient,
  normalizeLabel,
  type AliasMap,
} from "../../src/ingestion/product-mapper";

const aliases: AliasMap = new Map([
  ["비타민d", { ingredientId: "vd", ingredientSlug: "vitamin-d", categorySlug: "vitamin-d" }],
  ["epa와dha의합", { ingredientId: "ed", ingredientSlug: "epa-dha", categorySlug: "omega3" }],
]);

describe("normalizeLabel", () => {
  it("소문자화 + 공백·구분자 제거", () => {
    expect(normalizeLabel("EPA와 DHA의 합")).toBe("epa와dha의합");
    expect(normalizeLabel("비타민 D")).toBe("비타민d");
  });
});

describe("matchIngredient", () => {
  it("정확 매칭", () => {
    expect(matchIngredient("비타민D", aliases)?.ingredientSlug).toBe("vitamin-d");
  });
  it("부분 포함 매칭 (비타민D3 → 비타민d)", () => {
    expect(matchIngredient("비타민D3", aliases)?.ingredientSlug).toBe("vitamin-d");
  });
  it("범위 밖 성분은 null (아연)", () => {
    expect(matchIngredient("아연", aliases)).toBeNull();
  });
});

describe("mapRecord", () => {
  it("비타민D 제품: 성분·카테고리·신고번호 매핑", () => {
    const m = mapRecord(
      {
        PRDUCT: " 테스트 비타민D ",
        STTEMNT_NO: " 20140017002183 ",
        ENTRPS: "테스트사",
        SRV_USE: "1일 1회, 1회 1정",
        BASE_STANDARD: "1. 성상: 분말 2. 비타민D: 표시량(25μg/1,000mg)의 80~150% 3. 대장균군: 음성",
        MAIN_FNCTN: "[비타민D] 뼈의 형성과 유지에 필요",
        INTAKE_HINT1: "의약품 복용 시 전문가와 상담",
      },
      aliases,
    );
    expect(m.reportNo).toBe("20140017002183");
    expect(m.name).toBe("테스트 비타민D");
    expect(m.categorySlug).toBe("vitamin-d");
    expect(m.needsReview).toBe(false);
    expect(m.ingredients).toHaveLength(1);
    expect(m.ingredients[0]).toMatchObject({
      ingredientId: "vd",
      amountNormalized: 25,
      unitNormalized: "μg",
      perAmount: 1000,
      isKeyFunctional: true,
    });
  });

  it("EPA·DHA 제품: omega3 카테고리", () => {
    const m = mapRecord(
      {
        PRDUCT: "오메가3",
        STTEMNT_NO: "20200017",
        BASE_STANDARD: "2) EPA와 DHA의 합 : 표시량(1,200mg/1,300mg) 이상",
      },
      aliases,
    );
    expect(m.categorySlug).toBe("omega3");
    expect(m.ingredients[0]).toMatchObject({ ingredientId: "ed", amountNormalized: 1200 });
  });

  it("범위 밖 성분만 있는 제품 → needs_review", () => {
    const m = mapRecord(
      { PRDUCT: "아연 보충제", STTEMNT_NO: "999", BASE_STANDARD: "아연: 표시량(5mg/2,000mg)의 80~120%" },
      aliases,
    );
    expect(m.needsReview).toBe(true);
    expect(m.ingredients).toHaveLength(0);
    expect(m.categorySlug).toBeNull();
  });

  it("신고번호 없으면 null", () => {
    const m = mapRecord({ PRDUCT: "무신고제품", BASE_STANDARD: "" }, aliases);
    expect(m.reportNo).toBeNull();
    expect(m.needsReview).toBe(true);
  });
});

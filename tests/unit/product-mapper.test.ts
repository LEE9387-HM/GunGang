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
  ["비타민b1", { ingredientId: "b1", ingredientSlug: "vitamin-b1", categorySlug: null }],
  ["비타민b12", { ingredientId: "b12", ingredientSlug: "vitamin-b12", categorySlug: null }],
  ["아연", { ingredientId: "zn", ingredientSlug: "zinc", categorySlug: "zinc" }],
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
  it("비타민B12는 exact 매칭 (B1으로 오매칭 안 함)", () => {
    // "비타민b1"이 "비타민b12"에 부분포함되지만 exact가 우선
    expect(matchIngredient("비타민B12", aliases)?.ingredientSlug).toBe("vitamin-b12");
    expect(matchIngredient("비타민B1", aliases)?.ingredientSlug).toBe("vitamin-b1");
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

  it("사전에 없는 성분만 있는 제품 → needs_review", () => {
    const m = mapRecord(
      { PRDUCT: "베타카로틴 보충제", STTEMNT_NO: "999", BASE_STANDARD: "베타카로틴: 표시량(0.7mg/500mg)의 80~120%" },
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

  it("부성분(아연) 있어도 주성분(오메가3)으로 분류하되 성분은 둘 다 저장", () => {
    const m = mapRecord(
      {
        PRDUCT: "오메가3 아연",
        STTEMNT_NO: "100",
        BASE_STANDARD:
          "2. EPA와 DHA의 합 : 표시량(600mg/1,000mg)의 80~120% 3. 아연 : 표시량(5mg/1,000mg)의 80~120%",
      },
      aliases,
    );
    expect(m.categorySlug).toBe("omega3");
    expect(m.ingredients).toHaveLength(2);
  });

  it("같은 성분 중복 표기는 하나로 (unique 제약 대비)", () => {
    const m = mapRecord(
      {
        PRDUCT: "비타민D 중복표기",
        STTEMNT_NO: "101",
        BASE_STANDARD:
          "2. 비타민D : 표시량(25μg/500mg)의 80~150% 3. 비타민D : 표시량(10μg/300mg)의 80~150%",
      },
      aliases,
    );
    expect(m.ingredients).toHaveLength(1);
  });
});

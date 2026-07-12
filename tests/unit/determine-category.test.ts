import { describe, expect, it } from "vitest";
import { determineCategory } from "../../src/ingestion/product-mapper";

describe("determineCategory — 부성분 무시·통합·종합비타민 판정", () => {
  it("단일 주성분 → 그 카테고리", () => {
    expect(determineCategory(["omega3"])).toBe("omega3");
    expect(determineCategory(["red-ginseng"])).toBe("red-ginseng");
  });

  it("주성분 + 부성분(비타민C/D/아연/마그네슘)은 주성분으로 (부성분 무시)", () => {
    expect(determineCategory(["saw-palmetto", "zinc"])).toBe("saw-palmetto");
    expect(determineCategory(["collagen", "vitamin-c"])).toBe("collagen");
    expect(determineCategory(["omega3", "vitamin-d"])).toBe("omega3");
    expect(determineCategory(["joint", "vitamin-d", "zinc"])).toBe("joint");
  });

  it("주성분 2종 이상 → 종합비타민", () => {
    expect(determineCategory(["omega3", "probiotics"])).toBe("multivitamin");
    expect(determineCategory(["lutein", "omega3", "vitamin-d"])).toBe("multivitamin");
  });

  it("관절 통합: 여러 관절 성분이 같은 joint 카테고리로 투표되면 joint 유지", () => {
    // 매퍼가 glucosamine·msm·chondroitin을 모두 'joint'로 매핑 → 입력이 joint 반복
    expect(determineCategory(["joint", "joint", "joint"])).toBe("joint");
  });

  it("부성분만: 1종 → 그 미네랄, 2종 이상 → 종합비타민", () => {
    expect(determineCategory(["zinc"])).toBe("zinc");
    expect(determineCategory(["vitamin-d"])).toBe("vitamin-d");
    expect(determineCategory(["zinc", "magnesium"])).toBe("multivitamin");
    expect(determineCategory(["vitamin-c", "vitamin-d", "zinc", "magnesium"])).toBe("multivitamin");
  });

  it("중복 카테고리는 distinct 처리 (부성분 무시 후 주성분 1종)", () => {
    expect(determineCategory(["omega3", "omega3", "vitamin-c"])).toBe("omega3");
  });

  it("null·빈 입력 처리", () => {
    expect(determineCategory([])).toBeNull();
    expect(determineCategory([null, null])).toBeNull();
    expect(determineCategory([null, "omega3"])).toBe("omega3");
  });
});

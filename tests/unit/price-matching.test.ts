import { describe, expect, it } from "vitest";
import {
  isBundle,
  judgeCandidate,
  normalizeProductName,
  tokenize,
  type ShopCandidate,
} from "../../src/domain/price-matching";

const base: Omit<ShopCandidate, "title"> = {
  lprice: 15900,
  mallName: "테스트몰",
  link: "https://example.com",
  productType: 1,
};

describe("normalizeProductName / tokenize", () => {
  it("법인·수출용 괄호 제거, 소문자", () => {
    expect(normalizeProductName("(주)88루틴 비타민D3 5000IU(전량수출용)")).toBe("88루틴 비타민d3 5000iu");
  });
  it("수치+단위 결합 토큰", () => {
    expect(tokenize("비타민d 5000 iu 90 정")).toContain("5000iu");
    expect(tokenize("비타민d 5000 iu 90 정")).toContain("90정");
  });
});

describe("isBundle — 묶음 상품 감지", () => {
  it("x2, 2박스, 1+1은 묶음", () => {
    expect(isBundle("비타민D 5000IU 90정 x2")).toBe(true);
    expect(isBundle("오메가3 2박스 세트")).toBe(true);
    expect(isBundle("루테인 1+1 이벤트")).toBe(true);
  });
  it("단품은 묶음 아님", () => {
    expect(isBundle("88루틴 비타민D3 5000IU 90정")).toBe(false);
  });
});

describe("judgeCandidate — 신뢰도 판정", () => {
  it("동일 제품(수식어 추가) → high", () => {
    const j = judgeCandidate("88루틴 비타민D3 5000IU", {
      ...base,
      title: "<b>88루틴</b> 비타민D3 5000IU 90정 츄어블 국내산",
    });
    expect(j.confidence).toBe("high");
  });

  it("같은 브랜드 다른 용량(5000IU vs 2000IU) → high 금지", () => {
    const j = judgeCandidate("88루틴 비타민D3 5000IU", {
      ...base,
      title: "88루틴 비타민D3 2000IU 90정",
    });
    expect(j.confidence).not.toBe("high");
    expect(j.reasons.join()).toContain("수치 토큰 불일치");
  });

  it("묶음 상품 → high 금지 (단가 왜곡)", () => {
    const j = judgeCandidate("88루틴 비타민D3 5000IU", {
      ...base,
      title: "88루틴 비타민D3 5000IU 90정 x2",
    });
    expect(j.confidence).not.toBe("high");
  });

  it("무관 상품 → low", () => {
    const j = judgeCandidate("88루틴 비타민D3 5000IU", {
      ...base,
      title: "종근당 락토핏 생유산균 골드 50포",
    });
    expect(j.confidence).toBe("low");
  });

  it("중고/단종(productType>3) → low", () => {
    const j = judgeCandidate("88루틴 비타민D3 5000IU", {
      ...base,
      title: "88루틴 비타민D3 5000IU",
      productType: 4,
    });
    expect(j.confidence).toBe("low");
  });

  it("비정상 가격(<1,000원) → low", () => {
    const j = judgeCandidate("88루틴 비타민D3 5000IU", {
      ...base,
      title: "88루틴 비타민D3 5000IU",
      lprice: 100,
    });
    expect(j.confidence).toBe("low");
  });
});

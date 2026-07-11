import type { NormalizedUnit } from "../types";

/**
 * 단위 변환 계수는 하드코딩하지 않고 데이터로 관리한다 (마스터 프롬프트 19.7).
 * 운영 시에는 DB(unit_conversion)에서 버전과 함께 로드하며, 아래 시드는 초기값 겸 테스트용.
 */
export interface UnitConversion {
  /** 버전 태그 포함 식별자 (예: "vitamin-d-iu-to-ug@2026-07") */
  id: string;
  ingredientId: string;
  fromUnit: string;
  toUnit: NormalizedUnit;
  /** 1 원본단위 = factor 정규화단위 */
  factor: number;
  /** 변환 근거 출처 (근거 표시 원칙 2.3) */
  source: string;
}

export const SEED_CONVERSIONS: UnitConversion[] = [
  {
    id: "vitamin-d-iu-to-ug@2026-07",
    ingredientId: "vitamin-d",
    fromUnit: "IU",
    toUnit: "μg",
    factor: 0.025,
    source: "비타민D 1 IU = 0.025 μg — 식약처 건강기능식품 공전 (원문 확인 필요)",
  },
];

export function convertAmount(
  amount: number,
  fromUnit: string,
  ingredientId: string,
  conversions: readonly UnitConversion[],
): { amount: number; unit: NormalizedUnit; conversionId: string } {
  const rule = conversions.find(
    (c) => c.ingredientId === ingredientId && c.fromUnit === fromUnit,
  );
  if (!rule) {
    // 규칙이 없으면 임의 추정하지 않고 실패시킨다 (정보 부족 ≠ 임의 계산)
    throw new Error(`no conversion rule: ${ingredientId} ${fromUnit}`);
  }
  return { amount: amount * rule.factor, unit: rule.toUnit, conversionId: rule.id };
}

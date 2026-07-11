import type { IngredientAmount } from "../types";

/**
 * [Phase 2~3 구현 예정 — docs/12-backlog.md]
 * 1일 섭취량 환산과 다제품 성분 합산. 결정론적 로직만 사용 (절대 원칙 2).
 */
export function sumDailyAmounts(
  _products: readonly IngredientAmount[][],
): IngredientAmount[] {
  throw new Error("not implemented: Phase 3 (dosage aggregation)");
}

import type { IngredientAmount } from "../types";

export interface DuplicationFinding {
  ingredientId: string;
  totalAmount: number;
  productCount: number;
}

/**
 * [Phase 3 구현 예정 — docs/12-backlog.md]
 * 동일 성분 중복 탐지 + 상한량 규칙(RuleVersion) 대조.
 * 경고 문구는 판정 표현 금지 규정을 따른다 (docs/08-regulatory-risks.md 표현 가이드).
 */
export function findDuplicates(
  _products: readonly IngredientAmount[][],
): DuplicationFinding[] {
  throw new Error("not implemented: Phase 3 (duplication analysis)");
}

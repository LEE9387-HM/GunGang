import type { DailyServing, IngredientAmount } from "../types";

/**
 * 섭취방법 텍스트(SRV_USE)에서 1일 섭취 단위를 파싱한다.
 * 예: "1일 1회, 1회 2정을 충분한 물과 함께 섭취하십시오." → {servingsPerDay:1, unitsPerServing:2}
 *
 * 범위 표기("1일 1~2회")나 파싱 불가 시 null → 호출측에서 1일 비용 계산 제외.
 */
const SERVING_UNIT = "정|캡슐|캅셀|포|알|환|스틱|병|팩|티스푼|스푼";

export function parseServing(text: string | null | undefined): DailyServing | null {
  if (!text) return null;
  const perDay = text.match(/1\s*일\s*에?\s*(\d+)\s*회/);
  // 회당 단위는 "1회 M정" 또는 "M정씩"처럼 표기가 달라, 섭취 단위를 동반한 첫 숫자로 잡는다.
  const perServing = text.match(new RegExp(`(\\d+)\\s*(?:${SERVING_UNIT})`));
  if (!perDay || !perServing) return null;
  const servingsPerDay = Number(perDay[1]);
  const unitsPerServing = Number(perServing[1]);
  if (servingsPerDay <= 0 || unitsPerServing <= 0) return null;
  return { servingsPerDay, unitsPerServing };
}

/** 1일 총 섭취 단위 수 (정/캡슐 등) */
export function unitsPerDay(serving: DailyServing): number {
  return serving.servingsPerDay * serving.unitsPerServing;
}

/**
 * [Phase 3 구현 예정 — docs/12-backlog.md]
 * 다제품 성분 합산 (복용 제품 등록 시 중복 분석용).
 */
export function sumDailyAmounts(
  _products: readonly IngredientAmount[][],
): IngredientAmount[] {
  throw new Error("not implemented: Phase 3 (dosage aggregation)");
}

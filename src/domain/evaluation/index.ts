/**
 * [Phase 2 구현 예정 — docs/05-scoring-rules.md]
 * 항목별 등급 평가 엔진 (D-003: 숫자 점수 아님).
 * 규칙(RuleVersion.definition)은 데이터, 이 모듈은 순수 해석기.
 * 누락 차원은 "정보 부족"으로 표시하고 감점하지 않는다.
 */
export type Grade = "high" | "mid" | "low" | "insufficient-data";

export interface DimensionResult {
  dimension: string;
  grade: Grade;
  /** 산출 입력값 스냅샷 — 근거 표시 원칙 (2.3) */
  inputs: Record<string, number | string>;
}

export function evaluateProduct(): DimensionResult[] {
  throw new Error("not implemented: Phase 2 (evaluation engine)");
}

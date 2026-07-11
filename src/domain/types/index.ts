// 도메인 공통 타입.
// 이 레이어(src/domain)는 프레임워크·DB 등 외부를 import하지 않는다 (docs/02-architecture.md 2장).

/** 정규화 기준 단위 (D-010: 정규화 수치 + 원본 표시값 병행 저장) */
export type NormalizedUnit = "μg" | "mg" | "CFU";

export interface IngredientAmount {
  ingredientId: string;
  /** 원본 표시값 그대로 (예: "1,000IU") */
  rawText: string;
  /** 정규화 수치 */
  amount: number;
  unit: NormalizedUnit;
}

export interface DailyServing {
  /** 1일 섭취 횟수 */
  servingsPerDay: number;
  /** 1회 섭취 단위 수 (캡슐/정/포) */
  unitsPerServing: number;
}

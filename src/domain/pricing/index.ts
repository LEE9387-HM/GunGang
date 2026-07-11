import type { DailyServing } from "../types";

// 금액은 원 단위 정수로만 다룬다 (D-010). 부동소수점 누적을 피하기 위해
// 나눗셈은 마지막에 1회만 수행하고 결과를 정수로 반올림한다.

export interface PriceInput {
  /** 배송비 포함 총 결제금액 (원, 정수) */
  totalPriceKrw: number;
  /** 포장 내 총 단위 수 (캡슐/정/포) */
  totalUnits: number;
}

/** 총 섭취일수 = 총 단위 수 ÷ (1일 횟수 × 1회 단위 수), 소수점 버림 */
export function totalIntakeDays(totalUnits: number, serving: DailyServing): number {
  const perDay = serving.servingsPerDay * serving.unitsPerServing;
  if (perDay <= 0) throw new Error("invalid daily serving");
  return Math.floor(totalUnits / perDay);
}

/** 1일 섭취 비용 (원, 정수 반올림) */
export function dailyCostKrw(price: PriceInput, serving: DailyServing): number {
  const days = totalIntakeDays(price.totalUnits, serving);
  if (days <= 0) throw new Error("intake days must be positive");
  return Math.round(price.totalPriceKrw / days);
}

/** 핵심 성분 단위당 가격: 정규화 함량 `per`(예: 100mg)당 원 (정수 반올림) */
export function costPerAmountKrw(
  dailyCost: number,
  dailyAmountNormalized: number,
  per: number,
): number {
  if (dailyAmountNormalized <= 0) throw new Error("daily amount must be positive");
  return Math.round((dailyCost * per) / dailyAmountNormalized);
}

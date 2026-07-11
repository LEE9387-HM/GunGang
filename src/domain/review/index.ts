/**
 * 검수 자격 판정 (순수 함수).
 *
 * 원칙: 이 로직은 "verified로 전환해도 안전한 후보"를 선별할 뿐, 자동으로 검수를
 * 확정하지 않는다. 실제 verified 전환은 관리자의 명시적 실행으로만 일어나며
 * audit_log에 actor가 기록된다 (docs/03-data-model.md 상태 머신).
 */

export interface ReviewCandidate {
  name: string;
  categorySlug: string | null;
  ingredients: Array<{
    isKeyFunctional: boolean;
    parseConfidence: "exact" | "loose" | "manual" | null;
    amountNormalized: number | null;
    unitNormalized: string | null;
  }>;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[]; // 부적격 사유 (eligible=true면 빈 배열)
}

/**
 * 자동 검수 후보 자격. 하나라도 어기면 부적격 → 사람 수동 검수 대상.
 * - 제품명이 있어야 함
 * - 카테고리가 배정돼야 함 (오분류·미분류 제외)
 * - 핵심 기능성 성분이 정확히 1종 (복합제품은 수동 검수로)
 * - 그 성분의 함량 파싱이 exact 이고 수치·단위가 유효
 */
export function autoVerifyEligibility(c: ReviewCandidate): EligibilityResult {
  const reasons: string[] = [];

  if (!c.name.trim()) reasons.push("제품명 없음");
  if (!c.categorySlug) reasons.push("카테고리 미배정");

  const key = c.ingredients.filter((i) => i.isKeyFunctional);
  if (key.length === 0) {
    reasons.push("핵심 기능성 성분 없음");
  } else if (key.length > 1) {
    reasons.push("핵심 성분 2종 이상 (복합제품 — 수동 검수)");
  } else {
    const k = key[0]!;
    if (k.parseConfidence !== "exact") reasons.push(`함량 신뢰도 낮음(${k.parseConfidence})`);
    if (k.amountNormalized == null || k.amountNormalized <= 0) reasons.push("함량 수치 무효");
    if (!k.unitNormalized) reasons.push("단위 없음");
  }

  return { eligible: reasons.length === 0, reasons };
}

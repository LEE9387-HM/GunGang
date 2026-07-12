/**
 * 면책 문구 — 분석·상세·비교 화면에 고정 노출 (docs/08-regulatory-risks.md 표현 가이드).
 * 판정·치료 표현을 쓰지 않고 "공개 정보 기준"임을 명시한다.
 */
export function Disclaimer() {
  return (
    <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      본 정보는 식품의약품안전처 공개 데이터를 기준으로 정리한 것으로, 의학적 조언이 아닙니다.
      기능성·함량은 제품 표시사항 기준이며 개인 상태에 따라 다를 수 있습니다. 의약품 복용 중이라면
      전문가와 상담하세요.
    </p>
  );
}

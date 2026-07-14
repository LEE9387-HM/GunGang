/**
 * 쇼핑 검색 결과 ↔ 우리 제품 매칭 판정 (순수 함수).
 *
 * 전제(데이터 특성):
 * - 우리 제조사(ENTRPS)는 위탁제조사(OEM)라 쇼핑몰 판매 브랜드와 다르다 → maker/brand는
 *   긍정 신호로만 쓰고, 불일치를 탈락 사유로 쓰지 않는다.
 * - 오매칭 가격 표시는 신뢰를 파괴한다 → 애매하면 미표시(neutral 아님, 원칙).
 *
 * 신뢰도 등급:
 *   high — 자동 표시 가능 (토큰 포함률 높고 수치 토큰 모순 없음, 묶음 아님)
 *   mid  — 저장하되 미표시(검토 대기)
 *   low  — 폐기
 */

export interface ShopCandidate {
  /** 쇼핑 결과 상품명 (HTML 태그 제거 전 가능) */
  title: string;
  lprice: number;
  mallName: string;
  link: string;
  brand?: string;
  maker?: string;
  /** 네이버 productType: 1~3 일반, 4~6 중고, 7~9 단종, 10~12 판매예정 */
  productType?: number;
}

export interface MatchJudgement {
  confidence: "high" | "mid" | "low";
  score: number; // 0~1 토큰 포함률
  reasons: string[];
}

/** HTML 태그(<b> 등)·엔티티 제거 */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ");
}

/** 제품명 정규화: 괄호 접미(전량수출용 등)·법인 표기 제거, 소문자, 공백 정리 */
export function normalizeProductName(name: string): string {
  return stripHtml(name)
    .replace(/\((?:주|유)\)|주식회사/g, "")
    .replace(/\([^)]*수출용[^)]*\)/g, "")
    .toLowerCase()
    .replace(/[·ㆍ&+/,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 토큰화 (2자 미만 잡토큰 제거, 수치+단위는 붙여서 보존: "5000iu", "1000mg", "90정") */
export function tokenize(normalized: string): string[] {
  const merged = normalized.replace(/(\d[\d,.]*)\s*(iu|mg|g|정|캡슐|포|스틱|환|mcg|μg|㎍)/gi, (_, n, u) => `${n.replace(/,/g, "")}${u.toLowerCase()}`);
  return merged.split(/\s+/).filter((t) => t.length >= 2 || /\d/.test(t));
}

/** 수치 토큰만 추출 (용량·개수 — 오매칭 방지의 핵심 신호) */
export function numericTokens(tokens: string[]): string[] {
  return tokens.filter((t) => /^\d/.test(t));
}

/** 묶음 상품 여부 (x2, 2박스, 세트, 1+1 등 — 단가 왜곡 → 자동표시 금지)
 *  주의: 한글 뒤 \b는 JS에서 동작하지 않으므로 쓰지 않는다. */
export function isBundle(title: string): boolean {
  return /[x×]\s*\d|\d+\s*(박스|세트|개입)|\+\s*\d+\s*(정|캡슐|포)|1\s*\+\s*1/i.test(title);
}

/**
 * 후보 판정. ourName = 우리 제품명(식약처 신고명).
 * 점수 = 우리 토큰이 후보 title에 포함된 비율 (containment — 쇼핑 상품명은 수식어가 많아 Jaccard보다 적합).
 */
export function judgeCandidate(ourName: string, cand: ShopCandidate): MatchJudgement {
  const reasons: string[] = [];

  // 일반 상품만 (중고 4~6, 단종 7~9, 예정 10~12 제외)
  if (cand.productType != null && cand.productType > 3) {
    return { confidence: "low", score: 0, reasons: ["일반 상품 아님(중고/단종/예정)"] };
  }
  if (!Number.isFinite(cand.lprice) || cand.lprice < 1000) {
    return { confidence: "low", score: 0, reasons: ["가격 비정상(<1,000원)"] };
  }

  const ourTokens = tokenize(normalizeProductName(ourName));
  const candNorm = normalizeProductName(cand.title);
  const candTokens = new Set(tokenize(candNorm));

  if (ourTokens.length === 0) return { confidence: "low", score: 0, reasons: ["제품명 토큰 없음"] };

  const contained = ourTokens.filter((t) => candTokens.has(t) || candNorm.includes(t));
  const score = contained.length / ourTokens.length;

  // 수치 토큰 모순 검사: 우리 쪽 수치가 후보에 전혀 없으면 용량 다른 제품일 위험
  const ourNums = numericTokens(ourTokens);
  const numsOk = ourNums.every((n) => candNorm.replace(/,/g, "").includes(n));
  if (ourNums.length > 0 && !numsOk) reasons.push("수치 토큰 불일치(용량 다른 제품 위험)");

  const bundle = isBundle(cand.title);
  if (bundle) reasons.push("묶음 상품(단가 왜곡)");

  if (score >= 0.85 && numsOk && !bundle) {
    reasons.push(`토큰 포함률 ${(score * 100).toFixed(0)}%`);
    return { confidence: "high", score, reasons };
  }
  if (score >= 0.6) {
    reasons.push(`토큰 포함률 ${(score * 100).toFixed(0)}% — 검토 대기`);
    return { confidence: "mid", score, reasons };
  }
  reasons.push(`토큰 포함률 ${(score * 100).toFixed(0)}% — 폐기`);
  return { confidence: "low", score, reasons };
}

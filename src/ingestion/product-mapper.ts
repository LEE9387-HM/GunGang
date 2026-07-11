/**
 * 식약처 건강기능식품정보 API 레코드 → 도메인 적재 형태 매핑 (순수 함수).
 *
 * DB·네트워크 I/O 없음. 입력은 API 원본 레코드 + 성분 별칭 맵.
 * 출력은 product/product_ingredient staging insert에 바로 쓸 수 있는 구조.
 * 테스트: tests/unit/product-mapper.test.ts
 */
import { parseBaseStandard } from "./base-standard-parser";

/** 건강기능식품정보 API(HtfsInfoService03) 레코드 — 사용하는 필드만 */
export interface HtfsRecord {
  ENTRPS?: string; // 업체명
  PRDUCT?: string; // 제품명
  STTEMNT_NO?: string; // 신고번호
  SRV_USE?: string; // 섭취방법
  MAIN_FNCTN?: string; // 주된기능성
  INTAKE_HINT1?: string; // 섭취주의사항
  BASE_STANDARD?: string; // 기준규격 (함량 원천)
  PRSRV_PD?: string;
  DISTB_PD?: string;
}

/** 성분 라벨 정규화 키 → ingredient 정보 (ingredient_alias에서 구축) */
export interface AliasEntry {
  ingredientId: string;
  ingredientSlug: string;
  categorySlug: string; // 이 성분의 대표 카테고리 (vitamin-d → vitamin-d, epa-dha → omega3)
}
export type AliasMap = Map<string, AliasEntry>;

export interface MappedIngredient {
  ingredientId: string;
  rawAmountText: string;
  amountNormalized: number;
  unitNormalized: string;
  perAmount: number | null;
  perUnit: string | null;
  qualifier: string | null;
  parseConfidence: "exact" | "loose";
  isKeyFunctional: boolean;
}

export interface MappedProduct {
  reportNo: string | null;
  name: string;
  companyName: string | null;
  categorySlug: string | null;
  intakeMethod: string | null;
  mainFunction: string | null;
  productPrecaution: string | null;
  ingredients: MappedIngredient[];
  /** 파서가 함량을 하나도 못 뽑은 경우 true — 호출측에서 needs_review 처리 */
  needsReview: boolean;
}

/** 성분 라벨을 별칭 매칭용 키로 정규화 (소문자 + 공백/구분자 제거) */
export function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[\s·ㆍ,()%]/g, "");
}

/**
 * 별칭 맵으로 라벨을 성분에 매칭. 부분 일치(라벨이 별칭을 포함)까지 허용해
 * "EPA와 DHA의 합" 같은 변형을 흡수한다. 매칭 실패 시 null.
 */
export function matchIngredient(label: string, aliases: AliasMap): AliasEntry | null {
  const key = normalizeLabel(label);
  const exact = aliases.get(key);
  if (exact) return exact;
  // 부분 포함: 별칭 키가 라벨 키에 포함되면 매칭 (짧은 별칭이 오탐 내지 않도록 3자 이상만)
  for (const [aliasKey, entry] of aliases) {
    if (aliasKey.length >= 3 && key.includes(aliasKey)) return entry;
  }
  return null;
}

export function mapRecord(rec: HtfsRecord, aliases: AliasMap): MappedProduct {
  const name = (rec.PRDUCT ?? "").trim();
  const parsed = parseBaseStandard(rec.BASE_STANDARD ?? "");

  const ingredients: MappedIngredient[] = [];
  const categoryVotes = new Map<string, number>();

  for (const p of parsed) {
    const match = matchIngredient(p.label, aliases);
    if (!match) continue; // MVP 범위(오메가3·비타민D) 밖 성분은 스킵
    ingredients.push({
      ingredientId: match.ingredientId,
      rawAmountText: p.raw,
      amountNormalized: p.amount,
      unitNormalized: p.unit,
      perAmount: p.per,
      perUnit: p.perUnit,
      qualifier: p.qualifier,
      parseConfidence: p.confidence,
      isKeyFunctional: true, // 매칭된 성분은 우리가 추적하는 핵심 기능성 성분
    });
    categoryVotes.set(match.categorySlug, (categoryVotes.get(match.categorySlug) ?? 0) + 1);
  }

  // 카테고리: 매칭 성분이 가장 많은 카테고리 (동수면 첫 매칭 우선)
  let categorySlug: string | null = null;
  let best = 0;
  for (const [slug, votes] of categoryVotes) {
    if (votes > best) {
      best = votes;
      categorySlug = slug;
    }
  }

  return {
    reportNo: rec.STTEMNT_NO?.trim() || null,
    name,
    companyName: rec.ENTRPS?.trim() || null,
    categorySlug,
    intakeMethod: rec.SRV_USE?.trim() || null,
    mainFunction: rec.MAIN_FNCTN?.trim() || null,
    productPrecaution: rec.INTAKE_HINT1?.trim() || null,
    ingredients,
    needsReview: ingredients.length === 0,
  };
}

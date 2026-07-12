import { createPublicClient } from "../../infra/db/public-client";
import { parseServing } from "../../domain/dosage";
import { dailyCostKrw, costPerAmountKrw, totalIntakeDays } from "../../domain/pricing";
import {
  analyzeSupplements,
  type AnalysisItem,
  type DuplicationResult,
  type UpperLimit,
} from "../../domain/duplication";

/** 카테고리 slug → 표시명 */
export const CATEGORY_NAMES: Record<string, string> = {
  omega3: "오메가3",
  "vitamin-d": "비타민D",
  probiotics: "프로바이오틱스",
  lutein: "루테인",
  "vitamin-c": "비타민C",
  zinc: "아연",
  magnesium: "마그네슘",
  multivitamin: "종합비타민",
  "red-ginseng": "홍삼",
  "milk-thistle": "밀크씨슬",
  garcinia: "가르시니아",
  coq10: "코엔자임Q10",
  "saw-palmetto": "쏘팔메토",
  ginkgo: "은행잎추출물",
};

/** 카테고리별 랭킹 기준 단위 — 같은 단위끼리만 비교해야 순위가 유효.
 *  종합비타민은 다성분이라 단일 함량 랭킹이 성립하지 않아 제외(이름순 검색만). */
export const RANKING_UNIT: Record<string, string> = {
  omega3: "mg",
  "vitamin-d": "μg",
  probiotics: "CFU",
  lutein: "mg",
  "vitamin-c": "mg",
  zinc: "mg",
  magnesium: "mg",
  "red-ginseng": "mg",
  "milk-thistle": "mg",
  garcinia: "mg",
  coq10: "mg",
  "saw-palmetto": "mg",
  ginkgo: "mg",
};

/** 카테고리별 핵심 성분 라벨 (랭킹 기준 설명용) */
export const KEY_INGREDIENT_LABEL: Record<string, string> = {
  omega3: "EPA와 DHA의 합",
  "vitamin-d": "비타민D",
  probiotics: "프로바이오틱스 수",
  lutein: "루테인",
  "vitamin-c": "비타민C",
  zinc: "아연",
  magnesium: "마그네슘",
  "red-ginseng": "진세노사이드",
  "milk-thistle": "실리마린",
  garcinia: "가르시니아 HCA",
  coq10: "코엔자임Q10",
  "saw-palmetto": "쏘팔메토 추출물",
  ginkgo: "플라보놀배당체",
};

/** 카테고리별 형태 필터 옵션 (form_labels 값과 일치) */
export const CATEGORY_FORM_OPTIONS: Record<string, string[]> = {
  omega3: ["rTG", "TG", "식물성(조류)", "어류"],
  "vitamin-d": ["비타민 D3", "비타민 D2", "버섯·효모 유래"],
  magnesium: ["산화마그네슘", "구연산마그네슘", "글리시네이트", "젖산마그네슘"],
};

export interface ProductListItem {
  id: string;
  name: string;
  companyName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  keyIngredient: {
    name: string;
    amount: number | null;
    unit: string | null;
    formLabels: string[];
  } | null;
}

export interface ProductIngredientView {
  ingredientName: string;
  ingredientSlug: string;
  formLabels: string[];
  rawAmountText: string;
  amountNormalized: number | null;
  unitNormalized: string | null;
  perAmount: number | null;
  perUnit: string | null;
  qualifier: string | null;
  parseConfidence: string | null;
  isKeyFunctional: boolean;
}

export interface ProductDetail {
  id: string;
  name: string;
  companyName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  reportNo: string | null;
  intakeMethod: string | null;
  verifiedAt: string | null;
  sourceRegisteredAt: string | null;
  ingredients: ProductIngredientView[];
}

function categoryName(slug: string | null): string | null {
  return slug ? (CATEGORY_NAMES[slug] ?? slug) : null;
}

/** 제품 검색 (이름 부분일치 + 카테고리 필터). verified만 노출 (RLS). */
export async function searchProducts(opts: {
  q?: string;
  category?: string;
  limit?: number;
}): Promise<ProductListItem[]> {
  const sb = createPublicClient();

  // 카테고리 필터는 category_id로 직접 (관계 필터는 limit보다 늦게 적용돼 결과가 잘림)
  let categoryId: string | null = null;
  if (opts.category) {
    const { data: cat } = await sb
      .from("category")
      .select("id")
      .eq("slug", opts.category)
      .maybeSingle();
    if (!cat) return []; // 존재하지 않는 카테고리
    categoryId = cat.id;
  }

  let query = sb
    .from("product")
    .select(
      "id, name, company:company_id(name), category:category_id(slug), product_ingredient(is_key_functional, amount_normalized, unit_normalized, form_labels, ingredient:ingredient_id(slug, name))",
    )
    .order("name")
    .limit(opts.limit ?? 40);

  if (opts.q?.trim()) query = query.ilike("name", `%${opts.q.trim()}%`);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw new Error(`검색 실패: ${error.message}`);

  return (data ?? []).map((p) => {
    const slug = (p.category as { slug: string } | null)?.slug ?? null;
    const key = (p.product_ingredient ?? []).find((i) => i.is_key_functional);
    const ing = key?.ingredient as { name: string } | null | undefined;
    return {
      id: p.id,
      name: p.name,
      companyName: (p.company as { name: string } | null)?.name ?? null,
      categorySlug: slug,
      categoryName: categoryName(slug),
      keyIngredient: key
        ? {
            name: ing?.name ?? "",
            amount: key.amount_normalized,
            unit: key.unit_normalized,
            formLabels: key.form_labels ?? [],
          }
        : null,
    };
  });
}

export interface RankedProduct {
  rank: number;
  id: string;
  name: string;
  companyName: string | null;
  amount: number;
  unit: string;
  formLabels: string[];
}

/**
 * 카테고리 내 핵심 성분 함량 상위 랭킹. verified만 (RLS).
 * 대표 단위(RANKING_UNIT)로 필터해 같은 단위끼리만 비교 → 순위 왜곡 방지.
 * 주의: 함량이 높다고 더 우수한 제품이라는 뜻이 아니다 (화면에서 기준·주의 명시).
 */
export async function getCategoryRanking(
  category: string,
  limit = 10,
  form?: string,
): Promise<RankedProduct[]> {
  const unit = RANKING_UNIT[category];
  if (!unit) return [];
  const sb = createPublicClient();

  const { data: cat } = await sb.from("category").select("id").eq("slug", category).maybeSingle();
  if (!cat) return [];

  let q = sb
    .from("product_ingredient")
    .select(
      "amount_normalized, unit_normalized, form_labels, product:product_id!inner(id, name, category_id, data_status, company:company_id(name))",
    )
    .eq("is_key_functional", true)
    .eq("unit_normalized", unit)
    .not("amount_normalized", "is", null)
    .eq("product.category_id", cat.id)
    .eq("product.data_status", "verified");
  if (form) q = q.contains("form_labels", [form]);
  const { data, error } = await q
    .order("amount_normalized", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`랭킹 조회 실패: ${error.message}`);

  return (data ?? []).map((r, idx) => {
    const p = r.product as unknown as { id: string; name: string; company: { name: string } | null };
    return {
      rank: idx + 1,
      id: p.id,
      name: p.name,
      companyName: p.company?.name ?? null,
      amount: r.amount_normalized as number,
      unit: r.unit_normalized ?? unit,
      formLabels: r.form_labels ?? [],
    };
  });
}

export interface ProductPricing {
  priceKrw: number; // 배송비 포함 총액
  intakeDays: number; // 총 섭취일수
  dailyCostKrw: number; // 1일 비용
  costPer: { per: number; unit: string; value: number }; // per(예:100)단위당 value원
  retailer: string | null;
  collectedAt: string;
}

/**
 * 제품의 가성비 계산 (1일 비용 + 핵심성분 단위당 가격).
 * 가격(price_entry)·포장수(variant)·섭취방법(serving) 중 하나라도 없으면 null → 화면에서 "준비 중".
 * @param dailyAmount 핵심 성분의 1일 함량(정규화값), amountUnit 그 단위
 * @param intakeMethod 제품 SRV_USE 텍스트
 */
export async function getProductPricing(
  productId: string,
  dailyAmount: number | null,
  amountUnit: string | null,
  intakeMethod: string | null,
): Promise<ProductPricing | null> {
  const serving = parseServing(intakeMethod);
  if (!serving || dailyAmount == null || !amountUnit) return null;

  const sb = createPublicClient();
  const { data, error } = await sb
    .from("product_variant")
    .select("total_units, price_entry(price_krw, shipping_krw, collected_at, retailer:retailer_id(name))")
    .eq("product_id", productId);
  if (error || !data?.length) return null;

  // 가격이 있는 variant 중, 가장 최근 수집가를 사용
  let best: { totalUnits: number; price: number; shipping: number; collectedAt: string; retailer: string | null } | null =
    null;
  for (const v of data) {
    for (const pe of (v.price_entry ?? []) as Array<{
      price_krw: number;
      shipping_krw: number;
      collected_at: string;
      retailer: { name: string } | null;
    }>) {
      if (!best || pe.collected_at > best.collectedAt) {
        best = {
          totalUnits: v.total_units,
          price: pe.price_krw,
          shipping: pe.shipping_krw,
          collectedAt: pe.collected_at,
          retailer: pe.retailer?.name ?? null,
        };
      }
    }
  }
  if (!best) return null;

  try {
    const days = totalIntakeDays(best.totalUnits, serving);
    const daily = dailyCostKrw({ totalPriceKrw: best.price + best.shipping, totalUnits: best.totalUnits }, serving);
    const per = 100;
    const value = costPerAmountKrw(daily, dailyAmount, per);
    return {
      priceKrw: best.price + best.shipping,
      intakeDays: days,
      dailyCostKrw: daily,
      costPer: { per, unit: amountUnit, value },
      retailer: best.retailer,
      collectedAt: best.collectedAt,
    };
  } catch {
    return null; // 섭취일수 0 등 계산 불가
  }
}

/** 여러 제품을 비교용으로 조회 (2~4개). 존재하지 않거나 미검수 제품은 제외. */
export async function compareProducts(ids: string[]): Promise<ProductDetail[]> {
  const unique = [...new Set(ids)].slice(0, 4);
  const results = await Promise.all(unique.map((id) => getProductDetail(id)));
  return results.filter((p): p is ProductDetail => p !== null);
}

/**
 * active 상태 상한 규칙만 로드 (RLS: rule_version은 active만 anon 노출).
 * draft 규칙(공전 검증 전)은 제외 → 미검증 기준으로 잘못된 경고를 내지 않는다.
 */
async function loadActiveUpperLimits(): Promise<UpperLimit[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("rule_version")
    .select("definition")
    .eq("kind", "upper_limit")
    .eq("status", "active");
  const limits: UpperLimit[] = [];
  for (const row of data ?? []) {
    const def = row.definition as {
      ingredientSlug?: string;
      dailyIntake?: { max: number; unit: string };
      warnAboveMax?: { value: number; unit: string };
    };
    if (!def.ingredientSlug) continue;
    const max = def.dailyIntake ?? (def.warnAboveMax ? { max: def.warnAboveMax.value, unit: def.warnAboveMax.unit } : null);
    if (!max) continue;
    limits.push({
      ingredientSlug: def.ingredientSlug,
      maxAmount: max.max,
      unit: max.unit,
      message:
        "합산량 {total}이 공개된 일일섭취량 기준({limit})을 초과합니다. 개인 상태·의약품 복용에 따라 다를 수 있으니 전문가와 상담하세요.",
    });
  }
  return limits;
}

export interface SupplementAnalysis {
  products: ProductDetail[];
  result: DuplicationResult;
  /** active 상한 규칙이 없어 상한 대조를 못한 경우 true */
  limitsUnavailable: boolean;
}

/** 선택한 제품들의 중복 성분·상한 초과 분석 (비회원 가능, 2~10개). */
export async function analyzeProducts(ids: string[]): Promise<SupplementAnalysis> {
  const unique = [...new Set(ids)].slice(0, 10);
  const products = (await Promise.all(unique.map((id) => getProductDetail(id)))).filter(
    (p): p is ProductDetail => p !== null,
  );
  const items: AnalysisItem[] = products.map((p) => ({
    productId: p.id,
    productName: p.name,
    ingredients: p.ingredients
      .filter((i) => i.isKeyFunctional && i.amountNormalized != null && i.unitNormalized)
      .map((i) => ({
        ingredientSlug: i.ingredientSlug,
        ingredientName: i.ingredientName,
        amount: i.amountNormalized as number,
        unit: i.unitNormalized as string,
      })),
  }));
  const limits = await loadActiveUpperLimits();
  const result = analyzeSupplements(items, limits);
  return { products, result, limitsUnavailable: limits.length === 0 };
}

/** 제품 상세 (성분 + 출처·기준일). verified 아니면 null. */
export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("product")
    .select(
      "id, name, report_no, intake_method, verified_at, source_registered_at, company:company_id(name), category:category_id(slug), product_ingredient(raw_amount_text, amount_normalized, unit_normalized, per_amount, per_unit, qualifier, parse_confidence, is_key_functional, form_labels, ingredient:ingredient_id(slug, name))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`상세 조회 실패: ${error.message}`);
  if (!data) return null;

  const slug = (data.category as { slug: string } | null)?.slug ?? null;

  const ingredients: ProductIngredientView[] = (data.product_ingredient ?? [])
    .map((i) => {
      const ing = i.ingredient as { slug: string; name: string } | null;
      return {
        ingredientName: ing?.name ?? "",
        ingredientSlug: ing?.slug ?? "",
        formLabels: i.form_labels ?? [],
        rawAmountText: i.raw_amount_text,
        amountNormalized: i.amount_normalized,
        unitNormalized: i.unit_normalized,
        perAmount: i.per_amount,
        perUnit: i.per_unit,
        qualifier: i.qualifier,
        parseConfidence: i.parse_confidence,
        isKeyFunctional: i.is_key_functional,
      };
    })
    .sort((a, b) => Number(b.isKeyFunctional) - Number(a.isKeyFunctional));

  return {
    id: data.id,
    name: data.name,
    companyName: (data.company as { name: string } | null)?.name ?? null,
    categorySlug: slug,
    categoryName: categoryName(slug),
    reportNo: data.report_no,
    intakeMethod: data.intake_method,
    verifiedAt: data.verified_at,
    sourceRegisteredAt: data.source_registered_at,
    ingredients,
  };
}

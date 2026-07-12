import { createPublicClient } from "../../infra/db/public-client";

/** 카테고리 slug → 표시명 (검증 MVP 범위) */
export const CATEGORY_NAMES: Record<string, string> = {
  omega3: "오메가3",
  "vitamin-d": "비타민D",
};

/** 카테고리별 랭킹 기준 단위 — 같은 단위끼리만 비교해야 순위가 유효 */
export const RANKING_UNIT: Record<string, string> = {
  omega3: "mg",
  "vitamin-d": "μg",
};

/** 카테고리별 핵심 성분 라벨 (랭킹 기준 설명용) */
export const KEY_INGREDIENT_LABEL: Record<string, string> = {
  omega3: "EPA와 DHA의 합",
  "vitamin-d": "비타민D",
};

export interface ProductListItem {
  id: string;
  name: string;
  companyName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  keyIngredient: { name: string; amount: number | null; unit: string | null } | null;
}

export interface ProductIngredientView {
  ingredientName: string;
  ingredientSlug: string;
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
      "id, name, company:company_id(name), category:category_id(slug), product_ingredient(is_key_functional, amount_normalized, unit_normalized, ingredient:ingredient_id(slug, name))",
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
        ? { name: ing?.name ?? "", amount: key.amount_normalized, unit: key.unit_normalized }
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
}

/**
 * 카테고리 내 핵심 성분 함량 상위 랭킹. verified만 (RLS).
 * 대표 단위(RANKING_UNIT)로 필터해 같은 단위끼리만 비교 → 순위 왜곡 방지.
 * 주의: 함량이 높다고 더 우수한 제품이라는 뜻이 아니다 (화면에서 기준·주의 명시).
 */
export async function getCategoryRanking(
  category: string,
  limit = 10,
): Promise<RankedProduct[]> {
  const unit = RANKING_UNIT[category];
  if (!unit) return [];
  const sb = createPublicClient();

  const { data: cat } = await sb.from("category").select("id").eq("slug", category).maybeSingle();
  if (!cat) return [];

  const { data, error } = await sb
    .from("product_ingredient")
    .select(
      "amount_normalized, unit_normalized, product:product_id!inner(id, name, category_id, data_status, company:company_id(name))",
    )
    .eq("is_key_functional", true)
    .eq("unit_normalized", unit)
    .not("amount_normalized", "is", null)
    .eq("product.category_id", cat.id)
    .eq("product.data_status", "verified")
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
    };
  });
}

/** 여러 제품을 비교용으로 조회 (2~4개). 존재하지 않거나 미검수 제품은 제외. */
export async function compareProducts(ids: string[]): Promise<ProductDetail[]> {
  const unique = [...new Set(ids)].slice(0, 4);
  const results = await Promise.all(unique.map((id) => getProductDetail(id)));
  return results.filter((p): p is ProductDetail => p !== null);
}

/** 제품 상세 (성분 + 출처·기준일). verified 아니면 null. */
export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("product")
    .select(
      "id, name, report_no, intake_method, verified_at, source_registered_at, company:company_id(name), category:category_id(slug), product_ingredient(raw_amount_text, amount_normalized, unit_normalized, per_amount, per_unit, qualifier, parse_confidence, is_key_functional, ingredient:ingredient_id(slug, name))",
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

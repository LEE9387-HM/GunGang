/**
 * 중복 성분 분석 (순수 함수). 여러 제품을 함께 먹을 때 같은 성분이 겹치는지,
 * 합산량이 공개된 일일섭취량 기준을 넘는지 계산한다.
 *
 * 원칙(절대 원칙 2·4): 전부 결정론적 계산. "위험하다" 같은 판정 표현을 쓰지 않고
 * "공개된 기준 초과"만 사실로 전달한다. 경고 문구는 호출측/규칙에서 관리.
 */

/** 성분 함량을 μg 기준으로 환산 (성분 내 단위 비교용) */
const TO_UG: Record<string, number> = { μg: 1, mg: 1000, g: 1_000_000 };

export function toMicrograms(amount: number, unit: string): number | null {
  const f = TO_UG[unit];
  return f == null ? null : amount * f;
}

/** 사람이 읽기 좋은 단위로 되돌림 (μg → 적절 단위) */
export function formatFromMicrograms(ug: number): { amount: number; unit: string } {
  if (ug >= 1_000_000) return { amount: round(ug / 1_000_000), unit: "g" };
  if (ug >= 1000) return { amount: round(ug / 1000), unit: "mg" };
  return { amount: round(ug), unit: "μg" };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface AnalysisItemIngredient {
  ingredientSlug: string;
  ingredientName: string;
  /** 1일 함량 (정규화값) */
  amount: number;
  unit: string;
}
export interface AnalysisItem {
  productId: string;
  productName: string;
  ingredients: AnalysisItemIngredient[];
}

/** 성분별 일일섭취량 상한 (rule_version upper_limit에서 로드) */
export interface UpperLimit {
  ingredientSlug: string;
  maxAmount: number;
  unit: string;
  message: string; // 초과 시 문구 ({total}/{limit} 치환)
}

export interface IngredientTotal {
  ingredientSlug: string;
  ingredientName: string;
  totalAmount: number;
  unit: string;
  productNames: string[]; // 이 성분을 포함한 제품들
}

export interface Warning {
  ingredientSlug: string;
  ingredientName: string;
  message: string;
}

export interface DuplicationResult {
  totals: IngredientTotal[];
  /** 2개 이상 제품에 겹친 성분 */
  duplicates: IngredientTotal[];
  warnings: Warning[];
}

/**
 * 제품들의 성분을 합산해 중복·상한 초과를 계산.
 * 같은 ingredientSlug끼리 μg 기준으로 합산 후, 대표 단위로 표기.
 */
export function analyzeSupplements(
  items: AnalysisItem[],
  limits: UpperLimit[],
): DuplicationResult {
  // 성분별 집계
  const byIngredient = new Map<
    string,
    { name: string; totalUg: number; unit: string; products: string[] }
  >();

  for (const item of items) {
    for (const ing of item.ingredients) {
      const ug = toMicrograms(ing.amount, ing.unit);
      if (ug == null) continue; // 환산 불가 단위는 합산 제외 (CFU 등)
      const cur = byIngredient.get(ing.ingredientSlug);
      if (cur) {
        cur.totalUg += ug;
        if (!cur.products.includes(item.productName)) cur.products.push(item.productName);
      } else {
        byIngredient.set(ing.ingredientSlug, {
          name: ing.ingredientName,
          totalUg: ug,
          unit: ing.unit,
          products: [item.productName],
        });
      }
    }
  }

  const totals: IngredientTotal[] = [];
  const warnings: Warning[] = [];
  const limitBySlug = new Map(limits.map((l) => [l.ingredientSlug, l]));

  for (const [slug, agg] of byIngredient) {
    const disp = formatFromMicrograms(agg.totalUg);
    const total: IngredientTotal = {
      ingredientSlug: slug,
      ingredientName: agg.name,
      totalAmount: disp.amount,
      unit: disp.unit,
      productNames: agg.products,
    };
    totals.push(total);

    // 상한 초과 검사 (μg 기준 비교)
    const limit = limitBySlug.get(slug);
    if (limit) {
      const limitUg = toMicrograms(limit.maxAmount, limit.unit);
      if (limitUg != null && agg.totalUg > limitUg) {
        warnings.push({
          ingredientSlug: slug,
          ingredientName: agg.name,
          message: limit.message
            .replace("{total}", `${disp.amount}${disp.unit}`)
            .replace("{limit}", `${limit.maxAmount}${limit.unit}`),
        });
      }
    }
  }

  const duplicates = totals.filter((t) => t.productNames.length >= 2);
  return { totals, duplicates, warnings };
}

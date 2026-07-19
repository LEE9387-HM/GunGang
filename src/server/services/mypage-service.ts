import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../infra/db/types";
import type { DuplicationResult } from "../../domain/duplication";

type DB = SupabaseClient<Database>;

export interface UserSupplementItem {
  id: string; // user_supplement row id
  productId: string;
  productName: string;
  categoryName: string | null;
  companyName: string | null;
  dailyServings: number;
}

/** 로그인한 사용자의 등록 영양제 목록 (RLS: 본인 행만). */
export async function getUserSupplements(sb: DB, userId: string): Promise<UserSupplementItem[]> {
  const { data, error } = await sb
    .from("user_supplement")
    .select(
      "id, daily_servings, product:product_id(id, name, category:category_id(name), company:company_id(name))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`내 영양제 조회 실패: ${error.message}`);

  return (data ?? []).map((row) => {
    const p = row.product as {
      id: string;
      name: string;
      category: { name: string } | null;
      company: { name: string } | null;
    } | null;
    return {
      id: row.id,
      productId: p?.id ?? "",
      productName: p?.name ?? "(삭제된 제품)",
      categoryName: p?.category?.name ?? null,
      companyName: p?.company?.name ?? null,
      dailyServings: row.daily_servings,
    };
  });
}

/** 영양제 등록. 이미 등록된 제품이면 조용히 무시(중복 방지는 unique 제약 없음 — 앱 레벨 체크). */
export async function addUserSupplement(sb: DB, userId: string, productId: string): Promise<void> {
  const { data: existing } = await sb
    .from("user_supplement")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) return;

  const { error } = await sb.from("user_supplement").insert({ user_id: userId, product_id: productId });
  if (error) throw new Error(`등록 실패: ${error.message}`);
}

export async function removeUserSupplement(sb: DB, userId: string, rowId: string): Promise<void> {
  const { error } = await sb.from("user_supplement").delete().eq("id", rowId).eq("user_id", userId);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
}

/**
 * 이미 계산된 평가 결과(analyzeProducts 재사용)를 analysis_result에 기록.
 * "부족한 성분" 판정은 제공하지 않는다 — 개인별 권장섭취량 기준 데이터가 없어
 * 임의로 판정하면 근거 없는 건강 조언이 된다 (마스터 프롬프트 절대원칙 2·4).
 */
export async function recordAnalysis(
  sb: DB,
  userId: string,
  productIds: string[],
  result: DuplicationResult,
): Promise<void> {
  if (productIds.length === 0) return;
  const { error } = await sb.from("analysis_result").insert({
    user_id: userId,
    input_snapshot: { productIds } as unknown as Database["public"]["Tables"]["analysis_result"]["Row"]["input_snapshot"],
    duplications: result.duplicates as unknown as Database["public"]["Tables"]["analysis_result"]["Row"]["duplications"],
    warnings: result.warnings as unknown as Database["public"]["Tables"]["analysis_result"]["Row"]["warnings"],
  });
  if (error) throw new Error(`분석 기록 실패: ${error.message}`);
}

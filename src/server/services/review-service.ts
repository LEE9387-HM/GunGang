import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../infra/db/types";
import { autoVerifyEligibility, type ReviewCandidate } from "../../domain/review";

type DB = SupabaseClient<Database>;

function chunk<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
}

export interface StagingProduct {
  id: string;
  name: string;
  categorySlug: string | null;
  candidate: ReviewCandidate;
}

/**
 * staging 상태 제품 + 성분을 검수 판정 형태로 조회.
 * Supabase 기본 반환 한계(1000행)를 넘기 위해 range로 페이지네이션한다.
 */
export async function listStaging(
  sb: DB,
  opts: { max?: number } = {},
): Promise<StagingProduct[]> {
  const pageSize = 1000;
  const max = opts.max ?? Infinity;
  const rows: Array<{
    id: string;
    name: string;
    category: { slug: string } | null;
    product_ingredient: Array<{
      is_key_functional: boolean;
      parse_confidence: string | null;
      amount_normalized: number | null;
      unit_normalized: string | null;
    }>;
  }> = [];

  for (let from = 0; from < max; from += pageSize) {
    const { data, error } = await sb
      .from("product")
      .select(
        "id, name, category:category_id(slug), product_ingredient(is_key_functional, parse_confidence, amount_normalized, unit_normalized)",
      )
      .eq("data_status", "staging")
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`staging 조회 실패: ${error.message}`);
    const page = (data ?? []) as typeof rows;
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows.map((p) => {
    const categorySlug = (p.category as { slug: string } | null)?.slug ?? null;
    return {
      id: p.id,
      name: p.name,
      categorySlug,
      candidate: {
        name: p.name,
        categorySlug,
        ingredients: (p.product_ingredient ?? []).map((i) => ({
          isKeyFunctional: i.is_key_functional,
          parseConfidence: i.parse_confidence as "exact" | "loose" | "manual" | null,
          amountNormalized: i.amount_normalized,
          unitNormalized: i.unit_normalized,
        })),
      },
    };
  });
}

/** 지정한 제품들을 verified로 전환하고 admin_review·audit_log에 기록. */
export async function verifyProducts(
  sb: DB,
  ids: string[],
  actor: string,
  note?: string,
): Promise<number> {
  if (ids.length === 0) return 0;
  const now = new Date().toISOString();
  let updated = 0;

  for (const c of chunk(ids, 200)) {
    const { data, error } = await sb
      .from("product")
      .update({ data_status: "verified", verified_at: now })
      .in("id", c)
      .eq("data_status", "staging") // 이미 verified면 건너뜀 (멱등)
      .select("id");
    if (error) throw new Error(`verified 전환 실패: ${error.message}`);
    const verifiedIds = (data ?? []).map((r) => r.id);
    updated += verifiedIds.length;

    if (verifiedIds.length) {
      const reviews = verifiedIds.map((id) => ({
        product_id: id,
        reviewer: actor,
        decision: "approve",
        note: note ?? null,
      }));
      const { error: re } = await sb.from("admin_review").insert(reviews);
      if (re) throw new Error(`admin_review 기록 실패: ${re.message}`);

      const logs = verifiedIds.map((id) => ({
        actor,
        action: "verify",
        entity: "product",
        entity_id: id,
        before: { data_status: "staging" },
        after: { data_status: "verified" },
      }));
      const { error: le } = await sb.from("audit_log").insert(logs);
      if (le) throw new Error(`audit_log 기록 실패: ${le.message}`);
    }
  }
  return updated;
}

export interface AutoVerifyReport {
  scanned: number;
  eligible: number;
  verified: number;
  byCategory: Record<string, number>;
}

/**
 * 자동 검수 후보(도메인 규칙 충족)를 일괄 verified 전환.
 * "자동 판정"이 아니라 "명백히 안전한 후보를 관리자 실행으로 승인"하는 것.
 * actor에 배치 식별자를 남겨 추적 가능하게 한다.
 */
export async function autoVerify(sb: DB, actor: string): Promise<AutoVerifyReport> {
  const staging = await listStaging(sb);
  const eligible = staging.filter((s) => autoVerifyEligibility(s.candidate).eligible);
  const byCategory: Record<string, number> = {};
  for (const e of eligible) {
    const k = e.categorySlug ?? "(none)";
    byCategory[k] = (byCategory[k] ?? 0) + 1;
  }
  const verified = await verifyProducts(
    sb,
    eligible.map((e) => e.id),
    actor,
    "auto-eligible: single key ingredient, exact parse, category assigned",
  );
  return { scanned: staging.length, eligible: eligible.length, verified, byCategory };
}

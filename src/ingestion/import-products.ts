import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../infra/db/types";
import { fetchAllForTerm } from "./htfs-client";
import { mapRecord, type AliasEntry, type AliasMap, type HtfsRecord } from "./product-mapper";

type DB = SupabaseClient<Database>;

/** 성분 → 대표 카테고리 매핑 */
const INGREDIENT_CATEGORY: Record<string, string> = {
  "vitamin-d": "vitamin-d",
  "epa-dha": "omega3",
  probiotics: "probiotics",
  lutein: "lutein",
  "vitamin-c": "vitamin-c",
  zinc: "zinc",
  magnesium: "magnesium",
};

export interface ImportSummary {
  jobId: string;
  fetched: number;
  withReportNo: number;
  loaded: number;
  needsReview: number;
  ingredientsLoaded: number;
  errors: string[];
}

type Logger = (msg: string) => void;

/** 배열을 n개씩 분할 (Supabase .in()/insert 페이로드·URL 길이 안전) */
function chunk<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
}

/** ingredient + ingredient_alias 테이블에서 매칭용 별칭 맵 구축. */
async function buildAliasMap(sb: DB): Promise<AliasMap> {
  const { data: ings, error: e1 } = await sb.from("ingredient").select("id, slug");
  if (e1) throw new Error(`ingredient 조회 실패: ${e1.message}`);
  const slugById = new Map(ings.map((i) => [i.id, i.slug]));

  const { data: aliases, error: e2 } = await sb
    .from("ingredient_alias")
    .select("alias_normalized, ingredient_id");
  if (e2) throw new Error(`ingredient_alias 조회 실패: ${e2.message}`);

  const map: AliasMap = new Map();
  for (const a of aliases) {
    const slug = slugById.get(a.ingredient_id);
    if (!slug) continue;
    const entry: AliasEntry = {
      ingredientId: a.ingredient_id,
      ingredientSlug: slug,
      categorySlug: INGREDIENT_CATEGORY[slug] ?? null, // 매핑 없는 성분(종합비타민 구성원)은 null
    };
    map.set(a.alias_normalized, entry);
  }
  return map;
}

/**
 * 검색어별 수집 → 원문 보존 → 파싱·매핑 → product/product_ingredient staging 적재.
 * report_no(신고번호)가 있는 레코드만 적재한다 (식별·추적 불가한 레코드는 needs_review 카운트만).
 */
export async function runImport(
  sb: DB,
  apiKey: string,
  opts: { terms: string[]; log?: Logger },
): Promise<ImportSummary> {
  const log = opts.log ?? (() => {});
  const errors: string[] = [];

  const aliasMap = await buildAliasMap(sb);
  log(`별칭 맵 ${aliasMap.size}종 로드`);

  const { data: cats, error: ce } = await sb.from("category").select("id, slug");
  if (ce) throw new Error(`category 조회 실패: ${ce.message}`);
  const categoryIdBySlug = new Map(cats.map((c) => [c.slug, c.id]));

  // import_job 시작 기록
  const { data: job, error: je } = await sb
    .from("import_job")
    .insert({ source: "HtfsInfoService03", params: { terms: opts.terms } })
    .select("id")
    .single();
  if (je || !job) throw new Error(`import_job 생성 실패: ${je?.message}`);
  const jobId = job.id;

  // 1) 수집 (검색어별) + 신고번호 dedup
  const rawById = new Map<string, HtfsRecord>();
  for (const term of opts.terms) {
    const recs = await fetchAllForTerm(apiKey, term, {
      onPage: (p, t) => log(`[${term}] page ${p} (총 ${t}건)`),
    });
    for (const r of recs) {
      const id = r.STTEMNT_NO || r.PRDUCT || JSON.stringify(r);
      if (!rawById.has(id)) rawById.set(id, r);
    }
  }
  const allRecords = [...rawById.values()];
  log(`수집 완료: ${allRecords.length}건 (dedup 후)`);

  // 2) 매핑
  let needsReview = 0;
  const mapped = allRecords.map((r) => mapRecord(r, aliasMap));
  const loadable = mapped.filter((m) => {
    if (m.needsReview) needsReview += 1;
    return m.reportNo && !m.needsReview;
  });
  log(`적재 대상 ${loadable.length}건 / needs_review ${needsReview}건`);

  // 2.5) 업체명(company) upsert → name→id 맵
  const companyNames = [...new Set(loadable.map((m) => m.companyName).filter((n): n is string => !!n))];
  const companyIdByName = new Map<string, string>();
  if (companyNames.length) {
    const { data: comps, error: cce } = await sb
      .from("company")
      .upsert(companyNames.map((name) => ({ name })), { onConflict: "name" })
      .select("id, name");
    if (cce) errors.push(`company upsert 실패: ${cce.message}`);
    for (const c of comps ?? []) companyIdByName.set(c.name, c.id);
  }

  // 3) 신규 제품만 적재 — 기존 report_no는 건드리지 않는다 (검수 상태 보존).
  //    import는 새 제품 추가용이며, 기존 제품 갱신·검수 리셋을 하지 않는다.
  const allReportNos = loadable.map((m) => m.reportNo!).filter(Boolean);
  const existing = new Set<string>();
  for (const c of chunk(allReportNos, 400)) {
    const { data: ex, error: exe } = await sb.from("product").select("report_no").in("report_no", c);
    if (exe) throw new Error(`기존 제품 조회 실패: ${exe.message}`);
    for (const r of ex ?? []) if (r.report_no) existing.add(r.report_no);
  }
  const newLoadable = loadable.filter((m) => !existing.has(m.reportNo!));
  log(`신규 ${newLoadable.length}건 / 기존 유지 ${loadable.length - newLoadable.length}건`);

  const productRows = newLoadable.map((m) => ({
    report_no: m.reportNo!,
    name: m.name,
    company_id: m.companyName ? (companyIdByName.get(m.companyName) ?? null) : null,
    category_id: m.categorySlug ? (categoryIdBySlug.get(m.categorySlug) ?? null) : null,
    intake_method: m.intakeMethod,
    source_registered_at: m.sourceRegisteredAt,
    data_status: "staging" as const,
  }));
  const productIdByReportNo = new Map<string, string>();
  for (const c of chunk(productRows, 500)) {
    const { data: ins, error: ie } = await sb.from("product").insert(c).select("id, report_no");
    if (ie || !ins) throw new Error(`product 삽입 실패: ${ie?.message}`);
    for (const p of ins) if (p.report_no) productIdByReportNo.set(p.report_no, p.id);
  }
  log(`product ${productIdByReportNo.size}건 신규 삽입`);

  // 4) source_snapshot + product_ingredient 배치 삽입 (신규 제품만)
  const snapshots: Database["public"]["Tables"]["source_snapshot"]["Insert"][] = [];
  const ingredients: Database["public"]["Tables"]["product_ingredient"]["Insert"][] = [];
  let ingredientsLoaded = 0;
  for (const m of newLoadable) {
    const pid = productIdByReportNo.get(m.reportNo!);
    if (!pid) continue;
    const raw = allRecords.find((r) => r.STTEMNT_NO?.trim() === m.reportNo);
    snapshots.push({ product_id: pid, import_job_id: jobId, raw: (raw ?? {}) as never });
    for (const ing of m.ingredients) {
      ingredients.push({
        product_id: pid,
        ingredient_id: ing.ingredientId,
        raw_amount_text: ing.rawAmountText,
        amount_normalized: ing.amountNormalized,
        unit_normalized: ing.unitNormalized,
        per_amount: ing.perAmount,
        per_unit: ing.perUnit,
        qualifier: ing.qualifier,
        parse_confidence: ing.parseConfidence,
        is_key_functional: ing.isKeyFunctional,
        form_labels: ing.formLabels,
      });
      ingredientsLoaded += 1;
    }
  }

  for (const c of chunk(snapshots, 200)) {
    const { error } = await sb.from("source_snapshot").insert(c);
    if (error) errors.push(`source_snapshot 삽입 실패: ${error.message}`);
  }
  for (const c of chunk(ingredients, 200)) {
    const { error } = await sb.from("product_ingredient").insert(c);
    if (error) errors.push(`product_ingredient 삽입 실패: ${error.message}`);
  }
  log(`source_snapshot ${snapshots.length}건, product_ingredient ${ingredientsLoaded}건 삽입`);

  // 6) import_job 마감
  await sb
    .from("import_job")
    .update({
      finished_at: new Date().toISOString(),
      total_count: allRecords.length,
      success_count: productIdByReportNo.size,
      error: errors.length ? { messages: errors } : null,
    })
    .eq("id", jobId);

  return {
    jobId,
    fetched: allRecords.length,
    withReportNo: loadable.length,
    loaded: productIdByReportNo.size,
    needsReview,
    ingredientsLoaded,
    errors,
  };
}

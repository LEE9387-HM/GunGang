/**
 * 전체 재파싱. 보존된 원문(source_snapshot.raw)을 현재 별칭·매퍼 로직으로 다시 파싱해
 * product_ingredient와 category를 재생성한다. 별칭·매퍼를 고칠 때마다 API 재수집 없이 반영.
 * 실행: npm run reparse
 *
 * 주의: product_ingredient를 전량 재생성한다. verified 상태(검수)는 건드리지 않는다.
 */
import { createServiceClient } from "../src/infra/db/client";
import { buildAliasMap } from "../src/ingestion/import-products";
import { mapRecord, type HtfsRecord } from "../src/ingestion/product-mapper";
import type { Database } from "../src/infra/db/types";

function chunk<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
}

async function main() {
  const sb = createServiceClient();
  const aliasMap = await buildAliasMap(sb);
  const { data: cats } = await sb.from("category").select("id, slug");
  const catId = new Map((cats ?? []).map((c) => [c.slug, c.id]));
  console.log(`별칭 ${aliasMap.size}종, 카테고리 ${catId.size}개 로드`);

  // 1) 모든 제품의 최신 원문을 페이지네이션으로 모아 재파싱 (메모리)
  const pageSize = 500;
  const ingredientRows: Database["public"]["Tables"]["product_ingredient"]["Insert"][] = [];
  const categoryUpdates = new Map<string | null, string[]>(); // categoryId(null 포함) → productIds
  let from = 0;
  let scanned = 0;

  for (;;) {
    const { data, error } = await sb
      .from("product")
      .select("id, source_snapshot(raw, collected_at)")
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`제품 조회 실패: ${error.message}`);
    const rows = (data ?? []) as unknown as Array<{
      id: string;
      source_snapshot: Array<{ raw: HtfsRecord; collected_at: string }>;
    }>;
    if (rows.length === 0) break;

    for (const p of rows) {
      const snap = (p.source_snapshot ?? []).sort((a, b) => (a.collected_at > b.collected_at ? -1 : 1))[0];
      if (!snap?.raw) continue;
      const m = mapRecord(snap.raw, aliasMap);
      const newCatId = m.categorySlug ? (catId.get(m.categorySlug) ?? null) : null;
      const key = newCatId ?? "__null__";
      if (!categoryUpdates.has(key)) categoryUpdates.set(key, []);
      categoryUpdates.get(key)!.push(p.id);
      for (const ing of m.ingredients) {
        ingredientRows.push({
          product_id: p.id,
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
      }
      scanned += 1;
    }
    from += pageSize;
    if (scanned % 2000 < pageSize) console.log(`  ${scanned}건 재파싱...`);
    if (rows.length < pageSize) break;
  }
  console.log(`재파싱 ${scanned}건, 성분 ${ingredientRows.length}건`);

  // 2) category 배치 갱신 (카테고리별 product_id in)
  for (const [key, ids] of categoryUpdates) {
    const cid = key === "__null__" ? null : key;
    for (const c of chunk(ids, 300)) {
      const { error } = await sb.from("product").update({ category_id: cid }).in("id", c);
      if (error) console.error(`  category 갱신 실패: ${error.message}`);
    }
  }
  console.log("category 갱신 완료");

  // 3) product_ingredient 전량 재생성
  const allProductIds = [...categoryUpdates.values()].flat();
  for (const c of chunk(allProductIds, 300)) {
    const { error } = await sb.from("product_ingredient").delete().in("product_id", c);
    if (error) console.error(`  삭제 실패: ${error.message}`);
  }
  for (const c of chunk(ingredientRows, 500)) {
    const { error } = await sb.from("product_ingredient").insert(c);
    if (error) console.error(`  삽입 실패: ${error.message}`);
  }
  console.log(`product_ingredient 재생성 완료 (${ingredientRows.length}건)`);
}

main().catch((e) => {
  console.error("재파싱 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});

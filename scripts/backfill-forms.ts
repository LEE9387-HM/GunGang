/**
 * 원료 형태 라벨 백필. 제품명 + 기준규격(BASE_STANDARD)에서 추출해
 * 핵심 성분(product_ingredient.form_labels)에 저장한다.
 * 실행: npm run backfill:forms
 */
import { createServiceClient } from "../src/infra/db/client";
import { extractIngredientForm } from "../src/domain/ingredient-form";

async function main() {
  const sb = createServiceClient();
  const pageSize = 1000;
  let from = 0;
  let updated = 0;
  const labelCounts: Record<string, number> = {};

  for (;;) {
    // 핵심 성분 + 제품명/카테고리 + 원문(BASE_STANDARD)
    const { data, error } = await sb
      .from("product_ingredient")
      .select(
        "id, is_key_functional, product:product_id!inner(name, category:category_id(slug), source_snapshot(raw))",
      )
      .eq("is_key_functional", true)
      .order("id") // 정렬 없으면 range 페이지 간 순서 불안정 → 누락·중복
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`조회 실패: ${error.message}`);
    const rows = (data ?? []) as unknown as Array<{
      id: string;
      product: {
        name: string;
        category: { slug: string } | null;
        source_snapshot: Array<{ raw: { BASE_STANDARD?: string } }>;
      };
    }>;
    if (rows.length === 0) break;

    for (const r of rows) {
      const slug = r.product.category?.slug ?? null;
      const bs = r.product.source_snapshot?.[0]?.raw?.BASE_STANDARD ?? null;
      const tags = extractIngredientForm(slug, r.product.name, bs);
      const labels = tags.map((t) => t.label);
      const { error: ue } = await sb
        .from("product_ingredient")
        .update({ form_labels: labels })
        .eq("id", r.id);
      if (ue) {
        console.error(`  update 실패 ${r.id}: ${ue.message}`);
        continue;
      }
      if (labels.length) updated += 1;
      for (const l of labels) labelCounts[l] = (labelCounts[l] ?? 0) + 1;
    }
    console.log(`  ...${from + rows.length}건 처리`);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  console.log(`\n=== 형태 라벨 백필 완료 ===`);
  console.log(`형태 태그가 있는 성분: ${updated}건`);
  console.log("라벨별:", labelCounts);
}

main().catch((e) => {
  console.error("실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});

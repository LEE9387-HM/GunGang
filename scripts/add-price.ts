/**
 * 가격 수동 입력 도구 (D-006). 식약처 데이터에 없는 가격을 관리자가 직접 등록한다.
 * 실행: npm run price -- <신고번호> <가격원> <총개수> [판매처] [배송비]
 * 예:   npm run price -- 20230029284220 15900 90 "네이버쇼핑" 0
 *
 * 같은 제품이면 variant를 재사용하고 price_entry는 이력으로 누적한다 (collected_at 최신 사용).
 */
import { createServiceClient } from "../src/infra/db/client";

async function main() {
  const [reportNo, priceStr, unitsStr, retailerName = "수동입력", shippingStr = "0"] =
    process.argv.slice(2);
  if (!reportNo || !priceStr || !unitsStr) {
    console.error("사용법: npm run price -- <신고번호> <가격원> <총개수> [판매처] [배송비]");
    process.exit(1);
  }
  const priceKrw = Number(priceStr);
  const totalUnits = Number(unitsStr);
  const shippingKrw = Number(shippingStr);
  if (!Number.isInteger(priceKrw) || !Number.isInteger(totalUnits) || totalUnits <= 0) {
    console.error("가격·총개수는 양의 정수여야 합니다 (금액은 원 단위 정수).");
    process.exit(1);
  }

  const sb = createServiceClient();

  const { data: product, error: pe } = await sb
    .from("product")
    .select("id, name")
    .eq("report_no", reportNo)
    .maybeSingle();
  if (pe || !product) {
    console.error(`신고번호 ${reportNo} 제품을 찾을 수 없습니다.`);
    process.exit(1);
  }

  // retailer upsert
  const { data: retailer, error: re } = await sb
    .from("retailer")
    .upsert({ name: retailerName }, { onConflict: "name" })
    .select("id")
    .single();
  if (re || !retailer) throw new Error(`retailer 등록 실패: ${re?.message}`);

  // variant 재사용 or 생성 (총 개수 라벨)
  const label = `${totalUnits}개입`;
  let variantId: string;
  const { data: existing } = await sb
    .from("product_variant")
    .select("id")
    .eq("product_id", product.id)
    .eq("label", label)
    .maybeSingle();
  if (existing) {
    variantId = existing.id;
  } else {
    const { data: v, error: ve } = await sb
      .from("product_variant")
      .insert({ product_id: product.id, label, total_units: totalUnits })
      .select("id")
      .single();
    if (ve || !v) throw new Error(`variant 생성 실패: ${ve?.message}`);
    variantId = v.id;
  }

  const { error: pce } = await sb.from("price_entry").insert({
    variant_id: variantId,
    retailer_id: retailer.id,
    price_krw: priceKrw,
    shipping_krw: shippingKrw,
    price_type: "sale",
  });
  if (pce) throw new Error(`price_entry 등록 실패: ${pce.message}`);

  console.log(`✓ ${product.name}`);
  console.log(`  ${totalUnits}개입 ${priceKrw.toLocaleString()}원 (+배송 ${shippingKrw}) @ ${retailerName}`);
}

main().catch((e) => {
  console.error("실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});

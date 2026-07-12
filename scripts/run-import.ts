/**
 * 식약처 건강기능식품정보 → staging 적재 실행 스크립트.
 * 실행: npm run import   (tsx --env-file=.env)
 *
 * 적재된 제품은 data_status='staging'. 공개 노출(verified)은 관리자 검수 후 (docs/03-data-model.md).
 */
import { createServiceClient } from "../src/infra/db/client";
import { runImport } from "../src/ingestion/import-products";

async function main() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) throw new Error("DATA_GO_KR_API_KEY 환경변수가 필요합니다 (.env 확인).");

  const sb = createServiceClient();
  const summary = await runImport(sb, apiKey, {
    terms: ["비타민D", "오메가", "EPA", "프로바이오틱스", "유산균", "루테인", "비타민C", "아연", "마그네슘", "종합비타민", "멀티비타민", "멀티미네랄", "홍삼", "밀크씨슬", "가르시니아", "코엔자임", "쏘팔메토", "은행잎", "콜라겐", "프로폴리스", "감마리놀렌산", "전립소", "글루코사민", "콘드로이친", "MSM", "관절", "아르기닌", "크랜베리", "히알루론산"],
    log: (m) => console.log(`  ${m}`),
  });

  console.log("\n=== Import 완료 ===");
  console.log(`job: ${summary.jobId}`);
  console.log(`수집 ${summary.fetched}건 → 적재 ${summary.loaded}건 (성분 ${summary.ingredientsLoaded}건)`);
  console.log(`needs_review(함량 미추출): ${summary.needsReview}건`);
  if (summary.errors.length) {
    console.log(`오류 ${summary.errors.length}건:`);
    summary.errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Import 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});

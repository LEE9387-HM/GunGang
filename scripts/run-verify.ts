/**
 * 자동 검수 후보 일괄 승인 스크립트.
 * 실행: npm run verify
 *
 * 도메인 규칙(단일 핵심성분 + exact 파싱 + 카테고리 배정)을 충족하는 staging 제품을
 * verified로 전환한다. 자동 판정이 아니라 "명백히 안전한 후보의 관리자 일괄 승인"이며,
 * audit_log에 actor(배치 식별자)가 남는다. 복합제품·loose·미분류는 제외되어 수동 검수 대기.
 */
import { createServiceClient } from "../src/infra/db/client";
import { autoVerify } from "../src/server/services/review-service";

async function main() {
  const sb = createServiceClient();
  const actor = `auto-verify-batch@${new Date().toISOString().slice(0, 10)}`;
  const report = await autoVerify(sb, actor);

  console.log("=== 자동 검수 완료 ===");
  console.log(`staging 스캔: ${report.scanned}건`);
  console.log(`적격(후보): ${report.eligible}건`);
  console.log(`verified 전환: ${report.verified}건`);
  console.log("카테고리별:", report.byCategory);
  console.log(`\n남은 staging(수동 검수 대상): ${report.scanned - report.verified}건`);
}

main().catch((e) => {
  console.error("검수 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});

import { describe, expect, it } from "vitest";
import corpus from "../fixtures/base-standard-corpus.json";
import { parseBaseStandard } from "../../src/ingestion/base-standard-parser";

interface CorpusItem {
  name: string;
  group: string;
  baseStandard: string;
}

/**
 * 회귀 코퍼스: 식약처 API 실데이터 447건 (2026-07-11 수집, 비타민D·오메가·EPA 검색군).
 * 파서 수정 시 커버리지가 아래 기준 밑으로 떨어지면 실패한다.
 * 기준치는 최초 측정값에서 -2%p 여유를 둔 값 — 개선은 자유, 퇴행은 차단.
 */
describe("parseBaseStandard — 447건 실데이터 코퍼스 커버리지", () => {
  const items = corpus as CorpusItem[];

  it("제품 단위 파싱 성공률 (1건 이상 추출)", () => {
    let ok = 0;
    const failures: string[] = [];
    for (const item of items) {
      const entries = parseBaseStandard(item.baseStandard);
      if (entries.length > 0) ok += 1;
      else failures.push(item.name);
    }
    const rate = ok / items.length;
    console.log(`[코퍼스] 파싱 성공: ${ok}/${items.length} (${(rate * 100).toFixed(1)}%)`);
    if (failures.length > 0) console.log(`[코퍼스] 실패 예시: ${failures.slice(0, 8).join(" | ")}`);
    expect(rate).toBeGreaterThanOrEqual(0.93);
  });

  it("비타민D 검색군에서 비타민D 함량 추출률", () => {
    const vd = items.filter((i) => i.group === "비타민D");
    const hit = vd.filter((i) =>
      parseBaseStandard(i.baseStandard).some((e) => /비타민\s*D/i.test(e.label)),
    ).length;
    const rate = hit / vd.length;
    console.log(`[코퍼스] 비타민D 추출: ${hit}/${vd.length} (${(rate * 100).toFixed(1)}%)`);
    expect(rate).toBeGreaterThanOrEqual(0.85);
  });

  it("오메가 검색군에서 EPA/DHA 함량 추출률", () => {
    const om = items.filter((i) => i.group === "오메가" || i.group === "EPA");
    const hit = om.filter((i) =>
      parseBaseStandard(i.baseStandard).some((e) => /EPA|DHA/i.test(e.label)),
    ).length;
    const rate = hit / om.length;
    console.log(`[코퍼스] EPA/DHA 추출: ${hit}/${om.length} (${(rate * 100).toFixed(1)}%)`);
    expect(rate).toBeGreaterThanOrEqual(0.88);
  });
});

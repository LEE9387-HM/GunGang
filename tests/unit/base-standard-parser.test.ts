import { describe, expect, it } from "vitest";
import { parseBaseStandard } from "../../src/ingestion/base-standard-parser";

// 전부 447건 코퍼스에서 나온 실제 표기 (tests/fixtures/base-standard-corpus.json)
describe("parseBaseStandard — 실표기 변형", () => {
  it("P1 표준: 표시량(수치/기준량)의 범위", () => {
    const r = parseBaseStandard(
      "3. 프로바이오틱스 수: 표시량(10,000,000,000 CFU/2,000mg)이상 4. 아연: 표시량(5mg/2,000mg)의 80~120%",
    );
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({
      label: "프로바이오틱스 수",
      amount: 10_000_000_000,
      unit: "CFU",
      per: 2000,
      perUnit: "mg",
      qualifier: "이상",
      confidence: "exact",
    });
    expect(r[1]).toMatchObject({ label: "아연", amount: 5, unit: "mg", per: 2000, qualifier: "80~120%" });
  });

  it("P2 역순: 수치가 앞, (표시량의 범위)가 뒤 + ㎍ 정규화", () => {
    const r = parseBaseStandard("② 비타민D : 10 ㎍ / 2 g (표시량의 80-180%)");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      label: "비타민D",
      amount: 10,
      unit: "μg",
      per: 2,
      perUnit: "g",
      qualifier: "80~180%",
      confidence: "exact",
    });
  });

  it("P1 전각괄호 변형: 표시량｛100ug/500mg의 80~180%｝", () => {
    const r = parseBaseStandard("2) 비타민D : 표시량 ｛100ug/500mg의 80~180%｝");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ label: "비타민D", amount: 100, unit: "μg", per: 500, perUnit: "mg", qualifier: "80~180%" });
  });

  it("P1 기준량 수치 생략: 표시량 (15 ug/g)의 80~180% → per 1g", () => {
    const r = parseBaseStandard("3. 비타민 D : 표시량 (15 ug/g)의 80~180%");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ label: "비타민 D", amount: 15, unit: "μg", per: 1, perUnit: "g" });
  });

  it("P3 축약: 표시량 키워드 없음, (범위%) 필수 → loose", () => {
    const r = parseBaseStandard("2. 비타민D : 200 μg/g (80~180%)");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ label: "비타민D", amount: 200, unit: "μg", per: 1, perUnit: "g", confidence: "loose" });
  });

  it("EPA와 DHA의 합 + 번호 접두 제거", () => {
    const r = parseBaseStandard("2) EPA와 DHA의 합 : 표시량(1,200mg/1,300mg) 이상");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ label: "EPA와 DHA의 합", amount: 1200, per: 1300, qualifier: "이상" });
  });

  it("품질·오염물질 규격은 제외 (성상·대장균군·납 mg/kg)", () => {
    const r = parseBaseStandard(
      "1. 성상 : 고유의 향미가 있는 분말 2. 대장균군 : 음성 4. 납 (mg/kg) : 1.0이하 5. 비타민D: 표시량(25μg/1,000mg)의 80~150%",
    );
    expect(r).toHaveLength(1);
    expect(r[0]?.label).toBe("비타민D");
  });

  it("빈 문자열·무패턴 텍스트는 빈 배열 (임의 추정 금지)", () => {
    expect(parseBaseStandard("")).toEqual([]);
    expect(parseBaseStandard("1. 성상: 노란색 연질캡슐 2. 붕해: 적합")).toEqual([]);
  });

  it("복합 단위 보존 (mgα-TE)", () => {
    const r = parseBaseStandard("비타민E: 표시량(11mgα-TE/1,000mg)의 80~180%");
    expect(r[0]).toMatchObject({ amount: 11, unit: "mgα-TE" });
  });
});

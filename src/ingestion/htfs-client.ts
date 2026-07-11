import type { HtfsRecord } from "./product-mapper";

/**
 * 식약처 건강기능식품정보 API (HtfsInfoService03, data.go.kr 경로).
 * I2710(식품안전나라)과 달리 이 엔드포인트는 정상 작동 확인됨 (research/data-sources-check.md).
 */
const BASE = "https://apis.data.go.kr/1471000/HtfsInfoService03/getHtfsItem01";

function serviceKeyParam(key: string): string {
  // Decoding 키는 인코딩, Encoding 키(%포함)는 그대로
  return key.includes("%") ? key : encodeURIComponent(key);
}

export interface FetchPageResult {
  totalCount: number;
  records: HtfsRecord[];
}

/** 제품명 부분검색(Prduct)으로 한 페이지 조회. */
export async function fetchHtfsPage(
  apiKey: string,
  opts: { product?: string; pageNo: number; numOfRows: number },
): Promise<FetchPageResult> {
  const params = new URLSearchParams({
    serviceKey: serviceKeyParam(apiKey),
    pageNo: String(opts.pageNo),
    numOfRows: String(opts.numOfRows),
    type: "json",
  });
  if (opts.product) params.set("Prduct", opts.product);

  const res = await fetch(`${BASE}?${params.toString()}`);
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // data.go.kr 오류는 XML로 옴 (인증·트래픽 초과 등)
    throw new Error(`HTFS API가 JSON이 아닌 응답을 반환했습니다: ${text.slice(0, 200)}`);
  }
  const body = (data as { body?: { totalCount?: number; items?: unknown[] } }).body;
  const items = body?.items ?? [];
  const records = items.map((w) =>
    typeof w === "object" && w !== null && "item" in w ? (w as { item: HtfsRecord }).item : (w as HtfsRecord),
  );
  return { totalCount: body?.totalCount ?? 0, records };
}

/** 검색어에 대해 전체 페이지를 순회 수집 (중복 신고번호는 최초 것 유지). */
export async function fetchAllForTerm(
  apiKey: string,
  product: string,
  opts: { numOfRows?: number; maxPages?: number; onPage?: (page: number, total: number) => void } = {},
): Promise<HtfsRecord[]> {
  const numOfRows = opts.numOfRows ?? 100;
  const maxPages = opts.maxPages ?? 50;
  const seen = new Map<string, HtfsRecord>();
  for (let page = 1; page <= maxPages; page++) {
    const { totalCount, records } = await fetchHtfsPage(apiKey, { product, pageNo: page, numOfRows });
    for (const r of records) {
      const id = r.STTEMNT_NO || r.PRDUCT || JSON.stringify(r);
      if (!seen.has(id)) seen.set(id, r);
    }
    opts.onPage?.(page, totalCount);
    if (records.length < numOfRows || page * numOfRows >= totalCount) break;
  }
  return [...seen.values()];
}

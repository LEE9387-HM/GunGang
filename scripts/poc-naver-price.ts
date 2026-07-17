/**
 * 네이버쇼핑 가격 매칭 PoC (docs/13-pricing-strategy.md Phase A-3).
 * 실행: npm run poc:price          — 카테고리별 인기 제품 20개 자동 표본
 *       npm run poc:price -- "제품명"  — 특정 제품 1개 조회
 *
 * 준비: .env 에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET (네이버 개발자센터 애플리케이션).
 * 출력: 제품별 상위 후보 3개 + 자동 판정(high/mid/low). 사람이 일치 여부를 수기 확인해
 *       research/price-api-check.md 의 검증표를 채운다.
 * 판정 기준(진행 게이트): high 후보 정확도 ≥95% 그리고 high 커버리지 ≥60% → 자동수집 진행.
 */
import { createServiceClient } from "../src/infra/db/client";
import { judgeCandidate, stripHtml, type ShopCandidate } from "../src/domain/price-matching";

const SAMPLE_PER_CATEGORY: Record<string, number> = {
  omega3: 4,
  "vitamin-d": 4,
  "red-ginseng": 3,
  probiotics: 3,
  lutein: 2,
  magnesium: 2,
  "milk-thistle": 2,
};

interface NaverShopItem {
  title: string;
  link: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
}

async function searchNaver(query: string, clientId: string, secret: string): Promise<NaverShopItem[]> {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=5&sort=sim`;
  const res = await fetch(url, {
    headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": secret },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`네이버 API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { items?: NaverShopItem[] };
  return data.items ?? [];
}

async function main() {
  const clientId = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !secret) {
    console.error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 이 .env에 필요합니다.");
    console.error("네이버 개발자센터 > 애플리케이션 등록 > 검색 API 사용 설정 후 발급.");
    process.exit(1);
  }

  const sb = createServiceClient();
  let targets: Array<{ name: string; category: string }> = [];

  const manual = process.argv[2];
  if (manual) {
    targets = [{ name: manual, category: "(수동)" }];
  } else {
    for (const [slug, n] of Object.entries(SAMPLE_PER_CATEGORY)) {
      const { data: cat } = await sb.from("category").select("id").eq("slug", slug).maybeSingle();
      if (!cat) continue;
      const { data } = await sb
        .from("product")
        .select("name")
        .eq("category_id", cat.id)
        .eq("data_status", "verified")
        .order("name")
        .limit(n);
      for (const p of data ?? []) targets.push({ name: p.name, category: slug });
    }
  }
  console.log(`표본 ${targets.length}개 제품으로 PoC 시작\n`);

  let high = 0;
  let mid = 0;
  let none = 0;
  for (const t of targets) {
    let items: NaverShopItem[];
    try {
      items = await searchNaver(t.name, clientId, secret);
    } catch (e) {
      console.error(`  [오류] ${t.name}: ${e instanceof Error ? e.message : e}`);
      continue;
    }
    console.log(`■ [${t.category}] ${t.name}`);
    if (items.length === 0) {
      console.log("   (검색 결과 없음)\n");
      none += 1;
      continue;
    }
    const RANK = { low: 0, mid: 1, high: 2 } as const;
    let bestRank = 0;
    items.slice(0, 3).forEach((it, i) => {
      const cand: ShopCandidate = {
        title: it.title,
        lprice: Number(it.lprice),
        mallName: it.mallName,
        link: it.link,
        brand: it.brand,
        maker: it.maker,
        productType: Number(it.productType),
      };
      const j = judgeCandidate(t.name, cand);
      bestRank = Math.max(bestRank, RANK[j.confidence]);
      console.log(
        `   ${i + 1}. [${j.confidence.toUpperCase()} ${(j.score * 100).toFixed(0)}%] ${stripHtml(it.title).slice(0, 60)}`,
      );
      console.log(
        `      ${Number(it.lprice).toLocaleString()}원 · ${it.mallName} · brand=${it.brand || "-"} maker=${it.maker || "-"} · ${j.reasons.join(" / ")}`,
      );
    });
    if (bestRank === 2) high += 1;
    else if (bestRank === 1) mid += 1;
    else none += 1;
    console.log("");
    await new Promise((r) => setTimeout(r, 250)); // 예의상 간격
  }

  const total = targets.length;
  console.log("=== PoC 요약 ===");
  console.log(`high(자동표시 후보): ${high}/${total} (${((high / total) * 100).toFixed(0)}%)`);
  console.log(`mid(검토 대기): ${mid}/${total}`);
  console.log(`매칭 실패: ${none}/${total}`);
  console.log("\n다음: high 후보들을 눈으로 검증해 research/price-api-check.md 검증표를 채우세요.");
  console.log("게이트: high 정확도 ≥95% AND high 커버리지 ≥60% → 자동수집(Phase B-A) 진행.");
}

main().catch((e) => {
  console.error("PoC 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});

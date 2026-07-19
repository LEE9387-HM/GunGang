/**
 * 최저가 검색 링크 (아웃바운드).
 *
 * 왜 이 방식인가 (research/price-api-check.md §0-3):
 * - 네이버 쇼핑 "상품검색 API"는 2026-07-31 종료 + HUB 이관 제외 → 우리가 실시간 최저가를
 *   구조적으로 수집할 경로가 없다.
 * - 웹검색 스니펫에서 가격을 긁으면 오매칭·최신성·묶음 왜곡 → 근거 표시 원칙 위반.
 * - 따라서 GunGang은 "가격을 단정"하지 않고, 사용자를 네이버 쇼핑 검색결과로 "안내"만 한다.
 *   (마스터 프롬프트 절대원칙 5: 판매와 분석의 분리 — 가격은 우리 등급·순위와 무관한 별도 축)
 */

function naverShoppingUrl(productName: string): string {
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(productName)}`;
}

export function PriceSearchLink({
  productName,
  compact = false,
}: {
  productName: string;
  compact?: boolean;
}) {
  const href = naverShoppingUrl(productName);

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        최저가 검색 ↗
      </a>
    );
  }

  return (
    <div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 rounded-full bg-[#03c75a] px-4 py-2 text-sm font-medium text-white hover:brightness-95"
      >
        네이버 쇼핑에서 최저가 검색 ↗
      </a>
      <p className="mt-2 text-xs leading-relaxed text-gray-400">
        GunGang은 가격을 매기지 않습니다. 실시간 판매가·최저가는 검색결과에서 직접 확인하세요.
        가격은 함량 등급·노출 순위에 영향을 주지 않습니다.
      </p>
    </div>
  );
}

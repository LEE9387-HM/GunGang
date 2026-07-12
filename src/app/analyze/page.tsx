import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { analyzeProducts } from "@/server/services/product-service";

export const dynamic = "force-dynamic";

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { ids } = await searchParams;
  const { products, result, limitsUnavailable } = await analyzeProducts(toArray(ids));

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>
      <h1 className="mt-4 text-xl font-bold">중복 성분 분석</h1>
      <p className="mt-1 text-sm text-gray-500">
        함께 먹을 제품들의 성분이 겹치는지, 합산량이 어느 정도인지 확인합니다.
      </p>

      {products.length < 2 ? (
        <p className="mt-8 text-sm text-gray-500">
          분석할 제품을 2개 이상 선택하세요. 검색·랭킹에서 제품을 체크한 뒤
          &ldquo;중복 분석&rdquo;을 누르면 됩니다.
        </p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-xs font-semibold text-gray-500">분석 대상 {products.length}개</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {products.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {result.duplicates.length > 0 && (
            <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                겹치는 성분 {result.duplicates.length}종
              </h2>
              <ul className="mt-2 space-y-1.5">
                {result.duplicates.map((d) => (
                  <li key={d.ingredientSlug} className="text-sm">
                    <span className="font-medium">{d.ingredientName}</span> · 합산{" "}
                    <span className="font-bold tabular-nums">
                      {d.totalAmount.toLocaleString()}
                      {d.unit}
                    </span>
                    <span className="text-xs text-gray-500"> ({d.productNames.join(", ")})</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6">
            <h2 className="text-xs font-semibold text-gray-500">성분별 합산</h2>
            <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-900">
              {result.totals.map((t) => (
                <li key={t.ingredientSlug} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {t.ingredientName}
                    {t.productNames.length >= 2 && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        중복 {t.productNames.length}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {t.totalAmount.toLocaleString()}
                    {t.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {result.warnings.length > 0 && (
            <section className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <h2 className="text-sm font-semibold text-red-900 dark:text-red-200">
                일일섭취량 기준 확인
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm text-red-900 dark:text-red-200">
                {result.warnings.map((w) => (
                  <li key={w.ingredientSlug}>{w.message}</li>
                ))}
              </ul>
            </section>
          )}

          {limitsUnavailable && (
            <p className="mt-4 text-xs text-gray-400">
              일일섭취량 상한 대조는 공전 기준 검증 후 제공됩니다. 현재는 성분 합산·중복만
              표시합니다.
            </p>
          )}

          <Disclaimer />
        </>
      )}
    </main>
  );
}

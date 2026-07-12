import Link from "next/link";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SearchBar } from "@/components/SearchBar";
import {
  searchProducts,
  getCategoryRanking,
  CATEGORY_NAMES,
  KEY_INGREDIENT_LABEL,
} from "@/server/services/product-service";

export const dynamic = "force-dynamic";

function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null || !unit) return "함량 정보 미확인";
  return `${amount.toLocaleString()}${unit}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;
  const categoryLabel = category ? (CATEGORY_NAMES[category] ?? category) : null;
  const rankingMode = !!category && sort === "amount" && !q;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>

      <div className="mt-4 space-y-3">
        <CategoryTabs current={category ?? ""} sort={sort} />
        <SearchBar defaultQ={q ?? ""} category={category ?? ""} />
      </div>

      {/* 정렬 토글 — 카테고리 선택 시에만 (함량은 같은 단위끼리만 비교 유효) */}
      {category && (
        <div className="mt-5 flex gap-4 text-sm">
          <Link
            href={`/search?category=${category}`}
            className={!rankingMode ? "font-semibold" : "text-gray-500 hover:underline"}
          >
            이름순
          </Link>
          <Link
            href={`/search?category=${category}&sort=amount`}
            className={rankingMode ? "font-semibold" : "text-gray-500 hover:underline"}
          >
            함량순 Top 10
          </Link>
        </div>
      )}

      {rankingMode ? (
        <Ranking category={category!} categoryLabel={categoryLabel!} />
      ) : (
        <Results q={q} category={category} categoryLabel={categoryLabel} />
      )}
    </main>
  );
}

async function Ranking({
  category,
  categoryLabel,
}: {
  category: string;
  categoryLabel: string;
}) {
  const ranked = await getCategoryRanking(category, 10);
  const key = KEY_INGREDIENT_LABEL[category] ?? "핵심 성분";

  return (
    <section className="mt-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{categoryLabel}</span> · {key} 함량 높은 순 Top{" "}
        {ranked.length}
      </p>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
        함량이 높다고 더 좋은 제품이라는 뜻은 아닙니다. 일일섭취량 기준을 함께 확인하세요.
      </p>

      <ol className="mt-4 space-y-2">
        {ranked.map((p) => (
          <li key={p.id}>
            <Link
              href={`/products/${p.id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
            >
              <span
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                  (p.rank <= 3
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")
                }
              >
                {p.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                {p.companyName && (
                  <span className="text-xs text-gray-500">{p.companyName}</span>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {p.amount.toLocaleString()}
                {p.unit}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

async function Results({
  q,
  category,
  categoryLabel,
}: {
  q?: string;
  category?: string;
  categoryLabel: string | null;
}) {
  const results = await searchProducts({ q, category });

  return (
    <>
      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        {categoryLabel && <span className="font-medium">{categoryLabel} </span>}
        {q && <span>&ldquo;{q}&rdquo; </span>}
        검색 결과 <span className="font-medium">{results.length}</span>건
        {results.length >= 40 && " (상위 40건)"}
      </p>

      {results.length === 0 ? (
        <p className="mt-10 text-sm text-gray-500">
          검색 결과가 없습니다. 다른 제품명이나 카테고리로 시도해 보세요.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.id}`}
                className="flex items-center justify-between gap-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <span className="text-xs text-gray-500">
                    {p.companyName ?? p.categoryName}
                  </span>
                </div>
                {p.keyIngredient && (
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">{p.keyIngredient.name}</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatAmount(p.keyIngredient.amount, p.keyIngredient.unit)}
                    </p>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

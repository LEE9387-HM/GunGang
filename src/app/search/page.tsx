import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { searchProducts, CATEGORY_NAMES } from "@/server/services/product-service";

export const dynamic = "force-dynamic";

function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null || !unit) return "함량 정보 미확인";
  return `${amount.toLocaleString()}${unit}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const results = await searchProducts({ q, category });
  const categoryLabel = category ? (CATEGORY_NAMES[category] ?? category) : null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>

      <div className="mt-4">
        <SearchBar defaultQ={q ?? ""} defaultCategory={category ?? ""} />
      </div>

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
                  {p.categoryName && (
                    <span className="text-xs text-gray-500">{p.categoryName}</span>
                  )}
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
    </main>
  );
}

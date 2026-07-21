import Link from "next/link";
import { FormBadges } from "@/components/FormBadges";
import { SearchBar } from "@/components/SearchBar";
import { hasGuide } from "@/content/guides";
import {
  searchProducts,
  getCategoryRanking,
  CATEGORY_NAMES,
  KEY_INGREDIENT_LABEL,
  CATEGORY_FORM_OPTIONS,
} from "@/server/services/product-service";

export const dynamic = "force-dynamic";

function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null || !unit) return "함량 정보 미확인";
  return `${amount.toLocaleString()}${unit}`;
}

/**
 * 체크 후 비교/중복분석으로 보내는 플로팅 버튼 (formaction으로 대상 분기, JS 불필요).
 * 부모 <form>에 group 클래스가 필요 — group-has-[:checked]로 체크된 항목이 있을 때만
 * 노출한다. 상시 노출 시 아무것도 선택 안 해도 리스트 하단 항목을 가리는 문제가 있었다.
 */
function SelectionActions() {
  return (
    <div className="fixed bottom-5 left-1/2 z-10 hidden -translate-x-1/2 gap-2 group-has-[:checked]:flex">
      <button
        type="submit"
        formAction="/compare"
        className="rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-gray-700 dark:bg-white dark:text-gray-900"
      >
        선택 비교
      </button>
      <button
        type="submit"
        formAction="/analyze"
        className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow-lg hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        중복 분석
      </button>
    </div>
  );
}

const CHECKBOX = "h-4 w-4 shrink-0 accent-gray-900 dark:accent-white";

function FormChip({
  category,
  label,
  value,
  active,
}: {
  category: string;
  label: string;
  value: string;
  active: boolean;
}) {
  const params = new URLSearchParams({ category, sort: "amount" });
  if (value) params.set("form", value);
  return (
    <Link
      href={`/search?${params.toString()}`}
      className={
        active
          ? "rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white"
          : "rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
      }
    >
      {label}
    </Link>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; form?: string }>;
}) {
  const { q, category, sort, form } = await searchParams;
  const categoryLabel = category ? (CATEGORY_NAMES[category] ?? category) : null;
  const rankingMode = !!category && sort === "amount" && !q;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-24">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>

      <div className="mt-4">
        <SearchBar defaultQ={q ?? ""} category={category ?? ""} />
      </div>

      {categoryLabel && (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">{categoryLabel}</span>
          {category && hasGuide(category) && (
            <Link
              href={`/guide/${category}`}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              📖 {categoryLabel} 고르는 법
            </Link>
          )}
          <Link href="/" className="text-xs text-gray-400 hover:underline">
            카테고리 변경
          </Link>
        </p>
      )}

      {category && (
        <div className="mt-3 flex gap-4 text-sm">
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
        <Ranking category={category!} categoryLabel={categoryLabel!} form={form} />
      ) : (
        <Results q={q} category={category} categoryLabel={categoryLabel} />
      )}
    </main>
  );
}

async function Ranking({
  category,
  categoryLabel,
  form,
}: {
  category: string;
  categoryLabel: string;
  form?: string;
}) {
  const ranked = await getCategoryRanking(category, 10, form);
  const key = KEY_INGREDIENT_LABEL[category] ?? "핵심 성분";
  const formOptions = CATEGORY_FORM_OPTIONS[category] ?? [];

  return (
    <section className="mt-4">
      {/* 원료 형태 필터 */}
      {formOptions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <FormChip category={category} label="전체 형태" value="" active={!form} />
          {formOptions.map((f) => (
            <FormChip key={f} category={category} label={f} value={f} active={form === f} />
          ))}
        </div>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{categoryLabel}</span>
        {form && <span className="font-medium"> · {form}</span>} · {key} 함량 높은 순 Top{" "}
        {ranked.length}
      </p>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
        함량이 높다고 더 좋은 제품이라는 뜻은 아닙니다. 일일섭취량 기준을 함께 확인하세요.
      </p>

      {ranked.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          해당 형태로 표기된 제품이 없습니다. (제품명에 형태가 표기된 경우만 분류됩니다.)
        </p>
      )}

      <form action="/compare" className="group">
        <ol className="mt-4 space-y-2">
          {ranked.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 dark:border-gray-800"
            >
              <input type="checkbox" name="ids" value={p.id} className={CHECKBOX} />
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
              <Link href={`/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {p.companyName && <span className="text-xs text-gray-500">{p.companyName}</span>}
                    <FormBadges labels={p.formLabels} />
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {p.amount.toLocaleString()}
                  {p.unit}
                </span>
              </Link>
            </li>
          ))}
        </ol>
        {ranked.length > 0 && <SelectionActions />}
      </form>
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
        <form action="/compare" className="group">
          <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
            {results.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3.5">
                <input type="checkbox" name="ids" value={p.id} className={CHECKBOX} />
                <Link
                  href={`/products/${p.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-gray-500">
                        {p.companyName ?? p.categoryName}
                      </span>
                      {p.keyIngredient && <FormBadges labels={p.keyIngredient.formLabels} />}
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
          <SelectionActions />
        </form>
      )}
    </>
  );
}

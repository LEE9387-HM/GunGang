import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { GUIDES } from "@/content/guides";
import {
  CATEGORY_GROUPS,
  CATEGORY_NAMES,
  categoryHref,
  hasRanking,
} from "@/server/services/product-service";

const guides = Object.values(GUIDES);

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-3xl font-bold tracking-tight">GunGang</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        건강기능식품의 성분·실제 함량·가격을 <strong>근거와 함께</strong> 비교합니다.
        추천이 아니라 스스로 판단할 정보를 제공합니다.
      </p>

      <div className="mt-8">
        <SearchBar />
        <p className="mt-1.5 text-xs text-gray-400">제품명 또는 제조사로 검색</p>
      </div>

      <section className="mt-8 space-y-5">
        {CATEGORY_GROUPS.map((g) => (
          <div key={g.name}>
            <h2 className="text-xs font-semibold text-gray-500">{g.name}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.slugs.map((slug) => (
                <Link
                  key={slug}
                  href={categoryHref(slug)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3.5 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  {CATEGORY_NAMES[slug]}
                  {hasRanking(slug) && (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      Top10
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {guides.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold text-gray-500">구매가이드</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guide/${g.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-blue-300 px-3.5 py-1.5 text-sm text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                📖 {g.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-xs text-gray-500">
        데이터 출처: 식품의약품안전처 건강기능식품정보. 검수 완료된 제품만 표시됩니다.
      </p>
    </main>
  );
}

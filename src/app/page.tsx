import Link from "next/link";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SearchBar } from "@/components/SearchBar";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-3xl font-bold tracking-tight">GunGang</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        건강기능식품의 성분·실제 함량·가격을 <strong>근거와 함께</strong> 비교합니다.
        추천이 아니라 스스로 판단할 정보를 제공합니다.
      </p>

      <div className="mt-8 space-y-3">
        <CategoryTabs current="" />
        <SearchBar />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-gray-500">함량 Top 10</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link
            href="/search?category=omega3&sort=amount"
            className="rounded-lg border border-gray-200 px-4 py-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <p className="text-sm font-medium">오메가3</p>
            <p className="mt-0.5 text-xs text-gray-500">EPA+DHA 함량 순위</p>
          </Link>
          <Link
            href="/search?category=vitamin-d&sort=amount"
            className="rounded-lg border border-gray-200 px-4 py-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <p className="text-sm font-medium">비타민D</p>
            <p className="mt-0.5 text-xs text-gray-500">비타민D 함량 순위</p>
          </Link>
        </div>
      </section>

      <p className="mt-10 text-xs text-gray-500">
        데이터 출처: 식품의약품안전처 건강기능식품정보. 검수 완료된 제품만 표시됩니다.
      </p>
    </main>
  );
}

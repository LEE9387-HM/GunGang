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

      <p className="mt-10 text-xs text-gray-500">
        데이터 출처: 식품의약품안전처 건강기능식품정보. 검수 완료된 제품만 표시됩니다.
      </p>
    </main>
  );
}

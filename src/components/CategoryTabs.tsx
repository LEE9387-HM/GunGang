import Link from "next/link";

/**
 * 카테고리 선택 탭 (버튼 토글). 드롭다운 대신 링크 버튼으로 즉시 전환.
 * 검색창 위에 배치한다. 현재 선택된 탭을 강조.
 */
const TABS = [
  { slug: "", label: "전체" },
  { slug: "omega3", label: "오메가3" },
  { slug: "vitamin-d", label: "비타민D" },
  { slug: "probiotics", label: "프로바이오틱스" },
  { slug: "lutein", label: "루테인" },
  { slug: "vitamin-c", label: "비타민C" },
  { slug: "zinc", label: "아연" },
  { slug: "magnesium", label: "마그네슘" },
  { slug: "multivitamin", label: "종합비타민" },
  { slug: "red-ginseng", label: "홍삼" },
  { slug: "milk-thistle", label: "밀크씨슬" },
  { slug: "garcinia", label: "가르시니아" },
  { slug: "coq10", label: "코엔자임Q10" },
  { slug: "ginkgo", label: "은행잎" },
  { slug: "saw-palmetto", label: "쏘팔메토" },
  { slug: "propolis", label: "프로폴리스" },
  { slug: "gla", label: "감마리놀렌산" },
  { slug: "joint", label: "관절건강" },
  { slug: "hyaluronic-acid", label: "히알루론산" },
  { slug: "theanine", label: "테아닌" },
  { slug: "phosphatidylserine", label: "포스파티딜세린" },
  { slug: "curcumin", label: "강황/커큐민" },
] as const;

export function CategoryTabs({ current = "", sort }: { current?: string; sort?: string }) {
  return (
    <div className="flex gap-2">
      {TABS.map((t) => {
        const active = current === t.slug;
        const params = new URLSearchParams();
        if (t.slug) params.set("category", t.slug);
        if (t.slug && sort) params.set("sort", sort); // 전체 카테고리는 함량순 무의미
        const href = params.toString() ? `/search?${params.toString()}` : "/search";
        return (
          <Link
            key={t.slug || "all"}
            href={href}
            className={
              active
                ? "rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
                : "rounded-full border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

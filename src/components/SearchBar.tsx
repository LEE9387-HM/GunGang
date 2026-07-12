/**
 * 제품명 검색 입력. 순수 HTML GET form (클라이언트 JS 없이 SSR·SEO 친화).
 * 카테고리 선택은 CategoryTabs가 담당하고, 여기서는 현재 category·sort를 hidden으로 유지한다.
 */
export function SearchBar({
  defaultQ = "",
  category = "",
  sort = "",
}: {
  defaultQ?: string;
  category?: string;
  sort?: string;
}) {
  return (
    <form action="/search" className="flex w-full gap-2">
      {category && <input type="hidden" name="category" value={category} />}
      {sort && <input type="hidden" name="sort" value={sort} />}
      <input
        type="text"
        name="q"
        defaultValue={defaultQ}
        placeholder="제품명 검색 (예: 알티지, 5000)"
        className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-900"
      />
      <button
        type="submit"
        className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
      >
        검색
      </button>
    </form>
  );
}

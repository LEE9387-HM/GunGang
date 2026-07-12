/**
 * 검색 입력. 순수 HTML GET form이라 클라이언트 JS 없이 동작한다 (SSR·SEO 친화).
 * 제출 시 /search?q=...&category=... 로 이동.
 */
export function SearchBar({
  defaultQ = "",
  defaultCategory = "",
}: {
  defaultQ?: string;
  defaultCategory?: string;
}) {
  return (
    <form action="/search" className="flex w-full flex-col gap-2 sm:flex-row">
      <input
        type="text"
        name="q"
        defaultValue={defaultQ}
        placeholder="제품명 검색 (예: 오메가3, 비타민D)"
        className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-900"
      />
      <select
        name="category"
        defaultValue={defaultCategory}
        className="rounded-md border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <option value="">전체 카테고리</option>
        <option value="omega3">오메가3</option>
        <option value="vitamin-d">비타민D</option>
      </select>
      <button
        type="submit"
        className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
      >
        검색
      </button>
    </form>
  );
}

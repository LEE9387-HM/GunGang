/**
 * 원료 형태·유래 태그 뱃지 (rTG, 식물성(조류), 비타민 D3 등).
 * 근거가 있을 때만 채워진 배열이 오고, 비면 아무것도 렌더하지 않는다.
 */
export function FormBadges({ labels, className = "" }: { labels: string[]; className?: string }) {
  if (!labels.length) return null;
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`}>
      {labels.map((l) => (
        <span
          key={l}
          className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
        >
          {l}
        </span>
      ))}
    </span>
  );
}

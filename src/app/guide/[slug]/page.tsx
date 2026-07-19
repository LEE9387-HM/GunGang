import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { getGuide } from "@/content/guides";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "구매가이드 — GunGang" };
  return {
    title: `${guide.title} — GunGang`,
    description: guide.intro,
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>

      <header className="mt-4">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">구매가이드</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{guide.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {guide.intro}
        </p>
      </header>

      {/* 바쁘면 이것만 */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/40">
        <h2 className="text-sm font-semibold">바쁘면 이것만 보세요</h2>
        <ol className="mt-2 space-y-1.5">
          {guide.tldr.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 기준별 챕터 */}
      <div className="mt-8 space-y-10">
        {guide.chapters.map((c) => (
          <section key={c.title}>
            <h2 className="text-lg font-bold">{c.title}</h2>
            {c.subtitle && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{c.subtitle}</p>
            )}
            <div className="mt-3 space-y-3">
              {c.paras.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {p}
                </p>
              ))}
            </div>
            {c.trap && (
              <p className="mt-3 rounded-md bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <span className="font-semibold">과장 간파 · </span>
                {c.trap}
              </p>
            )}
            {c.cta && (
              <Link
                href={c.cta.href}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
              >
                {c.cta.label} →
              </Link>
            )}
          </section>
        ))}
      </div>

      {/* 우리가 제공 못 하는 축 (정직) */}
      {guide.cannotProvide && (
        <section className="mt-10 rounded-lg border border-dashed border-gray-300 px-4 py-4 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            GunGang이 제공하지 못하는 정보
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {guide.cannotProvide}
          </p>
        </section>
      )}

      <p className="mt-8 text-xs leading-relaxed text-gray-500">
        이 가이드는 특정 제품을 추천하지 않습니다. 무엇을 어떻게 비교할지에 대한 판단 기준을
        제공하며, 최종 선택은 사용자 본인의 몫입니다.
      </p>

      <Disclaimer />
    </main>
  );
}

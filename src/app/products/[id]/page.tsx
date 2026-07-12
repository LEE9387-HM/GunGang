import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { getProductDetail, type ProductIngredientView } from "@/server/services/product-service";

export const dynamic = "force-dynamic";

function normalizedLine(i: ProductIngredientView): string | null {
  if (i.amountNormalized == null || !i.unitNormalized) return null;
  const base =
    i.perAmount != null && i.perUnit
      ? `${i.amountNormalized.toLocaleString()}${i.unitNormalized} / ${i.perAmount.toLocaleString()}${i.perUnit}`
      : `${i.amountNormalized.toLocaleString()}${i.unitNormalized}`;
  return i.qualifier ? `${base} (${i.qualifier})` : base;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  // UTC 저장 → KST 표시 (docs 코딩 규칙)
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProductDetail(id);
  if (!p) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>

      <div className="mt-4">
        {p.categoryName && (
          <span className="text-xs font-medium text-gray-500">{p.categoryName}</span>
        )}
        <h1 className="mt-1 text-xl font-bold">{p.name}</h1>
        {p.companyName && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{p.companyName}</p>
        )}
        {p.intakeMethod && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{p.intakeMethod}</p>
        )}
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-500">핵심 기능성 성분 함량</h2>
        <ul className="mt-3 space-y-3">
          {p.ingredients
            .filter((i) => i.isKeyFunctional)
            .map((i, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{i.ingredientName}</span>
                  <span className="text-lg font-bold tabular-nums">
                    {normalizedLine(i) ?? "미확인"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">표시 원문: {i.rawAmountText}</p>
              </li>
            ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-gray-500">출처</dt>
          <dd>식품의약품안전처 건강기능식품정보</dd>
          <dt className="text-gray-500">신고번호</dt>
          <dd className="tabular-nums">{p.reportNo ?? "-"}</dd>
          <dt className="text-gray-500">정보 기준일</dt>
          <dd>{formatDate(p.sourceRegisteredAt)} (식약처 등록)</dd>
          <dt className="text-gray-500">검수 완료</dt>
          <dd>{formatDate(p.verifiedAt)}</dd>
        </dl>
      </section>

      <Disclaimer />
    </main>
  );
}

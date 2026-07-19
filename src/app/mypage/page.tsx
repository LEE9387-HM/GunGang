import Link from "next/link";
import { redirect } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { createServerAuthClient } from "@/infra/db/server-auth-client";
import { getSessionUser } from "@/server/services/auth-service";
import {
  addUserSupplement,
  getUserSupplements,
  recordAnalysis,
  removeUserSupplement,
} from "@/server/services/mypage-service";
import { analyzeProducts, searchProducts } from "@/server/services/product-service";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

async function addAction(formData: FormData) {
  "use server";
  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login");
  const productId = String(formData.get("productId") ?? "");
  if (productId) await addUserSupplement(sb, user.id, productId);
}

async function removeAction(formData: FormData) {
  "use server";
  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login");
  const rowId = String(formData.get("rowId") ?? "");
  if (rowId) await removeUserSupplement(sb, user.id, rowId);
}

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login?next=/mypage");

  const supplements = await getUserSupplements(sb, user.id);
  const searchResults = q?.trim() ? await searchProducts({ q, limit: 10 }) : [];

  const registeredIds = new Set(supplements.map((s) => s.productId));
  const productIds = supplements.map((s) => s.productId).filter(Boolean);
  const { result, limitsUnavailable } =
    productIds.length > 0
      ? await analyzeProducts(productIds)
      : { result: { totals: [], duplicates: [], warnings: [] }, limitsUnavailable: true };

  if (productIds.length > 0) {
    await recordAnalysis(sb, user.id, productIds, result);
  }

  const hasAlert = result.duplicates.length > 0 || result.warnings.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← GunGang
        </Link>
        <SignOutButton />
      </div>

      <h1 className="mt-4 text-xl font-bold">내 영양제</h1>
      <p className="mt-1 text-sm text-gray-500">{user.email}</p>

      {hasAlert && (
        <section className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            확인이 필요합니다
          </h2>
          <ul className="mt-1.5 space-y-1 text-sm text-amber-900 dark:text-amber-200">
            {result.duplicates.map((d) => (
              <li key={`dup-${d.ingredientSlug}`}>
                {d.ingredientName} 중복 — {d.productNames.join(", ")}에 함께 포함 (합산{" "}
                {d.totalAmount.toLocaleString()}
                {d.unit})
              </li>
            ))}
            {result.warnings.map((w) => (
              <li key={`warn-${w.ingredientSlug}`}>{w.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-semibold text-gray-500">
          등록된 영양제 {supplements.length}개
        </h2>
        {supplements.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">
            아래에서 검색해 섭취 중인 영양제를 등록하세요.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-900">
            {supplements.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <Link href={`/products/${s.productId}`} className="font-medium hover:underline">
                    {s.productName}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {s.categoryName ?? "-"} · {s.companyName ?? "-"}
                  </p>
                </div>
                <form action={removeAction}>
                  <input type="hidden" name="rowId" value={s.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    삭제
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {supplements.length > 0 && limitsUnavailable && (
        <p className="mt-3 text-xs text-gray-400">
          일일섭취량 상한 대조는 공전 기준 검증 후 제공됩니다. 현재는 성분 합산·중복만
          표시합니다. GunGang은 &ldquo;부족한 성분&rdquo;은 판정하지 않습니다 — 개인별 필요량은
          검사를 통해서만 알 수 있습니다.
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-xs font-semibold text-gray-500">영양제 추가</h2>
        <form action="/mypage" className="mt-2 flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="제품명 또는 제조사로 검색"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
          >
            검색
          </button>
        </form>

        {searchResults.length > 0 && (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-900">
            {searchResults.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.categoryName ?? "-"} · {p.companyName ?? "-"}
                  </p>
                </div>
                {registeredIds.has(p.id) ? (
                  <span className="text-xs text-gray-400">등록됨</span>
                ) : (
                  <form action={addAction}>
                    <input type="hidden" name="productId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
                    >
                      추가
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {q?.trim() && searchResults.length === 0 && (
          <p className="mt-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
        )}
      </section>

      <Disclaimer />
    </main>
  );
}

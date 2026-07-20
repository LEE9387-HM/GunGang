import Link from "next/link";
import { redirect } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { createServerAuthClient } from "@/infra/db/server-auth-client";
import { getSessionUser } from "@/server/services/auth-service";
import { hasConsent, recordConsent } from "@/server/services/consent-service";
import {
  addUserSupplement,
  getUserSupplements,
  recordAnalysis,
  removeUserSupplement,
} from "@/server/services/mypage-service";
import { analyzeProducts, searchProducts } from "@/server/services/product-service";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

async function consentAction() {
  "use server";
  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login");
  await recordConsent(sb, user.id, "health_data");
}

async function addAction(formData: FormData) {
  "use server";
  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login");
  // 방어적 재확인: UI가 가려져 있어도 서버에서 동의 여부를 다시 검증한다.
  if (!(await hasConsent(sb, user.id, "health_data"))) return;
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

async function deleteAccountAction(formData: FormData) {
  "use server";
  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login");
  if (formData.get("confirm") !== "on") return;
  const { error } = await sb.rpc("delete_own_account");
  if (error) throw new Error(`회원 탈퇴 실패: ${error.message}`);
  await sb.auth.signOut();
  redirect("/");
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

  const healthDataConsented = await hasConsent(sb, user.id, "health_data");
  const supplements = await getUserSupplements(sb, user.id);
  const searchResults = q?.trim() && healthDataConsented ? await searchProducts({ q, limit: 10 }) : [];

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
            {healthDataConsented
              ? "아래에서 검색해 섭취 중인 영양제를 등록하세요."
              : "아래 동의 후 검색·등록할 수 있습니다."}
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

        {!healthDataConsented ? (
          <div className="mt-2 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800">
            <p className="font-medium">건강정보(등록 영양제) 처리 동의가 필요합니다</p>
            <dl className="mt-2 space-y-1 text-xs text-gray-500">
              <div>
                <dt className="inline font-medium">목적</dt>
                <dd className="inline"> — 등록한 제품 간 성분 중복·공개된 일일섭취량 기준 초과 계산</dd>
              </div>
              <div>
                <dt className="inline font-medium">항목</dt>
                <dd className="inline"> — 등록한 제품명, 1일 섭취량</dd>
              </div>
              <div>
                <dt className="inline font-medium">보유기간</dt>
                <dd className="inline"> — 회원 탈퇴 또는 개별 삭제 시까지, 삭제 시 즉시 파기</dd>
              </div>
              <div>
                <dt className="inline font-medium">동의 거부 시</dt>
                <dd className="inline"> — 이 기능만 이용할 수 없고, 다른 서비스 이용에는 영향 없음</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-gray-400">
              자세한 내용은{" "}
              <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
                개인정보처리방침
              </Link>
              을 확인하세요.
            </p>
            <form action={consentAction} className="mt-3">
              <button
                type="submit"
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
              >
                동의하고 계속하기
              </button>
            </form>
          </div>
        ) : (
          <>
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
          </>
        )}
      </section>

      <Disclaimer />

      <section className="mt-10 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">회원 탈퇴</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          탈퇴하면 이메일, 등록한 영양제 목록, 분석 이력을 포함한 모든 데이터가 즉시 삭제되며
          복구할 수 없습니다.
        </p>
        <form action={deleteAccountAction} className="mt-3">
          <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input type="checkbox" name="confirm" required className="mt-0.5 h-4 w-4 shrink-0" />
            <span>위 내용을 확인했으며 계정과 모든 데이터의 즉시 삭제에 동의합니다.</span>
          </label>
          <button
            type="submit"
            className="mt-3 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            회원 탈퇴
          </button>
        </form>
      </section>
    </main>
  );
}

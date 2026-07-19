import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/infra/db/server-auth-client";
import { getSessionUser, isAdmin } from "@/server/services/auth-service";
import { listStaging, verifyProducts } from "@/server/services/review-service";
import { autoVerifyEligibility } from "@/domain/review";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

async function approveAction(formData: FormData) {
  "use server";
  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login");
  if (!(await isAdmin(sb))) redirect("/");

  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return;
  await verifyProducts(sb, ids, `admin:${user.email}`, "관리자 웹 승인");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const { limit } = await searchParams;
  const max = Math.min(Number(limit) || 50, 500);

  const sb = await createServerAuthClient();
  const user = await getSessionUser(sb);
  if (!user) redirect("/login?next=/admin");
  if (!(await isAdmin(sb))) redirect("/");

  const staging = await listStaging(sb, { max });

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← GunGang
        </Link>
        <SignOutButton />
      </div>

      <h1 className="mt-4 text-xl font-bold">관리자 — 검수 대기</h1>
      <p className="mt-1 text-sm text-gray-500">
        {user.email} · staging 상태 제품 {staging.length}건 표시 중 (최대 {max}건)
      </p>

      {staging.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">검수 대기 중인 제품이 없습니다.</p>
      ) : (
        <form action={approveAction} className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="w-8 p-2"></th>
                  <th className="p-2 text-left text-xs font-normal text-gray-400">제품명</th>
                  <th className="p-2 text-left text-xs font-normal text-gray-400">카테고리</th>
                  <th className="p-2 text-left text-xs font-normal text-gray-400">
                    자동승인 자격
                  </th>
                </tr>
              </thead>
              <tbody>
                {staging.map((s) => {
                  const eligibility = autoVerifyEligibility(s.candidate);
                  return (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="p-2 align-top">
                        <input type="checkbox" name="ids" value={s.id} className="h-4 w-4" />
                      </td>
                      <td className="p-2 align-top">{s.name}</td>
                      <td className="p-2 align-top text-gray-500">{s.categorySlug ?? "-"}</td>
                      <td className="p-2 align-top">
                        {eligibility.eligible ? (
                          <span className="text-xs text-green-700 dark:text-green-400">
                            자격 충족
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {eligibility.reasons.join(", ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
            >
              선택 승인 (verified 전환)
            </button>
            {staging.length >= max && (
              <Link
                href={`/admin?limit=${max + 50}`}
                className="text-sm text-gray-500 hover:underline"
              >
                더 보기 →
              </Link>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            승인하면 즉시 공개 검색·랭킹에 노출됩니다. admin_review·audit_log에 기록됩니다.
          </p>
        </form>
      )}
    </main>
  );
}

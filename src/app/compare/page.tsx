import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { compareProducts, type ProductDetail } from "@/server/services/product-service";

export const dynamic = "force-dynamic";

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/** 제품의 핵심 성분 함량 표시 문자열 */
function keyAmount(p: ProductDetail): string {
  const k = p.ingredients.find((i) => i.isKeyFunctional);
  if (!k || k.amountNormalized == null || !k.unitNormalized) return "-";
  return `${k.amountNormalized.toLocaleString()}${k.unitNormalized}`;
}

function keyIngredientName(p: ProductDetail): string {
  return p.ingredients.find((i) => i.isKeyFunctional)?.ingredientName ?? "-";
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { ids } = await searchParams;
  const products = await compareProducts(toArray(ids));

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>
      <h1 className="mt-4 text-xl font-bold">제품 비교</h1>

      {products.length < 2 ? (
        <p className="mt-8 text-sm text-gray-500">
          비교할 제품을 2개 이상 선택하세요. 검색 결과나 랭킹에서 제품을 체크한 뒤
          &ldquo;선택 비교&rdquo;를 누르면 됩니다.
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-24 border-b border-gray-200 p-2 text-left align-bottom text-xs font-normal text-gray-400 dark:border-gray-800">
                    항목
                  </th>
                  {products.map((p) => (
                    <th
                      key={p.id}
                      className="border-b border-gray-200 p-2 text-left align-bottom dark:border-gray-800"
                    >
                      <Link href={`/products/${p.id}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row label="제조사" cells={products.map((p) => p.companyName ?? "-")} />
                <Row label="카테고리" cells={products.map((p) => p.categoryName ?? "-")} />
                <Row
                  label="핵심 성분"
                  cells={products.map(keyIngredientName)}
                />
                <Row
                  label="함량"
                  cells={products.map(keyAmount)}
                  emphasize
                />
                <Row label="신고번호" cells={products.map((p) => p.reportNo ?? "-")} />
                <Row
                  label="정보 기준일"
                  cells={products.map((p) => formatDate(p.sourceRegisteredAt))}
                />
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            함량은 제품 표시량 기준입니다. 단위가 다르면 직접 비교되지 않으니 같은 성분끼리
            확인하세요.
          </p>
          <Disclaimer />
        </>
      )}
    </main>
  );
}

function Row({
  label,
  cells,
  emphasize = false,
}: {
  label: string;
  cells: string[];
  emphasize?: boolean;
}) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-900">
      <td className="p-2 align-top text-xs text-gray-500">{label}</td>
      {cells.map((c, i) => (
        <td
          key={i}
          className={
            emphasize
              ? "p-2 align-top text-base font-bold tabular-nums"
              : "p-2 align-top text-gray-700 dark:text-gray-300"
          }
        >
          {c}
        </td>
      ))}
    </tr>
  );
}

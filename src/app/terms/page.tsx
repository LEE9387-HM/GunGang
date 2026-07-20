import Link from "next/link";

export const metadata = { title: "이용약관 — GunGang" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>
      <h1 className="mt-4 text-xl font-bold">이용약관</h1>
      <p className="mt-1 text-xs text-gray-400">시행일: 2026-07-20</p>

      <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        이 약관은 초안이며 사업자 정보(운영자명·사업자등록번호·주소)가 아직 확정되지 않았습니다.
        실제 서비스 운영 전 해당 정보를 채우고 법률 검토를 받아야 합니다.
      </p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">제1조 (목적)</h2>
          <p className="mt-1">
            이 약관은 GunGang(이하 &ldquo;서비스&rdquo;)이 제공하는 건강기능식품 성분·함량·가격
            비교 정보 서비스의 이용조건과 절차, 이용자와 운영자의 권리·의무를 정합니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">제2조 (서비스의 성격)</h2>
          <p className="mt-1">
            서비스는 식품의약품안전처가 공개한 건강기능식품 정보를 정리·비교해 제공하는{" "}
            <strong>정보 제공 서비스</strong>입니다. 서비스는 어떤 제품도 직접 판매하지 않으며,
            결제·배송을 처리하지 않습니다. 가격 정보는 외부 쇼핑 검색 결과로 연결하는 링크로만
            제공됩니다.
          </p>
          <p className="mt-1">
            서비스가 제공하는 함량·등급·비교 정보는 공개된 표시사항을 기준으로 한 사실 정리이며,
            특정 제품의 구매를 추천하거나 의학적 진단·치료·처방을 대신하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">제3조 (이용 자격)</h2>
          <p className="mt-1">
            서비스는 만 14세 이상만 회원으로 가입할 수 있습니다. 만 14세 미만은 법정대리인의
            동의 없이 개인정보를 제공할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">제4조 (회원가입과 계정)</h2>
          <p className="mt-1">
            이용자는 이메일과 비밀번호로 회원가입을 할 수 있습니다. 계정 정보의 관리 책임은
            이용자 본인에게 있으며, 제3자에게 계정을 양도·공유해서는 안 됩니다. 이용자는 언제든
            서비스 내 기능으로 계정을 탈퇴하고 데이터를 삭제할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            제5조 (내 영양제 등록과 분석 기능)
          </h2>
          <p className="mt-1">
            회원은 &ldquo;내 영양제&rdquo; 기능으로 섭취 중인 제품을 등록할 수 있습니다. 등록한
            정보는 성분 중복·공개된 일일섭취량 기준 초과 여부를 계산하는 데만 사용되며, 이
            계산은 전부 결정론적 규칙에 따른 것으로 사람(전문가)의 진단이나 처방을 대체하지
            않습니다.
          </p>
          <p className="mt-1">
            서비스는 &ldquo;부족한 성분&rdquo;을 판정하지 않습니다. 개인별 권장섭취량은 검사를
            통해서만 알 수 있으므로, 서비스는 이를 임의로 추정해 제공하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">제6조 (면책)</h2>
          <p className="mt-1">
            서비스가 제공하는 정보는 의학적 조언이 아닙니다. 이용자는 서비스의 정보를 참고
            자료로만 활용해야 하며, 복용 중단·변경·의약품 병용 등 건강과 관련한 결정은 반드시
            의료 전문가와 상담해야 합니다. 서비스는 제품 표시사항의 원문을 정리·정규화하는
            과정에서 발생할 수 있는 오류에 대해 알게 되는 즉시 정정하되, 이용자가 이를 이유로
            입은 손해에 대해서는 관련 법령이 허용하는 범위에서 책임을 제한합니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">제7조 (약관의 변경)</h2>
          <p className="mt-1">
            운영자는 약관을 개정할 수 있으며, 개정 시 시행일과 개정 사유를 서비스 내에 공지합니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">제8조 (문의)</h2>
          <p className="mt-1">
            약관에 대한 문의는{" "}
            <a href="mailto:fortume9388@gmail.com" className="text-blue-600 hover:underline dark:text-blue-400">
              fortume9388@gmail.com
            </a>
            으로 연락해주세요. (연락처는 임시 값이며 확정 시 갱신됩니다.)
          </p>
        </section>
      </div>
    </main>
  );
}

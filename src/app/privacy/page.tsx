import Link from "next/link";

export const metadata = { title: "개인정보처리방침 — GunGang" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← GunGang
      </Link>
      <h1 className="mt-4 text-xl font-bold">개인정보처리방침</h1>
      <p className="mt-1 text-xs text-gray-400">시행일: 2026-07-20</p>

      <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        이 방침은 초안이며 사업자 정보(운영자명·사업자등록번호·주소)가 아직 확정되지 않았습니다.
        실제 서비스 운영 전 해당 정보를 채우고 법률 검토를 받아야 합니다. 아래 내용은 현재
        서비스가 실제로 수집·처리하는 항목만 정확히 기술했습니다.
      </p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">1. 수집하는 개인정보 항목</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="p-2 text-left font-medium text-gray-500">구분</th>
                  <th className="p-2 text-left font-medium text-gray-500">항목</th>
                  <th className="p-2 text-left font-medium text-gray-500">수집 시점</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-900">
                  <td className="p-2 align-top">필수 (일반 개인정보)</td>
                  <td className="p-2 align-top">이메일, 비밀번호(암호화 저장)</td>
                  <td className="p-2 align-top">회원가입 시</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-900">
                  <td className="p-2 align-top">선택 (민감정보 — 건강정보)</td>
                  <td className="p-2 align-top">
                    등록한 영양제 제품명·1일 섭취량 (&ldquo;내 영양제&rdquo; 이용 시)
                  </td>
                  <td className="p-2 align-top">영양제 등록 시 별도 동의 후</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">자동 수집</td>
                  <td className="p-2 align-top">접속 로그, 쿠키(로그인 세션 유지용)</td>
                  <td className="p-2 align-top">서비스 이용 중</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            이름·연령·성별·주민번호·질병명·진료기록 등은 수집하지 않습니다. 광고·분석 목적
            쿠키는 현재 사용하지 않습니다(도입 시 본 방침을 갱신합니다).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            2. 수집·이용 목적 (개인정보 보호법 제15조②)
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>이메일·비밀번호: 회원 식별, 로그인, 계정 관리</li>
            <li>등록 영양제 목록: 본인이 등록한 제품들 간 성분 중복·공개된 일일섭취량 기준 초과 여부 계산</li>
            <li>접속 로그: 부정 이용 방지, 서비스 장애 대응</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            3. 민감정보(건강정보) 처리에 관한 사항
          </h2>
          <p className="mt-1">
            &ldquo;내 영양제&rdquo; 등록 정보는 개인정보 보호법 제23조가 정한{" "}
            <strong>민감정보(건강에 관한 정보)</strong>로 해석될 수 있습니다. 이에 따라 서비스는
            이 정보를 처리하기 전, 일반 회원가입 동의와는 <strong>별도로</strong> 목적·항목·
            보유기간·거부 시 불이익을 고지하고 동의를 받습니다. 동의하지 않아도 회원가입과
            기본 서비스(검색·비교·구매가이드) 이용에는 제한이 없으며, &ldquo;내 영양제&rdquo;
            기능만 이용할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">4. 보유 및 이용 기간</h2>
          <p className="mt-1">
            회원 탈퇴 시 이메일, 등록 영양제 목록, 분석 이력을 포함한 모든 개인정보를{" "}
            <strong>즉시 삭제</strong>합니다. 별도의 보존 기간을 두지 않으며, 관계 법령에 따라
            보존해야 하는 기록이 생기면 그때 별도로 고지합니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">5. 처리 위탁 및 보관 위치</h2>
          <p className="mt-1">
            서비스는 인증·데이터베이스를 Supabase(대한민국 서울 리전)에, 애플리케이션 호스팅을
            Vercel에 위탁합니다. Vercel의 실제 처리 리전은 <strong>확인 필요</strong>입니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">6. 정보주체의 권리</h2>
          <p className="mt-1">
            이용자는 언제든 등록한 영양제 항목을 개별 삭제할 수 있고, &ldquo;마이페이지 &gt;
            회원 탈퇴&rdquo;로 계정과 모든 개인정보를 즉시 삭제할 수 있습니다. 별도 문의는{" "}
            <a href="mailto:fortume9388@gmail.com" className="text-blue-600 hover:underline dark:text-blue-400">
              fortume9388@gmail.com
            </a>
            으로 연락해주세요.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">7. 안전성 확보 조치</h2>
          <p className="mt-1">
            본인 데이터에만 접근 가능한 데이터베이스 접근 제어(Row Level Security)를 전 테이블에
            적용합니다. 관리자의 검수·승인 행위는 감사 로그(audit_log)에 기록됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

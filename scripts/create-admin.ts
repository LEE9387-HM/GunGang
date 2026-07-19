/**
 * 관리자 계정 부트스트랩. auth.users에 계정을 만들고(이메일 확인 생략) app_admin에 등록한다.
 * 실행: npm run admin:create -- <email> <password>
 * 비밀번호는 어디에도 저장하지 않는다 — CLI 인자로만 받아 즉시 사용 후 버린다.
 */
import { createServiceClient } from "../src/infra/db/client";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("사용법: npm run admin:create -- <email> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("비밀번호는 8자 이상이어야 합니다.");
    process.exit(1);
  }

  const sb = createServiceClient();

  // 이미 있는 계정이면 재사용 (비밀번호 갱신), 없으면 새로 생성
  const { data: list, error: listErr } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error(`사용자 목록 조회 실패: ${listErr.message}`);
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let userId: string;
  if (existing) {
    const { data, error } = await sb.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`계정 갱신 실패: ${error.message}`);
    userId = data.user.id;
    console.log(`기존 계정 비밀번호를 갱신했습니다: ${email}`);
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`계정 생성 실패: ${error.message}`);
    userId = data.user.id;
    console.log(`관리자 계정을 생성했습니다: ${email}`);
  }

  const { error: adminErr } = await sb.from("app_admin").upsert({ user_id: userId });
  if (adminErr) throw new Error(`app_admin 등록 실패: ${adminErr.message}`);
  console.log(`app_admin 등록 완료 (user_id=${userId})`);
}

main().catch((e) => {
  console.error("실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});

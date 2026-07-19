-- 0012_auth_admin — 관리자 역할 + RLS 확장
-- 원칙: 서비스 롤을 Vercel에 배포하지 않는다 (기존 방침 유지). 관리자 권한은
--       app_admin 테이블 + is_admin() 함수로 RLS에 편입해, 관리자 본인의 로그인
--       세션(anon 키 + JWT)만으로 staging 조회·승인이 가능하게 한다.

create table app_admin (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table app_admin enable row level security;

-- 로그인한 사용자가 "내가 관리자인지"만 확인 가능 (다른 사람 행은 못 봄)
create policy "own row" on app_admin for select using (auth.uid() = user_id);

-- security definer: app_admin 테이블에 RLS로 막힌 사용자도 자기 자신이 관리자인지
-- 판정 가능해야 정책 재귀 없이 다른 테이블 정책에서 재사용할 수 있다.
create function is_admin() returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from app_admin where user_id = auth.uid());
$$;

-- product: 관리자는 staging 포함 전체 조회 + 상태 갱신(승인) 가능
create policy "admin read all" on product for select using (is_admin());
create policy "admin update" on product for update using (is_admin()) with check (is_admin());

-- product_ingredient: 관리자가 staging 제품의 성분(핵심성분·파싱신뢰도)을 봐야 검수 판단 가능
create policy "admin read all" on product_ingredient for select using (is_admin());

-- admin_review / audit_log: 기존엔 정책 없음(service role 전용) → 관리자 세션도 기록 가능하게
create policy "admin all" on admin_review for all using (is_admin()) with check (is_admin());
create policy "admin all" on audit_log for all using (is_admin()) with check (is_admin());

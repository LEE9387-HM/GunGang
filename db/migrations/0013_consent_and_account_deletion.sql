-- 0013_consent_and_account_deletion — 법무 문서 대응 (D-014)
-- 근거: 개인정보 보호법 제23조(민감정보는 "다른 개인정보의 처리에 대한 동의와 별도로"
--       동의) — 등록 영양제(건강정보 성격)는 일반 이용약관 동의와 별개로 kind='health_data'
--       동의를 받는다. 제15조②(수집 시 고지사항)는 UI 문구로 처리, 여기선 저장만 담당.

create table user_consent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, -- 'terms_privacy' | 'health_data'
  agreed_at timestamptz not null default now(),
  unique (user_id, kind)
);

alter table user_consent enable row level security;
create policy "own rows" on user_consent for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 회원 탈퇴: auth.users 삭제 → user_supplement/analysis_result/user_consent/app_admin
-- 전부 on delete cascade로 함께 삭제됨 (07장 "삭제권" 요건). service role 없이
-- 본인 세션(authenticated 롤)만으로 호출 가능하도록 SECURITY DEFINER로 감쌈.
create function delete_own_account() returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function delete_own_account() to authenticated;

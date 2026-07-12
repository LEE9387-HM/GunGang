-- 0004_product_source_dates — 근거 표시용 날짜를 공개 테이블(product)에 비정규화
-- 이유: source_snapshot은 RLS상 anon 접근 금지(운영 테이블)라 공개 화면에서 못 읽음.
--       근거 표시 원칙(2.3: 수집일·기준일 필수)을 위해 product에 직접 둔다.
--   source_registered_at = 식약처 데이터 등록/갱신일 (REGIST_DT) — 데이터가 어느 시점 것인지

alter table product add column if not exists source_registered_at date;

-- 기존 적재분 백필: source_snapshot.raw의 REGIST_DT(YYYYMMDD)에서 추출
update product p
set source_registered_at = to_date(ss.raw ->> 'REGIST_DT', 'YYYYMMDD')
from source_snapshot ss
where ss.product_id = p.id
  and ss.raw ->> 'REGIST_DT' ~ '^\d{8}$'
  and p.source_registered_at is null;

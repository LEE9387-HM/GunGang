-- 0005_product_company — 제조·판매 업체명(ENTRPS)을 company로 정규화하고 product에 연결
-- 식약처 데이터엔 brand 개념이 없어 product→company 직접 연결 (brand 경유 생략).
-- 원문(source_snapshot.raw.ENTRPS)에서 백필.

alter table product add column if not exists company_id uuid references company(id);
create index if not exists product_company on product (company_id);

-- 1) company 채우기 (업체명 유니크)
insert into company (name)
select distinct nullif(trim(ss.raw ->> 'ENTRPS'), '')
from source_snapshot ss
where nullif(trim(ss.raw ->> 'ENTRPS'), '') is not null
on conflict (name) do nothing;

-- 2) product.company_id 연결
update product p
set company_id = c.id
from source_snapshot ss
join company c on c.name = trim(ss.raw ->> 'ENTRPS')
where ss.product_id = p.id
  and p.company_id is null;

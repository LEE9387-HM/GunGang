-- 0001_core_schema — 검증 MVP 핵심 스키마 (설계: 볼트 docs/03-data-model.md)
-- 원칙: 금액은 정수 원, 함량은 원본 표시값+정규화값 병행 (D-010).
--       verified가 아닌 데이터는 공개 노출 금지 (RLS로 강제).
--       사용자 프로필 확장(연령대 등)은 필요 시점에 별도 마이그레이션.

create extension if not exists pg_trgm;

-- ── enums ────────────────────────────────────────────────────────────
create type data_status as enum
  ('imported','normalized','staging','verified','conflict','stale','discontinued');
create type rule_kind as enum ('evaluation','duplication','upper_limit');
create type rule_status as enum ('draft','active','retired');
create type price_type as enum ('normal','sale','subscription');

-- ── 회사/브랜드/카테고리 ─────────────────────────────────────────────
create table company (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  role text, -- 제조/수입/판매
  created_at timestamptz not null default now()
);

create table brand (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company(id),
  name text not null,
  unique (company_id, name)
);

create table category (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- omega3, vitamin-d
  name text not null
);

-- ── 성분 사전 ────────────────────────────────────────────────────────
create table ingredient (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- vitamin-d, epa-dha
  name text not null,
  is_functional boolean not null default false,
  created_at timestamptz not null default now()
);

create table ingredient_alias (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredient(id) on delete cascade,
  alias text not null,
  alias_normalized text not null unique, -- 소문자·공백 제거
  source text
);

create table unit_conversion (
  id text primary key, -- "vitamin-d-iu-to-ug@2026-07" (버전 태그 포함)
  ingredient_id uuid not null references ingredient(id),
  from_unit text not null,
  to_unit text not null,
  factor numeric not null,
  source text not null, -- 변환 근거 출처
  effective_from date
);
create index unit_conversion_lookup on unit_conversion (ingredient_id, from_unit, to_unit);

-- ── 제품 ─────────────────────────────────────────────────────────────
create table product (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brand(id),
  category_id uuid references category(id),
  supersedes_product_id uuid references product(id), -- 리뉴얼 = 신규 레코드 (D-009)
  name text not null,
  report_no text unique, -- 품목제조신고번호 (STTEMNT_NO)
  daily_serving_count int,
  units_per_serving int,
  dosage_form text, -- 캡슐/정/포/액상
  intake_method text, -- SRV_USE 원문
  data_status data_status not null default 'imported',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_category_status on product (category_id, data_status);
create index product_name_trgm on product using gin (name gin_trgm_ops);

create table product_variant (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  label text not null, -- "90캡슐", "3개월분"
  total_units int not null,
  created_at timestamptz not null default now()
);

create table product_ingredient (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  ingredient_id uuid not null references ingredient(id),
  raw_amount_text text not null, -- 원본 표시값 그대로 (D-010)
  amount_normalized numeric,
  unit_normalized text,
  per_amount numeric,
  per_unit text,
  qualifier text, -- "80~120%", "이상" 등
  parse_confidence text, -- exact | loose | manual (base-standard-parser)
  conversion_id text references unit_conversion(id),
  is_key_functional boolean not null default false,
  unique (product_id, ingredient_id)
);

create table functional_claim (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  ingredient_id uuid references ingredient(id),
  claim_text text not null, -- 식약처 인정 기능성 문구 그대로
  source text
);

create table precaution (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references ingredient(id),
  product_id uuid references product(id),
  body text not null,
  source text not null, -- 출처 필수 (근거 표시 원칙)
  check (ingredient_id is not null or product_id is not null)
);

-- ── 출처·수집 ────────────────────────────────────────────────────────
create table evidence_source (
  id uuid primary key default gen_random_uuid(),
  org text not null, -- 식약처 등
  title text not null,
  url text,
  license text
);

create table import_job (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- HtfsInfoService03, I2710 …
  params jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_count int,
  success_count int,
  error jsonb
);

create table source_snapshot (
  id uuid primary key default gen_random_uuid(),
  evidence_source_id uuid references evidence_source(id),
  import_job_id uuid references import_job(id),
  product_id uuid references product(id),
  raw jsonb not null, -- 수집 원문 그대로 (재정규화 가능)
  collected_at timestamptz not null default now()
);
create index source_snapshot_product on source_snapshot (product_id, collected_at desc);

-- ── 가격 ─────────────────────────────────────────────────────────────
create table retailer (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text
);

create table price_entry (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variant(id) on delete cascade,
  retailer_id uuid not null references retailer(id),
  price_krw int not null, -- 정수 원 (D-010)
  shipping_krw int not null default 0,
  price_type price_type not null default 'sale',
  url text,
  collected_at timestamptz not null default now()
);
create index price_entry_latest on price_entry (variant_id, collected_at desc);

-- ── 규칙·평가 ────────────────────────────────────────────────────────
create table rule_version (
  id text primary key, -- "omega3-eval@2026-07"
  kind rule_kind not null,
  category_id uuid references category(id), -- null = 공통 규칙
  definition jsonb not null,
  status rule_status not null default 'draft',
  published_at timestamptz,
  published_by text
);

create table product_evaluation (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  rule_version_id text not null references rule_version(id),
  dimension_grades jsonb not null, -- 항목별 등급 + 입력 스냅샷 (D-003)
  missing_dimensions jsonb not null default '[]', -- '정보 부족' — 감점 아님
  calculated_at timestamptz not null default now(),
  unique (product_id, rule_version_id)
);

-- ── 사용자 (RLS 본인 행만) ───────────────────────────────────────────
create table user_supplement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references product(id),
  daily_servings numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_supplement_user on user_supplement (user_id);

create table analysis_result (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_version_id text references rule_version(id),
  input_snapshot jsonb not null, -- 분석 시점 제품·용량 (재현성)
  duplications jsonb not null default '[]',
  warnings jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index analysis_result_user on analysis_result (user_id, created_at desc);

-- ── 운영 ─────────────────────────────────────────────────────────────
create table admin_review (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id),
  reviewer text not null,
  decision text not null, -- approve | reject | conflict
  note text,
  reviewed_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor text not null,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────
-- 전 테이블 RLS 활성화. 쓰기는 service role(서버)만. 공개 읽기는 아래 정책으로만.
alter table company enable row level security;
alter table brand enable row level security;
alter table category enable row level security;
alter table ingredient enable row level security;
alter table ingredient_alias enable row level security;
alter table unit_conversion enable row level security;
alter table product enable row level security;
alter table product_variant enable row level security;
alter table product_ingredient enable row level security;
alter table functional_claim enable row level security;
alter table precaution enable row level security;
alter table evidence_source enable row level security;
alter table import_job enable row level security;
alter table source_snapshot enable row level security;
alter table retailer enable row level security;
alter table price_entry enable row level security;
alter table rule_version enable row level security;
alter table product_evaluation enable row level security;
alter table user_supplement enable row level security;
alter table analysis_result enable row level security;
alter table admin_review enable row level security;
alter table audit_log enable row level security;

-- 사전·규칙: 누구나 읽기
create policy "public read" on category for select using (true);
create policy "public read" on ingredient for select using (true);
create policy "public read" on ingredient_alias for select using (true);
create policy "public read" on unit_conversion for select using (true);
create policy "public read" on evidence_source for select using (true);
create policy "public read" on retailer for select using (true);
create policy "public read active rules" on rule_version for select using (status = 'active');
create policy "public read" on company for select using (true);
create policy "public read" on brand for select using (true);

-- 제품: verified만 공개 (검수 게이트)
create policy "read verified" on product for select using (data_status = 'verified');
create policy "read verified" on product_variant for select using (
  exists (select 1 from product p where p.id = product_id and p.data_status = 'verified'));
create policy "read verified" on product_ingredient for select using (
  exists (select 1 from product p where p.id = product_id and p.data_status = 'verified'));
create policy "read verified" on functional_claim for select using (
  exists (select 1 from product p where p.id = product_id and p.data_status = 'verified'));
create policy "read verified" on precaution for select using (
  product_id is null
  or exists (select 1 from product p where p.id = product_id and p.data_status = 'verified'));
create policy "read verified" on price_entry for select using (
  exists (select 1 from product_variant v join product p on p.id = v.product_id
          where v.id = variant_id and p.data_status = 'verified'));
create policy "read verified" on product_evaluation for select using (
  exists (select 1 from product p where p.id = product_id and p.data_status = 'verified'));

-- 사용자 데이터: 본인 행만
create policy "own rows" on user_supplement for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on analysis_result for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- source_snapshot / import_job / admin_review / audit_log:
-- 정책 없음 = service role 전용 (관리자 API는 서버에서만 접근)

-- 0006_ingredient_form — 핵심 성분의 원료 형태·유래 라벨
-- 제품명·기준규격에서 규칙 기반 추출한 표시 라벨 (예: ["rTG","식물성(조류)"])
-- 근거 있을 때만 채우며, 빈 배열 = 표기 없음(미상). 백필은 scripts/backfill-forms.ts.

alter table product_ingredient add column if not exists form_labels text[] not null default '{}';

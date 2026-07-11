-- 0003_seed_upper_limit_rules — 원료별 일일섭취량 규칙 + 섭취 주의사항 시드
-- 출처: 식약처 건강기능식품 종합정보 서비스 원료상세 (data.mfds.go.kr, 수집일 2026-07-11)
--       원료 등록일 표기 2022-10-20 — 공전 최신 개정 반영 여부 확인 필요
-- 주의: 비타민D는 시장에 125μg/일 신고 제품이 실재하므로(코퍼스 확인) 공전 개정 검증 전까지 draft 유지.
--       경고 문구는 판정 표현 금지 규정(docs/08 표현 가이드)을 따른다.

insert into rule_version (id, kind, category_id, definition, status, published_by)
select
  'vitamin-d-daily-intake@2026-07',
  'upper_limit',
  c.id,
  '{
    "ingredientSlug": "vitamin-d",
    "dailyIntake": { "min": 3, "max": 10, "unit": "μg", "note": "120~400 IU" },
    "source": {
      "org": "식품의약품안전처",
      "title": "건강기능식품 종합정보 서비스 — 원료상세 1-3 비타민 D (건강기능식품 공전)",
      "url": "https://data.mfds.go.kr/hid",
      "registeredAt": "2022-10-20",
      "collectedAt": "2026-07-11"
    },
    "verification": "needs_review — 시장에 125μg/일 신고 제품 존재. 공전 최신 개정(비타민D 일일섭취량 상향 여부) 확인 후 active 전환",
    "messageTemplate": "등록하신 제품들의 비타민D 합산량({total})이 공개된 일일섭취량 기준({min}~{max}μg)을 벗어납니다. 의약품 복용 중이거나 개인 상태에 따라 다를 수 있으니 전문가 확인이 필요합니다."
  }'::jsonb,
  'draft',
  'seed@2026-07-11'
from category c where c.slug = 'vitamin-d';

insert into rule_version (id, kind, category_id, definition, status, published_by)
select
  'epa-dha-daily-intake@2026-07',
  'upper_limit',
  c.id,
  '{
    "ingredientSlug": "epa-dha",
    "dailyIntakeByClaim": [
      { "claim": "혈중 중성지질 개선·혈행 개선", "min": 0.5, "max": 2, "unit": "g" },
      { "claim": "기억력 개선", "min": 0.9, "max": 2, "unit": "g" },
      { "claim": "건조한 눈 개선(눈 건강)", "min": 0.6, "max": 2.24, "unit": "g" }
    ],
    "warnAboveMax": { "value": 2.24, "unit": "g", "basis": "기능성별 최대 상한" },
    "source": {
      "org": "식품의약품안전처",
      "title": "건강기능식품 종합정보 서비스 — 원료상세 2-16 EPA 및 DHA 함유 유지 (건강기능식품 공전)",
      "url": "https://data.mfds.go.kr/hid",
      "registeredAt": "2022-10-20",
      "collectedAt": "2026-07-11"
    },
    "verification": "needs_review — 공전 최신 개정 확인 후 active 전환",
    "messageTemplate": "등록하신 제품들의 EPA+DHA 합산량({total})이 공개된 일일섭취량 기준(기능성별 최대 {max}g)을 벗어납니다. 항응고제 등 의약품 복용 중이면 전문가 확인이 필요합니다."
  }'::jsonb,
  'draft',
  'seed@2026-07-11'
from category c where c.slug = 'omega3';

-- 원료 단위 섭취 시 주의사항 (공전 원문 그대로)
insert into precaution (ingredient_id, body, source)
select i.id, v.body, '식약처 건강기능식품 종합정보 서비스 원료상세 (수집 2026-07-11)'
from (values
  ('vitamin-d', '고칼슘혈증이 있거나 의약품 복용 시 전문가와 상담할 것'),
  ('vitamin-d', '이상사례 발생 시 섭취를 중단하고 전문가와 상담할 것'),
  ('epa-dha', '의약품(항응고제, 항혈소판제, 혈압강하제 등) 복용 시 전문가와 상담할 것'),
  ('epa-dha', '개인에 따라 피부 관련 이상반응이 발생할 수 있음'),
  ('epa-dha', '이상사례 발생 시 섭취를 중단하고 전문가와 상담할 것')
) as v(slug, body)
join ingredient i on i.slug = v.slug;

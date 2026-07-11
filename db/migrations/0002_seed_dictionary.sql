-- 0002_seed_dictionary — 검증 MVP 성분 사전 초기 시드 (오메가3·비타민D, D-002)
-- alias_normalized = 소문자 + 공백 제거

insert into category (slug, name) values
  ('omega3', '오메가3'),
  ('vitamin-d', '비타민D');

insert into ingredient (slug, name, is_functional) values
  ('vitamin-d', '비타민D', true),
  ('epa-dha', 'EPA와 DHA의 합', true);

insert into ingredient_alias (ingredient_id, alias, alias_normalized, source)
select i.id, v.alias, v.norm, 'seed@2026-07'
from (values
  ('vitamin-d', '비타민D', '비타민d'),
  ('vitamin-d', '비타민D3', '비타민d3'),
  ('vitamin-d', 'Vitamin D', 'vitamind'),
  ('vitamin-d', '콜레칼시페롤', '콜레칼시페롤'),
  ('vitamin-d', 'Cholecalciferol', 'cholecalciferol'),
  ('epa-dha', 'EPA와 DHA의 합', 'epa와dha의합'),
  ('epa-dha', 'EPA 및 DHA의 합', 'epa및dha의합'),
  ('epa-dha', 'EPA+DHA', 'epa+dha'),
  ('epa-dha', 'EPA 및 DHA 함유유지', 'epa및dha함유유지')
) as v(slug, alias, norm)
join ingredient i on i.slug = v.slug;

insert into unit_conversion (id, ingredient_id, from_unit, to_unit, factor, source, effective_from)
select 'vitamin-d-iu-to-ug@2026-07', i.id, 'IU', 'μg', 0.025,
       '비타민D 1 IU = 0.025 μg — 식약처 건강기능식품 공전 (원문 재확인 필요)', '2026-07-11'
from ingredient i where i.slug = 'vitamin-d';

insert into evidence_source (org, title, url, license) values
  ('식품의약품안전처', '건강기능식품정보 OpenAPI (HtfsInfoService03)',
   'https://www.data.go.kr/data/15056760/openapi.do', '이용허락범위 제한 없음'),
  ('식품의약품안전처', '건강기능식품 품목분류정보 (I2710)',
   'https://www.foodsafetykorea.go.kr/api/openApiInfo.do?menu_grp=MENU_GRP31&menu_no=661&show_cnt=10&start_idx=1&svc_no=I2710', '이용허락범위 제한 없음');

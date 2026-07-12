-- 0010_categories_batch2 — 인기 단일성분 카테고리 6종
-- 홍삼·밀크씨슬·가르시니아·코엔자임Q10·쏘팔메토·은행잎. 각 핵심 성분 1종.
-- alias는 공전 원료명 기준(수집 후 매칭률로 보강 예정).

insert into category (slug, name) values
  ('red-ginseng', '홍삼'),
  ('milk-thistle', '밀크씨슬'),
  ('garcinia', '가르시니아'),
  ('coq10', '코엔자임Q10'),
  ('saw-palmetto', '쏘팔메토'),
  ('ginkgo', '은행잎추출물')
on conflict (slug) do nothing;

insert into ingredient (slug, name, is_functional) values
  ('ginsenoside', '진세노사이드', true),
  ('silymarin', '실리마린', true),
  ('hca', '가르시니아캄보지아추출물', true),
  ('coenzyme-q10', '코엔자임Q10', true),
  ('saw-palmetto', '쏘팔메토열매추출물', true),
  ('ginkgo', '은행잎추출물', true)
on conflict (slug) do nothing;

insert into ingredient_alias (ingredient_id, alias, alias_normalized, source)
select i.id, v.alias, v.norm, 'seed@2026-07-batch2'
from (values
  ('ginsenoside', '진세노사이드', '진세노사이드'),
  ('ginsenoside', '진세노사이드Rg1,Rb1및Rg3의합', '진세노사이드rg1rb1및rg3의합'),
  ('ginsenoside', '진세노사이드 Rg1', '진세노사이드rg1'),
  ('silymarin', '실리마린', '실리마린'),
  ('hca', '가르시니아캄보지아추출물', '가르시니아캄보지아추출물'),
  ('hca', 'Hydroxycitric acid', 'hydroxycitricacid'),
  ('hca', '총 (-)-Hydroxycitric acid', '총-hydroxycitricacid'),
  ('coenzyme-q10', '코엔자임Q10', '코엔자임q10'),
  ('coenzyme-q10', '코엔자임큐텐', '코엔자임큐텐'),
  ('saw-palmetto', '쏘팔메토열매추출물', '쏘팔메토열매추출물'),
  ('saw-palmetto', '쏘팔메토', '쏘팔메토'),
  ('ginkgo', '은행잎추출물', '은행잎추출물'),
  ('ginkgo', '플라보놀배당체', '플라보놀배당체')
) as v(slug, alias, norm)
join ingredient i on i.slug = v.slug
on conflict (alias_normalized) do nothing;

-- 0007_categories_batch1 — 카테고리 확장 1차 (프로바이오틱스·루테인·비타민C·아연)
-- 성분이 단순(핵심 성분 1종)한 카테고리부터. 마그네슘·종합비타민은 별도 마이그레이션.

insert into category (slug, name) values
  ('probiotics', '프로바이오틱스'),
  ('lutein', '루테인'),
  ('vitamin-c', '비타민C'),
  ('zinc', '아연')
on conflict (slug) do nothing;

insert into ingredient (slug, name, is_functional) values
  ('probiotics', '프로바이오틱스', true),
  ('lutein', '루테인', true),
  ('vitamin-c', '비타민C', true),
  ('zinc', '아연', true)
on conflict (slug) do nothing;

insert into ingredient_alias (ingredient_id, alias, alias_normalized, source)
select i.id, v.alias, v.norm, 'seed@2026-07-batch1'
from (values
  ('probiotics', '프로바이오틱스', '프로바이오틱스'),
  ('probiotics', '프로바이오틱스 수', '프로바이오틱스수'),
  ('probiotics', '유산균', '유산균'),
  ('lutein', '루테인', '루테인'),
  ('lutein', '루테인지아잔틴복합추출물', '루테인지아잔틴복합추출물'),
  ('vitamin-c', '비타민C', '비타민c'),
  ('vitamin-c', '비타민 C', '비타민c'),
  ('vitamin-c', '아스코르브산', '아스코르브산'),
  ('zinc', '아연', '아연')
) as v(slug, alias, norm)
join ingredient i on i.slug = v.slug
on conflict (alias_normalized) do nothing;

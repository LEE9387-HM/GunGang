-- 0008_category_magnesium — 마그네슘 카테고리
-- 공전 기준규격의 마그네슘 표시량은 원소 마그네슘 기준 → 함량은 그대로 사용.
-- 형태(산화/구연산/글리시네이트 등)는 흡수율 차이의 핵심이라 form_labels로 태깅(제품명·원재료).

insert into category (slug, name) values ('magnesium', '마그네슘')
on conflict (slug) do nothing;

insert into ingredient (slug, name, is_functional) values ('magnesium', '마그네슘', true)
on conflict (slug) do nothing;

insert into ingredient_alias (ingredient_id, alias, alias_normalized, source)
select i.id, v.alias, v.norm, 'seed@2026-07-mg'
from (values
  ('magnesium', '마그네슘', '마그네슘')
) as v(slug, alias, norm)
join ingredient i on i.slug = v.slug
on conflict (alias_normalized) do nothing;

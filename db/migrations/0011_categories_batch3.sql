-- 0011_categories_batch3 — 콜라겐·프로폴리스·감마리놀렌산 + 쏘팔메토 로르산 별칭
-- 쏘팔메토는 지표성분이 로르산이라 별칭 추가. 매퍼 부성분 무시 개선으로 아연 복합도 정확 분류.

insert into category (slug, name) values
  ('collagen', '콜라겐'),
  ('propolis', '프로폴리스'),
  ('gla', '감마리놀렌산')
on conflict (slug) do nothing;

insert into ingredient (slug, name, is_functional) values
  ('collagen', '콜라겐펩타이드', true),
  ('propolis', '프로폴리스', true),
  ('gla', '감마리놀렌산', true)
on conflict (slug) do nothing;

insert into ingredient_alias (ingredient_id, alias, alias_normalized, source)
select i.id, v.alias, v.norm, 'seed@2026-07-batch3'
from (values
  ('collagen', '콜라겐펩타이드', '콜라겐펩타이드'),
  ('collagen', '저분자콜라겐펩타이드', '저분자콜라겐펩타이드'),
  ('collagen', '콜라겐', '콜라겐'),
  ('propolis', '프로폴리스추출물', '프로폴리스추출물'),
  ('propolis', '프로폴리스', '프로폴리스'),
  ('gla', '감마리놀렌산', '감마리놀렌산'),
  ('saw-palmetto', '로르산', '로르산')
) as v(slug, alias, norm)
join ingredient i on i.slug = v.slug
on conflict (alias_normalized) do nothing;

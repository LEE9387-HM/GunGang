-- 0009_multivitamin — 종합비타민 카테고리 + 비타민/미네랄 성분 사전 확장
-- 종합비타민은 다성분(20~30종). 각 성분을 사전에 등록하고, 매퍼가 서로 다른
-- 단일카테고리 성분 2종 이상이면 multivitamin으로 분류한다.
-- 새 비타민/미네랄 성분은 자체 카테고리를 갖지 않는다(종합비타민 구성원).

insert into category (slug, name) values ('multivitamin', '종합비타민')
on conflict (slug) do nothing;

insert into ingredient (slug, name, is_functional) values
  ('vitamin-a', '비타민A', true),
  ('vitamin-b1', '비타민B1', true),
  ('vitamin-b2', '비타민B2', true),
  ('niacin', '나이아신', true),
  ('pantothenic-acid', '판토텐산', true),
  ('vitamin-b6', '비타민B6', true),
  ('folate', '엽산', true),
  ('vitamin-b12', '비타민B12', true),
  ('biotin', '비오틴', true),
  ('vitamin-e', '비타민E', true),
  ('vitamin-k', '비타민K', true),
  ('calcium', '칼슘', true),
  ('selenium', '셀레늄', true),
  ('iron', '철', true),
  ('copper', '구리', true),
  ('manganese', '망간', true),
  ('iodine', '요오드', true),
  ('chromium', '크롬', true),
  ('molybdenum', '몰리브덴', true)
on conflict (slug) do nothing;

insert into ingredient_alias (ingredient_id, alias, alias_normalized, source)
select i.id, v.alias, v.norm, 'seed@2026-07-mv'
from (values
  ('vitamin-a', '비타민A', '비타민a'),
  ('vitamin-a', '레티놀', '레티놀'),
  ('vitamin-b1', '비타민B1', '비타민b1'),
  ('vitamin-b1', '티아민', '티아민'),
  ('vitamin-b2', '비타민B2', '비타민b2'),
  ('vitamin-b2', '리보플라빈', '리보플라빈'),
  ('niacin', '나이아신', '나이아신'),
  ('pantothenic-acid', '판토텐산', '판토텐산'),
  ('vitamin-b6', '비타민B6', '비타민b6'),
  ('folate', '엽산', '엽산'),
  ('vitamin-b12', '비타민B12', '비타민b12'),
  ('biotin', '비오틴', '비오틴'),
  ('vitamin-e', '비타민E', '비타민e'),
  ('vitamin-e', '토코페롤', '토코페롤'),
  ('vitamin-k', '비타민K', '비타민k'),
  ('calcium', '칼슘', '칼슘'),
  ('selenium', '셀레늄', '셀레늄'),
  ('selenium', '셀렌', '셀렌'),
  ('iron', '철', '철'),
  ('copper', '구리', '구리'),
  ('manganese', '망간', '망간'),
  ('iodine', '요오드', '요오드'),
  ('chromium', '크롬', '크롬'),
  ('molybdenum', '몰리브덴', '몰리브덴')
) as v(slug, alias, norm)
join ingredient i on i.slug = v.slug
on conflict (alias_normalized) do nothing;

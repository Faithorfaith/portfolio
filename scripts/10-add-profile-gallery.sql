alter table public.profiles
add column if not exists gallery_images jsonb not null default '[]'::jsonb;

update public.profiles
set gallery_images = to_jsonb(array_remove(array[
  hero_image_1,
  hero_image_2,
  hero_image_3
], null))
where gallery_images = '[]'::jsonb
  and (hero_image_1 is not null or hero_image_2 is not null or hero_image_3 is not null);

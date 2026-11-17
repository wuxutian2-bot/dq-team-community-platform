-- Performance helpers.

-- 1) Provision storage buckets once, instead of createBucket + updateBucket
--    on every single upload. Keep in sync with lib/storage.ts upload checks.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-covers', 'post-covers', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('achievement-images', 'achievement-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Aggregate like / comment counts in the database instead of pulling
--    every row to the app server. security invoker keeps RLS in effect:
--    visitors only count rows they are allowed to see.

create or replace function public.post_interaction_counts(post_ids bigint[])
returns table (post_id bigint, likes_count bigint, comments_count bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    ids.id,
    (select count(*) from public.likes as l where l.post_id = ids.id),
    (
      select count(*)
      from public.comments as c
      where c.post_id = ids.id
        and c.status = 'visible'
        and c.parent_id is null
    )
  from unnest(post_ids) as ids(id);
$$;

grant execute on function public.post_interaction_counts(bigint[]) to anon, authenticated, service_role;
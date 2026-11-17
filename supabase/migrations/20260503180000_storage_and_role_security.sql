set check_function_bodies = off;

create or replace function private.protect_profile_role_level()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role_level is distinct from old.role_level and not private.is_captain() then
    raise exception 'only captain can change role_level';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_role_level on public.profiles;
create trigger profiles_protect_role_level
  before update on public.profiles
  for each row
  execute function private.protect_profile_role_level();

alter table storage.objects enable row level security;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.profiles
      where profiles.avatar_path = name
        and profiles.status = 'active'
        and profiles.is_profile_public = true
    )
  );

drop policy if exists "avatars_authenticated_read" on storage.objects;
create policy "avatars_authenticated_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      private.can_manage_members()
      or exists (
        select 1
        from public.profiles
        where profiles.avatar_path = name
          and (
            profiles.id = (select auth.uid())
            or (profiles.status = 'active' and profiles.is_profile_public = true)
          )
      )
    )
  );

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and private.is_member()
    and coalesce((storage.foldername(name))[1], '') = 'profiles'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and private.is_member()
    and coalesce((storage.foldername(name))[1], '') = 'profiles'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and private.is_member()
    and coalesce((storage.foldername(name))[1], '') = 'profiles'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and private.is_member()
    and coalesce((storage.foldername(name))[1], '') = 'profiles'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

drop policy if exists "post_covers_public_read" on storage.objects;
create policy "post_covers_public_read"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'post-covers'
    and exists (
      select 1
      from public.posts
      where posts.cover_image_path = name
        and posts.status = 'published'
        and posts.visibility = 'public'
    )
  );

drop policy if exists "post_covers_authenticated_read" on storage.objects;
create policy "post_covers_authenticated_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'post-covers'
    and (
      private.can_manage_content()
      or exists (
        select 1
        from public.posts
        where posts.cover_image_path = name
          and (
            posts.author_id = (select auth.uid())
            or (
              posts.status = 'published'
              and (
                posts.visibility = 'public'
                or (posts.visibility = 'members' and private.is_member())
              )
            )
          )
      )
    )
  );

drop policy if exists "post_covers_member_insert" on storage.objects;
create policy "post_covers_member_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-covers'
    and private.is_member()
    and coalesce((storage.foldername(name))[1], '') = 'posts'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

drop policy if exists "post_covers_member_update" on storage.objects;
create policy "post_covers_member_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'post-covers'
    and private.is_member()
    and coalesce((storage.foldername(name))[1], '') = 'posts'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  )
  with check (
    bucket_id = 'post-covers'
    and private.is_member()
    and coalesce((storage.foldername(name))[1], '') = 'posts'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

drop policy if exists "post_covers_member_delete" on storage.objects;
create policy "post_covers_member_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-covers'
    and (
      private.can_manage_content()
      or (
        private.is_member()
        and coalesce((storage.foldername(name))[1], '') = 'posts'
        and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
      )
    )
  );

drop policy if exists "achievement_images_public_read" on storage.objects;
create policy "achievement_images_public_read"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'achievement-images'
    and exists (
      select 1
      from public.achievements
      where achievements.image_path = name
        and achievements.is_public = true
        and achievements.is_published = true
    )
  );

drop policy if exists "achievement_images_authenticated_read" on storage.objects;
create policy "achievement_images_authenticated_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'achievement-images'
    and (
      private.can_manage_content()
      or exists (
        select 1
        from public.achievements
        where achievements.image_path = name
          and achievements.is_public = true
          and achievements.is_published = true
      )
    )
  );

drop policy if exists "achievement_images_admin_insert" on storage.objects;
create policy "achievement_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'achievement-images'
    and private.can_manage_content()
    and coalesce((storage.foldername(name))[1], '') = 'achievements'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

drop policy if exists "achievement_images_admin_update" on storage.objects;
create policy "achievement_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'achievement-images'
    and private.can_manage_content()
    and coalesce((storage.foldername(name))[1], '') = 'achievements'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  )
  with check (
    bucket_id = 'achievement-images'
    and private.can_manage_content()
    and coalesce((storage.foldername(name))[1], '') = 'achievements'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

drop policy if exists "achievement_images_admin_delete" on storage.objects;
create policy "achievement_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'achievement-images'
    and private.can_manage_content()
    and coalesce((storage.foldername(name))[1], '') = 'achievements'
    and coalesce((storage.foldername(name))[2], '') = (select auth.uid())::text
  );

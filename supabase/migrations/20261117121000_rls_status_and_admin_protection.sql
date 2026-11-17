-- 1) Inactive accounts lose their privileges everywhere.
-- pending/disabled profiles now resolve to role level 4, which cascades to
-- is_member(), can_manage_content(), can_manage_members() and is_captain().
-- A disabled vice-captain can no longer post, comment, or manage anything
-- even though their JWT is still valid.

create or replace function private.current_role_level()
returns smallint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select case
        when p.status = 'active' then p.role_level
        else 4::smallint
      end
      from public.profiles as p
      where p.id = (select auth.uid())
    ),
    4::smallint
  );
$$;

-- 2) Vice-captains cannot touch captain / vice-captain accounts.
-- The captain and service_role keep full control; everyone may still edit
-- their own row (subject to the existing field restrictions below).

create or replace function private.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if private.is_captain() then
    return new;
  end if;

  if old.id <> (select auth.uid()) and old.role_level <= 2 then
    raise exception 'Only the captain can manage captain or vice-captain accounts.';
  end if;

  if new.role_level is distinct from old.role_level then
    raise exception 'Only the captain can change role_level.';
  end if;

  if not private.can_manage_members() then
    if new.status is distinct from old.status then
      raise exception 'Only vice-captain or captain can change member status.';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Members cannot change synced email from profiles.';
    end if;

    if new.joined_at is distinct from old.joined_at then
      raise exception 'Members cannot change joined_at.';
    end if;
  end if;

  return new;
end;
$$;
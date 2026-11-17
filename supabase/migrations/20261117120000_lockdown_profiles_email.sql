-- Lock down the email column for anonymous visitors.
-- Email doubles as the login identifier (qq-number@qq.com); exposing it to
-- anon turns the public member directory into a credential list.
-- Authenticated members keep table-level select (teammates already know each
-- other's QQ numbers); admins and service_role are unaffected.

revoke select on public.profiles from anon;

grant select (
  id,
  username,
  display_name,
  bio,
  avatar_path,
  banner_path,
  favorite_game,
  position_title,
  joined_at,
  role_level,
  status,
  is_profile_public,
  created_at,
  updated_at
) on public.profiles to anon;
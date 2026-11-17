# Supabase Database Notes

## Migration

Run the initial database migration:

- `supabase/migrations/20260503130000_init_schema_and_rls.sql`

This migration creates:

- `profiles`
- `posts`
- `comments`
- `likes`
- `team_events`
- `achievements`
- `site_announcements`

It also creates:

- helper functions in the `private` schema
- auth-to-profile bootstrap triggers
- `updated_at` triggers
- Row Level Security policies for public visitors, members, vice-captains, and the captain

## Bootstrap the first captain

1. Create the first auth user in Supabase Auth.
2. The trigger will automatically create a `public.profiles` row with:
   - `role_level = 4`
   - `status = 'pending'`
3. Promote that user manually:

```sql
update public.profiles
set role_level = 1,
    status = 'active'
where email = 'captain@example.com';
```

## Important operational rule

Disable public signup in Supabase Auth settings. This project assumes member accounts are created by admins only.

## Permission model enforced by RLS

- `Level 1`: captain, full control
- `Level 2`: vice-captain, can manage members and content, but cannot change `role_level`
- `Level 3`: formal member, can edit own profile and own community content
- `Level 4`: guest/pending member, read-only public access

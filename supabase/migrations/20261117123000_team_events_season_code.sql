-- Season codes become stored data instead of being derived from list index.
-- Adding or removing an event used to shift every displayed season number.

alter table public.team_events
  add column if not exists season_code text;

alter table public.team_events
  drop constraint if exists team_events_season_code_check;

alter table public.team_events
  add constraint team_events_season_code_check
  check (season_code is null or season_code ~ '^S[0-9]{1,3}$');

-- Backfill the default S19-S42 seed rows by their (event_date, title) pairs.
update public.team_events as e
set season_code = v.season_code
from (values
  ('2020-07-01'::date, '突围赛事战队', 'S19'),
  ('2020-09-01'::date, '区级赛事战队', 'S20'),
  ('2021-01-01'::date, '省级赛事战队', 'S21'),
  ('2021-04-01'::date, '省级百强战队', 'S22'),
  ('2021-06-01'::date, '省级百强战队', 'S23'),
  ('2021-09-01'::date, '省级百强战队', 'S24'),
  ('2022-01-01'::date, '市级十强战队', 'S25'),
  ('2022-04-01'::date, '省级百强战队', 'S26'),
  ('2022-06-01'::date, '市级赛事战队', 'S27'),
  ('2022-09-01'::date, '省级十强战队', 'S28'),
  ('2023-01-01'::date, '市级十强战队', 'S29'),
  ('2023-04-01'::date, '市级赛事战队', 'S30'),
  ('2023-06-01'::date, '区级赛事战队', 'S31'),
  ('2023-09-01'::date, '区级季军战队', 'S32'),
  ('2024-01-01'::date, '区级十强战队', 'S33'),
  ('2024-03-01'::date, '区级十强战队', 'S34'),
  ('2024-06-01'::date, '全国赛事战队', 'S35'),
  ('2024-09-01'::date, '省级百强战队', 'S36'),
  ('2024-12-01'::date, '区级亚军战队', 'S37'),
  ('2025-03-01'::date, '突围赛事战队', 'S38'),
  ('2025-07-01'::date, '突围赛事战队', 'S39'),
  ('2025-09-01'::date, '市级冠军战队', 'S40'),
  ('2026-01-01'::date, '区级冠军战队', 'S41'),
  ('2026-04-01'::date, '突围赛事战队', 'S42')
) as v(event_date, title, season_code)
where e.event_date = v.event_date
  and e.title = v.title
  and e.season_code is null;
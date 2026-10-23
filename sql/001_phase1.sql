-- Right to Walk · Phase 1 · evidence store
-- Run once in the Supabase SQL editor of the dedicated project (DeepanshuCFI's Org). Idempotent.
-- Design: anonymous visitors can only INSERT a check (status pending or test) and upload its photos to a private bucket.
-- Nothing is readable by the public until a moderator sets status = 'published'; the public reads a view and a stats
-- function that never expose names, client ids or user agents. Moderators are the emails in public.moderators,
-- signed in with Supabase Auth (email magic link).

create extension if not exists pgcrypto;

-- ---------- checks ----------
create table if not exists public.checks (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  mode          text not null check (mode in ('quick','full')),
  method        text not null default 'footpath-check-v1.2' check (char_length(method) <= 40),
  lat           double precision check (lat between 6 and 38),
  lon           double precision check (lon between 68 and 98),
  acc_m         integer check (acc_m between 0 and 5000),
  end_lat       double precision check (end_lat between 6 and 38),
  end_lon       double precision check (end_lon between 68 and 98),
  length_m      integer check (length_m between 0 and 5000),
  side          text check (side in ('left','right')),
  road          text check (char_length(road) <= 160),
  sector        text check (char_length(sector) <= 60),
  land          text check (land in ('homes','shops','city','sensitive')),
  road_class    text check (road_class in ('arterial','subarterial','collector','local')),
  owner         text check (owner in ('gmda','mcg','hsvp','dtcp','nhai','pwd','unknown')),
  gate          text check (gate in ('yes','no')),
  answers       jsonb not null default '{}'::jsonb check (pg_column_size(answers) < 4000),
  obs           jsonb not null default '{}'::jsonb check (pg_column_size(obs) < 2000),
  score         integer check (score between 0 and 100),
  band          text check (band in ('g','a','r')),
  anchor        smallint check (anchor between 0 and 4),
  ped_count     integer check (ped_count between 0 and 10000),
  lang          text check (lang in ('en','hi')),
  first_name    text check (char_length(first_name) <= 40),
  consent       boolean not null default false,
  client_id     text check (char_length(client_id) <= 64),
  photo_count   integer not null default 0 check (photo_count between 0 and 12),
  ua            text check (char_length(ua) <= 300),
  status        text not null default 'pending' check (status in ('pending','published','rejected','test')),
  verified      boolean not null default false,
  moderated_at  timestamptz,
  moderated_by  text check (char_length(moderated_by) <= 120),
  mod_note      text check (char_length(mod_note) <= 500),
  constraint checks_has_place check (lat is not null or road is not null),
  constraint checks_consent  check (consent = true)
);
create index if not exists checks_status_created_idx on public.checks (status, created_at desc);
create index if not exists checks_sector_idx on public.checks (sector) where status = 'published';

-- ---------- moderators ----------
create table if not exists public.moderators (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);
insert into public.moderators (email) values ('deepanshu@crashfreeindia.org') on conflict do nothing;

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.moderators m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated;

-- ---------- row level security ----------
alter table public.checks enable row level security;
alter table public.moderators enable row level security;

drop policy if exists "anon can submit a check" on public.checks;
create policy "anon can submit a check" on public.checks
  for insert to anon
  with check (status in ('pending','test') and consent = true and verified = false and moderated_at is null);

drop policy if exists "moderators read every check" on public.checks;
create policy "moderators read every check" on public.checks
  for select to authenticated using (public.is_moderator());

drop policy if exists "moderators update status" on public.checks;
create policy "moderators update status" on public.checks
  for update to authenticated using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists "moderators delete test and rejected rows" on public.checks;
create policy "moderators delete test and rejected rows" on public.checks
  for delete to authenticated using (public.is_moderator() and status in ('test','rejected'));

drop policy if exists "moderators see the list" on public.moderators;
create policy "moderators see the list" on public.moderators
  for select to authenticated using (public.is_moderator());

-- explicit grants (new tables are not exposed to the Data API by default from 30 Oct 2026)
grant usage on schema public to anon, authenticated;
grant insert on public.checks to anon;
grant select on public.checks to authenticated;
grant update (status, verified, moderated_at, moderated_by, mod_note) on public.checks to authenticated;
grant delete on public.checks to authenticated;
grant select on public.moderators to authenticated;

-- ---------- public surface: published rows only, no personal columns ----------
create or replace view public.public_checks
with (security_invoker = false) as
  select id, created_at, mode, method,
         round(lat::numeric, 4)::double precision  as lat,
         round(lon::numeric, 4)::double precision  as lon,
         length_m, side, road, sector, land, road_class, owner, gate,
         answers, obs, score, band, anchor, photo_count, verified
  from public.checks
  where status = 'published';
grant select on public.public_checks to anon, authenticated;

create or replace view public.public_sector_stats
with (security_invoker = false) as
  select coalesce(nullif(sector,''), 'Unspecified') as sector,
         count(*)::int as checks,
         count(*) filter (where gate is not null)::int as gate_tested,
         count(*) filter (where gate = 'yes')::int as gate_pass,
         count(*) filter (where (answers ->> 'i1') = 'yes')::int as with_footpath,
         count(*) filter (where mode = 'full')::int as full_checks,
         count(*) filter (where verified)::int as verified
  from public.checks where status = 'published'
  group by 1;
grant select on public.public_sector_stats to anon, authenticated;

create or replace view public.public_owner_stats
with (security_invoker = false) as
  select coalesce(owner, 'unknown') as owner,
         count(*)::int as checks,
         count(*) filter (where gate is not null)::int as gate_tested,
         count(*) filter (where gate = 'yes')::int as gate_pass
  from public.checks where status = 'published'
  group by 1;
grant select on public.public_owner_stats to anon, authenticated;

create or replace function public.public_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'submitted',   (select count(*) from public.checks where status in ('pending','published')),
    'published',   (select count(*) from public.checks where status = 'published'),
    'pending',     (select count(*) from public.checks where status = 'pending'),
    'people',      (select count(distinct client_id) from public.checks where status in ('pending','published') and client_id is not null),
    'gate_tested', (select count(*) from public.checks where status = 'published' and gate is not null),
    'gate_pass',   (select count(*) from public.checks where status = 'published' and gate = 'yes'),
    'with_footpath', (select count(*) from public.checks where status = 'published' and (answers ->> 'i1') = 'yes'),
    'full',        (select count(*) from public.checks where status = 'published' and mode = 'full'),
    'verified',    (select count(*) from public.checks where status = 'published' and verified),
    'first',       (select min(created_at) from public.checks where status = 'published'),
    'last',        (select max(created_at) from public.checks where status = 'published')
  );
$$;
revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;

-- ---------- photos: private bucket. anon uploads into pending/<check id>/; anyone may read published/<check id>/;
-- moderators read, move (pending -> published on publish) and delete ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 3145728, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anon uploads pending photos" on storage.objects;
create policy "anon uploads pending photos" on storage.objects
  for insert to anon
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = 'pending');

drop policy if exists "public reads published photos" on storage.objects;
create policy "public reads published photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'photos' and (storage.foldername(name))[1] = 'published');

drop policy if exists "moderators read photos" on storage.objects;
create policy "moderators read photos" on storage.objects
  for select to authenticated using (bucket_id = 'photos' and public.is_moderator());

drop policy if exists "moderators move photos" on storage.objects;
create policy "moderators move photos" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and public.is_moderator()) with check (bucket_id = 'photos' and public.is_moderator());

drop policy if exists "moderators delete photos" on storage.objects;
create policy "moderators delete photos" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and public.is_moderator());

-- ---------- done ----------
-- Afterwards, in Authentication → URL configuration: Site URL https://righttowalk.life and
-- redirect URLs https://righttowalk.life/moderate.html and http://localhost:8815/moderate.html.
-- Keep "Allow new users to sign up" ON for the email provider: a moderator's first magic link creates their auth user,
-- and row access is decided by public.moderators, not by having an account. Everyone else who signs in sees nothing.

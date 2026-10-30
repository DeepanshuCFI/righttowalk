-- Right to Walk · evidence definitions and upload controls (apply after 001 and 002).
-- Apply in the Supabase SQL editor as one reviewed change before deploying the v1.3 site.
-- The trigger accepts the old quick-check payload during a staggered deployment.

alter table public.checks
  add column if not exists spot_passable text check (spot_passable in ('yes','no')),
  add column if not exists verified_at timestamptz,
  add column if not exists verification_check_id uuid references public.checks(id),
  add column if not exists legacy_verified boolean not null default false;
alter table public.checks alter column method set default 'footpath-check-v1.3';

-- A quick check always answered a question about one spot, never 100 m continuity.
update public.checks
set spot_passable = coalesce(spot_passable, gate), gate = null
where mode = 'quick' and gate is not null;

-- Preserve the historical moderator mark without presenting it as a documented re-walk.
update public.checks
set legacy_verified = true, verified = false
where verified = true and verification_check_id is null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'checks_evidence_mode') then
    alter table public.checks add constraint checks_evidence_mode
      check ((mode = 'quick' and gate is null) or (mode = 'full' and spot_passable is null));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'checks_verified_link') then
    alter table public.checks add constraint checks_verified_link
      check ((not verified and verified_at is null and verification_check_id is null)
          or (verified and status = 'published' and verified_at is not null
              and verification_check_id is not null and verification_check_id <> id));
  end if;
end $$;

-- Re-derive derived fields at the database boundary; the browser is not trusted.
create or replace function public.enforce_check_evidence()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  item_id text;
  answer text;
  weight numeric;
  earned numeric := 0;
  possible numeric := 0;
  item_no integer;
begin
  new.ua := null;
  new.photo_count := 0; -- actual number is set by the moderator after Storage has been checked
  new.moderated_at := null;
  new.moderated_by := null;
  new.mod_note := null;
  new.verified := false;
  new.verified_at := null;
  new.verification_check_id := null;
  new.legacy_verified := false;
  if new.mode = 'quick' then
    -- Old deployed clients send the spot answer in gate. Keep them valid during rollout.
    new.spot_passable := coalesce(new.spot_passable, new.gate);
    new.gate := null;
    new.answers := '{}'::jsonb;
    new.score := null;
    new.band := null;
    new.end_lat := null;
    new.end_lon := null;
    new.length_m := null;
    new.land := null;
    new.road_class := null;
    new.anchor := null;
    new.ped_count := null;
    return new;
  end if;
  new.spot_passable := null;
  if new.lat is null or new.lon is null or new.end_lat is null or new.end_lon is null then
    new.end_lat := null;
    new.end_lon := null;
    new.length_m := null;
  else
    new.length_m := round(2 * 6371000 * asin(least(1, sqrt(
      power(sin(radians(new.end_lat - new.lat) / 2), 2)
      + cos(radians(new.lat)) * cos(radians(new.end_lat))
        * power(sin(radians(new.end_lon - new.lon) / 2), 2)
    ))));
    if new.length_m <= 20 then new.length_m := null; end if;
  end if;
  if new.gate not in ('yes','no') or new.answers ->> 'gate' is distinct from new.gate then
    raise exception 'Full check requires a matching 100 m answer' using errcode = '23514';
  end if;
  for item_no in 1..10 loop
    item_id := 'i' || item_no;
    weight := (array[20,15,15,12,8,8,7,7,4,4])[item_no];
    answer := new.answers ->> item_id;
    if new.answers ->> 'i1' = 'no' and item_no in (2,5,6,7,9,10) then answer := 'no'; end if;
    if answer is null then
      raise exception 'Missing answer for %', item_id using errcode = '23514';
    end if;
    if answer = 'cant' and item_no = 8 then continue; end if;
    if answer not in ('yes','no') and not (answer = 'partly' and item_no in (2,3,7)) then
      raise exception 'Invalid answer for %', item_id using errcode = '23514';
    end if;
    possible := possible + weight;
    if answer = 'yes' then earned := earned + weight;
    elsif answer = 'partly' then earned := earned + weight / 2; end if;
  end loop;
  new.score := round(earned / possible * 100);
  new.band := case when new.gate = 'no' or new.score < 40 then 'r'
                   when new.score < 70 then 'a' else 'g' end;
  return new;
end;
$$;
revoke all on function public.enforce_check_evidence() from public;
drop trigger if exists checks_evidence_on_insert on public.checks;
create trigger checks_evidence_on_insert before insert on public.checks
for each row execute function public.enforce_check_evidence();

-- Verification now requires a separate, later, published check of the same side and place.
create or replace function public.enforce_verification_link()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  other_check public.checks%rowtype;
  gap_m double precision;
begin
  if old.status = 'published' and new.status <> 'published'
     and exists (select 1 from public.checks c where c.verification_check_id = old.id and c.verified) then
    raise exception 'Unlink this re-walk from verified records before unpublishing it' using errcode = '23514';
  end if;
  if not new.verified then
    new.verified_at := null;
    new.verification_check_id := null;
    return new;
  end if;
  if new.status <> 'published' or new.verification_check_id is null or new.verification_check_id = new.id then
    raise exception 'Verification requires a distinct linked check' using errcode = '23514';
  end if;
  select * into other_check from public.checks where id = new.verification_check_id;
  if not found or other_check.status <> 'published' or other_check.created_at <= new.created_at then
    raise exception 'Verification check must be a later published check' using errcode = '23514';
  end if;
  if new.lat is null or new.lon is null or other_check.lat is null or other_check.lon is null
     or new.side is null or other_check.side is distinct from new.side then
    raise exception 'Verification checks need coordinates and the same side' using errcode = '23514';
  end if;
  gap_m := sqrt(power((new.lat-other_check.lat)*111000,2)
              + power((new.lon-other_check.lon)*111000*cos(radians(new.lat)),2));
  if gap_m > 150 then
    raise exception 'Verification check starts more than 150 m away' using errcode = '23514';
  end if;
  if not old.verified or old.verification_check_id is distinct from new.verification_check_id then
    new.verified_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_verification_link() from public;
drop trigger if exists checks_verification_on_update on public.checks;
create trigger checks_verification_on_update before update of verified, verification_check_id, status on public.checks
for each row execute function public.enforce_verification_link();

grant update (photo_count, verified_at, verification_check_id) on public.checks to authenticated;

-- PostgreSQL only permits appending columns when replacing a view. Keep the old order.
create or replace view public.public_checks with (security_invoker = false) as
  select id, created_at, mode, method,
         round(lat::numeric, 4)::double precision as lat,
         round(lon::numeric, 4)::double precision as lon,
         length_m, side, road, sector, land, road_class, owner, gate,
         answers, obs, score, band, anchor, photo_count, verified,
         spot_passable, verified_at, verification_check_id, legacy_verified
  from public.checks where status = 'published';
grant select on public.public_checks to anon, authenticated;

create or replace view public.public_sector_stats with (security_invoker = false) as
  select coalesce(nullif(sector,''), 'Unspecified') as sector,
         count(*)::int as checks,
         count(*) filter (where mode = 'full' and gate is not null)::int as gate_tested,
         count(*) filter (where mode = 'full' and gate = 'yes')::int as gate_pass,
         count(*) filter (where (answers ->> 'i1') = 'yes')::int as with_footpath,
         count(*) filter (where mode = 'full')::int as full_checks,
         count(*) filter (where verified)::int as verified,
         count(*) filter (where mode = 'quick' and spot_passable is not null)::int as spot_tested
  from public.checks where status = 'published' group by 1;
grant select on public.public_sector_stats to anon, authenticated;

create or replace view public.public_owner_stats with (security_invoker = false) as
  select coalesce(owner, 'unknown') as owner,
         count(*)::int as checks,
         count(*) filter (where mode = 'full' and gate is not null)::int as gate_tested,
         count(*) filter (where mode = 'full' and gate = 'yes')::int as gate_pass,
         count(*) filter (where mode = 'quick' and spot_passable is not null)::int as spot_tested
  from public.checks where status = 'published' group by 1;
grant select on public.public_owner_stats to anon, authenticated;

create or replace function public.public_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'submitted', (select count(*) from public.checks where status in ('pending','published')),
    'published', (select count(*) from public.checks where status = 'published'),
    'pending', (select count(*) from public.checks where status = 'pending'),
    'people', (select count(distinct client_id) from public.checks where status = 'published' and client_id is not null),
    'gate_tested', (select count(*) from public.checks where status = 'published' and mode = 'full' and gate is not null),
    'gate_pass', (select count(*) from public.checks where status = 'published' and mode = 'full' and gate = 'yes'),
    'spot_tested', (select count(*) from public.checks where status = 'published' and mode = 'quick' and spot_passable is not null),
    'spot_blocked', (select count(*) from public.checks where status = 'published' and mode = 'quick' and spot_passable = 'no'),
    'with_footpath', (select count(*) from public.checks where status = 'published' and mode = 'full' and (answers ->> 'i1') = 'yes'),
    'full', (select count(*) from public.checks where status = 'published' and mode = 'full'),
    'verified', (select count(*) from public.checks where status = 'published' and verified),
    'first', (select min(created_at) from public.checks where status = 'published'),
    'last', (select max(created_at) from public.checks where status = 'published')
  );
$$;
revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;

-- Allow only recent checks' JPEG uploads, at most 12 files per check. The check ID is
-- unguessable but anonymous visitors are not authenticated owners. Concurrent requests
-- can race the count; move uploads behind a signed server endpoint if abuse appears.
create or replace function public.can_upload_check_photo(p_bucket text, p_name text)
returns boolean language plpgsql stable security definer set search_path = public, storage as $$
declare check_id uuid;
begin
  if p_bucket <> 'photos' or p_name !~ '^pending/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[a-zA-Z0-9_-]{1,64}\.jpg$' then
    return false;
  end if;
  check_id := split_part(p_name, '/', 2)::uuid;
  return exists (select 1 from public.checks c where c.id = check_id and c.status = 'pending'
                 and c.created_at > now() - interval '24 hours')
     and (select count(*) from storage.objects o where o.bucket_id = 'photos'
          and o.name like 'pending/' || check_id::text || '/%') < 12;
end;
$$;
revoke all on function public.can_upload_check_photo(text,text) from public;
grant execute on function public.can_upload_check_photo(text,text) to anon;
update storage.buckets set allowed_mime_types = array['image/jpeg'] where id = 'photos';
drop policy if exists "anon uploads pending photos" on storage.objects;
create policy "anon uploads pending photos" on storage.objects for insert to anon
with check (public.can_upload_check_photo(bucket_id, name));

-- Moving photos before publishing the row is recoverable, but must not expose them
-- while the row is still pending if the later row update fails.
create or replace function public.can_read_published_check_photo(p_bucket text, p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if p_bucket <> 'photos' or p_name !~ '^published/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[a-zA-Z0-9_-]{1,64}\.jpg$' then
    return false;
  end if;
  return exists (select 1 from public.checks c
                 where c.id = split_part(p_name, '/', 2)::uuid and c.status = 'published');
end;
$$;
revoke all on function public.can_read_published_check_photo(text,text) from public;
grant execute on function public.can_read_published_check_photo(text,text) to anon, authenticated;
drop policy if exists "public reads published photos" on storage.objects;
create policy "public reads published photos" on storage.objects for select to anon, authenticated
using (public.can_read_published_check_photo(bucket_id, name));

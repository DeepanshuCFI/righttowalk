-- Right to Walk · Phase 1 · tighten grants (run once after 001, in the SQL editor)
-- Supabase's default privileges hand anon select/update/delete on every new table and execute on every function.
-- RLS already returns nothing for those (probe showed empty results, no leak), but "permission denied" is the right answer.
revoke select, update, delete, truncate, references, trigger on public.checks from anon;
revoke all on public.moderators from anon;
revoke execute on function public.is_moderator() from anon;
-- keep: anon insert on checks; authenticated select/update(5 cols)/delete on checks; moderators select for authenticated
-- stop the same thing happening to any table created later in this project
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;

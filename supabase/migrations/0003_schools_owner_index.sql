-- 0003: make schools.owner_id a plain unique index so the app can upsert with
-- onConflict: "owner_id" (partial indexes can't arbitrate ON CONFLICT).

drop index if exists public.schools_owner_unique;
create unique index if not exists schools_owner_plain
  on public.schools (owner_id);

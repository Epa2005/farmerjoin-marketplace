-- =====================================================================
-- FarmerJoin Marketplace - Supabase Storage setup
-- Run this in the Supabase Dashboard -> SQL Editor (once).
-- It is idempotent: safe to run multiple times.
--
-- This creates the public "uploads" bucket used by the backend for
-- profile photos ("profiles/" folder) and product images.
-- =====================================================================

-- 1) Create the 'uploads' bucket if it does not exist (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
    'uploads', 'uploads', true, 5242880, null
where not exists (select 1 from storage.buckets where id = 'uploads');

-- 2) Make sure the bucket is public (re-run to be safe)
update storage.buckets set public = true where id = 'uploads';

-- 3) Public read access (so <img src=".../uploads/..."> works for anyone)
drop policy if exists "public_read_uploads" on storage.objects;
create policy "public_read_uploads"
on storage.objects for select
using ( bucket_id = 'uploads' );

-- 4) Allow uploads (service role bypasses these, but keep them so the
--    anon/authenticated keys also work if configured)
drop policy if exists "authenticated_insert_uploads" on storage.objects;
create policy "authenticated_insert_uploads"
on storage.objects for insert
with check ( bucket_id = 'uploads' );

drop policy if exists "authenticated_update_uploads" on storage.objects;
create policy "authenticated_update_uploads"
on storage.objects for update
using ( bucket_id = 'uploads' )
with check ( bucket_id = 'uploads' );

drop policy if exists "authenticated_delete_uploads" on storage.objects;
create policy "authenticated_delete_uploads"
on storage.objects for delete
using ( bucket_id = 'uploads' );

-- 5) Verify the result
select id, name, public
from storage.buckets
where id = 'uploads';
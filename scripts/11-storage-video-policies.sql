-- Allow signed-in portfolio admins to upload media directly to the public bucket.
-- Required for video uploads, which intentionally bypass the Vercel request-size limit.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-uploads',
  'portfolio-uploads',
  true,
  104857600,
  array['image/*', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated_media_insert" on storage.objects;
drop policy if exists "authenticated_media_update" on storage.objects;
drop policy if exists "authenticated_media_delete" on storage.objects;

create policy "authenticated_media_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-uploads');

create policy "authenticated_media_update"
on storage.objects for update to authenticated
using (bucket_id = 'portfolio-uploads')
with check (bucket_id = 'portfolio-uploads');

create policy "authenticated_media_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-uploads');

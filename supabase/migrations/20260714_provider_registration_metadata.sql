begin;

alter table public.provider_admin_metadata
  add column if not exists emergency_contact text,
  add column if not exists profile_image_name text;

commit;

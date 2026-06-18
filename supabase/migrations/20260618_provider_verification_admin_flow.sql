begin;

alter table public.provider_profiles
  add column if not exists date_of_birth date,
  add column if not exists sex text,
  add column if not exists residential_address text;

alter table public.provider_verifications
  add column if not exists document_type text,
  add column if not exists front_image_name text,
  add column if not exists back_image_name text,
  add column if not exists requested_documents text[] not null default '{}',
  add column if not exists admin_note text not null default '',
  add column if not exists last_reviewed_at timestamptz null;

commit;

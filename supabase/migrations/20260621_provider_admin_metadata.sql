begin;

create table if not exists public.provider_admin_metadata (
  provider_id uuid primary key references auth.users(id) on delete cascade,
  availability_days text[] not null default '{}',
  availability_time_preset text not null default '',
  availability_start_time text not null default '',
  availability_end_time text not null default '',
  service_image_captions jsonb not null default '{}'::jsonb,
  certificate_image_captions jsonb not null default '{}'::jsonb,
  current_latitude numeric(10,6) null,
  current_longitude numeric(10,6) null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists provider_admin_metadata_created_at_idx
  on public.provider_admin_metadata (created_at desc);

drop trigger if exists provider_admin_metadata_set_updated_at on public.provider_admin_metadata;
create trigger provider_admin_metadata_set_updated_at
before update on public.provider_admin_metadata
for each row
execute function public.set_updated_at();

commit;

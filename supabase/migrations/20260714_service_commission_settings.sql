begin;

create table if not exists public.service_commission_settings (
  service_key text primary key,
  service_label text not null,
  commission_percent numeric(5,2) not null default 5 check (commission_percent >= 0 and commission_percent <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists service_commission_settings_set_updated_at on public.service_commission_settings;
create trigger service_commission_settings_set_updated_at
before update on public.service_commission_settings
for each row
execute function public.set_updated_at();

alter table public.service_commission_settings enable row level security;

commit;

begin;

alter table public.provider_admin_metadata
  add column if not exists service_image_files jsonb not null default '{}'::jsonb,
  add column if not exists certificate_image_files jsonb not null default '{}'::jsonb;

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid null references auth.users(id) on delete set null,
  booking_id uuid null references public.bookings(id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'general',
  priority text not null default 'medium',
  status text not null default 'submitted',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_reports_reporter_id_idx
  on public.user_reports (reporter_id, created_at desc);

create index if not exists user_reports_reported_user_id_idx
  on public.user_reports (reported_user_id, created_at desc);

create index if not exists user_reports_status_idx
  on public.user_reports (status, created_at desc);

drop trigger if exists user_reports_set_updated_at on public.user_reports;
create trigger user_reports_set_updated_at
before update on public.user_reports
for each row
execute function public.set_updated_at();

alter table public.user_reports enable row level security;

drop policy if exists "user_reports_select_participants" on public.user_reports;
create policy "user_reports_select_participants"
on public.user_reports
for select
to authenticated
using (
  auth.uid() = reporter_id
  or auth.uid() = reported_user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'admin', 'manager', 'customer_care', 'customer_service')
  )
);

drop policy if exists "user_reports_insert_reporter" on public.user_reports;
create policy "user_reports_insert_reporter"
on public.user_reports
for insert
to authenticated
with check (
  auth.uid() = reporter_id
);

create table if not exists public.login_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text null,
  role_snapshot text null,
  app_surface text not null default 'unknown',
  user_agent text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists login_audit_events_user_id_idx
  on public.login_audit_events (user_id, created_at desc);

alter table public.login_audit_events enable row level security;

drop policy if exists "login_audit_events_insert_self" on public.login_audit_events;
create policy "login_audit_events_insert_self"
on public.login_audit_events
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists "login_audit_events_select_self" on public.login_audit_events;
create policy "login_audit_events_select_self"
on public.login_audit_events
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'admin', 'manager', 'customer_care', 'customer_service')
  )
);

commit;

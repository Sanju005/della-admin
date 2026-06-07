-- Live booking workflow for DELLA
-- Covers:
-- - customer request
-- - provider accept / decline
-- - on the way / arrived / completed / paid
-- - review request
-- - notifications
-- - status history

begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'booking_status'
  ) then
    create type public.booking_status as enum (
      'pending',
      'accepted',
      'on_the_way',
      'arrived',
      'completed',
      'paid',
      'review_requested',
      'reviewed',
      'declined',
      'cancelled'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'booking_mode'
  ) then
    create type public.booking_mode as enum (
      'hourly',
      'daily'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'booking_actor_role'
  ) then
    create type public.booking_actor_role as enum (
      'customer',
      'provider',
      'admin',
      'system'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'notification_type'
  ) then
    create type public.notification_type as enum (
      'booking_created',
      'booking_accepted',
      'booking_declined',
      'provider_on_the_way',
      'provider_arrived',
      'task_completed',
      'payment_done',
      'review_requested',
      'review_submitted',
      'booking_cancelled'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references auth.users(id) on delete cascade,
  provider_service_id uuid null references public.provider_services(id) on delete set null,
  booking_status public.booking_status not null default 'pending',
  booking_mode public.booking_mode not null,
  service_key text not null,
  service_label text not null,
  location_text text not null,
  scheduled_date date not null,
  scheduled_start_time time not null,
  scheduled_end_time time not null,
  duration_hours numeric(6,2) not null default 1,
  customer_note text not null default '',
  provider_response_note text not null default '',
  decline_reason text not null default '',
  hourly_rate numeric(10,2) not null default 0,
  daily_rate numeric(10,2) not null default 0,
  quoted_amount numeric(10,2) not null default 0,
  accepted_at timestamptz null,
  on_the_way_at timestamptz null,
  arrived_at timestamptz null,
  completed_at timestamptz null,
  paid_at timestamptz null,
  review_requested_at timestamptz null,
  reviewed_at timestamptz null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_duration_hours_positive check (duration_hours > 0),
  constraint bookings_amount_non_negative check (quoted_amount >= 0),
  constraint bookings_schedule_order check (scheduled_end_time > scheduled_start_time)
);

alter table public.bookings
  add column if not exists provider_service_id uuid null references public.provider_services(id) on delete set null;
alter table public.bookings
  add column if not exists booking_status public.booking_status not null default 'pending';
alter table public.bookings
  add column if not exists booking_mode public.booking_mode;
alter table public.bookings
  add column if not exists service_key text;
alter table public.bookings
  add column if not exists service_label text;
alter table public.bookings
  add column if not exists location_text text;
alter table public.bookings
  add column if not exists scheduled_date date;
alter table public.bookings
  add column if not exists scheduled_start_time time;
alter table public.bookings
  add column if not exists scheduled_end_time time;
alter table public.bookings
  add column if not exists duration_hours numeric(6,2) not null default 1;
alter table public.bookings
  add column if not exists customer_note text not null default '';
alter table public.bookings
  add column if not exists provider_response_note text not null default '';
alter table public.bookings
  add column if not exists decline_reason text not null default '';
alter table public.bookings
  add column if not exists hourly_rate numeric(10,2) not null default 0;
alter table public.bookings
  add column if not exists daily_rate numeric(10,2) not null default 0;
alter table public.bookings
  add column if not exists quoted_amount numeric(10,2) not null default 0;
alter table public.bookings
  add column if not exists accepted_at timestamptz null;
alter table public.bookings
  add column if not exists on_the_way_at timestamptz null;
alter table public.bookings
  add column if not exists arrived_at timestamptz null;
alter table public.bookings
  add column if not exists completed_at timestamptz null;
alter table public.bookings
  add column if not exists paid_at timestamptz null;
alter table public.bookings
  add column if not exists review_requested_at timestamptz null;
alter table public.bookings
  add column if not exists reviewed_at timestamptz null;
alter table public.bookings
  add column if not exists cancelled_at timestamptz null;
alter table public.bookings
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.bookings
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists bookings_customer_id_idx
  on public.bookings (customer_id, created_at desc);

create index if not exists bookings_provider_id_idx
  on public.bookings (provider_id, created_at desc);

create index if not exists bookings_status_idx
  on public.bookings (booking_status, created_at desc);

create index if not exists bookings_provider_status_idx
  on public.bookings (provider_id, booking_status, scheduled_date desc);

create index if not exists bookings_customer_status_idx
  on public.bookings (customer_id, booking_status, scheduled_date desc);

create table if not exists public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role public.booking_actor_role not null,
  message_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists booking_messages_booking_id_idx
  on public.booking_messages (booking_id, created_at asc);

create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  old_status public.booking_status null,
  new_status public.booking_status not null,
  changed_by uuid null references auth.users(id) on delete set null,
  changed_by_role public.booking_actor_role not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists booking_status_history_booking_id_idx
  on public.booking_status_history (booking_id, created_at asc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid null references public.bookings(id) on delete cascade,
  notification_type public.notification_type not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz null
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, is_read, created_at desc);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

create or replace function public.log_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by,
      changed_by_role,
      note
    ) values (
      new.id,
      null,
      new.booking_status,
      new.customer_id,
      'customer',
      'Booking request created'
    );

    return new;
  end if;

  if new.booking_status is distinct from old.booking_status then
    insert into public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by,
      changed_by_role,
      note
    ) values (
      new.id,
      old.booking_status,
      new.booking_status,
      auth.uid(),
      case
        when auth.uid() = new.customer_id then 'customer'
        when auth.uid() = new.provider_id then 'provider'
        else 'admin'
      end,
      case
        when new.booking_status = 'accepted' then coalesce(nullif(new.provider_response_note, ''), 'Provider accepted booking')
        when new.booking_status = 'declined' then coalesce(nullif(new.decline_reason, ''), 'Provider declined booking')
        else ''
      end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_log_status_change on public.bookings;
create trigger bookings_log_status_change
after insert or update on public.bookings
for each row
execute function public.log_booking_status_change();

create or replace function public.create_booking_notification(
  p_user_id uuid,
  p_booking_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id,
    booking_id,
    notification_type,
    title,
    body
  ) values (
    p_user_id,
    p_booking_id,
    p_type,
    p_title,
    p_body
  );
end;
$$;

alter table public.bookings enable row level security;
alter table public.booking_messages enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
on public.bookings
for select
to authenticated
using (
  auth.uid() = customer_id
  or auth.uid() = provider_id
);

drop policy if exists "bookings_insert_customer" on public.bookings;
create policy "bookings_insert_customer"
on public.bookings
for insert
to authenticated
with check (
  auth.uid() = customer_id
);

drop policy if exists "bookings_update_customer_or_provider" on public.bookings;
create policy "bookings_update_customer_or_provider"
on public.bookings
for update
to authenticated
using (
  auth.uid() = customer_id
  or auth.uid() = provider_id
)
with check (
  auth.uid() = customer_id
  or auth.uid() = provider_id
);

drop policy if exists "booking_messages_select_participants" on public.booking_messages;
create policy "booking_messages_select_participants"
on public.booking_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (b.customer_id = auth.uid() or b.provider_id = auth.uid())
  )
);

drop policy if exists "booking_messages_insert_participants" on public.booking_messages;
create policy "booking_messages_insert_participants"
on public.booking_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (b.customer_id = auth.uid() or b.provider_id = auth.uid())
  )
);

drop policy if exists "booking_status_history_select_participants" on public.booking_status_history;
create policy "booking_status_history_select_participants"
on public.booking_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (b.customer_id = auth.uid() or b.provider_id = auth.uid())
  )
);

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

commit;

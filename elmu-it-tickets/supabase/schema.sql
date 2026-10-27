-- ELMU IT Ticketing: run this whole file once in Supabase > SQL Editor.
-- Safe to read top to bottom; it creates tables, security rules and a signup trigger.

-- 1. TABLES ------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  created_at timestamptz not null default now()
);

-- Roles live in their own table. Users can READ their own role but have no
-- INSERT/UPDATE/DELETE access, so nobody can promote themselves.
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role    text not null default 'requester' check (role in ('requester', 'it_admin'))
);

create sequence public.ticket_number_seq start 1;

create table public.tickets (
  id              uuid primary key default gen_random_uuid(),
  ticket_number   text not null unique
                  default ('ELMU-' || lpad(nextval('public.ticket_number_seq')::text, 5, '0')),
  requester_id    uuid not null default auth.uid() references auth.users (id),
  requester_name  text not null check (char_length(requester_name) between 2 and 100),
  requester_email text not null,
  department      text not null check (char_length(department) between 2 and 100),
  category        text not null check (category in
    ('Hardware','Software','Network','Microsoft 365','Vialing/SKY CMS','OpenLearning','Account Access','Other')),
  subject         text not null check (char_length(subject) between 5 and 120),
  description     text not null check (char_length(description) between 10 and 5000),
  priority        text not null default 'Normal' check (priority in ('Low','Normal','High','Critical')),
  status          text not null default 'Open' check (status in ('Open','In Progress','Pending','Resolved','Closed')),
  assigned_to     uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tickets_requester_idx on public.tickets (requester_id);
create index tickets_status_idx    on public.tickets (status);
create index tickets_created_idx   on public.tickets (created_at desc);

-- Internal notes are a separate table so requesters can never read them.
create table public.ticket_notes (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets (id) on delete cascade,
  author_id  uuid not null references public.profiles (id),
  body       text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index ticket_notes_ticket_idx on public.ticket_notes (ticket_id);

-- 2. HELPER FUNCTIONS ----------------------------------------------------------

create function public.is_it_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'it_admin'
  );
$$;

-- Technician dropdown. Returns nothing unless the caller is an IT admin.
create function public.list_technicians()
returns table (id uuid, full_name text, email text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.full_name, p.email
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where r.role = 'it_admin' and public.is_it_admin()
  order by coalesce(p.full_name, p.email);
$$;

-- 3. TRIGGERS ------------------------------------------------------------------

-- New signup -> profile + 'requester' role. Admins are promoted manually (see README).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  insert into public.user_roles (user_id, role) values (new.id, 'requester');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh, lock fields that must never change, and only allow
-- assigning a ticket to an IT admin.
create function public.guard_ticket_update() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.id            := old.id;
  new.ticket_number := old.ticket_number;
  new.requester_id  := old.requester_id;
  new.created_at    := old.created_at;
  new.updated_at    := now();
  if new.assigned_to is not null and not exists (
    select 1 from public.user_roles where user_id = new.assigned_to and role = 'it_admin'
  ) then
    raise exception 'Tickets can only be assigned to IT admins';
  end if;
  return new;
end;
$$;

create trigger tickets_guard_update
  before update on public.tickets
  for each row execute function public.guard_ticket_update();

-- 4. PERMISSIONS + ROW LEVEL SECURITY ------------------------------------------

alter table public.profiles     enable row level security;
alter table public.user_roles   enable row level security;
alter table public.tickets      enable row level security;
alter table public.ticket_notes enable row level security;

-- Start from nothing, then grant only what the app needs.
revoke all on public.profiles, public.user_roles, public.tickets, public.ticket_notes from anon, authenticated;
grant select on public.profiles, public.user_roles, public.tickets, public.ticket_notes to authenticated;
grant update (full_name) on public.profiles to authenticated;   -- not email, not id
grant insert, update     on public.tickets to authenticated;     -- no delete
grant insert             on public.ticket_notes to authenticated;
grant usage on sequence public.ticket_number_seq to authenticated;

revoke all on function public.is_it_admin(), public.list_technicians() from public, anon;
grant execute on function public.is_it_admin(), public.list_technicians() to authenticated;

-- profiles
create policy "read own profile or admin reads all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_it_admin());
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_roles: read-only for users, and only their own row. No write policies at all.
create policy "read own role" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()));

-- tickets
create policy "read own tickets or admin reads all" on public.tickets
  for select to authenticated
  using (requester_id = (select auth.uid()) or public.is_it_admin());

create policy "create own ticket as Open and unassigned" on public.tickets
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and lower(requester_email) = lower((select auth.jwt() ->> 'email'))
    and status = 'Open'
    and assigned_to is null
  );

create policy "only admins update tickets" on public.tickets
  for update to authenticated
  using (public.is_it_admin()) with check (public.is_it_admin());

-- ticket_notes: admins only
create policy "admins read notes" on public.ticket_notes
  for select to authenticated using (public.is_it_admin());
create policy "admins add notes as themselves" on public.ticket_notes
  for insert to authenticated
  with check (public.is_it_admin() and author_id = (select auth.uid()));

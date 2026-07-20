-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  member_id text unique not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  pending boolean not null default true,
  avatar_url text,
  qr_token_hash text unique not null,
  created_at timestamptz default now(),
  last_login timestamptz,
  failed_login_attempts integer default 0,
  locked_until timestamptz
);

-- Create attendance table
create table attendance (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  attended_on date not null default current_date,
  scanned_by uuid references profiles(id),
  scanned_at timestamptz default now(),
  unique (user_id, attended_on)
);

-- Create audit_log table
create table audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references profiles(id),
  action text not null,
  target_user_id uuid references profiles(id),
  metadata jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table attendance enable row level security;
alter table audit_log enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert profiles"
  on profiles for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Attendance policies
create policy "Users can view own attendance"
  on attendance for select
  using (auth.uid() = user_id);

create policy "Admins can view all attendance"
  on attendance for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert attendance"
  on attendance for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update attendance"
  on attendance for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Audit log policies
create policy "Admins can view audit log"
  on audit_log for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert audit log"
  on audit_log for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, member_id, qr_token_hash)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'member_id', ''),
    coalesce(new.raw_user_meta_data->>'qr_token_hash', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

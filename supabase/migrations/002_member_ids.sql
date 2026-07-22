-- Create member_ids table for invite-code-based signup
create table if not exists member_ids (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  member_id text not null,
  status text not null default 'unused' check (status in ('unused', 'used', 'revoked')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  used_by uuid references profiles(id) on delete set null,
  used_at timestamptz
);

-- RLS policies for member_ids
alter table member_ids enable row level security;

create policy "Admins can view all member_ids"
  on member_ids for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert member_ids"
  on member_ids for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update member_ids"
  on member_ids for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Anyone can validate a code"
  on member_ids for select
  using (status = 'unused');

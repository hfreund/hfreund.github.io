create extension if not exists pgcrypto;
create extension if not exists vector;

do $$ begin
  create type public.created_by as enum ('user', 'ai');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_status as enum ('accepted', 'pending', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.summary_created_by as enum ('user', 'ai');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.media_type as enum ('image', 'video', 'audio', 'document', 'link', 'text');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_type as enum ('work', 'writing', 'thought', 'reference', 'principle');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ownership as enum ('mine', 'theirs');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.relation_type as enum ('inspired_by', 'used_in', 'contrasts_with', 'related');
exception
  when duplicate_object then null;
end $$;

create or replace function public.is_commonplace_owner()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'hugh.freund@gmail.com';
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text,
  body text,
  why_saved text,
  summary text,
  summary_created_by public.summary_created_by,
  url text,
  url_normalized text,
  canonical_url text,
  source_platform text,
  source_id text,
  saved_version text,
  media_storage_url text,
  media_type public.media_type not null,
  content_type public.content_type not null,
  ownership public.ownership not null,
  discipline text,
  creator text,
  source text,
  is_public boolean not null default false,
  portfolio_featured boolean not null default false,
  embedding vector(1536),
  constraint entries_has_content check (
    nullif(trim(coalesce(body, '')), '') is not null
    or nullif(trim(coalesce(url, '')), '') is not null
    or nullif(trim(coalesce(media_storage_url, '')), '') is not null
  )
);

create trigger set_entries_updated_at
before update on public.entries
for each row
execute function public.set_updated_at();

create index if not exists entries_created_at_idx on public.entries (created_at desc);
create index if not exists entries_url_normalized_idx on public.entries (url_normalized) where url_normalized is not null;
create index if not exists entries_content_filters_idx on public.entries (ownership, content_type, media_type);
create index if not exists entries_public_idx on public.entries (is_public) where is_public = true;

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  body text not null,
  note text,
  timestamp text,
  page int,
  locator jsonb,
  created_at timestamptz not null default now(),
  embedding vector(1536)
);

create index if not exists highlights_entry_id_idx on public.highlights (entry_id);
create index if not exists highlights_created_at_idx on public.highlights (created_at desc);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by public.created_by not null default 'user',
  created_at timestamptz not null default now(),
  constraint tags_name_lowercase check (name = lower(name))
);

create table if not exists public.entry_tags (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  status public.entry_status not null default 'accepted',
  created_by public.created_by not null default 'user',
  created_at timestamptz not null default now(),
  unique (entry_id, tag_id)
);

create index if not exists entry_tags_entry_id_idx on public.entry_tags (entry_id);
create index if not exists entry_tags_tag_id_idx on public.entry_tags (tag_id);
create index if not exists entry_tags_status_idx on public.entry_tags (status);

create table if not exists public.relations (
  id uuid primary key default gen_random_uuid(),
  from_entry_id uuid not null references public.entries(id) on delete cascade,
  to_entry_id uuid not null references public.entries(id) on delete cascade,
  relation_type public.relation_type not null,
  note text,
  created_by public.created_by not null default 'user',
  status public.entry_status not null default 'accepted',
  created_at timestamptz not null default now(),
  constraint relations_no_self_reference check (from_entry_id <> to_entry_id)
);

create index if not exists relations_from_entry_id_idx on public.relations (from_entry_id);
create index if not exists relations_to_entry_id_idx on public.relations (to_entry_id);
create index if not exists relations_status_idx on public.relations (status);

alter table public.entries enable row level security;
alter table public.highlights enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
alter table public.relations enable row level security;

create policy "owner_select_entries" on public.entries for select to authenticated using (public.is_commonplace_owner());
create policy "owner_insert_entries" on public.entries for insert to authenticated with check (public.is_commonplace_owner());
create policy "owner_update_entries" on public.entries for update to authenticated using (public.is_commonplace_owner()) with check (public.is_commonplace_owner());
create policy "owner_delete_entries" on public.entries for delete to authenticated using (public.is_commonplace_owner());

create policy "owner_select_highlights" on public.highlights for select to authenticated using (public.is_commonplace_owner());
create policy "owner_insert_highlights" on public.highlights for insert to authenticated with check (public.is_commonplace_owner());
create policy "owner_update_highlights" on public.highlights for update to authenticated using (public.is_commonplace_owner()) with check (public.is_commonplace_owner());
create policy "owner_delete_highlights" on public.highlights for delete to authenticated using (public.is_commonplace_owner());

create policy "owner_select_tags" on public.tags for select to authenticated using (public.is_commonplace_owner());
create policy "owner_insert_tags" on public.tags for insert to authenticated with check (public.is_commonplace_owner());
create policy "owner_update_tags" on public.tags for update to authenticated using (public.is_commonplace_owner()) with check (public.is_commonplace_owner());
create policy "owner_delete_tags" on public.tags for delete to authenticated using (public.is_commonplace_owner());

create policy "owner_select_entry_tags" on public.entry_tags for select to authenticated using (public.is_commonplace_owner());
create policy "owner_insert_entry_tags" on public.entry_tags for insert to authenticated with check (public.is_commonplace_owner());
create policy "owner_update_entry_tags" on public.entry_tags for update to authenticated using (public.is_commonplace_owner()) with check (public.is_commonplace_owner());
create policy "owner_delete_entry_tags" on public.entry_tags for delete to authenticated using (public.is_commonplace_owner());

create policy "owner_select_relations" on public.relations for select to authenticated using (public.is_commonplace_owner());
create policy "owner_insert_relations" on public.relations for insert to authenticated with check (public.is_commonplace_owner());
create policy "owner_update_relations" on public.relations for update to authenticated using (public.is_commonplace_owner()) with check (public.is_commonplace_owner());
create policy "owner_delete_relations" on public.relations for delete to authenticated using (public.is_commonplace_owner());

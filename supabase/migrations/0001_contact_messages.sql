-- leads module: contact form messages.
-- Locked down: RLS on with no policies, and no table privileges for anon/authenticated.
-- Only the server (secret key, which bypasses RLS) can insert and read.

create type public.contact_topic as enum ('hiring', 'consulting', 'collaboration', 'other');

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null check (char_length(email) between 3 and 254),
  topic       public.contact_topic not null,
  message     text not null check (char_length(message) between 10 and 4000),
  ip_hash     text not null,
  source      text not null default 'production'
              check (source in ('production', 'preview', 'development')),
  status      text not null default 'new'
              check (status in ('new', 'replied', 'archived'))
);

comment on table public.contact_messages is 'Messages from the jitin-site contact form. ip_hash is a salted SHA-256, never a raw IP.';

create index contact_messages_ip_recent on public.contact_messages (ip_hash, created_at desc);
create index contact_messages_created on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;

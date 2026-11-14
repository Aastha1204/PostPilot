-- PostPilot schema. Enable Realtime on approval_event if you want push updates instead of polling.
create table if not exists business (
  id text primary key, name text not null, city text, type text not null,
  timezone text not null default 'Asia/Kolkata', owner_name text, owner_whatsapp text, created_at timestamptz not null default now()
);
create table if not exists brand_kit (
  id text primary key, business_id text not null references business(id) on delete cascade,
  colours jsonb not null, fonts jsonb not null, logo_url text, tone text, languages text[] default '{}',
  services text[] default '{}', offers jsonb default '[]', audience text, hashtag_sets jsonb default '[]', rules jsonb default '{}'
);
create table if not exists brand_asset (
  id uuid primary key default gen_random_uuid(), business_id text not null references business(id) on delete cascade,
  url text not null, kind text not null check (kind in ('portfolio','bts','team','ai_generated')), tags text[] default '{}', licence_note text
);
create table if not exists content_pillar (
  id text primary key, business_id text not null references business(id) on delete cascade, name text not null, weight int not null, colour text
);
create table if not exists festival_calendar (
  id text primary key, name text not null, date date not null, region text, applicable_business_types text[] default '{}',
  requires_manual_review boolean not null default true, verified boolean not null default false
);
create table if not exists post (
  id text primary key, business_id text not null references business(id) on delete cascade, pillar_id text,
  format text not null check (format in ('image','carousel','reel')), title text not null, caption text not null,
  hashtags text[] default '{}', cta text, visual_brief text, template_id text, template_props jsonb default '{}',
  media_urls text[] default '{}', scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft','awaiting_approval','approved','scheduled','publishing','published','failed','skipped')),
  platforms text[] default '{instagram}', ig_media_id text, fb_post_id text, fact_flags jsonb default '[]', error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists approval (
  id uuid primary key default gen_random_uuid(), post_id text not null references post(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','web','mobile_link')), action text not null check (action in ('approve','edit','skip')),
  comment text, actor text, at timestamptz not null default now()
);
create table if not exists publish_job (
  id uuid primary key default gen_random_uuid(), post_id text not null references post(id) on delete cascade, platform text not null,
  attempt int not null default 0, next_retry_at timestamptz, status text not null default 'queued', log jsonb[] default '{}', error text
);
create table if not exists message_log (
  id uuid primary key default gen_random_uuid(), business_id text references business(id) on delete cascade, direction text not null check (direction in ('out','in')),
  channel text not null, wa_message_id text unique, payload jsonb, at timestamptz not null default now()
);
create table if not exists post_insight (
  post_id text primary key references post(id) on delete cascade, reach int, likes int, comments int, saves int, shares int, captured_at timestamptz not null default now()
);
-- Phone approval links: a snapshot of the week's posts plus the owner's actions, scoped by an unguessable token.
create table if not exists approval_session (
  token text primary key, business_id text not null, week_start date not null, posts jsonb not null, created_at timestamptz not null default now()
);
create table if not exists approval_event (
  id text primary key, token text not null references approval_session(token) on delete cascade, post_id text not null,
  action text not null check (action in ('approve','edit','skip')), comment text, revised jsonb, summary text, channel text not null default 'mobile_link', at timestamptz not null default now()
);
create index if not exists approval_event_token_at on approval_event (token, at);

-- Fields the app tracks that have no dedicated column (variant, watermark, timeline, retry state, ...).
alter table post add column if not exists meta jsonb not null default '{}';
create index if not exists post_due on post (status, scheduled_at);

-- PROPOSAL ONLY: review and apply through the normal production migration gate.
-- Required before enabling scheduled collection. This file has not been run.

-- Preflight gate: stop without deleting or rewriting any snapshot when the new
-- idempotency key is not yet unique. An operator must inspect the conflicting
-- rows and explicitly decide which evidence to retain; there is intentionally
-- no automatic "latest wins" or cleanup rule in this migration.
do $$
begin
  if exists (
    select 1 from public.metric_snapshots
    group by submission_id, snapshot_type
    having count(*) > 1
  ) then
    raise exception using
      errcode = '23505',
      message = 'metric snapshot duplicates require manual review before KOL hardening migration';
  end if;
end $$;

alter table public.post_submissions
  add column if not exists post_exists boolean,
  add column if not exists mention_verified boolean,
  add column if not exists utm_verified boolean,
  add column if not exists checked_at timestamptz,
  add column if not exists verification_source text;

-- URL/username checks prove ownership format only. Third-party verification
-- fields remain NULL (unknown), and verification_status remains 'pending'.

alter table public.metric_snapshots drop constraint if exists metric_snapshots_submission_id_snapshot_type_captured_at_key;
alter table public.metric_snapshots drop constraint if exists metric_snapshots_snapshot_type_check;
alter table public.metric_snapshots add constraint metric_snapshots_snapshot_type_check
  check(snapshot_type in('initial','24h','30h_retry','48h_retry','7d','8d_retry','manual'));
alter table public.metric_snapshots add constraint metric_snapshots_submission_snapshot_key
  unique(submission_id,snapshot_type);

# KOL metric schedule proposal (disabled)

This is a design only. No cron job or workflow is enabled by this repository change.

For each submission, enqueue five one-shot snapshots relative to `submitted_at`: `24h`, `30h_retry`, `48h_retry`, `7d`, and `8d_retry`. A retry may run only when its preceding target is absent or has a non-`ok` status. Every request is `POST /functions/v1/collect-metrics` with `submissionId` and `snapshotType`; the scheduler supplies `x-cron-secret` from its secret store. Never place `CRON_SECRET` in SQL source, URLs, logs, Pages, or request bodies.

Before enabling this schedule, apply and verify `003_kol_hardening_proposal.sql`. Its unique `(submission_id, snapshot_type)` constraint is the concurrency-safe idempotency boundary. The function treats a uniqueness conflict as `already_exists`, so scheduler retries do not create another snapshot. Admin display should prefer a successful target snapshot, then its successful retry snapshots in time order; if none succeeded, it must show `Unable to Verify`, never zero.

## Deployment runbook (not executed)

1. Keep every scheduler job disabled and confirm the function secret `METRICS_MODE=mock`.
2. Back up `metric_snapshots`, then run this read-only preflight and retain its output as migration evidence:
   `select submission_id,snapshot_type,count(*) from public.metric_snapshots group by 1,2 having count(*) > 1;`
3. If the query returns rows, stop. Review raw evidence and status for each conflict, document an explicit retention decision, and perform any approved cleanup as a separate audited operation. This proposal never silently deletes data.
4. Apply `003_kol_hardening_proposal.sql`. Its own `DO` gate fails if any duplicate remains.
5. Verify the new columns and unique constraint, then deploy the updated `submit-post` and `collect-metrics` functions—in that order. Deploying functions before the migration would make submission inserts reference unavailable columns.
6. Run fixture/static tests and staging smoke calls for `24h`, `30h_retry`, `48h_retry`, `7d`, and `8d_retry`. Repeat one call and confirm `already_exists`; confirm all stored rows use `source=mock` and absent values remain SQL `NULL`.
7. Review Admin fallback and `Unable to Verify` rendering. Only then request separate approval to enable Supabase Cron. Do not switch to live mode as part of this rollout.

Recommendation: use **Supabase Cron with Vault** because the function and data live in Supabase, reducing secret distribution and avoiding a long-lived service credential in GitHub. Use a dispatcher query to select due/missing snapshot types and call the Edge Function with the Vault-held header. Keep all jobs disabled until the migration, mock-mode staging test, and explicit production approval are complete. GitHub Actions is acceptable only if operational visibility there outweighs the additional secret copy and external scheduler dependency.

Launch gate: `METRICS_MODE=mock`. Live provider credentials and paid calls are out of scope.

## Runtime compatibility check

The Edge Function imports the shared adapter through an explicit relative `.ts` path, matching Deno/Supabase Edge module resolution. The repository fixture test imports that same source module under Node 22, so test and runtime do not maintain separate adapter implementations. This workstation does not have the `deno` executable; therefore `deno check` and Supabase bundling remain mandatory staging gates before deployment and are not claimed as locally passed.

-- Secure task content and private media management.
alter table public.campaign_tasks
  add column if not exists title text not null default 'MAGNE.AI Campaign Task',
  add column if not exists campaign_link_enabled boolean not null default false,
  add column if not exists campaign_base_url text;

alter table public.task_assets
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists updated_at timestamptz not null default now();

alter table public.task_assets drop constraint if exists task_assets_size_check;
alter table public.task_assets add constraint task_assets_size_check check (size_bytes is null or size_bytes between 1 and 18874368);
do $$ begin
  if not exists(select 1 from pg_constraint where conname='task_assets_type_check' and conrelid='public.task_assets'::regclass) then alter table public.task_assets add constraint task_assets_type_check check (asset_type in ('image','video')); end if;
end $$;

create index if not exists task_assets_task_sort_idx on public.task_assets(task_id,sort_order);
create unique index if not exists task_assets_storage_path_idx on public.task_assets(storage_path) where storage_path is not null;

create or replace function public.is_portal_admin() returns boolean
language sql stable security definer set search_path=''
as $$select exists(select 1 from public.admin_users where id=auth.uid() and active and role='admin')$$;
revoke all on function public.is_portal_admin() from public;
grant execute on function public.is_portal_admin() to authenticated;

-- Editors retain read-only reporting access; content mutation is admin-only.
drop policy if exists staff_tasks on public.campaign_tasks;
drop policy if exists staff_assets on public.task_assets;
drop policy if exists staff_tasks_read on public.campaign_tasks;
drop policy if exists admin_tasks_write on public.campaign_tasks;
drop policy if exists staff_assets_read on public.task_assets;
drop policy if exists admin_assets_write on public.task_assets;
create policy staff_tasks_read on public.campaign_tasks for select to authenticated using(public.is_portal_staff());
create policy staff_assets_read on public.task_assets for select to authenticated using(public.is_portal_staff());
-- No authenticated PostgREST write policies: service-role Edge Functions are the only mutation path.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('kol-assets','kol-assets',false,18874368,array['image/png','image/jpeg','image/webp','video/mp4','video/webm'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists kol_assets_admin_insert on storage.objects;
drop policy if exists kol_assets_admin_update on storage.objects;
drop policy if exists kol_assets_admin_delete on storage.objects;
drop policy if exists kol_assets_staff_select on storage.objects;
-- No authenticated storage.object policies: reads use signed URLs and writes use the service-role Edge Function.

-- Service-role-only atomic rotation: a failure rolls back both revoke and insert.
create or replace function public.rotate_task_token_hash(p_task_id uuid,p_new_hash text,p_expires_at timestamptz) returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.role() <> 'service_role' then raise exception 'forbidden'; end if;
  if p_new_hash !~ '^[0-9a-f]{64}$' or p_expires_at <= now() then raise exception 'invalid token metadata'; end if;
  update public.task_access_tokens set revoked_at=now() where task_id=p_task_id and revoked_at is null;
  insert into public.task_access_tokens(task_id,token_hash,expires_at) values(p_task_id,p_new_hash,p_expires_at);
end $$;
revoke all on function public.rotate_task_token_hash(uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.rotate_task_token_hash(uuid,text,timestamptz) to service_role;

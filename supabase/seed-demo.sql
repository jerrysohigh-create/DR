-- TEST PROJECT ONLY. Seeds public Demo profiles/tasks, but intentionally creates no access tokens.
-- Generate random raw tokens outside the repository, store only SHA-256 hashes in task_access_tokens,
-- and keep raw tokens in a local 0600 file or password manager. See README.md.
with k as (
  insert into public.kol_profiles(slug,x_handle,display_name,language,timezone) values
    ('crypto-dragon','@CryptoDragon001','Crypto Dragon','en','Asia/Singapore'),
    ('kryptomonach','@Kryptomonach','Kryptomonach','en','Asia/Singapore'),
    ('crypto-panda','@CryptoPanda_gl','Crypto Panda','en','Asia/Singapore')
  on conflict (slug) do update set
    x_handle=excluded.x_handle, display_name=excluded.display_name,
    language=excluded.language, timezone=excluded.timezone
  returning id,slug
)
insert into public.campaign_tasks(kol_id,wave,stage,publish_at,status,primary_angle,approved_copy,utm_url,requirements,prohibited_claims)
select id,'Wave 1 · DEMO','demo',
  case slug when 'crypto-dragon' then '2026-08-01 10:00:00+08'::timestamptz when 'kryptomonach' then '2026-08-02 10:00:00+08'::timestamptz else '2026-08-03 10:00:00+08'::timestamptz end,
  'Ready to Publish',
  case slug when 'crypto-dragon' then 'Web3-native AI smartphone' when 'kryptomonach' then 'Local call translation + one-tap Gemini' else 'Compliance progress' end,
  case slug when 'crypto-dragon' then 'A Web3-native AI smartphone should make identity, intelligence and ownership feel native to the device. Exploring the MAGNE.AI approach.' when 'kryptomonach' then 'MAGNE.AI focuses current on-device AI on real-time call translation, with one-tap access to Gemini as a cloud-assisted workflow.' else 'MAGNE.AI compliance progress: CE Approved, Google GMS Approved, GSMA TAC Obtained and FCC Public.' end,
  'https://magne.ai/?utm_source=x&utm_medium=kol&utm_campaign=demo_wave1&utm_content='||replace(slug,'-','_'),
  case slug when 'crypto-dragon' then '["Use only the approved post copy.","Publish from @CryptoDragon001.","Keep the campaign link in the post."]'::jsonb when 'kryptomonach' then '["Current on-device AI focuses on real-time call translation.","Gemini is a cloud-assisted workflow.","Publish from @Kryptomonach."]'::jsonb else '["CE Approved · Google GMS Approved.","GSMA TAC Obtained · FCC Public.","Publish from @CryptoPanda_gl."]'::jsonb end,
  case slug when 'crypto-dragon' then '["Do not claim mainnet launch or guaranteed returns."]'::jsonb when 'kryptomonach' then '["On-device Gemini","Offline Gemini"]'::jsonb else '["Do not add certifications not listed here."]'::jsonb end
from k
where not exists(select 1 from public.campaign_tasks t where t.kol_id=k.id and t.stage='demo');

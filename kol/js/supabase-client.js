await window.KOL_CONFIG_READY;const cfg=window.KOL_CONFIG||{};
export const isDemo=cfg.USE_DEMO_DATA!==false;export const config=cfg;
async function call(name,body,token){
  const r=await fetch(`${cfg.SUPABASE_URL}/functions/v1/${name}`,{method:'POST',headers:{'content-type':'application/json',apikey:cfg.SUPABASE_ANON_KEY,authorization:`Bearer ${cfg.SUPABASE_ANON_KEY}`},body:JSON.stringify({...body,token})});
  const data=await r.json().catch(()=>({error:'Invalid server response'}));if(!r.ok)throw new Error(data.error||'Request failed');return data;
}
export const api={getTask:(slug,token)=>call('get-task',{slug},token),submitPost:(slug,postUrl,token)=>call('submit-post',{slug,postUrl},token)};

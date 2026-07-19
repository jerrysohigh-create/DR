export function inspectAuthCallback(href){
  const url=new URL(href),hash=new URLSearchParams(url.hash.replace(/^#/,''));
  const get=key=>hash.get(key)||url.searchParams.get(key);
  const type=get('type');
  const error=get('error')||get('error_code');
  const hasCredentials=['access_token','refresh_token','code','token_hash'].some(key=>hash.has(key)||url.searchParams.has(key));
  return{type,error,hasCallback:hasCredentials||['recovery','invite','signup','magiclink'].includes(type)};
}

export function authEntryState({callback,session,sessionError}){
  if(callback.error||(callback.hasCallback&&(sessionError||!session)))return'error';
  if(callback.hasCallback&&session)return'set-password';
  return session?'signed-in':'sign-in';
}

export function resolveAuthEntry({callback,session,sessionError,cleanUrl}){
  const state=authEntryState({callback,session,sessionError});
  if(state==='set-password')cleanUrl();
  return state;
}

export function consumeAuthCallback(callback){
  return{...callback,hasCallback:false,type:null,error:null};
}

export function isPasswordSetupEvent(event,callback,session){
  return event==='PASSWORD_RECOVERY'||Boolean(callback.hasCallback&&session);
}

export function validateNewPassword(password,confirmation){
  if(password.length<8)return'Password must be at least 8 characters.';
  if(password!==confirmation)return'Passwords do not match.';
  return'';
}

export async function completePasswordSetup({auth,password,confirmation,email,cleanUrl}){
  const validationError=validateNewPassword(password,confirmation);
  if(validationError)return{error:validationError};
  let error;
  try{({error}=await auth.updateUser({password}))}catch(cause){return{error:cause?.message||'Unable to set password.'}}
  if(error)return{error:error.message||'Unable to set password.'};
  cleanUrl();
  try{await auth.signOut()}catch{/* Password is already updated; local navigation must still complete. */}
  return{email};
}

import assert from'node:assert/strict';
import{inspectAuthCallback,authEntryState,resolveAuthEntry,consumeAuthCallback,isPasswordSetupEvent,validateNewPassword,completePasswordSetup}from'../js/admin-auth.js';

const recovery=inspectAuthCallback('https://example.test/admin.html#access_token=test&type=recovery');
assert.equal(recovery.type,'recovery');assert.equal(recovery.hasCallback,true);
const invite=inspectAuthCallback('https://example.test/admin.html?code=test&type=invite');
assert.equal(invite.type,'invite');assert.equal(invite.hasCallback,true);
assert.equal(authEntryState({callback:recovery,session:{user:{}},sessionError:null}),'set-password');
let entryCleanups=0;
assert.equal(resolveAuthEntry({callback:recovery,session:{user:{}},sessionError:null,cleanUrl:()=>entryCleanups++}),'set-password');
assert.equal(entryCleanups,1);
const consumedRecovery=consumeAuthCallback(recovery);
assert.equal(consumedRecovery.hasCallback,false);
assert.equal(isPasswordSetupEvent('SIGNED_OUT',consumedRecovery,null),false);
assert.equal(isPasswordSetupEvent('SIGNED_IN',consumedRecovery,{user:{}}),false);
assert.equal(isPasswordSetupEvent('PASSWORD_RECOVERY',{hasCallback:false},null),true);
assert.equal(isPasswordSetupEvent('SIGNED_IN',invite,{user:{}}),true);

const expired=inspectAuthCallback('https://example.test/admin.html#error=access_denied&error_code=otp_expired&type=recovery');
assert.equal(authEntryState({callback:expired,session:null,sessionError:null}),'error');
assert.equal(authEntryState({callback:recovery,session:null,sessionError:new Error('invalid')}),'error');
assert.equal(validateNewPassword('short','short'),'Password must be at least 8 characters.');
assert.equal(validateNewPassword('long-enough','different'),'Passwords do not match.');

let updated,signOuts=0,cleanups=0;
const auth={updateUser:async value=>{updated=value;return{error:null}},signOut:async()=>{signOuts++}};
const success=await completePasswordSetup({auth,password:'safe-pass-123',confirmation:'safe-pass-123',email:'admin@example.test',cleanUrl:()=>cleanups++});
assert.deepEqual(updated,{password:'safe-pass-123'});assert.equal(signOuts,1);assert.equal(cleanups,1);assert.equal(success.email,'admin@example.test');

const failedAuth={updateUser:async()=>({error:{message:'Session expired'}}),signOut:async()=>{throw Error('must not sign out')}};
const failure=await completePasswordSetup({auth:failedAuth,password:'safe-pass-123',confirmation:'safe-pass-123',email:'admin@example.test',cleanUrl:()=>{throw Error('must not clean URL')}});
assert.equal(failure.error,'Session expired');

let rejectedSignOutCleanup=0;
const rejectedSignOut={updateUser:async()=>({error:null}),signOut:async()=>{throw Error('offline')}};
const stillSuccessful=await completePasswordSetup({auth:rejectedSignOut,password:'safe-pass-123',confirmation:'safe-pass-123',email:'admin@example.test',cleanUrl:()=>rejectedSignOutCleanup++});
assert.equal(stillSuccessful.error,undefined);assert.equal(stillSuccessful.email,'admin@example.test');assert.equal(rejectedSignOutCleanup,1);
console.log('admin auth behavioral tests: PASS');

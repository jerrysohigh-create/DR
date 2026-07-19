export function parseXPostUrl(value){
  try{const u=new URL(value.trim());if(!['x.com','www.x.com','twitter.com','www.twitter.com'].includes(u.hostname.toLowerCase()))throw 0;
    const m=u.pathname.match(/^\/([^/]+)\/status\/(\d+)(?:\/|$)/i);if(!m)throw 0;return{url:`https://x.com/${m[1]}/status/${m[2]}`,username:m[1],postId:m[2]};
  }catch{return null;}
}
export function sameHandle(a,b){return a.replace(/^@/,'').toLowerCase()===b.replace(/^@/,'').toLowerCase()}
export function csvCell(v){return `"${String(v??'').replaceAll('"','""')}"`}

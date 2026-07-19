// A local ignored config wins; Pages uses the committed publishable runtime config; Demo is the safe final fallback.
window.KOL_CONFIG_READY=new Promise(resolve=>{
  const load=(src,next)=>{const script=document.createElement('script');script.src=src;script.onload=()=>resolve(window.KOL_CONFIG);script.onerror=next;document.head.append(script)};
  load('js/config.js',()=>load('js/config.runtime.js',()=>load('js/config.example.js',()=>resolve({USE_DEMO_DATA:true}))));
});

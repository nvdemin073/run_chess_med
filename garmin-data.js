/* Read only the already-published, allowlisted activity export. No Garmin credentials are sent to visitors. */
(() => {
  const remote='https://raw.githubusercontent.com/nvdemin073/run_chess_med/main/data/integrations.json';
  let cached=null, pending=null;
  const num=(x)=>typeof x==='number'&&Number.isFinite(x);
  function clean(raw){
    const g=raw?.garmin;
    if(!g||!Array.isArray(g.runs||g.recentRuns))throw Error('Invalid Garmin export');
    const seen=new Set();
    const runs=(g.runs||g.recentRuns).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&num(r.distanceKm)&&r.distanceKm>0&&num(r.durationSeconds)&&r.durationSeconds>0).filter(r=>{const k=r.garminActivityId||`${r.date}-${r.distanceKm}-${r.durationSeconds}`;if(seen.has(k))return false;seen.add(k);return true;}).map(r=>({...r,paceSecondsPerKm:r.durationSeconds/r.distanceKm})).sort((a,b)=>b.date.localeCompare(a.date)||(b.garminActivityId||0)-(a.garminActivityId||0));
    if(!runs.length)throw Error('Empty Garmin export');
    return {...g,runs};
  }
  async function get(url){const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Export unavailable');return clean(await r.json());}
  function notify(data){cached=data;window.dispatchEvent(new CustomEvent('garmin-data-updated',{detail:data}));return data;}
  async function refresh(){const next=await get(remote);if(!cached||Date.parse(next.updatedAt)>=Date.parse(cached.updatedAt))notify(next);return cached;}
  async function load(){
    if(cached)return cached;if(pending)return pending;
    pending=(async()=>{let local;try{local=await get('data/integrations.json');}catch{local=await get(remote);}notify(local);refresh().catch(()=>{});return local;})();
    try{return await pending;}finally{pending=null;}
  }
  const date=(v)=>new Date(v+'T12:00:00Z');
  const km=(v,d=2)=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:d});
  const clock=v=>{const s=Math.round(v),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return `${h?h+':':''}${h?String(m).padStart(2,'0'):m}:${String(s%60).padStart(2,'0')}`;};
  const stamp=v=>new Date(v).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).replace(' г.','')+' МСК';
  const totals=runs=>{const distance=runs.reduce((s,r)=>s+r.distanceKm,0),seconds=runs.reduce((s,r)=>s+r.durationSeconds,0);return {distance,seconds,count:runs.length,pace:distance?seconds/distance:null};};
  window.RunData={load,refresh,km,clock,date,stamp,totals};
})();

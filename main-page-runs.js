(() => {
  const set=(id,s)=>{const n=document.getElementById(id);if(n)n.textContent=s;};
  function render(g){
    const {km,clock,date,stamp,totals}=RunData,all=totals(g.runs),month=g.month,monthly=g.runs.filter(r=>r.date.startsWith(month)),mt=totals(monthly),last=g.runs[0];
    set('home-month-label',date(month+'-01').toLocaleDateString('ru-RU',{month:'long',year:'numeric'}));set('home-month-distance',km(mt.distance));set('home-month-runs',`${mt.count} ${mt.count%10===1&&mt.count%100!==11?"тренировка":mt.count%10>=2&&mt.count%10<=4&&!(mt.count%100>=12&&mt.count%100<=14)?"тренировки":"тренировок"} за месяц`);
    set('home-total-distance',km(all.distance));set('home-total-runs',km(all.count,0));set('home-total-hours',`${Math.floor(all.seconds/3600)} ч ${Math.floor(all.seconds%3600/60)} мин в движении`);set('home-average-pace',clock(all.pace));
    set('home-history-since','С '+date(g.runs[g.runs.length-1].date).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}));
    set('home-last-distance',km(last.distanceKm)+' км');set('home-last-date',date(last.date).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}));set('home-last-details',`${clock(last.durationSeconds)} · ${clock(last.paceSecondsPerKm)} /км`);
    const link=document.getElementById('home-last-run');if(link)link.href='runs.html?activity='+encodeURIComponent(last.garminActivityId);
    set('home-sync-status','Данные Garmin · обновлено '+stamp(g.updatedAt));
    const year=month.slice(0,4);set('home-chart-year',year);
    const months=Array.from({length:Number(month.slice(5))},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`),values=months.map(m=>g.runs.filter(r=>r.date.startsWith(m)).reduce((s,r)=>s+r.distanceKm,0)),max=Math.max(...values,1),box=document.getElementById('home-month-chart');
    if(box){box.replaceChildren();months.forEach((m,i)=>{const a=document.createElement('a');a.href=`runs.html?year=${year}&month=${m.slice(5)}`;a.className='home-chart-column';a.title=date(m+'-01').toLocaleDateString('ru-RU',{month:'long'})+': '+km(values[i])+' км';a.setAttribute('aria-label',a.title);const value=document.createElement('span');value.className='home-chart-value';value.textContent=km(values[i],0);const track=document.createElement('span');track.className='home-chart-track';const bar=document.createElement('span');bar.className='home-chart-bar';bar.style.height=(values[i]/max*100)+'%';track.append(bar);const label=document.createElement('span');label.textContent=date(m+'-01').toLocaleDateString('ru-RU',{month:'short'}).replace('.','');a.append(value,track,label);box.append(a);});}
    // The original running chapter remains intact and now uses the same data.
    set('preview-total-runs',mt.count);set('preview-total-distance',km(mt.distance));set('preview-runs-status','Garmin · '+date(month+'-01').toLocaleDateString('ru-RU',{month:'long',year:'numeric'}));set('preview-last-run',`Последняя пробежка: ${date(last.date).toLocaleDateString('ru-RU')} · ${km(last.distanceKm)} км · ${clock(last.paceSecondsPerKm)} мин/км`);const old=document.getElementById('run-live-stats');if(old)old.hidden=false;
  }
  window.addEventListener('garmin-data-updated',e=>render(e.detail));
  document.addEventListener('DOMContentLoaded',()=>RunData.load().then(render).catch(()=>set('home-sync-status','Данные временно недоступны. Открой страницу тренировок и попробуй обновить.')));
})();

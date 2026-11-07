(() => {
  const $=id=>document.getElementById(id),set=(id,value)=>{$(id).textContent=value;},node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const {km,clock,date,stamp,totals}=RunData;
  const state={scope:'all',year:'all',month:'all',day:null,shown:25};let data,filtered=[],returnFocus=null;
  const now=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const monthName=m=>date('2020-'+m+'-01').toLocaleDateString('ru-RU',{month:'long'});
  function selected(){
    let runs=data.runs;
    if(state.scope==='year')runs=runs.filter(r=>r.date.startsWith(now.slice(0,4)));
    else if(state.scope==='month')runs=runs.filter(r=>r.date.startsWith(now.slice(0,7)));
    else if(state.scope==='recent')runs=runs.slice(0,30);
    else if(state.scope==='period')runs=runs.filter(r=>(state.year==='all'||r.date.startsWith(state.year))&&(state.month==='all'||r.date.slice(5,7)===state.month));
    if(state.day)runs=runs.filter(r=>r.date===state.day);return runs;
  }
  function label(){if(state.day)return date(state.day).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});if(state.scope==='all')return 'Вся история';if(state.scope==='recent')return 'Последние 30 тренировок';if(state.scope==='year')return now.slice(0,4)+' год';if(state.scope==='month')return date(now.slice(0,7)+'-01').toLocaleDateString('ru-RU',{month:'long',year:'numeric'});return (state.month==='all'?'Все месяцы':monthName(state.month))+' · '+(state.year==='all'?'все годы':state.year);}
  function syncFilters(){
    document.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(!state.day&&state.scope===b.dataset.scope)));
    $('runs-year').value=state.scope==='year'||state.scope==='month'?now.slice(0,4):state.scope==='period'?state.year:'all';$('runs-month').value=state.scope==='month'?now.slice(5,7):state.scope==='period'?state.month:'all';
  }
  function render(){
    filtered=selected();const t=totals(filtered);set('runs-distance',km(t.distance));set('runs-count',km(t.count,0));set('runs-time',clock(t.seconds));set('runs-pace',t.pace?clock(t.pace):'—');set('selection-title',label());set('selection-dates',filtered.length?date(filtered[filtered.length-1].date).toLocaleDateString('ru-RU')+' — '+date(filtered[0].date).toLocaleDateString('ru-RU'):'Пробежек за этот период нет');syncFilters();drawChart();drawList();
  }
  function svg(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;}
  function drawChart(){
    const box=$('runs-chart');box.replaceChildren();
    if(!filtered.length){box.append(node('p','empty-state','В этом периоде пробежек нет. Выбери другой месяц или всю историю.'));set('chart-title','Дистанция');set('chart-note','Здесь отображаются только тренировки из твоей выгрузки Garmin.');return;}
    const days=new Set(filtered.map(r=>r.date)),unit=days.size>45?'month':'day',group=new Map();
    filtered.forEach(r=>{const key=unit==='month'?r.date.slice(0,7):r.date;group.set(key,(group.get(key)||0)+r.distanceKm);});
    // Fill missing buckets with zero so gaps are represented honestly.
    const ordered=[...group.keys()].sort(),keys=[],start=date(unit==='month'?ordered[0]+'-01':ordered[0]),end=date(unit==='month'?ordered[ordered.length-1]+'-01':ordered[ordered.length-1]);
    for(let d=new Date(start);d<=end;unit==='month'?d.setUTCMonth(d.getUTCMonth()+1):d.setUTCDate(d.getUTCDate()+1)){keys.push(d.toISOString().slice(0,unit==='month'?7:10));if(keys.length>1500)break;}
    const width=window.innerWidth<600?420:780,height=250,left=43,right=8,top=18,bottom=37,w=width-left-right,h=height-top-bottom,step=w/keys.length,max=Math.max(5,Math.ceil(Math.max(...group.values())/5)*5);
    const root=svg('svg',{viewBox:`0 0 ${width} ${height}`,class:'distance-chart',role:'group','aria-label':'Дистанция пробежек по '+(unit==='month'?'месяцам':'дням')});
    for(let i=0;i<=4;i++){const y=top+h-i*h/4;root.append(svg('line',{x1:left,y1:y,x2:left+w,y2:y}),svg('text',{x:left-9,y:y+4,'text-anchor':'end'},km(max*i/4,2)));}
    const tip=node('div','chart-tooltip');box.append(tip);
    keys.forEach((key,i)=>{
      const value=group.get(key)||0,bw=Math.min(28,Math.max(2,step*.6)),x=left+i*step+(step-bw)/2,bh=value/max*h,long=unit==='month'?date(key+'-01').toLocaleDateString('ru-RU',{month:'long',year:'numeric'}):date(key).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
      const bar=svg('rect',{x,y:top+h-Math.max(1,bh),width:bw,height:Math.max(1,bh),rx:2,class:'chart-bar',tabindex:0,role:'button','aria-label':long+': '+km(value)+' км. Показать тренировки.'});bar.append(svg('title',{},long+': '+km(value)+' км'));
      const show=()=>{tip.textContent=long+' · '+km(value)+' км';};bar.addEventListener('mouseenter',show);bar.addEventListener('focus',show);bar.addEventListener('mouseleave',()=>tip.textContent='');bar.addEventListener('blur',()=>tip.textContent='');
      const drill=()=>{if(unit==='month'){state.scope='period';state.year=key.slice(0,4);state.month=key.slice(5,7);state.day=null;}else state.day=key;state.shown=25;render();};bar.addEventListener('click',drill);bar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();drill();}});root.append(bar);
      const every=Math.max(1,Math.ceil(keys.length/(window.innerWidth<600?7:12)));if(i%every===0||i===keys.length-1){const short=unit==='month'?key.slice(5)+'/'+key.slice(2,4):key.slice(8)+'.'+key.slice(5,7);if(i===keys.length-1&&i%every!==0&&keys.length>2&&i%every<every/2)return;root.append(svg('text',{x:left+i*step+step/2,y:height-11,'text-anchor':'middle'},short));}
    });box.append(root);set('chart-title','Дистанция по '+(unit==='month'?'месяцам':'дням'));set('chart-note',unit==='month'?'Нажми на месяц, чтобы перейти к его тренировкам.':'Нажми на день, чтобы оставить в журнале только его пробежки.');
  }
  function valueCell(value,unit,label){const n=node('span','activity-value');n.append(node('label','',label),document.createTextNode(value));if(unit)n.append(node('small','',unit));return n;}
  function drawList(){
    const list=$('runs-list');list.replaceChildren();set('training-count',`Показано ${Math.min(state.shown,filtered.length)} из ${filtered.length}`);$('runs-more').hidden=state.shown>=filtered.length;
    if(!filtered.length){list.append(node('p','empty-state','Пока нет пробежек за выбранный период. Вся история доступна по кнопке выше.'));return;}
    filtered.slice(0,state.shown).forEach(r=>{
      const row=node('button','activity-row');row.type='button';row.dataset.activity=r.garminActivityId;row.setAttribute('aria-label',`${date(r.date).toLocaleDateString('ru-RU')}, бег, ${km(r.distanceKm)} км, ${clock(r.durationSeconds)}. Подробнее`);
      const dt=node('span','activity-date');dt.append(node('strong','',date(r.date).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})),node('small','',date(r.date).toLocaleDateString('ru-RU',{weekday:'long',year:'numeric'})));
      row.append(dt,node('span','activity-type','Бег'),valueCell(km(r.distanceKm),'км','Дистанция'),valueCell(clock(r.durationSeconds),'','Время'),valueCell(clock(r.paceSecondsPerKm),'','Темп /км'),node('span','activity-arrow','↗'));row.addEventListener('click',()=>openRun(r,row));list.append(row);
    });
  }
  function openRun(r,trigger){
    returnFocus=trigger||document.activeElement;set('run-dialog-date',date(r.date).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric',weekday:'long'}));set('detail-distance',km(r.distanceKm)+' км');set('detail-time',clock(r.durationSeconds));set('detail-pace',clock(r.paceSecondsPerKm)+' /км');
    const link=$('detail-garmin');link.hidden=!Number.isSafeInteger(r.garminActivityId);if(!link.hidden)link.href='https://connect.garmin.com/app/activity/'+r.garminActivityId;$('run-dialog').showModal();
  }
  function applyData(g){
    data=g;const year=$('runs-year'),previous=year.value;year.replaceChildren(node('option','','Все годы'));year.firstChild.value='all';const years=[...new Set([now.slice(0,4),...g.runs.map(r=>r.date.slice(0,4))])].sort().reverse();years.forEach(y=>{const o=node('option','',y);o.value=y;year.append(o);});if([...year.options].some(o=>o.value===previous))year.value=previous;
    set('runs-status',`${g.historyComplete?'Вся история Garmin':'Данные Garmin'} · обновлено ${stamp(g.updatedAt)}`);
    const mt=totals(g.runs.filter(r=>r.date.startsWith(g.month)));set('current-month',date(g.month+'-01').toLocaleDateString('ru-RU',{month:'long',year:'numeric'}));set('month-distance',km(mt.distance));set('month-count',mt.count);set('all-history-count',km(g.runs.length,0)+' пробежек');set('history-since','С '+date(g.runs[g.runs.length-1].date).toLocaleDateString('ru-RU'));
    year.disabled=false;$('runs-month').disabled=false;render();
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    for(let i=1;i<=12;i++){const v=String(i).padStart(2,'0'),o=node('option','',monthName(v));o.value=v;$('runs-month').append(o);}
    document.querySelectorAll('[data-scope]').forEach(b=>b.addEventListener('click',()=>{if(!data)return;state.scope=b.dataset.scope;state.day=null;state.shown=25;render();}));
    const change=()=>{state.scope='period';state.year=$('runs-year').value;state.month=$('runs-month').value;state.day=null;state.shown=25;render();};$('runs-year').addEventListener('change',change);$('runs-month').addEventListener('change',change);
    $('runs-more').addEventListener('click',()=>{state.shown+=25;drawList();});
    $('run-dialog').querySelector('.dialog-close').addEventListener('click',()=>$('run-dialog').close());$('run-dialog').addEventListener('click',e=>{if(e.target===$('run-dialog'))$('run-dialog').close();});$('run-dialog').addEventListener('close',()=>returnFocus?.isConnected&&returnFocus.focus());
    $('refresh-data').addEventListener('click',async()=>{const b=$('refresh-data');b.disabled=true;set('runs-status','Обновляю данные Garmin…');try{applyData(await RunData.refresh());}catch{set('runs-status','Обновление временно недоступно. Показаны данные от '+stamp(data.updatedAt));}finally{b.disabled=false;}});
    window.addEventListener('garmin-data-updated',e=>applyData(e.detail));let resize;window.addEventListener('resize',()=>{clearTimeout(resize);resize=setTimeout(()=>data&&drawChart(),150);});
    try{const g=await RunData.load();const q=new URLSearchParams(location.search),y=q.get('year'),m=q.get('month');if(y&&/^\d{4}$/.test(y)){state.scope='period';state.year=y;state.month=/^(0[1-9]|1[0-2])$/.test(m||'')?m:'all';}applyData(g);const id=q.get('activity');if(id){const r=g.runs.find(r=>String(r.garminActivityId)===id);if(r)openRun(r);}}
    catch{set('runs-status','Не удалось загрузить историю. Попробуй обновить страницу.');$('runs-list').replaceChildren(node('p','empty-state','История временно недоступна.'));}
  });
})();

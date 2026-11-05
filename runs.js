(() => {
    const set=(id,value)=>{document.getElementById(id).textContent=value;};
    const km=value=>Number(value).toLocaleString('ru-RU',{maximumFractionDigits:2});
    const date=value=>new Date(value+'T12:00:00Z');
    const duration=value=>{
        const s=Math.round(value),h=Math.floor(s/3600),m=Math.floor(s%3600/60);
        return `${h ? h+':' : ''}${h ? String(m).padStart(2,'0') : m}:${String(s%60).padStart(2,'0')}`;
    };
    const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
    const svgNode=(tag,attrs,text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;};
    function chart(runs){
        const box=document.getElementById('runs-chart');box.replaceChildren();
        if(!runs.length){set('chart-title','Дистанция');set('chart-note','Выбери другой период, чтобы посмотреть тренировки.');box.append(node('p','chart-empty','За выбранный период пробежек нет.'));return;}
        const uniqueDays=new Set(runs.map(r=>r.date));
        let unit=uniqueDays.size>45 ? 'month' : 'day';
        if(unit==='month' && new Set(runs.map(r=>r.date.slice(0,7))).size>60)unit='year';
        const key=r=>unit==='year' ? r.date.slice(0,4) : unit==='month' ? r.date.slice(0,7) : r.date;
        const grouped=new Map();for(const r of runs)grouped.set(key(r),(grouped.get(key(r))||0)+r.distanceKm);
        const points=[...grouped].sort(([a],[b])=>a.localeCompare(b));
        const unitLabel=unit==='year'?'годам':unit==='month'?'месяцам':'дням';
        set('chart-title','Дистанция по '+unitLabel);
        set('chart-note','Все тренировки выбранного периода · дистанция суммируется по '+unitLabel);
        const pointDate=value=>date(unit==='year'?value+'-01-01':unit==='month'?value+'-01':value);
        const shortLabel=value=>unit==='year'?value:unit==='month'?pointDate(value).toLocaleDateString('ru-RU',{month:'2-digit',year:'2-digit'}):pointDate(value).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
        const longLabel=value=>unit==='year'?value:pointDate(value).toLocaleDateString('ru-RU',unit==='month'?{month:'long',year:'numeric'}:undefined);
        const chartWidth=window.matchMedia('(max-width:760px)').matches ? 420 : 760;
        const svg=svgNode('svg',{viewBox:'0 0 '+chartWidth+' 245',class:'distance-chart',role:'img','aria-label':'Дистанция пробежек по '+unitLabel+', в километрах'});
        const left=43,top=12,w=chartWidth-60,h=188,step=w/points.length,max=Math.ceil(Math.max(...points.map(p=>p[1]))/5)*5;
        for(let i=0;i<=4;i++){
            const y=top+h-i*h/4;svg.append(svgNode('line',{x1:left,y1:y,x2:left+w,y2:y,stroke:'#334253','stroke-width':1}));
            svg.append(svgNode('text',{x:left-9,y:y+4,'text-anchor':'end'},km(max*i/4)));
        }
        points.forEach(([day,distance],i)=>{
            const bw=Math.max(3,Math.min(28,step*.6)),bh=distance/max*h,x=left+i*step+(step-bw)/2;
            const bar=svgNode('rect',{x,y:top+h-bh,width:bw,height:bh,rx:2,class:'chart-bar'});
            bar.append(svgNode('title',{},longLabel(day)+' · '+km(distance)+' км'));svg.append(bar);
            if(i===0||i===points.length-1||i%Math.max(1,Math.ceil(points.length/6))===0){
                svg.append(svgNode('text',{x:left+(i+.5)*step,y:top+h+23,'text-anchor':'middle'},shortLabel(day)));
            }
        });box.append(svg);
    }
    function valueCell(value,unit,label){
        const cell=node('div','training-value');cell.append(node('span','training-mobile-label',label),document.createTextNode(value));
        if(unit)cell.append(node('small','',unit));return cell;
    }
    function render(runs){
        const distance=runs.reduce((sum,r)=>sum+r.distanceKm,0),seconds=runs.reduce((sum,r)=>sum+r.durationSeconds,0);
        set('runs-distance',km(distance));set('runs-count',runs.length);set('runs-time',duration(seconds));set('runs-pace',distance ? duration(seconds/distance) : '—');
        chart(runs);
        let shown=50;
        const more=document.getElementById('runs-more');
        function drawList(){
        set('training-count','Показано '+Math.min(shown,runs.length)+' из '+runs.length);
        const list=document.getElementById('runs-list');list.replaceChildren();
        more.hidden=shown>=runs.length;
        if(!runs.length){list.append(node('p','chart-empty','За этот период синхронизированных пробежек нет.'));return;}
        runs.slice(0,shown).forEach(run=>{
            const row=node('article','training-row'),dt=node('div','training-date');
            dt.append(node('strong','',date(run.date).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})),node('small','',date(run.date).toLocaleDateString('ru-RU',{weekday:'long',year:'numeric'})));
            row.append(dt,node('span','training-type','Бег'),valueCell(km(run.distanceKm),'км','Дистанция'),valueCell(duration(run.durationSeconds),'','Время'),valueCell(duration(run.paceSecondsPerKm),'','Темп, мин/км'));
            if(Number.isSafeInteger(run.garminActivityId)&&run.garminActivityId>0){
                const link=node('a','training-open','↗');link.href=`https://connect.garmin.com/app/activity/${run.garminActivityId}`;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Открыть тренировку '+date(run.date).toLocaleDateString('ru-RU')+' в Garmin');row.append(link);
            }else row.append(node('span',''));
            list.append(row);
        });
        }
        more.onclick=()=>{shown+=50;drawList();};drawList();
    }
    document.addEventListener('DOMContentLoaded',async()=>{
        try{
            const response=await fetch('data/integrations.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});
            if(!response.ok)throw Error('Unavailable');const data=(await response.json()).garmin;
            if(!data||(!Array.isArray(data.runs)&&!Array.isArray(data.recentRuns)))throw Error('No data');
            const runs=(data.runs||data.recentRuns).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&Number.isFinite(r.distanceKm)&&r.distanceKm>0&&Number.isFinite(r.durationSeconds)&&r.durationSeconds>0).sort((a,b)=>b.date.localeCompare(a.date));
            set('month-distance',km(data.monthDistanceKm));set('month-count',data.monthRuns);
            set('current-month',new Date(data.month+'-01T12:00:00Z').toLocaleDateString('ru-RU',{month:'long',year:'numeric'}));
            set('runs-status','Обновлено '+new Date(data.updatedAt).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' МСК');
            const year=document.getElementById('runs-year'),month=document.getElementById('runs-period');
            const years=[...new Set([data.month.slice(0,4),...runs.map(r=>r.date.slice(0,4))])].sort().reverse();
            for(const value of years){const option=node('option','',value);option.value=value;year.append(option);}
            for(let i=1;i<=12;i++){const value=String(i).padStart(2,'0'),option=node('option','',date('2020-'+value+'-01').toLocaleDateString('ru-RU',{month:'long'}));option.value=value;month.append(option);}
            const refresh=()=>render(runs.filter(r=>(year.value==='all'||r.date.startsWith(year.value))&&(month.value==='all'||r.date.slice(5,7)===month.value)));
            year.disabled=false;month.disabled=false;year.addEventListener('change',refresh);month.addEventListener('change',refresh);window.matchMedia('(max-width:760px)').addEventListener('change',refresh);refresh();
            if(data.historyComplete)set('runs-status','Вся история Garmin · '+document.getElementById('runs-status').textContent);

        }catch(_){set('runs-status','Не удалось загрузить данные. Обнови страницу или открой профиль Garmin.');}
    });
})();

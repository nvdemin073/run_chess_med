(() => {
    const set = (id,value) => {document.getElementById(id).textContent=value;};
    const km = value => Number(value).toLocaleString('ru-RU',{maximumFractionDigits:2});
    const date = value => new Date(value+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    const duration = value => {
        const seconds=Math.round(value), hours=Math.floor(seconds/3600), minutes=Math.floor(seconds%3600/60);
        return `${hours ? hours+':' : ''}${hours ? String(minutes).padStart(2,'0') : minutes}:${String(seconds%60).padStart(2,'0')}`;
    };
    const metric = (value,label) => {
        const div=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');
        strong.textContent=value;span.textContent=label;div.append(strong,span);return div;
    };
    document.addEventListener('DOMContentLoaded',async()=>{
        try {
            const response=await fetch('data/integrations.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});
            if(!response.ok)throw Error('Unavailable');
            const data=(await response.json()).garmin;
            if(!data || !Array.isArray(data.recentRuns))throw Error('No data');
            set('runs-distance',km(data.monthDistanceKm));set('runs-count',data.monthRuns);
            set('runs-last',data.recentRuns[0] ? km(data.recentRuns[0].distanceKm) : '—');
            const month=new Date(data.month+'-01T12:00:00Z').toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
            set('runs-status',`Garmin · ${month} · обновлено ${new Date(data.updatedAt).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} МСК`);
            const list=document.getElementById('runs-list');list.replaceChildren();
            if(!data.recentRuns.length)list.textContent='За доступный период пробежек нет.';
            data.recentRuns.forEach(run=>{
                const card=document.createElement('article');card.className='run-card';
                const header=document.createElement('div');header.className='run-card-header';
                const h3=document.createElement('h3');h3.textContent=date(run.date);header.append(h3);
                if(Number.isSafeInteger(run.garminActivityId)&&run.garminActivityId>0){
                    const link=document.createElement('a');link.href=`https://connect.garmin.com/app/activity/${run.garminActivityId}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='В Garmin ↗';header.append(link);
                }
                const details=document.createElement('div');details.className='run-details';
                details.append(metric(km(run.distanceKm)+' км','Дистанция'),metric(duration(run.durationSeconds),'Время'),metric(duration(run.paceSecondsPerKm),'Темп, мин/км'));
                card.append(header,details);list.append(card);
            });
        }catch(_){set('runs-status','Не удалось загрузить тренировки. Попробуй обновить страницу. Профиль Garmin доступен по ссылке.');}
    });
})();

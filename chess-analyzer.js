// Public statistics first; the board opens only after selecting a game.
(() => {
    const username = 'peretoka73';
    let board, position, moves = [], moveIndex = 0, games = [], selectedIndex = -1;
    let snapshotPromise;
    const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
    async function json(url) {
        const response = await fetch(url, {signal: AbortSignal.timeout(12000)});
        if (!response.ok) throw Error(`HTTP ${response.status}`);
        return response.json();
    }
    function snapshot() {
        return snapshotPromise ||= json('data/integrations.json').then(d => {
            if (d.chess?.username !== username) throw Error('No saved data');
            return d.chess;
        });
    }
    function stats(data) {
        set('rapid-rating', data.chess_rapid?.last?.rating ?? '—');
        set('blitz-rating', data.chess_blitz?.last?.rating ?? '—');
        const records = ['chess_rapid','chess_blitz','chess_bullet','chess_daily'].map(k => data[k]?.record).filter(Boolean);
        const total = records.reduce((s,r) => s + (r.win || 0) + (r.loss || 0) + (r.draw || 0), 0);
        const wins = records.reduce((s,r) => s + (r.win || 0), 0);
        set('total-games', total.toLocaleString('ru-RU'));
        set('win-percentage', total ? Math.round(wins / total * 100) + '%' : '—');
        const draws=records.reduce((sum,r)=>sum+(r.draw||0),0),losses=records.reduce((sum,r)=>sum+(r.loss||0),0);
        for(const [name,count] of [['wins',wins],['draws',draws],['losses',losses]]) {
            set(name+'-count',count.toLocaleString('ru-RU'));
            document.getElementById(name+'-bar').style.width=(total ? count/total*100 : 0)+'%';
        }
        const table=document.getElementById('ratings-table');table.replaceChildren();
        for(const [key,label] of [['chess_rapid','Rapid'],['chess_blitz','Blitz'],['chess_bullet','Bullet'],['chess_daily','Daily']]) {
            const item=data[key],record=item?.record,row=document.createElement('tr');
            const values=[label,item?.last?.rating??'—',item?.best?.rating??'—',record ? (record.win||0)+(record.loss||0)+(record.draw||0) : '—'];
            for(const value of values){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
            table.append(row);
        }
    }
    async function loadStats() {
        try { stats(await json(`https://api.chess.com/pub/player/${username}/stats`)); }
        catch (_) { stats((await snapshot()).stats); }
    }
    function result(g) {
        return g.white?.result === 'win' ? '1–0' : g.black?.result === 'win' ? '0–1' : '½–½';
    }
    function renderGames() {
        const list = document.getElementById('games-list');
        list.replaceChildren();
        if (!games.length) { list.textContent = 'В последних доступных архивах партий нет.'; return; }
        games.forEach((g,i) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'game-item' + (i === selectedIndex ? ' active' : '');
            button.style.cssText = 'display:block;width:100%;text-align:left;background:transparent;color:inherit';
            const title = document.createElement('strong');
            title.textContent = `${g.white?.username || 'Белые'} — ${g.black?.username || 'Чёрные'} · ${result(g)}`;
            const details = document.createElement('div');
            details.className = 'game-info';
            details.textContent = `${g.end_time ? new Date(g.end_time * 1000).toLocaleDateString('ru-RU') : 'Импорт PGN'} · ${g.time_class || ''}`;
            const action=document.createElement('span');action.className='game-open';action.textContent='Посмотреть партию →';
            button.append(title, details, action);
            button.addEventListener('click', () => selectGame(i));
            list.append(button);
        });
    }
    function updatePosition() {
        if (!position || !board) return;
        board.position(position.fen());
        set('game-evaluation', `Ход ${Math.ceil(moveIndex / 2)} · ${moveIndex} из ${moves.length} полуходов`);
        document.getElementById('prev-move').disabled = moveIndex === 0;
        document.getElementById('next-move').disabled = moveIndex === moves.length;
        document.getElementById('first-move').disabled = moveIndex === 0;
        document.querySelectorAll('.move-button').forEach((button,index)=>{
            if(index+1===moveIndex)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
        });
    }
    function selectGame(index) {
        if (!window.Chess || !window.Chessboard) { set('chess-status','Доска не загрузилась. Откройте партию на Chess.com.'); return; }
        const parsed = new Chess();
        if (!parsed.load_pgn(games[index].pgn || '')) { set('chess-status','Не удалось прочитать PGN партии.'); return; }
        document.getElementById('stats').hidden=true;
        const review=document.getElementById('review');review.hidden=false;
        try {
            if(!board)board=Chessboard('chessboard',{position:'start',draggable:false,pieceTheme:'images/chesspieces/{piece}.png'});
            else board.resize();
        } catch(_){showOverview(false);set('chess-status','Доска временно недоступна.');return;}
        selectedIndex = index;
        moves = parsed.history();
        moveIndex = 0;
        position = new Chess();
        set('game-info', `${games[index].white?.username || 'Белые'} — ${games[index].black?.username || 'Чёрные'} · ${result(games[index])}`);
        const info = document.getElementById('game-info');
        if (/^https:\/\/www\.chess\.com\/game\//.test(games[index].url || '')) {
            const link = document.createElement('a');
            link.href = games[index].url; link.target = '_blank'; link.rel = 'noopener noreferrer';
            link.textContent = 'Открыть на Chess.com ↗'; link.style.display = 'block'; info.append(link);
        }
        const moveList=document.getElementById('move-list');moveList.replaceChildren();
        moves.forEach((move,i)=>{
            const button=document.createElement('button');button.type='button';button.className='move-button';
            button.textContent=(i%2===0 ? (Math.floor(i/2)+1)+'. ' : '')+move;
            button.setAttribute('aria-label','Перейти к полуходу '+(i+1)+': '+move);
            button.addEventListener('click',()=>seek(i+1));moveList.append(button);
        });
        renderGames(); updatePosition();
        document.getElementById('review-title').focus({preventScroll:true});review.scrollIntoView({block:'start'});
    }
    async function loadGames() {
        let imported;
        try {
            const base = `https://api.chess.com/pub/player/${username}`;
            const {archives = []} = await json(base + '/games/archives');
            imported = [];
            for (const url of archives.slice(-3)) {
                if (!url.startsWith(base + '/games/')) throw Error('Unexpected archive');
                imported.push(...(await json(url)).games || []);
            }
        } catch (_) { imported = (await snapshot()).games; }
        games = (imported || []).filter(g => g.rules === 'chess').sort((a,b) => b.end_time - a.end_time).slice(0,100);
        renderGames();

    }
    function seek(target){
        position=new Chess();moveIndex=0;
        for(let i=0;i<target;i++){position.move(moves[i]);moveIndex++;}
        updatePosition();
    }
    function showOverview(focus=true){
        document.getElementById('review').hidden=true;document.getElementById('stats').hidden=false;
        if(focus){const title=document.getElementById('stats-title');title.setAttribute('tabindex','-1');title.focus({preventScroll:true});document.getElementById('stats').scrollIntoView({block:'start'});}
    }
    async function refresh(kind = 'all') {
        const buttons = ['load-all-data','fetch-stats','fetch-games'].map(id => document.getElementById(id)).filter(Boolean);
        buttons.forEach(b => b.disabled = true);
        set('chess-status', 'Загружаю данные Chess.com…');
        try {
            if (kind !== 'games') await loadStats();
            if (kind !== 'stats') await loadGames();
            set('chess-status', 'Профиль peretoka73 · до 100 последних партий из трёх доступных месячных архивов.');
        } catch (_) { set('chess-status', 'Данные временно недоступны. Профиль доступен на Chess.com.'); }
        finally { buttons.forEach(b => b.disabled = false); }
    }
    document.addEventListener('DOMContentLoaded', () => {
        window.addEventListener('resize',()=>{if(!document.getElementById('review').hidden)board?.resize();});
        document.getElementById('back-to-stats').addEventListener('click',()=>showOverview());
        document.getElementById('first-move').addEventListener('click',()=>seek(0));
        document.getElementById('load-all-data')?.addEventListener('click', () => {showOverview(false);refresh();});
        document.getElementById('fetch-stats')?.addEventListener('click', () => refresh('stats'));
        document.getElementById('fetch-games')?.addEventListener('click', () => refresh('games'));
        document.getElementById('prev-move')?.addEventListener('click', () => { if (moveIndex > 0) { position.undo(); moveIndex--; updatePosition(); } });
        document.getElementById('next-move')?.addEventListener('click', () => { if (moveIndex < moves.length) { position.move(moves[moveIndex++]); updatePosition(); } });
        document.getElementById('flip-board')?.addEventListener('click', () => board?.flip());
        refresh();
    });
})();

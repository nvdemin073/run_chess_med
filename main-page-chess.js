// Public Chess.com statistics; independent of analyzer/local browser history.
(() => {
    const username = 'peretoka73';
    const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
    function render(stats, updatedAt, saved) {
        const records = ['chess_rapid', 'chess_blitz', 'chess_bullet', 'chess_daily'].map(key => stats[key]?.record).filter(Boolean);
        const total = records.reduce((sum, r) => sum + (r.win || 0) + (r.loss || 0) + (r.draw || 0), 0);
        set('preview-chess-rating', stats.chess_rapid?.last?.rating ?? '—');
        set('preview-blitz-rating', stats.chess_blitz?.last?.rating ?? '—');
        set('preview-total-games', records.length ? total.toLocaleString('ru-RU') : '—');
        set('preview-games-status', `${saved ? 'Сохранённая статистика' : 'Данные Chess.com'} · ${new Date(updatedAt).toLocaleDateString('ru-RU')}`);
    }
    document.addEventListener('DOMContentLoaded', async () => {
        let saved = null;
        try {
            const response = await fetch('data/integrations.json', {cache: 'no-cache'});
            if (response.ok) saved = (await response.json()).chess;
            if (saved?.username === username && saved.stats) render(saved.stats, saved.updatedAt, true);
        } catch (_) { /* Try the public API even if snapshot is unavailable. */ }
        try {
            const response = await fetch(`https://api.chess.com/pub/player/${username}/stats`, {signal: AbortSignal.timeout(12000)});
            if (!response.ok) throw Error('API unavailable');
            const stats = await response.json();
            if (!Object.keys(stats).some(key => key.startsWith('chess_'))) throw Error('Invalid statistics');
            render(stats, new Date(), false);
        } catch (_) {
            if (!saved?.stats) set('preview-games-status', 'Статистика временно недоступна. Профиль Chess.com доступен по ссылке ниже.');
        }
    });
})();

// Garmin credentials never enter the browser; only selected metrics are public.
(() => {
    document.addEventListener('DOMContentLoaded', async () => {
        const panel = document.getElementById('run-live-stats');
        if (!panel) return;
        try {
            const response = await fetch('data/integrations.json', {cache: 'no-cache'});
            if (!response.ok) return;
            const data = (await response.json()).garmin;
            if (!data || !/^\d{4}-\d{2}$/.test(data.month)) return;
            document.getElementById('preview-total-runs').textContent = data.monthRuns.toLocaleString('ru-RU');
            document.getElementById('preview-total-distance').textContent = data.monthDistanceKm.toLocaleString('ru-RU', {maximumFractionDigits: 1});
            const month = new Date(data.month + '-01T12:00:00Z').toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});
            document.getElementById('preview-runs-status').textContent = `Garmin · ${month} · обновлено ${new Date(data.updatedAt).toLocaleDateString('ru-RU')}`;
            const last = data.recentRuns?.[0];
            if (last) {
                const pace = Math.round(last.paceSecondsPerKm);
                document.getElementById('preview-last-run').textContent = `Последняя пробежка: ${new Date(last.date + 'T12:00:00Z').toLocaleDateString('ru-RU')} · ${last.distanceKm.toLocaleString('ru-RU', {maximumFractionDigits: 2})} км · ${Math.floor(pace / 60)}:${String(pace % 60).padStart(2, '0')} мин/км`;
            }
            panel.hidden = false;
        } catch (_) { /* Keep the existing running section when sync is unavailable. */ }
    });
})();

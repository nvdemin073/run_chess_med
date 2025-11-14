// main-page-chess.js - добавляйте этот файл в index.html
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Инициализация шахматной статистики на главной');
    loadChessStatsOnMainPage();
});

function loadChessStatsOnMainPage() {
    // Пытаемся загрузить данные из localStorage
    const savedData = localStorage.getItem('chessMainPageData');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            console.log('📊 Загружаем данные для главной:', data);
            
            // Обновляем элементы на странице
            updateMainPageElements(data);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            showDefaultStats();
        }
    } else {
        console.log('ℹ️ Нет сохраненных данных, показываем заглушки');
        showDefaultStats();
    }
    
    // Слушаем сообщения от analyzer страницы
    window.addEventListener('message', function(event) {
        if (event.data.type === 'CHESS_STATS_UPDATE') {
            console.log('🔄 Получено обновление от analyzer:', event.data.data);
            updateMainPageElements(event.data.data);
            // Сохраняем для будущих загрузок
            localStorage.setItem('chessMainPageData', JSON.stringify(event.data.data));
        }
    });
}

function updateMainPageElements(data) {
    const elements = {
        'preview-chess-rating': data.rapidRating,
        'preview-total-games': data.totalGames,
        'preview-win-percentage': data.winPercentage + '%',
        'preview-games-status': 'Обновлено: ' + new Date().toLocaleTimeString()
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`✅ Обновлен ${id}: ${value}`);
        }
    }
}

function showDefaultStats() {
    // Показываем базовые данные или сообщения о загрузке
    const elements = {
        'preview-chess-rating': '-',
        'preview-total-games': '0',
        'preview-win-percentage': '0%',
        'preview-games-status': 'Откройте анализатор для загрузки'
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }
}
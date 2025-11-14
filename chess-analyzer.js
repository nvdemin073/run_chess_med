// chess-analyzer.js
let games = JSON.parse(localStorage.getItem('chessGames')) || [];
let currentGameIndex = -1;
let board = null;
let game = new Chess();
const CHESS_USERNAME = 'peretoka73';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Инициализация для пользователя:', CHESS_USERNAME);
    
    // Показываем что страница загрузилась
    showNotification('🔄 Страница загружается...');
    
    initializeChessboard();
    setupEventListeners();
    
    // Автозагрузка с небольшой задержкой чтобы все успело инициализироваться
    setTimeout(() => {
        loadChessData();
    }, 1000);
});

function initializeChessboard() {
    console.log('♟️ Инициализация шахматной доски...');
    
    try {
        const config = {
            draggable: true,
            position: 'start',
            pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        };
        
        board = Chessboard('chessboard', config);
        console.log('✅ Шахматная доска инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации доски:', error);
    }
}

function onDragStart(source, piece, position, orientation) {
    return false;
}

function onDrop(source, target) {
    return 'snapback';
}

function onSnapEnd() {
    board.position(game.fen());
}

function setupEventListeners() {
    console.log('🔄 Настройка обработчиков...');
    
    // Проверяем существование элементов перед добавлением обработчиков
    const elements = {
        'load-all-data': 'loadChessData',
        'fetch-games': 'fetchChessComGames', 
        'fetch-stats': 'fetchChessComStats',
        'load-pgn': 'loadPGN',
        'prev-move': 'prevMove',
        'next-move': 'nextMove',
        'flip-board': 'flipBoard'
    };
    
    for (const [id, handler] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', window[handler]);
            console.log(`✅ Обработчик для #${id} добавлен`);
        } else {
            console.warn(`❌ Элемент #${id} не найден`);
        }
    }
    
    // Устанавливаем username в поле
    const usernameField = document.getElementById('chess-username');
    if (usernameField) {
        usernameField.value = CHESS_USERNAME;
    }
}

// === ОСНОВНАЯ ФУНКЦИЯ ===
async function loadChessData() {
    console.log('🚀 ЗАПУСК loadChessData');
    
    try {
        showNotification('🔄 Загружаю статистику и партии...');
        
        // Загружаем последовательно чтобы видеть прогресс
        await fetchChessComStats();
        await fetchChessComGames();
        
        showNotification('✅ Все данные загружены! 🎉');
        
    } catch (error) {
        console.error('💥 Ошибка в loadChessData:', error);
        showNotification('❌ Ошибка загрузки: ' + error.message);
    }
}

// === СТАТИСТИКА ===
async function fetchChessComStats() {
    console.log('📊 ЗАПУСК fetchChessComStats');
    
    try {
        const url = `https://api.chess.com/pub/player/${CHESS_USERNAME}/stats`;
        console.log('📡 Запрос к:', url);
        
        const response = await fetch(url);
        console.log('📡 Ответ:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const stats = await response.json();
        console.log('📊 Получены данные:', stats);
        
        updateChessComStats(stats);
        
    } catch (error) {
        console.error('❌ Ошибка fetchChessComStats:', error);
        showNotification('❌ Ошибка статистики: ' + error.message);
    }
}

function updateChessComStats(stats) {
    console.log('🔄 ЗАПУСК updateChessComStats');
    
    // Список всех элементов которые мы будем обновлять
    const elementsToUpdate = [
        'rapid-rating', 'blitz-rating', 'best-rating', 'win-percentage',
        'rapid-trend', 'blitz-trend', 'total-games',
        'preview-chess-rating', 'preview-total-games'
    ];
    
    // Проверяем какие элементы существуют
    elementsToUpdate.forEach(id => {
        const element = document.getElementById(id);
        console.log(`🔍 Элемент #${id}:`, element ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
    });
    
    // Rapid рейтинг
    if (stats.chess_rapid?.last?.rating) {
        const rapidRating = stats.chess_rapid.last.rating;
        console.log('🎯 Rapid рейтинг:', rapidRating);
        
        safeSetText('rapid-rating', rapidRating);
        safeSetText('preview-chess-rating', rapidRating);
        
        // Тренд
        const bestRapid = stats.chess_rapid.best?.rating || 0;
        const trendRapid = rapidRating - (bestRapid - 20);
        safeSetText('rapid-trend', getTrendText(trendRapid));
        
        // Процент побед
        if (stats.chess_rapid.record) {
            const record = stats.chess_rapid.record;
            const total = record.win + record.loss + record.draw;
            const winPercentage = total > 0 ? Math.round((record.win / total) * 100) : 0;
            safeSetText('win-percentage', winPercentage + '%');
        }
    }
    
    // Blitz рейтинг
    if (stats.chess_blitz?.last?.rating) {
        const blitzRating = stats.chess_blitz.last.rating;
        console.log('🎯 Blitz рейтинг:', blitzRating);
        
        safeSetText('blitz-rating', blitzRating);
        
        const bestBlitz = stats.chess_blitz.best?.rating || 0;
        const trendBlitz = blitzRating - (bestBlitz - 20);
        safeSetText('blitz-trend', getTrendText(trendBlitz));
    }
    
    // Лучший рейтинг
    const bestRating = Math.max(
        stats.chess_rapid?.best?.rating || 0,
        stats.chess_blitz?.best?.rating || 0,
        stats.chess_bullet?.best?.rating || 0
    );
    safeSetText('best-rating', bestRating > 0 ? bestRating : '-');
    
    console.log('✅ Статистика обновлена');
    showNotification('✅ Статистика загружена! Rapid: ' + (stats.chess_rapid?.last?.rating || '-'));
}

function safeSetText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
        console.log(`✅ Обновлен #${id}: ${text}`);
    } else {
        console.warn(`❌ Не могу обновить #${id} - элемент не найден`);
    }
}

function getTrendText(trend) {
    if (trend >= 10) return '🔥 +' + trend;
    if (trend >= 0) return '↗️ +' + trend;
    return '↘️ ' + trend;
}

// === ПАРТИИ ===
async function fetchChessComGames() {
    console.log('♟️ ЗАПУСК fetchChessComGames');
    
    try {
        const archivesUrl = `https://api.chess.com/pub/player/${CHESS_USERNAME}/games/archives`;
        console.log('📡 Запрос архивов:', archivesUrl);
        
        const archivesResponse = await fetch(archivesUrl);
        console.log('📡 Ответ архивов:', archivesResponse.status);
        
        if (!archivesResponse.ok) {
            throw new Error('Не удалось получить архивы партий');
        }
        
        const archives = await archivesResponse.json();
        console.log('📁 Найдено архивов:', archives.archives?.length || 0);
        
        let allGames = [];
        const recentArchives = archives.archives?.slice(-3) || [];
        
        console.log('📂 Загружаем архивы:', recentArchives.length);
        
        for (const archiveUrl of recentArchives) {
            try {
                console.log('📥 Загрузка архива:', archiveUrl);
                const gamesResponse = await fetch(archiveUrl);
                if (gamesResponse.ok) {
                    const monthlyGames = await gamesResponse.json();
                    console.log('📊 Партий в архиве:', monthlyGames.games?.length || 0);
                    allGames = allGames.concat(monthlyGames.games || []);
                }
            } catch (error) {
                console.warn('⚠️ Ошибка архива:', error);
            }
        }
        
        console.log('🎯 Всего загружено партий:', allGames.length);
        
        if (allGames.length === 0) {
            throw new Error('Не найдено партий');
        }
        
        processImportedGames(allGames);
        
    } catch (error) {
        console.error('❌ Ошибка fetchChessComGames:', error);
        showNotification('❌ Ошибка партий: ' + error.message);
    }
}

function processImportedGames(chessComGames) {
    console.log('🔄 Обработка', chessComGames.length, 'партий');
    
    const newGames = chessComGames.map(chessComGame => ({
        id: Date.now() + Math.random(),
        pgn: chessComGame.pgn,
        date: new Date(chessComGame.end_time * 1000).toISOString().split('T')[0],
        white: chessComGame.white?.username || 'Unknown',
        black: chessComGame.black?.username || 'Unknown',
        result: getGameResult(chessComGame),
        timeControl: chessComGame.time_control || '?',
        rules: chessComGame.rules || 'chess',
        eco: chessComGame.eco || ''
    }));

    // Сохраняем только уникальные партии
    const existingGameIds = new Set(games.map(g => g.pgn));
    const uniqueNewGames = newGames.filter(game => !existingGameIds.has(game.pgn));
    
    console.log('🎯 Новых уникальных партий:', uniqueNewGames.length);
    
    games = [...uniqueNewGames, ...games].slice(0, 100);
    localStorage.setItem('chessGames', JSON.stringify(games));
    
    loadGames();
    updateStats();
    
    showNotification(`✅ Загружено ${uniqueNewGames.length} партий!`);
}

function getGameResult(chessComGame) {
    if (chessComGame.white?.result === 'win') return '1-0';
    if (chessComGame.black?.result === 'win') return '0-1';
    return '1/2-1/2';
}

function loadPGN() {
    const pgnText = document.getElementById('pgn-input')?.value.trim();
    if (!pgnText) {
        alert('Введите PGN партии');
        return;
    }

    try {
        const newGame = {
            id: Date.now(),
            pgn: pgnText,
            date: new Date().toISOString().split('T')[0],
            white: 'Unknown',
            black: 'Unknown',
            result: '*',
            timeControl: '?',
            rules: 'chess',
            eco: ''
        };

        const pgnLines = pgnText.split('\n');
        pgnLines.forEach(line => {
            if (line.startsWith('[White ')) newGame.white = line.split('"')[1];
            if (line.startsWith('[Black ')) newGame.black = line.split('"')[1];
            if (line.startsWith('[Result ')) newGame.result = line.split('"')[1];
            if (line.startsWith('[ECO ')) newGame.eco = line.split('"')[1];
        });

        games.unshift(newGame);
        localStorage.setItem('chessGames', JSON.stringify(games));
        loadGames();
        updateStats();
        showNotification('✅ PGN партия загружена!');
        
    } catch (error) {
        console.error('Ошибка загрузки PGN:', error);
        showNotification('❌ Ошибка в формате PGN');
    }
}

// === ОСТАЛЬНЫЕ ФУНКЦИИ ===
function loadGames() {
    const gamesList = document.getElementById('games-list');
    
    if (!gamesList) {
        console.warn('❌ Элемент #games-list не найден');
        return;
    }
    
    if (games.length === 0) {
        gamesList.innerHTML = '<div class="empty-state"><p>Пока нет партий</p></div>';
        return;
    }

    gamesList.innerHTML = games.map((game, index) => `
        <div class="game-item ${index === currentGameIndex ? 'active' : ''}" 
             onclick="loadGameToBoard(${index})">
            <div class="game-info">
                <strong>${game.white} vs ${game.black}</strong>
                <span class="game-result">${game.result}</span>
            </div>
            <div class="game-info">
                <span>${game.date}</span>
                <span>${game.timeControl}</span>
            </div>
            ${game.eco ? `<div style="color: var(--text-secondary); font-size: 0.8rem;">${game.eco}</div>` : ''}
        </div>
    `).join('');
}

function loadGameToBoard(index) {
    currentGameIndex = index;
    const selectedGame = games[index];
    
    const gameInfo = document.getElementById('game-info');
    if (gameInfo) {
        gameInfo.innerHTML = `
            <p><strong>Белые:</strong> ${selectedGame.white}</p>
            <p><strong>Чёрные:</strong> ${selectedGame.black}</p>
            <p><strong>Результат:</strong> ${selectedGame.result}</p>
            <p><strong>Дата:</strong> ${selectedGame.date}</p>
            <p><strong>Контроль:</strong> ${selectedGame.timeControl}</p>
            ${selectedGame.eco ? `<p><strong>Дебют:</strong> ${selectedGame.eco}</p>` : ''}
        `;
    }
    
    game.load_pgn(selectedGame.pgn);
    board.position(game.fen());
    loadGames();
}

function prevMove() {
    if (currentGameIndex === -1) return;
    game.undo();
    board.position(game.fen());
    updatePosition();
}

function nextMove() {
    if (currentGameIndex === -1) return;
    const selectedGame = games[currentGameIndex];
    game.load_pgn(selectedGame.pgn);
    board.position(game.fen());
    updatePosition();
}

function flipBoard() {
    board.flip();
}

function updatePosition() {
    const evaluation = document.getElementById('game-evaluation');
    if (evaluation) {
        evaluation.textContent = 'Оценка позиции: 0.00';
    }
}

function updateStats() {
    safeSetText('total-games', games.length);
    safeSetText('preview-total-games', games.length);
    
    // Процент побед
    const wins = games.filter(g => 
        (g.white.toLowerCase() === CHESS_USERNAME.toLowerCase() && g.result === '1-0') ||
        (g.black.toLowerCase() === CHESS_USERNAME.toLowerCase() && g.result === '0-1')
    ).length;
    
    const winPercentage = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;
    safeSetText('win-percentage', winPercentage + '%');
}

function showNotification(message) {
    console.log('📢 Уведомление:', message);
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        background: var(--gold);
        color: var(--bg-dark);
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: bold;
        border: 2px solid var(--border);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Добавим функцию для принудительной загрузки
function forceLoad() {
    console.clear();
    console.log('🔄 ПРИНУДИТЕЛЬНАЯ ЗАГРУЗКА');
    loadChessData();
}





// Функция для обновления главной страницы
function updateMainPageStats(stats, gamesCount) {
    console.log('🔄 Обновляю главную страницу...');
    
    // Сохраняем данные в localStorage чтобы главная страница могла их прочитать
    const mainPageData = {
        rapidRating: stats.chess_rapid?.last?.rating || '-',
        totalGames: gamesCount,
        winPercentage: stats.chess_rapid?.record ? 
            Math.round((stats.chess_rapid.record.win / (stats.chess_rapid.record.win + stats.chess_rapid.record.loss + stats.chess_rapid.record.draw)) * 100) : 0,
        lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem('chessMainPageData', JSON.stringify(mainPageData));
    console.log('💾 Данные для главной страницы сохранены:', mainPageData);
    
    // Если мы в iframe или можем обновить родительское окно
    if (window.parent && window.parent !== window) {
        try {
            window.parent.postMessage({
                type: 'CHESS_STATS_UPDATE',
                data: mainPageData
            }, '*');
        } catch (error) {
            console.log('⚠️ Не удалось обновить родительское окно');
        }
    }
}

// Обновите функцию updateChessComStats
function updateChessComStats(stats) {
    console.log('🔄 ЗАПУСК updateChessComStats');
    
    // Rapid рейтинг
    if (stats.chess_rapid?.last?.rating) {
        const rapidRating = stats.chess_rapid.last.rating;
        console.log('🎯 Rapid рейтинг:', rapidRating);
        
        safeSetText('rapid-rating', rapidRating);
        safeSetText('preview-chess-rating', rapidRating);
        
        // Тренд
        const bestRapid = stats.chess_rapid.best?.rating || 0;
        const trendRapid = rapidRating - (bestRapid - 20);
        safeSetText('rapid-trend', getTrendText(trendRapid));
        safeSetText('preview-chess-trend', getTrendText(trendRapid));
        
        // Процент побед
        if (stats.chess_rapid.record) {
            const record = stats.chess_rapid.record;
            const total = record.win + record.loss + record.draw;
            const winPercentage = total > 0 ? Math.round((record.win / total) * 100) : 0;
            safeSetText('win-percentage', winPercentage + '%');
            safeSetText('preview-win-percentage', winPercentage + '%');
        }
    }
    
    // Blitz рейтинг
    if (stats.chess_blitz?.last?.rating) {
        const blitzRating = stats.chess_blitz.last.rating;
        console.log('🎯 Blitz рейтинг:', blitzRating);
        
        safeSetText('blitz-rating', blitzRating);
        
        const bestBlitz = stats.chess_blitz.best?.rating || 0;
        const trendBlitz = blitzRating - (bestBlitz - 20);
        safeSetText('blitz-trend', getTrendText(trendBlitz));
    }
    
    // Лучший рейтинг
    const bestRating = Math.max(
        stats.chess_rapid?.best?.rating || 0,
        stats.chess_blitz?.best?.rating || 0,
        stats.chess_bullet?.best?.rating || 0
    );
    safeSetText('best-rating', bestRating > 0 ? bestRating : '-');
    
    // Обновляем главную страницу
    updateMainPageStats(stats, games.length);
    
    console.log('✅ Статистика обновлена');
    showNotification('✅ Статистика загружена! Rapid: ' + (stats.chess_rapid?.last?.rating || '-'));
}
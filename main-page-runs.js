// main-page-runs.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏃 Загрузка статистики пробежек на главной');
    loadRunStats();
});

function loadRunStats() {
    const savedData = localStorage.getItem('runMainPageData');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            console.log('📊 Данные пробежек для главной:', data);
            updateRunElements(data);
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            showDefaultStats();
        }
    } else {
        // Если данных нет, создаем пустые
        updateMainPageRunStats();
        showDefaultStats();
    }
}

function updateRunElements(data) {
    const elements = {
        'preview-total-runs': data.totalRuns || '0',
        'preview-total-distance': data.totalDistance || '0', 
        'preview-runs-status': 'Обновлено: ' + new Date().toLocaleTimeString()
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
    updateRunElements({
        totalRuns: '0',
        totalDistance: '0',
        lastUpdate: new Date().toISOString()
    });
}

// Принудительное обновление
function refreshRunStats() {
    updateMainPageRunStats();
    loadRunStats();
    showNotification('🔄 Статистика пробежек обновлена');
}
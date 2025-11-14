// user-data.js
const USER_ID = 'peretoka73';
const GARMIN_USER_ID = '7ef0ff16-b8da-415d-9f94-3f4ee97d0d64';

// Добавим флаг источника данных
function saveUserRun(runData) {
    const allRuns = JSON.parse(localStorage.getItem('runs')) || [];
    
    runData.userId = USER_ID;
    runData.id = Date.now();
    runData.source = runData.source || 'manual'; // 'manual' или 'garmin'
    runData.createdAt = new Date().toISOString();
    
    allRuns.unshift(runData);
    localStorage.setItem('runs', JSON.stringify(allRuns));
    
    updateMainPageRunStats();
    return runData;
}
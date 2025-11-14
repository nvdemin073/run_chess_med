// Функция открытия модального окна с фото
function openPhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalPhoto');
    const userPhoto = document.querySelector('.user-photo');
    
    if (modal && modalImg && userPhoto) {
        modalImg.src = userPhoto.src;
        modalImg.alt = userPhoto.alt;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку
    }
}

// Функция закрытия модального окна
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Возвращаем прокрутку
    }
}

// Закрытие по клику вне фото
document.addEventListener('click', function(event) {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalPhoto');
    
    if (modal && modal.style.display === 'block') {
        if (event.target === modal) {
            closePhotoModal();
        }
    }
});


// Закрытие по клавише ESC
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('photoModal');
    
    if (modal && modal.style.display === 'block' && event.key === 'Escape') {
        closePhotoModal();
    }
});


// Функция открытия модального окна с фото
function openPhotoModal() {
    console.log('Клик на фото!');
    
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalPhoto');
    const userPhoto = document.querySelector('img[src="./images/my-photo.jpg"]');
    
    if (modal && modalImg && userPhoto) {
        modalImg.src = userPhoto.src;
        modal.style.display = 'block';
        console.log('Модальное окно открыто!');
    } else {
        console.log('Не найдены элементы:', {modal, modalImg, userPhoto});
    }
}

// Функция закрытия модального окна
function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Закрытие по клику вне фото
document.addEventListener('click', function(event) {
    const modal = document.getElementById('photoModal');
    if (event.target === modal) {
        closePhotoModal();
    }
});

// Закрытие по клавише ESC
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('photoModal');
    if (modal && modal.style.display === 'block' && event.key === 'Escape') {
        closePhotoModal();
    }
});

console.log('Скрипт загружен! Функции openPhotoModal и closePhotoModal доступны');



// Анимация появления элементов при скролле
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.content-with-image').forEach(element => {
    observer.observe(element);
});

// Плавная прокрутка для навигации
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

<section id="prayer" class="fullscreen-section clickable-section" onclick="openPrayerMenu()">
    <div class="content">
        <h1>Медитация</h1>
        <p>Духовный путь и размышления</p>
        
        <div class="content-with-image fade-in">
            <div class="content-text">
                <h2>Внутренняя гармония</h2>
                <p>Молитва как способ обретения внутреннего покоя и связи с высшими силами. Здесь я делюсь своими духовными insights и размышлениями.</p>
                
                <p class="click-hint">↓ Нажмите на эту секцию, чтобы открыть меню молитв</p>
            </div>
            <div class="content-image">
                <img src="./images/prayer-photo.jpg" alt="Молитва" loading="lazy">
            </div>
        </div>
    </div>
</section>

<!-- Модальное окно выбора -->
<div id="prayer-modal" class="modal">
    <div class="modal-content prayer-modal">
        <span class="close-modal" onclick="closePrayerModal()">&times;</span>
        <h2>Молитвы и медитации</h2>
        <div class="prayer-options">
            <div class="prayer-option" onclick="location.href='prayer-add.html'">
                <h3>➕ Добавить молитву</h3>
                <p>Записать новую молитву или размышление</p>
            </div>
            <div class="prayer-option" onclick="location.href='prayer-diary.html'">
                <h3>📖 Дневник молитв</h3>
                <p>Посмотреть историю ваших молитв</p>
            </div>
        </div>
        <button class="close-btn" onclick="closePrayerModal()">Закрыть</button>
    </div>
</div>


// Открытие модального окна молитв
function openPrayerMenu() {
    document.getElementById('prayer-modal').style.display = 'block';
}

// Закрытие модального окна молитв
function closePrayerModal() {
    document.getElementById('prayer-modal').style.display = 'none';
}

// Закрытие при клике вне окна
window.onclick = function(event) {
    const modal = document.getElementById('prayer-modal');
    if (event.target === modal) {
        closePrayerModal();
    }
}


function openRunDiary() {
    // Можно сделать переход на страницу или открыть модальное окно
    alert('Беговой дневник будет добавлен позже');
}
// Общие действия главной страницы.
function openPhotoModal() {
    const modal = document.getElementById('photoModal');
    const photo = document.querySelector('.user-photo');
    const enlarged = document.getElementById('modalPhoto');
    if (!modal || !photo || !enlarged) return;
    enlarged.src = photo.src;
    enlarged.alt = photo.alt;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('click', function(event) {
    if (event.target === document.getElementById('photoModal')) closePhotoModal();
});
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closePhotoModal();
});

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.content-with-image').forEach(function(element) {
        observer.observe(element);
    });
}

document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(event) {
        const id = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

function openRunDiary() {
    alert('Беговой дневник будет добавлен позже');
}

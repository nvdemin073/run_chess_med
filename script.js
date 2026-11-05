const photoDialog = document.getElementById('photoModal');
let previousPhotoFocus = null;
function closePhotoModal() {
    if (!photoDialog?.open) return;
    photoDialog.close();
}
document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
        const image = document.getElementById('modalPhoto');
        if (!image || !photoDialog) return;
        previousPhotoFocus = button;
        image.src = button.dataset.photo;
        image.alt = button.querySelector('img')?.alt || 'Фотография';
        photoDialog.showModal();
        document.body.style.overflow = 'hidden';
    });
});
photoDialog?.querySelector('.close-modal')?.addEventListener('click', closePhotoModal);
photoDialog?.addEventListener('click', event => {
    if (event.target === photoDialog) closePhotoModal();
});
photoDialog?.addEventListener('close', () => {
    document.body.style.overflow = '';
    previousPhotoFocus?.focus();
});

// Навигация остаётся доступной без JavaScript; CSS учитывает reduced motion.
if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.main-nav a')];
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(link => {
                const active = link.getAttribute('href') === '#' + entry.target.id;
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-20% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section));
}

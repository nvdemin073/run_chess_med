const copyButton = document.getElementById('copy-camp');
const pitch = document.getElementById('camp-pitch');
const status = document.getElementById('copy-status');
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(pitch.value.trim());
    status.textContent = 'Карточка скопирована — можно отправить будущему партнёру.';
  } catch {
    const fallback = document.getElementById('copy-fallback');
    fallback.hidden = false;
    fallback.open = true;
    pitch.focus();
    pitch.select();
    status.textContent = 'Выделил текст карточки. Скопируйте его вручную.';
  }
});

const GAME_BUILD_VERSION = '20260714-player-tip';
const params = new URLSearchParams(window.location.search);
const slug = params.get('game') || '';
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
const expectedSrc = validSlug ? `media/games/${slug}/index.html` : '';
const works = Array.isArray(window.portfolioWorks) ? window.portfolioWorks : [];
const game = works.find(work => work.type === 'game' && work.src === expectedSrc);

const frame = document.getElementById('gameFrame');
const title = document.getElementById('gameTitle');
const loading = document.getElementById('gameLoading');
const error = document.getElementById('gameError');

if (!game) {
  frame.hidden = true;
  loading.hidden = true;
  error.hidden = false;
} else {
  title.textContent = game.title;
  frame.title = game.title;
  document.title = `${game.title} — 王帆作品集`;
  frame.addEventListener('load', () => {
    loading.hidden = true;
  }, { once: true });
  frame.src = `${game.src}?v=${GAME_BUILD_VERSION}`;
}

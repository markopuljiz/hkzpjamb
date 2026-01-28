import './index.css';

// Do not put application logic in this file. Keep `main.js` as a tiny bootstrap only.

import { init, applyAutoScore, resetGame, najavaExports, updateState } from './game/gameplay';
import { initDebugMode } from './debugMode.js';

Object.assign(window, {
  resetGame,
  applyAutoScore,
  ...najavaExports
});

function initLanding() {
  const landing = document.getElementById('landing');
  const app = document.getElementById('app');
  const singleBtn = document.getElementById('start-single');
  const homeLink = document.getElementById('home-link');

  if (!landing || !app || !singleBtn || !homeLink) return;

  const showLanding = () => {
    landing.classList.remove('hidden');
    app.classList.add('hidden');
  };

  const showApp = () => {
    landing.classList.add('hidden');
    app.classList.remove('hidden');
  };

  const syncViewWithHash = () => {
    if (window.location.hash === '#single') {
      showApp();
    } else {
      showLanding();
    }
  };

  singleBtn.addEventListener('click', () => {
    window.location.hash = 'single';
  });

  homeLink.addEventListener('click', () => {
    window.location.hash = '';
  });

  window.addEventListener('hashchange', syncViewWithHash);
  syncViewWithHash();
}

init();
initDebugMode({ updateState });
initLanding();

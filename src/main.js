import './index.css';

// Do not put application logic in this file. Keep `main.js` as a tiny bootstrap only.

import { init, applyAutoScore, resetGame, najavaExports, updateState } from './game/gameplay';
import { initDebugMode } from './debugMode.js';
import { initMultiplayer } from './multiplayer.js';
import { getMultiplayerSession } from './multiplayerState.js';
import { initMultiplayerScores } from './multiplayerScores.js';

Object.assign(window, {
  resetGame,
  applyAutoScore,
  ...najavaExports
});

function initLanding() {
  const landing = document.getElementById('landing');
  const app = document.getElementById('app');
  const multiplayer = document.getElementById('multiplayer');
  const lobby = document.getElementById('lobby');
  const singleBtn = document.getElementById('start-single');
  const multiBtn = document.getElementById('start-multi');
  const homeLink = document.getElementById('home-link');
  const multiHomeLink = document.getElementById('multi-home-link');
  const lobbyBackBtn = document.getElementById('lobby-back-btn');
  const resetBtn = document.getElementById('reset-btn');
  const viewScoresBtn = document.getElementById('view-scores-btn');
  const roomCodeLabel = document.getElementById('room-code-label');

  if (!landing || !app || !singleBtn || !homeLink || !multiplayer || !lobby || !multiBtn || !multiHomeLink || !lobbyBackBtn) {
    return;
  }

  const multiplayerController = initMultiplayer({
    onNavigate: (path) => {
      window.history.pushState({}, '', path);
      syncViewWithPath();
    }
  });

  let lastLobbyCode = null;

  const hideAll = () => {
    landing.classList.add('hidden');
    app.classList.add('hidden');
    multiplayer.classList.add('hidden');
    lobby.classList.add('hidden');
  };

  const showSection = (section) => {
    hideAll();
    section.classList.remove('hidden');
    section.dispatchEvent(new Event('show'));
  };

  const syncHeaderActions = (sessionActive, sessionCode) => {
    if (resetBtn) resetBtn.classList.toggle('hidden', sessionActive);
    if (viewScoresBtn) viewScoresBtn.classList.toggle('hidden', !sessionActive);
    if (roomCodeLabel) roomCodeLabel.textContent = sessionActive && sessionCode ? sessionCode : 'Dual Jamb';
  };

  const syncViewWithPath = async () => {
    const path = window.location.pathname.replace(/\/$/, '');
    const codeMatch = path.match(/^\/(?:lobby\/)?([A-Za-z]{4})$/);

    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();
      const session = getMultiplayerSession();
      if (session.active && session.roomCode === code) {
        showSection(app);
        syncHeaderActions(true, session.roomCode);
        return;
      }

      showSection(lobby);
      syncHeaderActions(false, null);
      if (code && code !== lastLobbyCode) {
        lastLobbyCode = code;
        await multiplayerController?.enterLobby(code);
      }
      return;
    }

    lastLobbyCode = null;
    multiplayerController?.resetLobby();

    if (path === '/single') {
      showSection(app);
      syncHeaderActions(false, null);
      return;
    }

    if (path === '/multi') {
      showSection(multiplayer);
      syncHeaderActions(false, null);
      return;
    }

    showSection(landing);
    syncHeaderActions(false, null);
  };

  singleBtn.addEventListener('click', () => {
    window.history.pushState({}, '', '/single');
    syncViewWithPath();
  });

  multiBtn.addEventListener('click', () => {
    window.history.pushState({}, '', '/multi');
    syncViewWithPath();
  });

  homeLink.addEventListener('click', () => {
    window.history.pushState({}, '', '/');
    syncViewWithPath();
  });

  multiHomeLink.addEventListener('click', () => {
    window.history.pushState({}, '', '/');
    syncViewWithPath();
  });

  lobbyBackBtn.addEventListener('click', () => {
    window.history.pushState({}, '', '/multi');
    syncViewWithPath();
  });

  window.addEventListener('popstate', syncViewWithPath);
  syncViewWithPath();
}

init();
initDebugMode({ updateState });
initMultiplayerScores();
initLanding();

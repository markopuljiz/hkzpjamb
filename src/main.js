import './index.css';

// Do not put application logic in this file. Keep `main.js` as a tiny bootstrap only.

import { init, applyAutoScore, resetGame, najavaExports, updateState } from './game/gameplay';
import { initDebugMode } from './debugMode.js';

Object.assign(window, {
  resetGame,
  applyAutoScore,
  ...najavaExports
});

init();
initDebugMode({ updateState });

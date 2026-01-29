import { rows, tables } from './config';
import { updatePeerGhost } from './ghosts';
import { openNajavaModal, closeNajavaModal, selectNajava } from './najava';
import { calculateColumn, getPreviewScore, isRowAllowed } from './scoring';
import { clearDiceState, loadScores, saveScores } from './storage';
import { renderTableContainer } from './tableRender';
import { initDiceRoller } from './diceRoller';
import { initSubmitPreviewToggle } from './submitPreview';
import { initFontSizeToggle } from './fontSizeToggle';
import { initDarkModeToggle } from './darkModeToggle';
import { state } from './state';
import { initUndo, isUndoInProgress, registerUndoWrite } from './undo';
import { supabase } from '../supabaseClient.js';
import { getMultiplayerSession } from '../multiplayerState.js';

async function persistMultiplayerScore(tableId: string, colIndex: number, rowId: string, val: number | null) {
  if (!supabase) return;
  const session = getMultiplayerSession();
  if (!session.active || !session.roomId || !session.sessionId) return;

  await supabase
    .from('yamb_scores')
    .upsert(
      {
        room_id: session.roomId,
        session_id: session.sessionId,
        table_id: tableId,
        column_index: colIndex,
        row_id: rowId,
        value: val,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'room_id,session_id,table_id,column_index,row_id' }
    );
}

declare global {
  interface Window {
    resetRollState?: () => void;
  }
}

export function init() {
  tables.forEach((t) => renderTableContainer(t));
  loadScores();
  initDiceRoller();
  initSubmitPreviewToggle();
  initFontSizeToggle();
  initDarkModeToggle();
  initUndo(updateState);
}

export function updateState(tableId: string, colIndex: number, rowId: string, val: number | null) {
  if (!state.allScores[tableId]) state.allScores[tableId] = {};
  const colKey = String(colIndex);
  if (!state.allScores[tableId][colKey]) state.allScores[tableId][colKey] = {};

  const prevValue = state.allScores[tableId][colKey][rowId] ?? null;
  if (!isUndoInProgress() && prevValue !== val) {
    registerUndoWrite(tableId, colIndex, rowId, prevValue);
  }

  state.allScores[tableId][colKey][rowId] = val;

  const el = document.getElementById(`${tableId}_c${colIndex}_${rowId}`) as HTMLInputElement | null;
  if (el) {
    if (String(el.value) !== String(val ?? '')) {
      el.value = val === null ? '' : String(val);
    }

    if (val === 0) {
      el.parentElement?.classList.add('crossed-out');
    } else {
      el.parentElement?.classList.remove('crossed-out');
    }
  }

  calculateColumn(tableId, colIndex);
  updatePeerGhost(tableId, colIndex, rowId, val);
  saveScores();
  persistMultiplayerScore(tableId, colIndex, rowId, val);

  if (val !== null && typeof window.resetRollState === 'function') {
    window.resetRollState();
  }
}

export function applyAutoScore(tableId: string, colIndex: number, rowId: string) {
  const rowConfig = rows.find((row) => row.id === rowId);
  if (!rowConfig || rowConfig.isSum) return;

  const inputEl = document.getElementById(`${tableId}_c${colIndex}_${rowId}`) as HTMLInputElement | null;
  if (!inputEl || inputEl.value !== '') return;
  if (!state.submitPreviewActive && !state.najavaActive) return;
  if (!isRowAllowed(tableId, colIndex, rowId)) return;

  const diceCounts = Array(7).fill(0);
  let diceSum = 0;
  state.diceValues.forEach((val) => {
    if (val === null) return;
    diceCounts[val] += 1;
    diceSum += val;
  });

  const score = getPreviewScore(rowConfig, diceCounts, diceSum);
  updateState(tableId, colIndex, rowId, score);
}

export function resetGame() {
  if (confirm('Clear ALL scores?')) {
    localStorage.removeItem('dual_jamb_scores_v10');
    clearDiceState();

    state.allScores = { t1: {}, t2: {} };

    document.querySelectorAll('input').forEach((i) => {
      (i as HTMLInputElement).value = '';
    });

    document.querySelectorAll('[id*="_sum"]').forEach((s) => {
      s.innerHTML = '0';
      s.removeAttribute('data-val');
      s.removeAttribute('data-bonus');
    });

    document
      .querySelectorAll('[id*="_total_"], span[id*="grand-total"]')
      .forEach((s) => {
        (s as HTMLElement).innerText = '0';
      });

    const superEl = document.getElementById('super-total');
    if (superEl) superEl.innerText = '0';

    document.querySelectorAll('.row-bonus-active').forEach((el) => el.classList.remove('row-bonus-active'));
    document.querySelectorAll('.crossed-out').forEach((el) => el.classList.remove('crossed-out'));
    document
      .querySelectorAll('[id*="_badge_"], [id$="-extra-badge"]')
      .forEach((el) => el.classList.add('hidden'));

    document.querySelectorAll('[id^="ghost_"]').forEach((el) => {
      (el as HTMLElement).innerText = '';
    });

    if (typeof window.resetRollState === 'function') {
      window.resetRollState();
    }
  }
}

export const najavaExports = {
  openNajavaModal,
  closeNajavaModal,
  selectNajava
};

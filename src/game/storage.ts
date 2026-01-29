import { state } from './state';
import { calculateColumn } from './scoring';
import { refreshAllGhosts } from './ghosts';
import { supabase } from '../supabaseClient.js';
import { getMultiplayerSession } from '../multiplayerState.js';

const diceStateStorageKey = 'dual_jamb_dice_v1';

export function saveDiceState() {
  const locked = Array(5).fill(false);
  document.querySelectorAll('[data-die]').forEach((label) => {
    const dieIndex = parseInt((label as HTMLElement).dataset.die || '', 10);
    const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (!Number.isNaN(dieIndex) && dieIndex >= 0 && dieIndex < 5) {
      locked[dieIndex] = !!checkbox?.checked;
    }
  });

  localStorage.setItem(
    diceStateStorageKey,
    JSON.stringify({ diceValues: state.diceValues, rollsLeft: state.rollsLeft, locked })
  );
}

export function loadDiceState(): null | { rollsLeft: number; diceValues: Array<number | null>; locked: boolean[] } {
  const raw = localStorage.getItem(diceStateStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const nextRollsLeft = Number.isInteger(parsed?.rollsLeft) ? parsed.rollsLeft : null;
    const nextDiceValues = Array.isArray(parsed?.diceValues) ? parsed.diceValues : null;
    const nextLocked = Array.isArray(parsed?.locked) ? parsed.locked : null;

    if (nextRollsLeft === null || nextRollsLeft < 0 || nextRollsLeft > 3) return null;
    if (!nextDiceValues || nextDiceValues.length !== 5) return null;
    if (!nextLocked || nextLocked.length !== 5) return null;

    const normalizedDice = nextDiceValues.map((v: unknown) => {
      if (v === null) return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 6) return null;
      return n;
    });

    const normalizedLocked = nextLocked.map((v: unknown) => !!v);

    return { rollsLeft: nextRollsLeft, diceValues: normalizedDice, locked: normalizedLocked };
  } catch {
    return null;
  }
}

export function clearDiceState() {
  localStorage.removeItem(diceStateStorageKey);
}

export function saveScores() {
  const session = getMultiplayerSession();
  if (session.active) return;
  localStorage.setItem('dual_jamb_scores_v10', JSON.stringify(state.allScores));
}

function applyScoresToUi() {
  document.querySelectorAll('input[type="text"]').forEach((input) => {
    (input as HTMLInputElement).value = '';
  });
  document.querySelectorAll('[id*="_sum"]').forEach((s) => {
    s.innerHTML = '0';
    s.removeAttribute('data-val');
    s.removeAttribute('data-bonus');
  });
  document
    .querySelectorAll('[id*="_total_"], span[id*="grand-total"], #super-total')
    .forEach((s) => {
      (s as HTMLElement).innerText = '0';
    });
  document.querySelectorAll('.row-bonus-active').forEach((el) => el.classList.remove('row-bonus-active'));
  document.querySelectorAll('.crossed-out').forEach((el) => el.classList.remove('crossed-out'));
  document
    .querySelectorAll('[id*="_badge_"], [id$="-extra-badge"]')
    .forEach((el) => el.classList.add('hidden'));
  document.querySelectorAll('[id^="ghost_"]').forEach((el) => {
    (el as HTMLElement).innerText = '';
  });

  if (!(state.allScores as any).t1) state.allScores = { t1: {}, t2: {} };
  ['t1', 't2'].forEach((tid) => {
    const tableData = state.allScores[tid] || {};
    Object.keys(tableData).forEach((colIdx) => {
      Object.entries(tableData[colIdx] ?? {}).forEach(([rowId, val]) => {
        const el = document.getElementById(`${tid}_c${colIdx}_${rowId}`) as HTMLInputElement | null;
        if (el) {
          el.value = val === null ? '' : String(val);
          if (val === 0) el.parentElement?.classList.add('crossed-out');
          else el.parentElement?.classList.remove('crossed-out');
        }
      });
      calculateColumn(tid, colIdx as any);
    });
  });
  refreshAllGhosts();
}

export function applyScoresSnapshot(nextScores: typeof state.allScores) {
  state.allScores = nextScores || { t1: {}, t2: {} };
  applyScoresToUi();
}

export async function loadScores() {
  const session = getMultiplayerSession();
  if (session.active && session.roomId && session.sessionId && supabase) {
    const { data, error } = await supabase
      .from('yamb_scores')
      .select('table_id, column_index, row_id, value')
      .eq('room_id', session.roomId)
      .eq('session_id', session.sessionId);

    if (!error) {
      state.allScores = { t1: {}, t2: {} };
      data?.forEach((score: { table_id: string; column_index: number; row_id: string; value: number | null }) => {
        const colKey = String(score.column_index);
        if (!state.allScores[score.table_id]) state.allScores[score.table_id] = {};
        if (!state.allScores[score.table_id][colKey]) state.allScores[score.table_id][colKey] = {};
        state.allScores[score.table_id][colKey][score.row_id] = score.value;
      });
      applyScoresToUi();
      return;
    }
  }

  const saved = localStorage.getItem('dual_jamb_scores_v10');
  if (saved) {
    try {
      state.allScores = JSON.parse(saved);
      applyScoresToUi();
    } catch {
      state.allScores = { t1: {}, t2: {} };
    }
  }
}

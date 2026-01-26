import { state } from './state';
import { calculateColumn } from './scoring';
import { refreshAllGhosts } from './ghosts';

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
  localStorage.setItem('dual_jamb_scores_v10', JSON.stringify(state.allScores));
}

export function loadScores() {
  const saved = localStorage.getItem('dual_jamb_scores_v10');
  if (saved) {
    try {
      state.allScores = JSON.parse(saved);
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
    } catch {
      state.allScores = { t1: {}, t2: {} };
    }
  }
}

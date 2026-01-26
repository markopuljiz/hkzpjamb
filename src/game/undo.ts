import { columns, rows } from './config';
import { state, type DiceValues } from './state';
import { updateNajavaIndicator } from './najava';
import { clearSubmitPreviews, renderSubmitPreviews } from './submitPreview';
import { applyDiceSnapshot } from './diceRoller';

export type UndoSnapshot = {
  diceValues: DiceValues;
  rollsLeft: number;
  locked: boolean[];
  submitPreviewActive: boolean;
  najavaActive: boolean;
  najavaRowId: string | null;
};

type ScoreUpdateFn = (tableId: string, colIndex: number, rowId: string, val: number | null) => void;

type UndoAction =
  | {
      type: 'write';
      tableId: string;
      colIndex: number;
      rowId: string;
      prevValue: number | null;
      snapshot: UndoSnapshot;
      label: string;
    }
  | {
      type: 'najava';
      snapshot: UndoSnapshot;
      label: string;
    };

let undoAction: UndoAction | null = null;
let undoInProgress = false;
let applyScoreUpdate: ScoreUpdateFn | null = null;

function getUndoButton() {
  return document.getElementById('undo-btn') as HTMLButtonElement | null;
}

function getUndoLabelEl() {
  return document.getElementById('undo-label') as HTMLSpanElement | null;
}

function formatColumnIcon(colIndex: number) {
  const type = columns[colIndex] || '';
  if (type === 'down') return 'fa-arrow-down';
  if (type === 'up') return 'fa-arrow-up';
  if (type === 'free') return 'fa-arrows-left-right';
  if (type === 'announc') return 'fa-bullhorn';
  return 'fa-pen';
}

function getLockedStates() {
  const locked = Array(5).fill(false);
  document.querySelectorAll('[data-die]').forEach((label) => {
    const dieIndex = parseInt((label as HTMLElement).dataset.die || '', 10);
    const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (!Number.isNaN(dieIndex) && dieIndex >= 0 && dieIndex < 5) {
      locked[dieIndex] = !!checkbox?.checked;
    }
  });
  return locked;
}

function captureSnapshot(): UndoSnapshot {
  return {
    diceValues: [...state.diceValues],
    rollsLeft: state.rollsLeft,
    locked: getLockedStates(),
    submitPreviewActive: state.submitPreviewActive,
    najavaActive: state.najavaActive,
    najavaRowId: state.najavaRowId
  };
}

function updateUndoButton() {
  const btn = getUndoButton();
  const labelEl = getUndoLabelEl();
  if (!btn || !labelEl) return;
  if (!undoAction) {
    btn.classList.add('hidden');
    labelEl.textContent = '';
    return;
  }
  btn.classList.remove('hidden');
  labelEl.innerHTML = undoAction.label;
}

function restoreSnapshot(snapshot: UndoSnapshot) {
  state.najavaActive = snapshot.najavaActive;
  state.najavaRowId = snapshot.najavaRowId;
  applyDiceSnapshot({
    diceValues: snapshot.diceValues,
    rollsLeft: snapshot.rollsLeft,
    locked: snapshot.locked
  });
  updateNajavaIndicator();
  state.submitPreviewActive = snapshot.submitPreviewActive;
  if (state.submitPreviewActive) {
    renderSubmitPreviews();
  } else {
    clearSubmitPreviews();
  }
}

function handleUndoClick() {
  if (!undoAction) return;
  if (!applyScoreUpdate) return;
  undoInProgress = true;
  if (undoAction.type === 'write') {
    applyScoreUpdate(undoAction.tableId, undoAction.colIndex, undoAction.rowId, undoAction.prevValue);
    restoreSnapshot(undoAction.snapshot);
  } else {
    restoreSnapshot(undoAction.snapshot);
  }
  undoAction = null;
  updateUndoButton();
  undoInProgress = false;
}

export function initUndo(applyScoreUpdateFn: ScoreUpdateFn) {
  applyScoreUpdate = applyScoreUpdateFn;
  const btn = getUndoButton();
  if (!btn) return;
  btn.addEventListener('click', handleUndoClick);

  const rollBtn = document.getElementById('roll-dice-btn');
  if (rollBtn) {
    rollBtn.addEventListener('click', () => {
      clearUndo();
    });
  }
  updateUndoButton();
}

export function isUndoInProgress() {
  return undoInProgress;
}

export function clearUndo() {
  undoAction = null;
  updateUndoButton();
}

export function registerUndoWrite(tableId: string, colIndex: number, rowId: string, prevValue: number | null) {
  if (undoInProgress) return;
  const rowLabel = rows.find((row) => row.id === rowId)?.label || '';
  const colIcon = formatColumnIcon(colIndex);
  const snapshot = captureSnapshot();
  undoAction = {
    type: 'write',
    tableId,
    colIndex,
    rowId,
    prevValue,
    snapshot,
    label: `<i class="fas ${colIcon}"></i><span>${rowLabel}</span>`
  };
  updateUndoButton();
}

export function registerUndoNajava(rowId: string) {
  if (undoInProgress) return;
  const rowLabel = rows.find((row) => row.id === rowId)?.label || '';
  const snapshot = captureSnapshot();
  undoAction = {
    type: 'najava',
    snapshot,
    label: `<i class="fas fa-bullhorn"></i><span>${rowLabel}</span>`
  };
  updateUndoButton();
}

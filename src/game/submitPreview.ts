import { columns, rows, tables } from './config';
import { state } from './state';
import { getPreviewScore, isRowAllowed } from './scoring';

let previewToggleButton: HTMLButtonElement | null = null;
let previewToggleIcon: HTMLElement | null = null;

export function initSubmitPreviewToggle() {
  previewToggleButton = document.getElementById('preview-toggle') as HTMLButtonElement | null;
  previewToggleIcon = document.getElementById('preview-toggle-icon');
  if (!previewToggleButton) return;
  previewToggleButton.addEventListener('click', () => {
    setSubmitPreviewActive(!state.submitPreviewActive);
  });
  updatePreviewToggleUI();
}

export function updatePreviewToggleUI() {
  if (!previewToggleButton || !previewToggleIcon) return;
  const isActive = state.submitPreviewActive;
  previewToggleButton.classList.toggle('text-emerald-200', isActive);
  previewToggleButton.classList.toggle('text-slate-300', !isActive);
  previewToggleIcon.classList.toggle('fa-eye', isActive);
  previewToggleIcon.classList.toggle('fa-eye-slash', !isActive);
  previewToggleButton.setAttribute('aria-pressed', String(isActive));
  previewToggleButton.title = isActive ? 'Hide previews' : 'Show previews';
}

export function setSubmitPreviewActive(nextState: boolean) {
  if (nextState && state.rollsLeft === 3) return;
  if (!nextState && state.najavaActive) return;
  state.submitPreviewActive = nextState;
  if (state.submitPreviewActive) {
    renderSubmitPreviews();
  } else {
    clearSubmitPreviews();
  }
  updatePreviewToggleUI();
}

export function clearSubmitPreviews() {
  const showHighlights = state.rollsLeft < 3;
  tables.forEach((table) => {
    columns.forEach((_, colIndex) => {
      rows.forEach((row) => {
        if (row.isSum) return;
        const inputEl = document.getElementById(`${table.id}_c${colIndex}_${row.id}`) as HTMLInputElement | null;
        const previewEl = document.getElementById(`preview_${table.id}_c${colIndex}_${row.id}`);
        if (!previewEl) return;
        const isEmpty = inputEl ? inputEl.value === '' : false;
        const isAllowed = isRowAllowed(table.id, colIndex, row.id);
        const shouldHighlight = showHighlights && isEmpty && isAllowed;
        previewEl.innerText = '';
        previewEl.classList.toggle('opacity-100', shouldHighlight);
        previewEl.classList.toggle('opacity-0', !shouldHighlight);
      });
    });
  });
}

export function renderSubmitPreviews() {
  const diceCounts = Array(7).fill(0);
  let diceSum = 0;
  state.diceValues.forEach((val) => {
    if (val === null) return;
    diceCounts[val] += 1;
    diceSum += val;
  });

  tables.forEach((table) => {
    columns.forEach((_, colIndex) => {
      rows.forEach((row) => {
        if (row.isSum) return;
        const inputEl = document.getElementById(`${table.id}_c${colIndex}_${row.id}`) as HTMLInputElement | null;
        const previewEl = document.getElementById(`preview_${table.id}_c${colIndex}_${row.id}`);
        if (!previewEl) return;
        const isEmpty = inputEl && inputEl.value === '';
        const isAllowed = isRowAllowed(table.id, colIndex, row.id);
        if (!state.submitPreviewActive || !isEmpty) {
          previewEl.innerText = '';
          previewEl.classList.add('opacity-0');
          previewEl.classList.remove('opacity-100');
          return;
        }
        if (!isAllowed) {
          previewEl.innerText = '';
          previewEl.classList.add('opacity-0');
          previewEl.classList.remove('opacity-100');
          return;
        }
        const previewVal = getPreviewScore(row, diceCounts, diceSum);
        previewEl.innerText = String(previewVal);
        previewEl.classList.add('opacity-100');
        previewEl.classList.remove('opacity-0');
      });
    });
  });
}

import { columns, rows, tables } from './config';
import { state } from './state';
import { getPreviewScore, isRowAllowed } from './scoring';

export function setSubmitPreviewActive(nextState: boolean) {
  if (nextState && state.rollsLeft === 3) return;
  if (!nextState && state.najavaActive) return;
  state.submitPreviewActive = nextState;
  if (state.submitPreviewActive) {
    renderSubmitPreviews();
  } else {
    clearSubmitPreviews();
  }
}

export function clearSubmitPreviews() {
  tables.forEach((table) => {
    columns.forEach((_, colIndex) => {
      rows.forEach((row) => {
        if (row.isSum) return;
        const previewEl = document.getElementById(`preview_${table.id}_c${colIndex}_${row.id}`);
        if (!previewEl) return;
        previewEl.innerText = '';
        previewEl.classList.add('opacity-0');
        previewEl.classList.remove('opacity-100');
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

import { columns, rows, tables } from './config';
import { state } from './state';
import { setSubmitPreviewActive } from './submitPreview';
import { registerUndoNajava } from './undo';

export function openNajavaModal() {
  if (state.rollsLeft === 3 || state.najavaActive) return;
  const modal = document.getElementById('najava-modal');
  const optionsContainer = document.getElementById('najava-options');
  if (!modal || !optionsContainer) return;

  optionsContainer.innerHTML = '';
  const playableRows = rows.filter((row) => !row.isSum);

  playableRows.forEach((row) => {
    const hasEmptyCell = tables.some((table) => {
      const colIndex = columns.indexOf('announc');
      const cellVal = state.allScores[table.id]?.[String(colIndex)]?.[row.id];
      return cellVal === undefined || cellVal === null;
    });
    if (!hasEmptyCell) return;

    const btn = document.createElement('button');
    btn.className =
      'flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left';
    btn.innerHTML = `
      ${row.icon ? `<i class="${row.icon} text-slate-500"></i>` : '<i class="fas fa-circle text-slate-300 text-xs"></i>'}
      <span class="font-medium text-slate-700">${row.label}</span>
    `;
    btn.onclick = () => selectNajava(row.id);
    optionsContainer.appendChild(btn);
  });

  modal.classList.remove('hidden');
}

export function closeNajavaModal() {
  const modal = document.getElementById('najava-modal');
  if (modal) modal.classList.add('hidden');
}

export function selectNajava(rowId: string) {
  registerUndoNajava(rowId);
  state.najavaActive = true;
  state.najavaRowId = rowId;
  closeNajavaModal();
  updateNajavaIndicator();
  setSubmitPreviewActive(true);
}

export function updateNajavaIndicator() {
  const btn =
    state.najavaButton || (document.getElementById('najava-btn') as HTMLButtonElement | null);
  if (!btn) return;

  const row = state.najavaRowId ? rows.find((r) => r.id === state.najavaRowId) : null;
  const rowLabel = row?.label || '';

  if (state.najavaActive && rowLabel) {
    btn.innerHTML = `<i class="fas fa-bullhorn"></i><span>${rowLabel}</span>`;
    btn.disabled = true;
    btn.classList.add('border-2', 'border-red-500');
    btn.classList.remove('border-amber-200');
  } else {
    btn.textContent = 'Najava';
    btn.classList.remove('border-2', 'border-red-500');
    btn.classList.add('border-amber-200');
  }

  document.querySelectorAll('[data-ann-label]').forEach((el) => {
    el.textContent = rowLabel ? `(${rowLabel})` : '';
  });
}

import { state } from './state';

export function updatePeerGhost(sourceTableId: string, colIndex: number | string, rowId: string, val: number | null) {
  const peerId = sourceTableId === 't1' ? 't2' : 't1';
  const ghostId = `ghost_${peerId}_c${colIndex}_${rowId}`;
  const ghostEl = document.getElementById(ghostId);
  if (ghostEl) ghostEl.innerText = val !== null && val !== undefined ? String(val) : '';
}

export function refreshAllGhosts() {
  updateGhostsForTable('t1', 't2');
  updateGhostsForTable('t2', 't1');
}

export function updateGhostsForTable(targetTable: string, sourceTable: string) {
  const sourceData = state.allScores[sourceTable];
  if (!sourceData) return;
  Object.keys(sourceData).forEach((colIdx) => {
    Object.entries(sourceData[colIdx] ?? {}).forEach(([rowId, val]) => {
      const ghostId = `ghost_${targetTable}_c${colIdx}_${rowId}`;
      const ghostEl = document.getElementById(ghostId);
      if (ghostEl && val !== null) ghostEl.innerText = String(val);
    });
  });
}

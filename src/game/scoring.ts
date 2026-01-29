import { columns, rows, type RowConfig } from './config';
import { state } from './state';

function calculateSum1(colScores: Record<string, number | null | undefined>) {
  let rawSum1 = 0;
  ['1', '2', '3', '4', '5', '6'].forEach((r) => {
    rawSum1 += (colScores as any)[r] || 0;
  });
  const sum1Bonus = rawSum1 >= 60 ? 30 : 0;
  return { rawSum1, sum1Bonus, sum1Total: rawSum1 + sum1Bonus };
}

function calculateSum2(colScores: Record<string, number | null | undefined>) {
  const maxRaw = (colScores as any).max;
  const minRaw = (colScores as any).min;
  const ones = (colScores as any)['1'] || 0;

  let sum2Base = 0;
  const hasMax = maxRaw !== undefined && maxRaw !== null;
  const hasMin = minRaw !== undefined && minRaw !== null;
  if (hasMax && hasMin) {
    const max = maxRaw || 0;
    const min = minRaw || 0;
    sum2Base = Math.max(0, max - min) * ones;
  }

  const sum2Bonus = sum2Base >= 60 ? 30 : 0;
  return { sum2Base, sum2Bonus, sum2Total: sum2Base + sum2Bonus };
}

export function getAllowedRowId(tableId: string, colIndex: number) {
  const columnType = columns[colIndex];
  if (columnType !== 'down' && columnType !== 'up') return null;
  const colKey = String(colIndex);
  const colScores = state.allScores[tableId]?.[colKey] || {};
  const playableRows = rows.filter((row) => !row.isSum).map((row) => row.id);
  const emptyRows = playableRows.filter(
    (rowId) => colScores[rowId] === undefined || colScores[rowId] === null
  );
  if (emptyRows.length === 0) return null;
  return columnType === 'down' ? emptyRows[0] : emptyRows[emptyRows.length - 1];
}

export function isRowAllowed(tableId: string, colIndex: number, rowId: string) {
  const columnType = columns[colIndex];
  if (state.najavaActive) {
    return columnType === 'announc' && state.najavaRowId === rowId;
  }
  if (columnType === 'announc') {
    return false;
  }
  if (columnType === 'down' || columnType === 'up') {
    return getAllowedRowId(tableId, colIndex) === rowId;
  }
  return true;
}

export function getPreviewScore(row: RowConfig, diceCounts: number[], diceSum: number) {
  if (row.type === 'count') {
    const dieVal = parseInt(row.id, 10);
    return (diceCounts[dieVal] || 0) * dieVal;
  }

  if (row.type === 'manual') {
    return diceSum;
  }

  if (row.type === 'straight') {
    const smallStraight = [1, 2, 3, 4, 5].every((val) => diceCounts[val] > 0);
    const largeStraight = [2, 3, 4, 5, 6].every((val) => diceCounts[val] > 0);
    if (largeStraight) return 66;
    if (smallStraight) return 56;
    return 0;
  }

  if (row.type === 'full') {
    let tripleVal: number | null = null;
    let pairVal: number | null = null;
    for (let val = 6; val >= 1; val -= 1) {
      if (diceCounts[val] >= 3 && tripleVal === null) tripleVal = val;
    }
    for (let val = 6; val >= 1; val -= 1) {
      if (val !== tripleVal && diceCounts[val] >= 2 && pairVal === null) pairVal = val;
    }
    if (tripleVal && pairVal) return tripleVal * 3 + pairVal * 2 + 30;
    return 0;
  }

  if (row.type === 'poker') {
    for (let val = 6; val >= 1; val -= 1) {
      if (diceCounts[val] >= 4) return val * 4 + 40;
    }
    return 0;
  }

  if (row.type === 'yamb') {
    for (let val = 6; val >= 1; val -= 1) {
      if (diceCounts[val] === 5) return val * 5 + 70;
    }
    return 0;
  }

  return 0;
}

export function updateCellWithBadge(
  elementId: string,
  totalValue: number,
  bonusValue: number,
  badgeColorClass: string
) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let contentHTML = `<span class="text-lg font-bold">${totalValue}</span>`;
  if (bonusValue > 0 && badgeColorClass) {
    contentHTML += `<span class="${badgeColorClass} text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold mt-0.5 badge-pop shadow-sm">+${bonusValue}</span>`;
  }
  if (
    el.getAttribute('data-val') !== String(totalValue) ||
    el.getAttribute('data-bonus') !== String(bonusValue)
  ) {
    el.innerHTML = contentHTML;
    el.setAttribute('data-val', String(totalValue));
    el.setAttribute('data-bonus', String(bonusValue));
  }
}

export function calculateColumn(tableId: string, colIndex: number | string) {
  const colKey = String(colIndex);
  const tableData = state.allScores[tableId] || {};
  const colScores = tableData[colKey] || {};

  const { rawSum1, sum1Bonus, sum1Total } = calculateSum1(colScores as any);
  const sum1Badge = rawSum1 >= 60 ? 'bg-blue-600' : '';
  updateCellWithBadge(`${tableId}_c${colIndex}_sum1`, sum1Total, sum1Bonus, sum1Badge);

  const { sum2Base, sum2Bonus, sum2Total } = calculateSum2(colScores as any);
  const sum2Badge = sum2Base >= 60 ? 'bg-blue-600' : '';
  updateCellWithBadge(`${tableId}_c${colIndex}_sum2`, sum2Total, sum2Bonus, sum2Badge);

  let sum3Base = 0;
  ['str', 'full', 'poker', 'yamb'].forEach((r) => {
    sum3Base += (colScores as any)[r] || 0;
  });

  const strVal = (colScores as any).str || 0;
  const fullVal = (colScores as any).full || 0;
  const pokVal = (colScores as any).poker || 0;
  const yambVal = (colScores as any).yamb || 0;

  let bonus = 0;
  let badgeColor = '';

  if (strVal === 56 && fullVal === 37 && pokVal === 44) {
    if (yambVal === 75) {
      bonus = 212;
      badgeColor = 'bg-teal-600';
    } else {
      bonus = 137;
      badgeColor = 'bg-cyan-500';
    }
  } else if (strVal === 66 && fullVal === 58 && pokVal === 64) {
    if (yambVal === 100) {
      bonus = 100;
      badgeColor = 'bg-purple-600';
    } else {
      bonus = 50;
      badgeColor = 'bg-red-500';
    }
  } else if (strVal === 56 && fullVal === 56 && pokVal === 56) {
    bonus = 56;
    badgeColor = 'bg-orange-500';
  }

  const sum3Total = sum3Base + bonus;
  updateCellWithBadge(`${tableId}_c${colIndex}_sum3`, sum3Total, bonus, badgeColor);

  const total = rawSum1 + sum1Bonus + sum2Base + sum2Bonus + sum3Total;
  const totalEl = document.getElementById(`${tableId}_total_${colIndex}`);
  if (totalEl) totalEl.innerText = String(total);

  calculateGrandTotal();
}

export function checkRowBonuses(tableId: string) {
  let bonus = 0;
  const targetRows = ['sum1', 'sum2', 'str', 'full', 'poker'];
  targetRows.forEach((rowId) => {
    const vals: Array<number | null | undefined> = [];
    let sum1IsReady = true;
    for (let c = 0; c < 4; c += 1) {
      const colScores = (state.allScores[tableId]?.[String(c)] || {}) as any;
      if (rowId === 'sum1') {
        ['1', '2', '3', '4', '5', '6'].forEach((r) => {
          if (colScores[r] === undefined || colScores[r] === null) sum1IsReady = false;
        });
        vals.push(calculateSum1(colScores).sum1Total);
      } else if (rowId === 'sum2') {
        vals.push(calculateSum2(colScores).sum2Total);
      } else {
        vals.push(colScores[rowId]);
      }
    }
    const labelEl = document.getElementById(`${tableId}_label_${rowId}`);
    const badgeEl = document.getElementById(`${tableId}_badge_${rowId}`);
    const reference = vals[0];
    const isComplete =
      reference !== undefined &&
      reference !== null &&
      reference > 0 &&
      vals.every((v) => v === reference) &&
      (rowId !== 'sum1' || sum1IsReady);

    if (isComplete) {
      bonus += reference;
      if (labelEl) labelEl.classList.add('row-bonus-active');
      if (badgeEl) {
        badgeEl.innerText = `+${reference}`;
        badgeEl.classList.remove('hidden');
      }
    } else {
      if (labelEl) labelEl.classList.remove('row-bonus-active');
      if (badgeEl) badgeEl.classList.add('hidden');
    }
  });
  return bonus;
}

export function calculateGrandTotal() {
  let superTotal = 0;
  const tableIds = ['t1', 't2'];
  let filledCells = 0;
  const playableRows = rows.filter((row) => !row.isSum).map((row) => row.id);
  const totalCells = playableRows.length * columns.length * tableIds.length;

  tableIds.forEach((tid) => {
    let tableSum = 0;
    for (let c = 0; c < 4; c += 1) {
      const el = document.getElementById(`${tid}_total_${c}`);
      tableSum += parseInt(el?.innerText || '0', 10);
    }
    const rowBonus = checkRowBonuses(tid);
    tableSum += rowBonus;
    const grandEl = document.getElementById(`grand-total-${tid}`);
    if (grandEl) grandEl.innerText = String(tableSum);
    const tableTotalEl = document.getElementById(`table-total-${tid}`);
    if (tableTotalEl) tableTotalEl.innerText = String(tableSum);
    superTotal += tableSum;

    for (let c = 0; c < columns.length; c += 1) {
      const colScores = state.allScores[tid]?.[String(c)] || {};
      playableRows.forEach((rowId) => {
        const value = (colScores as Record<string, number | null | undefined>)[rowId];
        if (value !== null && value !== undefined) filledCells += 1;
      });
    }

    const badge = document.getElementById(`${tid}-extra-badge`);
    const badgeVal = document.getElementById(`${tid}-extra-val`);
    if (badge && badgeVal) {
      if (rowBonus > 0) {
        badge.classList.remove('hidden');
        badge.classList.add('inline-flex');
        badgeVal.innerText = String(rowBonus);
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('inline-flex');
      }
    }
  });
  const superEl = document.getElementById('super-total');
  if (superEl) superEl.innerText = String(superTotal);
  const progressEl = document.getElementById('progress-percent');
  if (progressEl) {
    const percent = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
    progressEl.innerText = `${percent}%`;
  }
}

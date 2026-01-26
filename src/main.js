import './index.css';

// --- Configuration ---
const tables = [
  { id: 't1', color: 'blue', headerColor: 'bg-blue-600', subHeader: 'bg-blue-50' },
  { id: 't2', color: 'emerald', headerColor: 'bg-emerald-600', subHeader: 'bg-emerald-50' }
];

const columns = ['down', 'up', 'free', 'announc'];
const rows = [
  { id: '1', label: '1', icon: 'fas fa-dice-one', type: 'count' },
  { id: '2', label: '2', icon: 'fas fa-dice-two', type: 'count' },
  { id: '3', label: '3', icon: 'fas fa-dice-three', type: 'count' },
  { id: '4', label: '4', icon: 'fas fa-dice-four', type: 'count' },
  { id: '5', label: '5', icon: 'fas fa-dice-five', type: 'count' },
  { id: '6', label: '6', icon: 'fas fa-dice-six', type: 'count' },
  { id: 'sum1', label: 'Sum 1', isSum: true },
  { id: 'max', label: 'Max', icon: 'fas fa-chevron-up', type: 'manual' },
  { id: 'min', label: 'Min', icon: 'fas fa-chevron-down', type: 'manual' },
  { id: 'sum2', label: 'Sum 2', isSum: true },
  { id: 'str', label: 'Straight', icon: 'fas fa-sort-numeric-down', type: 'straight' },
  { id: 'full', label: 'Full', icon: 'fas fa-home', type: 'full' },
  { id: 'poker', label: 'Poker', icon: 'fas fa-th-large', type: 'poker' },
  { id: 'yamb', label: 'Jamb', icon: 'fas fa-star', type: 'yamb' },
  { id: 'sum3', label: 'Sum 3', isSum: true }
];

// --- State ---
let allScores = { t1: {}, t2: {} };
let diceValues = [null, null, null, null, null];
let rollsLeft = 3;
let submitPreviewActive = false;
let submitRollButton = null;
let najavaButton = null;
let isRolling = false;
let najavaActive = false;
let najavaRowId = null;

// --- Init ---
function init() {
  tables.forEach((t) => renderTableContainer(t));
  loadScores();
  initDiceRoller();
}

function initDiceRoller() {
  const rollBtn = document.getElementById('roll-dice-btn');
  const rollsLeftEl = document.getElementById('rolls-left');
  const rollStatusEl = document.getElementById('roll-status');
  const submitBtn = document.getElementById('submit-roll-btn');
  const najavaBtn = document.getElementById('najava-btn');
  const dieLabels = document.querySelectorAll('[data-die]');

  if (!rollBtn || !rollsLeftEl || dieLabels.length === 0) return;
  submitRollButton = submitBtn;
  najavaButton = najavaBtn;

  const updateRollStatus = () => {
    rollsLeftEl.innerText = rollsLeft;
    if (rollStatusEl) rollStatusEl.innerText = `${3 - rollsLeft}/3`;
    rollBtn.disabled = rollsLeft <= 0;
    rollBtn.classList.toggle('opacity-50', rollsLeft <= 0);
    rollBtn.classList.toggle('cursor-not-allowed', rollsLeft <= 0);
    const canSubmit = rollsLeft < 3 && !isRolling;
    if (submitRollButton) {
      submitRollButton.disabled = !canSubmit;
      submitRollButton.classList.toggle('opacity-50', !canSubmit);
      submitRollButton.classList.toggle('cursor-not-allowed', !canSubmit);
    }
    if (najavaButton) {
      najavaButton.disabled = !canSubmit;
      najavaButton.classList.toggle('opacity-50', !canSubmit);
      najavaButton.classList.toggle('cursor-not-allowed', !canSubmit);
    }
  };

  const setDieFace = (dieIndex, value) => {
    const label = document.querySelector(`[data-die="${dieIndex}"]`);
    if (!label) return;
    const faceEl = label.querySelector('[data-die-face]');
    if (!faceEl) return;
    const diceIcons = [
      'fa-dice-one',
      'fa-dice-two',
      'fa-dice-three',
      'fa-dice-four',
      'fa-dice-five',
      'fa-dice-six'
    ];
    faceEl.className = `fas ${diceIcons[value - 1]} text-2xl`;
    faceEl.classList.remove('dice-empty');
  };

  const setDieEmpty = (dieIndex) => {
    const label = document.querySelector(`[data-die="${dieIndex}"]`);
    if (!label) return;
    const faceEl = label.querySelector('[data-die-face]');
    if (!faceEl) return;
    faceEl.className = 'fas fa-dice text-xl dice-empty';
  };

  const rollDice = () => {
    if (rollsLeft <= 0 || isRolling) return;
    isRolling = true;
    updateRollStatus();

    const rollingIntervals = [];
    const unlockedLabels = [];

    dieLabels.forEach((label) => {
      const dieIndex = parseInt(label.dataset.die, 10);
      const checkbox = label.querySelector('input[type="checkbox"]');
      const isLocked = checkbox?.checked;
      const faceEl = label.querySelector('[data-die-face]');
      const boxEl = label.querySelector('div');
      if (isLocked) return;
      unlockedLabels.push({ label, dieIndex, faceEl, boxEl });
      if (boxEl) boxEl.classList.add('dice-rolling');
      const intervalId = window.setInterval(() => {
        const value = Math.floor(Math.random() * 6) + 1;
        setDieFace(dieIndex, value);
      }, 90);
      rollingIntervals.push({ dieIndex, intervalId, boxEl });
    });

    const stopNext = (idx) => {
      const target = unlockedLabels[idx];
      if (!target) {
        rollsLeft -= 1;
        isRolling = false;
        updateRollStatus();
        if (submitPreviewActive) renderSubmitPreviews();
        return;
      }
      const { dieIndex, faceEl, boxEl } = target;
      const interval = rollingIntervals.find((entry) => entry.dieIndex === dieIndex);
      if (interval) window.clearInterval(interval.intervalId);
      const finalValue = Math.floor(Math.random() * 6) + 1;
      diceValues[dieIndex] = finalValue;
      setDieFace(dieIndex, finalValue);
      if (boxEl) boxEl.classList.remove('dice-rolling');
      window.setTimeout(() => stopNext(idx + 1), 160);
    };

    window.setTimeout(() => stopNext(0), 600);
  };

  window.resetRollState = () => {
    rollsLeft = 3;
    diceValues = [null, null, null, null, null];
    dieLabels.forEach((label) => {
      const checkbox = label.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
    });
    diceValues.forEach((value, index) => {
      if (value === null) setDieEmpty(index);
    });
    updateRollStatus();
    setSubmitPreviewActive(false);
    najavaActive = false;
    najavaRowId = null;
    updateNajavaIndicator();
  };

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (najavaActive && submitPreviewActive) return;
      setSubmitPreviewActive(!submitPreviewActive);
    });
  }

  if (najavaBtn) {
    najavaBtn.addEventListener('click', openNajavaModal);
  }

  diceValues.forEach((value, index) => {
    if (value === null) setDieEmpty(index);
    else setDieFace(index, value);
  });
  updateRollStatus();
  updateSubmitButton();
  rollBtn.addEventListener('click', rollDice);
}

function updateSubmitButton() {
  if (!submitRollButton) return;
  submitRollButton.setAttribute('aria-pressed', submitPreviewActive ? 'true' : 'false');
  submitRollButton.classList.toggle('bg-emerald-600', submitPreviewActive);
  submitRollButton.classList.toggle('text-white', submitPreviewActive);
  submitRollButton.classList.toggle('border-emerald-600', submitPreviewActive);
  submitRollButton.classList.toggle('bg-emerald-100', !submitPreviewActive);
  submitRollButton.classList.toggle('text-emerald-800', !submitPreviewActive);
  submitRollButton.classList.toggle('border-emerald-200', !submitPreviewActive);
}

function setSubmitPreviewActive(nextState) {
  if (nextState && rollsLeft === 3) return;
  if (!nextState && najavaActive) return;
  submitPreviewActive = nextState;
  updateSubmitButton();
  if (submitPreviewActive) {
    renderSubmitPreviews();
  } else {
    clearSubmitPreviews();
  }
}

function clearSubmitPreviews() {
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

function renderSubmitPreviews() {
  const diceCounts = Array(7).fill(0);
  let diceSum = 0;
  diceValues.forEach((val) => {
    if (val === null) return;
    diceCounts[val] += 1;
    diceSum += val;
  });

  tables.forEach((table) => {
    columns.forEach((_, colIndex) => {
      rows.forEach((row) => {
        if (row.isSum) return;
        const inputEl = document.getElementById(`${table.id}_c${colIndex}_${row.id}`);
        const previewEl = document.getElementById(`preview_${table.id}_c${colIndex}_${row.id}`);
        if (!previewEl) return;
        const isEmpty = inputEl && inputEl.value === '';
        const isAllowed = isRowAllowed(table.id, colIndex, row.id);
        if (!submitPreviewActive || !isEmpty) {
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
        previewEl.innerText = previewVal;
        previewEl.classList.add('opacity-100');
        previewEl.classList.remove('opacity-0');
      });
    });
  });
}

function getAllowedRowId(tableId, colIndex) {
  const columnType = columns[colIndex];
  if (columnType !== 'down' && columnType !== 'up') return null;
  const colScores = allScores[tableId]?.[colIndex] || {};
  const playableRows = rows.filter((row) => !row.isSum).map((row) => row.id);
  const emptyRows = playableRows.filter(
    (rowId) => colScores[rowId] === undefined || colScores[rowId] === null
  );
  if (emptyRows.length === 0) return null;
  return columnType === 'down' ? emptyRows[0] : emptyRows[emptyRows.length - 1];
}

function isRowAllowed(tableId, colIndex, rowId) {
  const columnType = columns[colIndex];
  if (najavaActive) {
    return columnType === 'announc' && najavaRowId === rowId;
  }
  if (columnType === 'announc') {
    return false;
  }
  if (columnType === 'down' || columnType === 'up') {
    return getAllowedRowId(tableId, colIndex) === rowId;
  }
  return true;
}

function openNajavaModal() {
  if (rollsLeft === 3 || najavaActive) return;
  const modal = document.getElementById('najava-modal');
  const optionsContainer = document.getElementById('najava-options');
  if (!modal || !optionsContainer) return;

  optionsContainer.innerHTML = '';
  const playableRows = rows.filter((row) => !row.isSum);

  playableRows.forEach((row) => {
    const hasEmptyCell = tables.some((table) => {
      const colIndex = columns.indexOf('announc');
      const cellVal = allScores[table.id]?.[colIndex]?.[row.id];
      return cellVal === undefined || cellVal === null;
    });
    if (!hasEmptyCell) return;

    const btn = document.createElement('button');
    btn.className = 'flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left';
    btn.innerHTML = `
      ${row.icon ? `<i class="${row.icon} text-slate-500"></i>` : '<i class="fas fa-circle text-slate-300 text-xs"></i>'}
      <span class="font-medium text-slate-700">${row.label}</span>
    `;
    btn.onclick = () => selectNajava(row.id);
    optionsContainer.appendChild(btn);
  });

  modal.classList.remove('hidden');
}

function closeNajavaModal() {
  const modal = document.getElementById('najava-modal');
  if (modal) modal.classList.add('hidden');
}

function selectNajava(rowId) {
  najavaActive = true;
  najavaRowId = rowId;
  closeNajavaModal();
  updateNajavaIndicator();
  setSubmitPreviewActive(true);
}

function cancelNajava() {
  najavaActive = false;
  najavaRowId = null;
  updateNajavaIndicator();
  if (submitPreviewActive) renderSubmitPreviews();
}

function updateNajavaIndicator() {
  const indicator = document.getElementById('najava-indicator');
  const label = document.getElementById('najava-row-label');
  if (!indicator) return;

  const row = najavaRowId ? rows.find((r) => r.id === najavaRowId) : null;
  const rowLabel = row?.label || '';
  if (label) label.textContent = rowLabel || '-';

  document.querySelectorAll('[data-ann-label]').forEach((el) => {
    el.textContent = rowLabel ? `(${rowLabel})` : '';
  });

  if (najavaActive && najavaRowId) {
    indicator.classList.remove('hidden');
  } else {
    indicator.classList.add('hidden');
  }
}

function getPreviewScore(row, diceCounts, diceSum) {
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
    let tripleVal = null;
    let pairVal = null;
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

// --- Rendering ---
function renderTableContainer(tableConfig) {
  const container = document.getElementById(`table-container-${tableConfig.id}`);
  const baseColor = tableConfig.color;

  // Generate HTML structure
  let html = `
        <div class="${tableConfig.subHeader} p-2 px-4 border-b border-${baseColor}-100 flex justify-between items-center">
            <h2 class="font-bold text-${baseColor}-800 flex items-center gap-2">
                <span class="bg-${tableConfig.color}-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">${tableConfig.id === 't1' ? 'A' : 'B'}</span>
                Table ${tableConfig.id === 't1' ? '1' : '2'}
            </h2>
            <span id="${tableConfig.id}-extra-badge" class="hidden text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
                Horiz. Bonus: +<span id="${tableConfig.id}-extra-val">0</span>
            </span>
        </div>
        <div class="flex-grow overflow-auto custom-scroll relative">
            <table class="w-full min-w-[350px] border-collapse text-center" id="table-${tableConfig.id}">
    `;

  // Header
  html += `
        <thead class="${tableConfig.headerColor} text-white sticky-head shadow-sm">
            <tr>
                <th class="p-2 w-14 sticky-col ${tableConfig.headerColor} sticky-corner border-b border-white/20"></th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrow-down block text-xs opacity-75"></i><span class="text-xs uppercase">Down</span></th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrow-up block text-xs opacity-75"></i><span class="text-xs uppercase">Up</span></th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrows-left-right block text-xs opacity-75"></i><span class="text-xs uppercase">Free</span></th>
                <th class="p-2 w-1/4 border-l border-white/20">
                  <i class="fas fa-bullhorn block text-xs opacity-75"></i>
                  <span class="text-xs uppercase">Ann.</span>
                  <span data-ann-label class="block text-[10px] font-semibold text-white/80"></span>
                </th>
            </tr>
        </thead>
        <tbody class="text-sm">
    `;

  rows.forEach((row) => {
    const isSum = row.isSum;
    const rowClass = isSum ? `bg-${baseColor}-50 font-bold` : 'hover:bg-slate-50 transition-colors';
    const labelBg = isSum ? `bg-${baseColor}-100` : 'bg-white';
    const labelId = `${tableConfig.id}_label_${row.id}`;
    const badgeId = `${tableConfig.id}_badge_${row.id}`;

    html += `<tr class="${rowClass}">`;

    // Label
    html += `
            <td id="${labelId}" class="sticky-col ${labelBg} p-2 text-right border-b border-slate-200 text-slate-600 transition-colors duration-300">
                <div class="flex items-center justify-end gap-2">
                     <span id="${badgeId}" class="hidden bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 rounded-full border border-yellow-300 shadow-sm badge-pop">+0</span>
                    ${row.icon ? `<i class="${row.icon} opacity-50 text-[10px]"></i>` : ''}
                    <span>${row.label}</span>
                </div>
            </td>
        `;

    // Cells
    columns.forEach((col, cIndex) => {
      const cellId = `${tableConfig.id}_c${cIndex}_${row.id}`;
      const ghostId = `ghost_${tableConfig.id}_c${cIndex}_${row.id}`;

      html += `<td class="border-l border-b border-slate-200 p-0 relative h-10">`;
      if (isSum) {
        html += `<div id="${cellId}" class="flex flex-col items-center justify-center w-full h-full text-${baseColor}-700 transition-all duration-300 leading-none">0</div>`;
      } else {
        // Ghost
        html += `<span id="${ghostId}" class="absolute top-0.5 right-1 text-[9px] text-slate-300 italic pointer-events-none z-0"></span>`;
        html += `<span id="preview_${tableConfig.id}_c${cIndex}_${row.id}" class="absolute bottom-0.5 left-1 text-[10px] text-emerald-600 font-semibold opacity-0 transition-opacity pointer-events-none z-0"></span>`;

        const inputClasses = `w-full h-full text-center bg-transparent relative z-10 focus:bg-${baseColor}-100 focus:outline-none font-medium text-slate-800 cursor-pointer selection:bg-transparent`;

        html += `<input type="text" id="${cellId}" readonly
                class="${inputClasses}" 
                placeholder="-" 
                onclick="applyAutoScore('${tableConfig.id}', ${cIndex}, '${row.id}')">`;
      }
      html += `</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody>`;

  // Footer
  html += `
        <tfoot class="bg-slate-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
            <tr class="border-t-2 border-slate-300">
                <td class="p-2 sticky-col bg-slate-200 text-right pr-2 text-[10px] uppercase text-slate-500">Total</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_0">0</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_1">0</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_2">0</td>
                <td class="p-2 border-l border-slate-300 text-${baseColor}-700" id="${tableConfig.id}_total_3">0</td>
            </tr>
        </tfoot>
    `;
  html += `</table></div>`;

  container.innerHTML = html;
}

// --- Logic ---

function handleInput(tableId, colIndex, rowId, value) {
  const val = value === '' ? null : parseInt(value, 10);
  updateState(tableId, colIndex, rowId, val);
}

function updateState(tableId, colIndex, rowId, val) {
  if (!allScores[tableId]) allScores[tableId] = {};
  if (!allScores[tableId][colIndex]) allScores[tableId][colIndex] = {};

  allScores[tableId][colIndex][rowId] = val;

  const el = document.getElementById(`${tableId}_c${colIndex}_${rowId}`);
  if (el) {
    // Update value
    if (el.value !== val) {
      el.value = val === null ? '' : val;
    }
    // Update Crossed Out Style
    if (val === 0) {
      el.parentElement.classList.add('crossed-out');
    } else {
      el.parentElement.classList.remove('crossed-out');
    }
  }

  calculateColumn(tableId, colIndex);
  updatePeerGhost(tableId, colIndex, rowId, val);
  saveScores();

  if (val !== null && typeof window.resetRollState === 'function') {
    window.resetRollState();
  }
}

function applyAutoScore(tableId, colIndex, rowId) {
  const rowConfig = rows.find((row) => row.id === rowId);
  if (!rowConfig || rowConfig.isSum) return;
  const inputEl = document.getElementById(`${tableId}_c${colIndex}_${rowId}`);
  if (!inputEl || inputEl.value !== '') return;
  if (!submitPreviewActive && !najavaActive) return;
  if (!isRowAllowed(tableId, colIndex, rowId)) return;

  const diceCounts = Array(7).fill(0);
  let diceSum = 0;
  diceValues.forEach((val) => {
    if (val === null) return;
    diceCounts[val] += 1;
    diceSum += val;
  });

  const score = getPreviewScore(rowConfig, diceCounts, diceSum);
  updateState(tableId, colIndex, rowId, score);
}

// --- Calculation & Shared ---
function updatePeerGhost(sourceTableId, colIndex, rowId, val) {
  const peerId = sourceTableId === 't1' ? 't2' : 't1';
  const ghostId = `ghost_${peerId}_c${colIndex}_${rowId}`;
  const ghostEl = document.getElementById(ghostId);
  if (ghostEl) ghostEl.innerText = val !== null && val !== undefined ? val : '';
}

function refreshAllGhosts() {
  updateGhostsForTable('t1', 't2');
  updateGhostsForTable('t2', 't1');
}

function updateGhostsForTable(targetTable, sourceTable) {
  const sourceData = allScores[sourceTable];
  if (!sourceData) return;
  Object.keys(sourceData).forEach((colIdx) => {
    Object.entries(sourceData[colIdx]).forEach(([rowId, val]) => {
      const ghostId = `ghost_${targetTable}_c${colIdx}_${rowId}`;
      const ghostEl = document.getElementById(ghostId);
      if (ghostEl && val !== null) ghostEl.innerText = val;
    });
  });
}

function calculateColumn(tableId, colIndex) {
  const tableData = allScores[tableId] || {};
  const colScores = tableData[colIndex] || {};

  let rawSum1 = 0;
  ['1', '2', '3', '4', '5', '6'].forEach((r) => {
    rawSum1 += colScores[r] || 0;
  });
  const sum1Bonus = rawSum1 >= 60 ? 30 : 0;
  const sum1Badge = rawSum1 >= 60 ? 'bg-blue-600' : '';
  updateCellWithBadge(`${tableId}_c${colIndex}_sum1`, rawSum1 + sum1Bonus, sum1Bonus, sum1Badge);

  const max = colScores.max || 0;
  const min = colScores.min || 0;
  const ones = colScores['1'] || 0;
  let sum2 = 0;
  if (
    (colScores.max !== undefined && colScores.max !== null) ||
    (colScores.min !== undefined && colScores.min !== null)
  ) {
    sum2 = (max - min) * ones;
  }
  if (colScores.max === undefined && colScores.min === undefined) sum2 = 0;
  updateCellWithBadge(`${tableId}_c${colIndex}_sum2`, sum2, 0, '');

  let sum3Base = 0;
  ['str', 'full', 'poker', 'yamb'].forEach((r) => {
    sum3Base += colScores[r] || 0;
  });

  const strVal = colScores.str || 0;
  const fullVal = colScores.full || 0;
  const pokVal = colScores.poker || 0;
  const yambVal = colScores.yamb || 0;

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

  const total = rawSum1 + sum1Bonus + sum2 + sum3Total;
  const totalEl = document.getElementById(`${tableId}_total_${colIndex}`);
  if (totalEl) totalEl.innerText = total;

  calculateGrandTotal();
}

function updateCellWithBadge(elementId, totalValue, bonusValue, badgeColorClass) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let contentHTML = `<span class="text-lg font-bold">${totalValue}</span>`;
  if (bonusValue > 0 && badgeColorClass) {
    contentHTML += `<span class="${badgeColorClass} text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold mt-0.5 badge-pop shadow-sm">+${bonusValue}</span>`;
  }
  if (el.getAttribute('data-val') !== String(totalValue) || el.getAttribute('data-bonus') !== String(bonusValue)) {
    el.innerHTML = contentHTML;
    el.setAttribute('data-val', totalValue);
    el.setAttribute('data-bonus', bonusValue);
  }
}

function calculateGrandTotal() {
  let superTotal = 0;
  ['t1', 't2'].forEach((tid) => {
    let tableSum = 0;
    for (let c = 0; c < 4; c += 1) {
      const el = document.getElementById(`${tid}_total_${c}`);
      tableSum += parseInt(el.innerText || '0', 10);
    }
    const rowBonus = checkRowBonuses(tid);
    tableSum += rowBonus;
    document.getElementById(`grand-total-${tid}`).innerText = tableSum;
    superTotal += tableSum;

    const badge = document.getElementById(`${tid}-extra-badge`);
    const badgeVal = document.getElementById(`${tid}-extra-val`);
    if (rowBonus > 0) {
      badge.classList.remove('hidden');
      badge.classList.add('inline-flex');
      badgeVal.innerText = rowBonus;
    } else {
      badge.classList.add('hidden');
      badge.classList.remove('inline-flex');
    }
  });
  document.getElementById('super-total').innerText = superTotal;
}

function checkRowBonuses(tableId) {
  let bonus = 0;
  const targetRows = ['str', 'full', 'poker'];
  targetRows.forEach((rowId) => {
    const vals = [];
    for (let c = 0; c < 4; c += 1) vals.push(allScores[tableId]?.[c]?.[rowId]);
    const labelEl = document.getElementById(`${tableId}_label_${rowId}`);
    const badgeEl = document.getElementById(`${tableId}_badge_${rowId}`);
    const reference = vals[0];
    const isComplete =
      reference !== undefined &&
      reference !== null &&
      reference > 0 &&
      vals.every((v) => v === reference);

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

function saveScores() {
  localStorage.setItem('dual_jamb_scores_v10', JSON.stringify(allScores));
}

function loadScores() {
  const saved = localStorage.getItem('dual_jamb_scores_v10');
  if (saved) {
    try {
      allScores = JSON.parse(saved);
      if (!allScores.t1) allScores = { t1: {}, t2: {} };
      ['t1', 't2'].forEach((tid) => {
        const tableData = allScores[tid] || {};
        Object.keys(tableData).forEach((colIdx) => {
          Object.entries(tableData[colIdx]).forEach(([rowId, val]) => {
            // Update value and style
            const el = document.getElementById(`${tid}_c${colIdx}_${rowId}`);
            if (el) {
              el.value = val === null ? '' : val;
              if (val === 0) el.parentElement.classList.add('crossed-out');
              else el.parentElement.classList.remove('crossed-out');
            }
          });
          calculateColumn(tid, colIdx);
        });
      });
      refreshAllGhosts();
    } catch (e) {
      allScores = { t1: {}, t2: {} };
    }
  }
}

function resetGame() {
  if (confirm('Clear ALL scores?')) {
    localStorage.removeItem('dual_jamb_scores_v10');
    allScores = { t1: {}, t2: {} };
    document.querySelectorAll('input').forEach((i) => {
      i.value = '';
    });
    document.querySelectorAll('[id*="_sum"]').forEach((s) => {
      s.innerHTML = '0';
      s.removeAttribute('data-val');
      s.removeAttribute('data-bonus');
    });
    document
      .querySelectorAll('[id*="_total_"], span[id*="grand-total"]')
      .forEach((s) => {
        s.innerText = '0';
      });
    document.getElementById('super-total').innerText = '0';
    document.querySelectorAll('.row-bonus-active').forEach((el) => el.classList.remove('row-bonus-active'));
    document.querySelectorAll('.crossed-out').forEach((el) => el.classList.remove('crossed-out'));
    document.querySelectorAll('[id*="_badge_"], [id$="-extra-badge"]').forEach((el) => el.classList.add('hidden'));
    document.querySelectorAll('[id^="ghost_"]').forEach((el) => {
      el.innerText = '';
    });
    if (typeof window.resetRollState === 'function') {
      window.resetRollState();
    }
  }
}

Object.assign(window, {
  resetGame,
  applyAutoScore,
  openNajavaModal,
  closeNajavaModal,
  selectNajava,
  cancelNajava
});

init();

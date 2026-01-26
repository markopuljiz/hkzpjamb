import './style.css';

// --- Configuration ---
const tables = [
  { id: 't1', color: 'blue', headerColor: 'bg-blue-600', subHeader: 'bg-blue-50' },
  { id: 't2', color: 'emerald', headerColor: 'bg-emerald-600', subHeader: 'bg-emerald-50' }
];

const columns = ['down', 'free', 'up', 'announc'];
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
let activeCell = null;

// --- Init ---
function init() {
  tables.forEach((t) => renderTableContainer(t));
  loadScores();
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
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrows-left-right block text-xs opacity-75"></i><span class="text-xs uppercase">Free</span></th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-arrow-up block text-xs opacity-75"></i><span class="text-xs uppercase">Up</span></th>
                <th class="p-2 w-1/4 border-l border-white/20"><i class="fas fa-bullhorn block text-xs opacity-75"></i><span class="text-xs uppercase">Ann.</span></th>
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

        const inputClasses = `w-full h-full text-center bg-transparent relative z-10 focus:bg-${baseColor}-100 focus:outline-none font-medium text-slate-800 cursor-pointer selection:bg-transparent`;

        if (row.type === 'manual') {
          html += `<input type="number" id="${cellId}" 
                class="${inputClasses}"
                placeholder="-" 
                oninput="handleInput('${tableConfig.id}', ${cIndex}, '${row.id}', this.value)"
                onfocus="this.select()">`;
        } else {
          html += `<input type="text" id="${cellId}" readonly
                class="${inputClasses}" 
                placeholder="-" 
                onclick="openModal('${tableConfig.id}', ${cIndex}, '${row.id}')">`;
        }
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
}

// --- Modal Logic ---

function openModal(tableId, colIndex, rowId) {
  const rowConfig = rows.find((r) => r.id === rowId);
  if (!rowConfig) return;

  activeCell = { tableId, colIndex, rowId };

  const promptEl = document.getElementById('modal-prompt');
  promptEl.innerText = `Enter score for ${rowConfig.label}`;

  const contentEl = document.getElementById('modal-content');
  contentEl.innerHTML = '';

  const modal = document.getElementById('score-modal');
  modal.classList.remove('hidden');

  if (rowConfig.type === 'count') {
    const diceVal = parseInt(rowId, 10);
    promptEl.innerText = `How many ${rowConfig.label}s?`;
    renderCountButtons(diceVal);
  } else if (rowConfig.type === 'straight') {
    renderStraightButtons();
  } else if (rowConfig.type === 'full') {
    renderFullHouseWizard();
  } else if (rowConfig.type === 'poker') {
    renderPokerButtons();
  } else if (rowConfig.type === 'yamb') {
    renderYambButtons();
  }
}

function closeModal() {
  document.getElementById('score-modal').classList.add('hidden');
  activeCell = null;
}

function commitScore(val) {
  if (activeCell) {
    updateState(activeCell.tableId, activeCell.colIndex, activeCell.rowId, val);
  }
  closeModal();
}

// --- Modal Renderers ---

function renderCountButtons(multiplier) {
  const container = document.getElementById('modal-content');
  container.className = 'grid grid-cols-3 gap-3';

  for (let i = 1; i <= 5; i += 1) {
    const val = i * multiplier;
    const btn = document.createElement('button');
    btn.className =
      'p-4 bg-slate-100 hover:bg-blue-100 border border-slate-300 rounded-lg text-lg font-bold transition-colors';
    btn.innerHTML = `<div class="text-xs text-slate-500 font-normal">Count: ${i}</div><div class="text-blue-600">${val}</div>`;
    btn.onclick = () => commitScore(val);
    container.appendChild(btn);
  }
}

function renderStraightButtons() {
  const container = document.getElementById('modal-content');
  container.className = 'grid grid-cols-2 gap-4';

  const opts = [
    { label: 'Small', val: 56 },
    { label: 'Big', val: 66 }
  ];

  opts.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className =
      'p-6 bg-slate-100 hover:bg-green-100 border border-slate-300 rounded-xl text-xl font-bold transition-colors flex flex-col items-center gap-1';
    btn.innerHTML = `<span>${opt.label}</span><span class="text-2xl text-green-600">${opt.val}</span>`;
    btn.onclick = () => commitScore(opt.val);
    container.appendChild(btn);
  });
}

function renderFullHouseWizard() {
  const container = document.getElementById('modal-content');
  const prompt = document.getElementById('modal-prompt');
  prompt.innerText = 'Full House: Select Triple (3x)';
  renderDiceGrid(container, (tripleVal) => {
    prompt.innerText = 'Full House: Select Double (2x)';
    renderDiceGrid(
      container,
      (doubleVal) => {
        const score = tripleVal * 3 + doubleVal * 2 + 30;
        commitScore(score);
      },
      tripleVal
    );
  });
}

function renderPokerButtons() {
  const container = document.getElementById('modal-content');
  const prompt = document.getElementById('modal-prompt');
  prompt.innerText = 'Poker (4x): Select Dice';
  renderDiceGrid(container, (diceVal) => {
    const score = diceVal * 4 + 40;
    commitScore(score);
  });
}

function renderYambButtons() {
  const container = document.getElementById('modal-content');
  const prompt = document.getElementById('modal-prompt');
  prompt.innerText = 'Jamb (5x): Select Dice';
  renderDiceGrid(container, (diceVal) => {
    const score = diceVal * 5 + 70;
    commitScore(score);
  });
}

function renderDiceGrid(container, clickHandler, excludedVal = null) {
  container.innerHTML = '';
  container.className = 'grid grid-cols-3 gap-3';

  const diceIcons = [
    'fa-dice-one',
    'fa-dice-two',
    'fa-dice-three',
    'fa-dice-four',
    'fa-dice-five',
    'fa-dice-six'
  ];

  for (let i = 1; i <= 6; i += 1) {
    const btn = document.createElement('button');
    const isDisabled = i === excludedVal;
    btn.className = `p-3 border rounded-lg flex flex-col items-center gap-2 transition-all 
            ${
              isDisabled
                ? 'opacity-25 cursor-not-allowed bg-slate-100'
                : 'bg-white hover:bg-indigo-50 border-slate-300 shadow-sm'
            }`;
    btn.disabled = isDisabled;
    btn.innerHTML = `
            <i class="fas ${diceIcons[i - 1]} text-2xl ${isDisabled ? 'text-slate-400' : 'text-indigo-600'}"></i>
            <span class="text-sm font-bold">${i}</span>
        `;
    if (!isDisabled) {
      btn.onclick = () => clickHandler(i);
    }
    container.appendChild(btn);
  }
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
  }
}

Object.assign(window, {
  resetGame,
  openModal,
  closeModal,
  commitScore,
  handleInput
});

init();

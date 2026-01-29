import { supabase } from './supabaseClient.js';
import { getMultiplayerSession } from './multiplayerState.js';

const tableIds = ['t1', 't2'];
const columnIndices = [0, 1, 2, 3];
const sum1Rows = ['1', '2', '3', '4', '5', '6'];
const sum3Rows = ['str', 'full', 'poker', 'yamb'];

function hasValue(value) {
  return value !== null && value !== undefined;
}

function computeColumnTotals(colScores) {
  const sum1Ready = sum1Rows.every((rowId) => hasValue(colScores[rowId]));
  const rawSum1 = sum1Rows.reduce((acc, rowId) => acc + (Number(colScores[rowId]) || 0), 0);
  const sum1Bonus = rawSum1 >= 60 ? 30 : 0;
  const sum1Total = rawSum1 + sum1Bonus;

  const maxRaw = colScores.max;
  const minRaw = colScores.min;
  const ones = Number(colScores['1']) || 0;
  let sum2Base = 0;
  if (hasValue(maxRaw) && hasValue(minRaw)) {
    sum2Base = Math.max(0, (Number(maxRaw) || 0) - (Number(minRaw) || 0)) * ones;
  }
  const sum2Bonus = sum2Base >= 60 ? 30 : 0;
  const sum2Total = sum2Base + sum2Bonus;

  const sum3Base = sum3Rows.reduce((acc, rowId) => acc + (Number(colScores[rowId]) || 0), 0);
  const strVal = Number(colScores.str) || 0;
  const fullVal = Number(colScores.full) || 0;
  const pokVal = Number(colScores.poker) || 0;
  const yambVal = Number(colScores.yamb) || 0;

  let sum3Bonus = 0;
  if (strVal === 56 && fullVal === 37 && pokVal === 44) {
    sum3Bonus = yambVal === 75 ? 212 : 137;
  } else if (strVal === 66 && fullVal === 58 && pokVal === 64) {
    sum3Bonus = yambVal === 100 ? 100 : 50;
  } else if (strVal === 56 && fullVal === 56 && pokVal === 56) {
    sum3Bonus = 56;
  }

  const sum3Total = sum3Base + sum3Bonus;
  const colTotal = rawSum1 + sum1Bonus + sum2Base + sum2Bonus + sum3Total;

  return { sum1Total, sum2Total, colTotal, sum1Ready };
}

function computeTotals(allScores) {
  let superTotal = 0;
  const tableTotals = {};

  tableIds.forEach((tableId) => {
    const tableData = allScores[tableId] || {};
    const columnData = columnIndices.map((colIdx) => {
      const colScores = tableData[String(colIdx)] || {};
      return computeColumnTotals(colScores);
    });

    const rowBonusTargets = ['sum1', 'sum2', 'str', 'full', 'poker'];
    let rowBonus = 0;
    const sum1Ready = columnData.every((col) => col.sum1Ready);

    rowBonusTargets.forEach((rowId) => {
      const vals = columnIndices.map((colIdx, index) => {
        const colScores = tableData[String(colIdx)] || {};
        if (rowId === 'sum1') return columnData[index].sum1Total;
        if (rowId === 'sum2') return columnData[index].sum2Total;
        return hasValue(colScores[rowId]) ? Number(colScores[rowId]) : null;
      });

      const reference = vals[0];
      const isComplete =
        reference !== null &&
        reference !== undefined &&
        reference > 0 &&
        vals.every((val) => val === reference) &&
        (rowId !== 'sum1' || sum1Ready);

      if (isComplete) rowBonus += reference;
    });

    const tableTotal = columnData.reduce((acc, col) => acc + col.colTotal, 0) + rowBonus;
    tableTotals[tableId] = tableTotal;
    superTotal += tableTotal;
  });

  return { tableTotals, superTotal };
}

function renderPlayerCard({ name, totals }) {
  const card = document.createElement('div');
  card.className = 'border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-3';
  card.innerHTML = `
    <div class="text-sm font-semibold text-slate-800">${name}</div>
    <div class="grid grid-cols-3 gap-2 text-xs text-slate-600">
      <div class="bg-white rounded-lg px-2 py-2 border border-slate-200">
        <div class="uppercase text-[10px] text-slate-400">Table A</div>
        <div class="text-lg font-bold text-blue-600">${totals.tableTotals.t1}</div>
      </div>
      <div class="bg-white rounded-lg px-2 py-2 border border-slate-200">
        <div class="uppercase text-[10px] text-slate-400">Table B</div>
        <div class="text-lg font-bold text-emerald-600">${totals.tableTotals.t2}</div>
      </div>
      <div class="bg-white rounded-lg px-2 py-2 border border-slate-200">
        <div class="uppercase text-[10px] text-slate-400">Total</div>
        <div class="text-lg font-bold text-slate-800">${totals.superTotal}</div>
      </div>
    </div>
  `;
  return card;
}

export function initMultiplayerScores() {
  const viewBtn = document.getElementById('view-scores-btn');
  const modal = document.getElementById('scores-modal');
  const modalBody = document.getElementById('scores-modal-body');
  const modalEmpty = document.getElementById('scores-modal-empty');
  const closeBtn = document.getElementById('scores-modal-close');
  const overlay = document.getElementById('scores-modal-overlay');

  const closeModal = () => {
    modal?.classList.add('hidden');
  };

  const openModal = async () => {
    if (!modal || !modalBody || !modalEmpty) return;
    modal.classList.remove('hidden');
    modalBody.innerHTML = '';
    modalEmpty.textContent = 'Loading scores...';
    modalEmpty.classList.remove('hidden');

    const session = getMultiplayerSession();
    if (!session.active || !session.roomId || !supabase) {
      modalEmpty.textContent = 'No active multiplayer session.';
      return;
    }

    const { data: players } = await supabase
      .from('yamb_players')
      .select('session_id, name, joined_at')
      .eq('room_id', session.roomId)
      .order('joined_at', { ascending: true });

    const { data: scores, error } = await supabase
      .from('yamb_scores')
      .select('session_id, table_id, column_index, row_id, value')
      .eq('room_id', session.roomId);

    if (error) {
      modalEmpty.textContent = error.message || 'Failed to load scores.';
      return;
    }

    const scoresBySession = new Map();
    scores?.forEach((row) => {
      if (!scoresBySession.has(row.session_id)) {
        scoresBySession.set(row.session_id, { t1: {}, t2: {} });
      }
      const tableData = scoresBySession.get(row.session_id);
      const colKey = String(row.column_index);
      if (!tableData[row.table_id]) tableData[row.table_id] = {};
      if (!tableData[row.table_id][colKey]) tableData[row.table_id][colKey] = {};
      tableData[row.table_id][colKey][row.row_id] = row.value;
    });

    modalBody.innerHTML = '';
    const playerList = players?.length ? players : [{ session_id: session.sessionId, name: 'Player 1' }];

    playerList.forEach((player, index) => {
      const tableScores = scoresBySession.get(player.session_id) || { t1: {}, t2: {} };
      const totals = computeTotals(tableScores);
      const name = player.name || `Player ${index + 1}`;
      modalBody.appendChild(renderPlayerCard({ name, totals }));
    });

    if (!playerList.length) {
      modalEmpty.textContent = 'No scores yet.';
      modalEmpty.classList.remove('hidden');
    } else {
      modalEmpty.classList.add('hidden');
    }
  };

  viewBtn?.addEventListener('click', () => {
    openModal();
  });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

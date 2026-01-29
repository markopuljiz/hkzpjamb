import { supabase } from './supabaseClient.js';
import { getMultiplayerSession } from './multiplayerState.js';
import { columns, rows } from './game/config';

const tableIds = ['t1', 't2'];
const columnIndices = [0, 1, 2, 3];
const sum1Rows = ['1', '2', '3', '4', '5', '6'];
const sum3Rows = ['str', 'full', 'poker', 'yamb'];
const playableRows = rows.filter((row) => !row.isSum).map((row) => row.id);
const totalPlayableCells = playableRows.length * columns.length * tableIds.length;

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

function computeCompletionPercent(tableScores) {
  let filled = 0;
  tableIds.forEach((tableId) => {
    const tableData = tableScores[tableId] || {};
    columnIndices.forEach((colIdx) => {
      const colScores = tableData[String(colIdx)] || {};
      playableRows.forEach((rowId) => {
        if (hasValue(colScores[rowId])) filled += 1;
      });
    });
  });
  return totalPlayableCells ? Math.round((filled / totalPlayableCells) * 100) : 0;
}

function renderPlayerCard({ name, totals, isLocal, rank }) {
  const card = document.createElement('div');
  const percent = computeCompletionPercent(totals.tableScores);
  const bgColor = isLocal ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'bg-slate-100/40';
  const rankIcon = rank === 1 ? '<i class="fas fa-crown text-yellow-500 mr-1"></i>' : '';

  card.className = `relative overflow-hidden rounded-lg p-2 transition-all ${bgColor}`;
  card.innerHTML = `
    <div class="flex items-center gap-2 mb-1.5">
      <span class="shrink-0 w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">${rank}</span>
      <div class="flex flex-col min-w-0 flex-1">
        <span class="text-[11px] font-bold text-slate-800 truncate leading-tight">${rankIcon}${name}</span>
        ${isLocal ? '<span class="text-[7px] font-bold text-blue-500 uppercase tracking-tighter leading-none">You</span>' : ''}
      </div>
      <div class="shrink-0 flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-md">
        <i class="fas fa-star text-yellow-400 text-[8px]"></i>
        <span class="font-mono font-bold text-yellow-300 text-[11px] leading-none">${totals.superTotal}</span>
      </div>
    </div>
    
    <div class="flex items-center gap-1.5 mb-1.5">
      <div class="flex-1 flex items-center gap-1.5 bg-blue-50/50 rounded-md px-1.5 py-0.5 border border-blue-100/50">
        <span class="text-[7px] font-bold text-blue-400 uppercase">A</span>
        <span class="text-[10px] font-bold text-blue-600 ml-auto">${totals.tableTotals.t1}</span>
      </div>
      <div class="flex-1 flex items-center gap-1.5 bg-emerald-50/50 rounded-md px-1.5 py-0.5 border border-emerald-100/50">
        <span class="text-[7px] font-bold text-emerald-400 uppercase">B</span>
        <span class="text-[10px] font-bold text-emerald-600 ml-auto">${totals.tableTotals.t2}</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex-1 h-0.5 bg-slate-200 rounded-full overflow-hidden">
        <div class="h-full bg-emerald-500 transition-all duration-500" style="width: ${percent}%"></div>
      </div>
      <span class="shrink-0 text-[7px] font-bold text-slate-500 tracking-tighter leading-none">${percent}%</span>
    </div>
  `;
  return card;
}

export function initMultiplayerScores() {
  const viewBtn = document.getElementById('view-scores-btn');
  const playerScorePill = document.getElementById('player-score-pill');
  const modal = document.getElementById('scores-modal');
  const modalBody = document.getElementById('scores-modal-body');
  const modalEmpty = document.getElementById('scores-modal-empty');
  const closeBtn = document.getElementById('scores-modal-close');
  const overlay = document.getElementById('scores-modal-overlay');
  const opponentSummary = document.getElementById('opponent-summary');

  let isDraggingOpponents = false;
  let opponentDragStartX = 0;
  let opponentScrollStart = 0;

  let opponentIntervalId = null;

  const closeModal = () => {
    modal?.classList.add('hidden');
  };

  const updateOpponentSummary = async () => {
    if (!opponentSummary) return;
    const session = getMultiplayerSession();
    if (!session.active || !session.roomId || !session.sessionId || !supabase) {
      opponentSummary.classList.add('hidden');
      opponentSummary.textContent = '';
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
      opponentSummary.classList.add('hidden');
      opponentSummary.textContent = '';
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

    const playerList = players?.length ? players : [{ session_id: session.sessionId, name: 'Player 1' }];
    const opponents = playerList.filter((player) => player.session_id !== session.sessionId);

    if (!opponents.length) {
      opponentSummary.classList.add('hidden');
      opponentSummary.textContent = '';
      return;
    }

    const opponentData = opponents
      .map((player) => {
        const tableScores = scoresBySession.get(player.session_id) || { t1: {}, t2: {} };
        const totals = computeTotals(tableScores);
        const percent = computeCompletionPercent(tableScores);
        const nameIndex = playerList.findIndex((p) => p.session_id === player.session_id);
        const name = player.name || `Player ${nameIndex + 1}`;
        return { name, total: totals.superTotal, percent };
      })
      .sort((a, b) => b.total - a.total);

    opponentSummary.innerHTML = opponentData
      .map((opponent) => `
        <div class="flex items-center gap-1.5 bg-slate-900/50 px-2 py-0.5 rounded-lg border border-white/5">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter opacity-80">${opponent.name}</span>
          <i class="fas fa-star text-yellow-400 text-[10px]"></i>
          <span class="font-mono font-bold text-white text-sm leading-none">${opponent.total}</span>
          <span class="text-[9px] text-slate-500">${opponent.percent}%</span>
        </div>
      `)
      .join('');
    opponentSummary.classList.remove('hidden');
    opponentSummary.classList.add('flex');
  };

  const startOpponentPolling = () => {
    if (opponentIntervalId) return;
    updateOpponentSummary();
    opponentIntervalId = window.setInterval(updateOpponentSummary, 10000);
  };

  if (opponentSummary) {
    opponentSummary.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      isDraggingOpponents = true;
      opponentDragStartX = event.clientX;
      opponentScrollStart = opponentSummary.scrollLeft;
      opponentSummary.classList.add('active');
    });

    window.addEventListener('mousemove', (event) => {
      if (!isDraggingOpponents) return;
      const delta = event.clientX - opponentDragStartX;
      opponentSummary.scrollLeft = opponentScrollStart - delta;
    });

    window.addEventListener('mouseup', () => {
      isDraggingOpponents = false;
      opponentSummary.classList.remove('active');
    });

    opponentSummary.addEventListener('mouseleave', () => {
      if (!isDraggingOpponents) return;
      isDraggingOpponents = false;
      opponentSummary.classList.remove('active');
    });
  }

  const stopOpponentPolling = () => {
    if (!opponentIntervalId) return;
    window.clearInterval(opponentIntervalId);
    opponentIntervalId = null;
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

    const playerList = players?.length ? players : [{ session_id: session.sessionId, name: 'Player 1' }];
    const allPlayerData = playerList.map((player, index) => {
      const tableScores = scoresBySession.get(player.session_id) || { t1: {}, t2: {} };
      const totals = computeTotals(tableScores);
      return {
        id: player.session_id,
        name: player.name || `Player ${index + 1}`,
        totals: { ...totals, tableScores },
        isLocal: player.session_id === session.sessionId
      };
    }).sort((a, b) => b.totals.superTotal - a.totals.superTotal);

    modalBody.innerHTML = '';
    allPlayerData.forEach((player, index) => {
      modalBody.appendChild(renderPlayerCard({ 
        name: player.name, 
        totals: player.totals, 
        isLocal: player.isLocal,
        rank: index + 1
      }));
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
  playerScorePill?.addEventListener('click', () => {
    openModal();
  });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  if (getMultiplayerSession().active) {
    startOpponentPolling();
  }

  window.addEventListener('storage', () => {
    const session = getMultiplayerSession();
    if (session.active) {
      startOpponentPolling();
    } else {
      stopOpponentPolling();
      if (opponentSummary) {
        opponentSummary.classList.add('hidden');
        opponentSummary.textContent = '';
      }
    }
  });
}

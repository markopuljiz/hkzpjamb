import { supabase } from './supabaseClient.js';
import { setMultiplayerSession } from './multiplayerState.js';
import { loadScores } from './game/storage';

const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const sessionStorageKey = 'yamb_multiplayer_session';

function getSessionId() {
  let existing = localStorage.getItem(sessionStorageKey);
  if (!existing) {
    existing = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(sessionStorageKey, existing);
  }
  return existing;
}

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

function normalizeRoomCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4);
}

function setError(el, message) {
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function setLoading(button, loadingText) {
  if (!button) return () => {};
  const original = button.textContent;
  button.disabled = true;
  button.textContent = loadingText;
  return () => {
    button.disabled = false;
    button.textContent = original;
  };
}

function buildRoomCard({ code, status, created_at, playersCount }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-2';

  const statusLabel = status === 'finished' ? 'Finished' : status === 'active' ? 'In progress' : 'Lobby';
  const meta = new Date(created_at).toLocaleString();

  wrapper.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-lg font-semibold text-slate-900 tracking-[0.2em]">${code}</span>
      <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">${statusLabel}</span>
    </div>
    <div class="text-sm text-slate-500">${playersCount} player${playersCount === 1 ? '' : 's'} · ${meta}</div>
  `;

  return wrapper;
}

export function initMultiplayer({ onNavigate }) {
  const multiplayerSection = document.getElementById('multiplayer');
  const lobbySection = document.getElementById('lobby');
  const createRoomBtn = document.getElementById('create-room-btn');
  const joinRoomBtn = document.getElementById('join-room-btn');
  const joinRoomInput = document.getElementById('join-room-code');
  const refreshBtn = document.getElementById('rooms-refresh-btn');
  const roomsList = document.getElementById('rooms-list');
  const roomsEmpty = document.getElementById('rooms-empty');
  const multiError = document.getElementById('multi-error');
  const lobbyError = document.getElementById('lobby-error');
  const lobbyCode = document.getElementById('lobby-room-code');
  const lobbyStatus = document.getElementById('lobby-status');
  const lobbyPlayerCount = document.getElementById('lobby-player-count');
  const lobbyPlayersList = document.getElementById('lobby-players-list');
  const lobbyNameInput = document.getElementById('lobby-name-input');
  const lobbyReadyBtn = document.getElementById('lobby-ready-btn');
  const lobbyReadyState = document.getElementById('lobby-ready-state');
  const lobbyStartBtn = document.getElementById('lobby-start-btn');
  const lobbyStartHint = document.getElementById('lobby-start-hint');
  const lobbyStartBanner = document.getElementById('lobby-start-banner');

  let currentRoom = null;
  let lobbyInterval = null;

  if (!supabase) {
    setError(multiError, 'Supabase environment variables missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const sessionId = getSessionId();

  const stopLobbyRefresh = () => {
    if (lobbyInterval) {
      window.clearInterval(lobbyInterval);
      lobbyInterval = null;
    }
  };

  const resetLobbyUI = () => {
    if (lobbyCode) lobbyCode.textContent = '----';
    if (lobbyStatus) lobbyStatus.textContent = 'Waiting for players...';
    if (lobbyPlayerCount) lobbyPlayerCount.textContent = '0';
    if (lobbyPlayersList) lobbyPlayersList.innerHTML = '';
    if (lobbyReadyState) lobbyReadyState.textContent = 'Not ready yet.';
    if (lobbyReadyBtn) {
      lobbyReadyBtn.disabled = false;
      lobbyReadyBtn.textContent = 'Ready';
    }
    if (lobbyStartBtn) {
      lobbyStartBtn.disabled = true;
    }
    if (lobbyStartHint) {
      lobbyStartHint.textContent = 'Waiting for all players to be ready.';
    }
    if (lobbyStartBanner) lobbyStartBanner.classList.add('hidden');
    setError(lobbyError, '');
  };

  async function refreshRoomsList() {
    if (!supabase || !roomsList || !roomsEmpty) return;

    const { data: rooms, error } = await supabase
      .from('yamb_rooms')
      .select('id, code, status, created_at')
      .in('status', ['lobby', 'active', 'finished'])
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      setError(multiError, error.message);
      return;
    }

    setError(multiError, '');
    roomsList.innerHTML = '';

    if (!rooms || rooms.length === 0) {
      roomsEmpty.classList.remove('hidden');
      return;
    }

    roomsEmpty.classList.add('hidden');
    const roomIds = rooms.map((room) => room.id);
    const { data: players } = await supabase
      .from('yamb_players')
      .select('room_id')
      .in('room_id', roomIds);

    const countByRoom = players?.reduce((acc, player) => {
      acc[player.room_id] = (acc[player.room_id] || 0) + 1;
      return acc;
    }, {}) ?? {};

    rooms.forEach((room) => {
      const card = buildRoomCard({
        ...room,
        playersCount: countByRoom[room.id] || 0
      });
      roomsList.appendChild(card);
    });
  }

  async function ensureRoomSlot(roomId, maxPlayers) {
    const { data: players, error } = await supabase
      .from('yamb_players')
      .select('id, session_id', { count: 'exact' })
      .eq('room_id', roomId);

    if (error) return { ok: false, message: error.message };

    const existing = players?.some((p) => p.session_id === sessionId);
    const count = players?.length || 0;

    if (!existing && count >= maxPlayers) {
      return { ok: false, message: 'Room is full. Ask someone to leave or create another room.' };
    }

    return { ok: true };
  }

  async function upsertPlayer(roomId, name = null, ready = false) {
    const payload = {
      room_id: roomId,
      session_id: sessionId,
      name,
      ready,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('yamb_players')
      .upsert(payload, { onConflict: 'room_id,session_id' });

    if (error) throw error;
  }

  async function createRoom() {
    if (!supabase) return;
    setError(multiError, '');
    const resetLoading = setLoading(createRoomBtn, 'Creating...');

    try {
      let room = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const code = generateRoomCode();
        const { data, error } = await supabase
          .from('yamb_rooms')
          .insert({ code, status: 'lobby', max_players: 4, host_session_id: sessionId })
          .select()
          .single();

        if (!error) {
          room = data;
          break;
        }
        if (error.code !== '23505') {
          throw error;
        }
      }

      if (!room) {
        throw new Error('Unable to reserve a unique room code. Try again.');
      }

      await upsertPlayer(room.id, null, false);
      currentRoom = room;
      if (joinRoomInput) joinRoomInput.value = '';
      onNavigate(`/${room.code}`);
    } catch (error) {
      setError(multiError, error.message || 'Unable to create room.');
    } finally {
      resetLoading();
    }
  }

  async function joinRoom(codeInput) {
    if (!supabase) return;
    const code = normalizeRoomCode(codeInput);
    if (!code) {
      setError(multiError, 'Enter a valid 4-letter code.');
      return;
    }

    setError(multiError, '');
    const resetLoading = setLoading(joinRoomBtn, 'Joining...');

    try {
      const { data: room, error } = await supabase
        .from('yamb_rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !room) {
        throw new Error('Room not found. Double-check the code.');
      }

      if (room.status === 'finished') {
        throw new Error('That room has already finished.');
      }

      const slot = await ensureRoomSlot(room.id, room.max_players || 4);
      if (!slot.ok) {
        throw new Error(slot.message);
      }

      await upsertPlayer(room.id, null, false);
      currentRoom = room;
      onNavigate(`/${room.code}`);
    } catch (error) {
      setError(multiError, error.message || 'Unable to join room.');
    } finally {
      resetLoading();
    }
  }

  async function refreshLobby() {
    if (!supabase || !currentRoom) return;

    const { data: room, error } = await supabase
      .from('yamb_rooms')
      .select('*')
      .eq('id', currentRoom.id)
      .single();

    if (error || !room) {
      setError(lobbyError, error?.message || 'Room not found.');
      return;
    }

    currentRoom = room;

    const { data: players, error: playersError } = await supabase
      .from('yamb_players')
      .select('id, session_id, name, ready, joined_at')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true });

    if (playersError) {
      setError(lobbyError, playersError.message);
      return;
    }

    const playerList = players || [];
    const readyCount = playerList.filter((player) => player.ready).length;
    const allReady = playerList.length > 0 && readyCount === playerList.length;
    const isHost = room.host_session_id === sessionId;

    if (lobbyCode) lobbyCode.textContent = room.code;
    if (lobbyPlayerCount) lobbyPlayerCount.textContent = String(playerList.length);
    if (lobbyStatus) {
      lobbyStatus.textContent = room.status === 'active' ? 'Game starting...' : 'Waiting for players...';
    }

    if (lobbyPlayersList) {
      lobbyPlayersList.innerHTML = '';
      playerList.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 bg-slate-50';
        row.innerHTML = `
          <div class="text-sm font-semibold text-slate-800">${player.name || `Player ${index + 1}`}</div>
          <div class="text-xs font-semibold ${player.ready ? 'text-emerald-600' : 'text-slate-400'}">
            ${player.ready ? 'Ready' : 'Not ready'}
          </div>
        `;
        lobbyPlayersList.appendChild(row);
      });
    }

    const currentPlayer = playerList.find((player) => player.session_id === sessionId);
    if (lobbyReadyState) {
      lobbyReadyState.textContent = currentPlayer?.ready ? 'You are ready.' : 'Not ready yet.';
    }
    if (lobbyReadyBtn) {
      lobbyReadyBtn.textContent = currentPlayer?.ready ? 'Ready ✓' : 'Ready';
      lobbyReadyBtn.disabled = currentPlayer?.ready || false;
    }

    if (lobbyStartBtn) {
      lobbyStartBtn.disabled = !(allReady && isHost) || room.status !== 'lobby';
    }

    if (lobbyStartHint) {
      if (!isHost) {
        lobbyStartHint.textContent = 'Only the host can start the game.';
      } else if (!allReady) {
        lobbyStartHint.textContent = 'Waiting for all players to be ready.';
      } else {
        lobbyStartHint.textContent = 'Everyone is ready. Start when you are.';
      }
    }

    if (lobbyStartBanner) {
      if (allReady && room.status === 'lobby') {
        lobbyStartBanner.classList.remove('hidden');
      } else {
        lobbyStartBanner.classList.add('hidden');
      }
    }

    if (room.status === 'active') {
      stopLobbyRefresh();
      setMultiplayerSession({ roomId: room.id, sessionId, roomCode: room.code });
      await loadScores();
      onNavigate(`/${room.code}`);
    }
  }

  async function enterLobby(code) {
    if (!supabase) return;
    stopLobbyRefresh();
    resetLobbyUI();

    const normalized = normalizeRoomCode(code);
    if (!normalized) {
      setError(lobbyError, 'Missing room code.');
      return;
    }

    const { data: room, error } = await supabase
      .from('yamb_rooms')
      .select('*')
      .eq('code', normalized)
      .single();

    if (error || !room) {
      setError(lobbyError, 'Room not found.');
      return;
    }

    const slot = await ensureRoomSlot(room.id, room.max_players || 4);
    if (!slot.ok) {
      setError(lobbyError, slot.message);
      return;
    }

    currentRoom = room;
    await upsertPlayer(room.id, null, false);
    await refreshLobby();

    lobbyInterval = window.setInterval(refreshLobby, 4000);
  }

  async function setReady() {
    if (!supabase || !currentRoom) return;
    const name = lobbyNameInput?.value?.trim();
    if (!name) {
      setError(lobbyError, 'Enter your name before getting ready.');
      return;
    }

    setError(lobbyError, '');
    lobbyReadyBtn.disabled = true;

    try {
      await upsertPlayer(currentRoom.id, name, true);
      await refreshLobby();
    } catch (error) {
      setError(lobbyError, error.message || 'Could not set ready state.');
    }
  }

  async function startGame() {
    if (!supabase || !currentRoom) return;

    const { data: room } = await supabase
      .from('yamb_rooms')
      .select('host_session_id, status')
      .eq('id', currentRoom.id)
      .single();

    if (!room || room.status !== 'lobby') return;
    if (room.host_session_id !== sessionId) {
      setError(lobbyError, 'Only the host can start the game.');
      return;
    }

    await supabase
      .from('yamb_rooms')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', currentRoom.id);

    await refreshLobby();
  }

  if (joinRoomInput) {
    joinRoomInput.addEventListener('input', () => {
      const normalized = normalizeRoomCode(joinRoomInput.value);
      if (joinRoomInput.value !== normalized) {
        joinRoomInput.value = normalized;
      }
    });
  }

  createRoomBtn?.addEventListener('click', () => createRoom());
  joinRoomBtn?.addEventListener('click', () => joinRoom(joinRoomInput?.value));
  refreshBtn?.addEventListener('click', () => refreshRoomsList());
  lobbyReadyBtn?.addEventListener('click', () => setReady());
  lobbyStartBtn?.addEventListener('click', () => startGame());

  if (multiplayerSection) {
    multiplayerSection.addEventListener('show', () => {
      refreshRoomsList();
    });
  }

  return {
    refreshRoomsList,
    enterLobby,
    resetLobby: () => {
      stopLobbyRefresh();
      resetLobbyUI();
      currentRoom = null;
    },
    stopLobbyRefresh
  };
}

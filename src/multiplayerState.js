const storageKey = 'yamb_multiplayer_active';

let cachedSession = null;

export function getMultiplayerSession() {
  if (cachedSession) return cachedSession;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return { active: false, roomId: null, sessionId: null, roomCode: null };
  try {
    const parsed = JSON.parse(raw);
    cachedSession = {
      active: !!parsed?.active,
      roomId: parsed?.roomId ?? null,
      sessionId: parsed?.sessionId ?? null,
      roomCode: parsed?.roomCode ?? null
    };
  } catch {
    cachedSession = { active: false, roomId: null, sessionId: null, roomCode: null };
  }
  return cachedSession;
}

export function setMultiplayerSession({ roomId, sessionId, roomCode }) {
  cachedSession = { active: true, roomId, sessionId, roomCode };
  localStorage.setItem(storageKey, JSON.stringify(cachedSession));
}

export function clearMultiplayerSession() {
  cachedSession = { active: false, roomId: null, sessionId: null, roomCode: null };
  localStorage.removeItem(storageKey);
}

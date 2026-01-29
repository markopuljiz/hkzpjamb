declare module '../multiplayerState.js' {
  export function getMultiplayerSession(): {
    active: boolean;
    roomId: number | null;
    sessionId: string | null;
  };
  export function setMultiplayerSession(payload: { roomId: number; sessionId: string }): void;
  export function clearMultiplayerSession(): void;
}

declare module '../supabaseClient.js' {
  import { SupabaseClient } from '@supabase/supabase-js';
  export const supabase: SupabaseClient | null;
}

declare module '../multiplayerState.js' {
  export function getMultiplayerSession(): {
    active: boolean;
    roomId: number | null;
    sessionId: string | null;
    roomCode: string | null;
  };
  export function setMultiplayerSession(payload: { roomId: number; sessionId: string; roomCode: string }): void;
  export function clearMultiplayerSession(): void;
}

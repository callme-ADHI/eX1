import type { FocusSession } from './types';

// ─── Message union type ───────────────────────────────────────────────────────

export type Message =
  | { type: 'OPEN_TAB'; url: string; active?: boolean }
  | { type: 'START_FOCUS_SESSION'; session: Omit<FocusSession, 'id' | 'startedAt' | 'status' | 'distractionAttempts'> }
  | { type: 'PAUSE_FOCUS_SESSION'; id: string }
  | { type: 'RESUME_FOCUS_SESSION'; id: string }
  | { type: 'CANCEL_FOCUS_SESSION'; id: string }
  | { type: 'CLOSE_TABS'; tabIds: number[] }
  | { type: 'REQUEST_SECURITY_REPORT'; origin: string }
  | { type: 'ADD_TASK'; task: { title: string; description: string; category: string; dueAt: number | null; priority: string } }
  | { type: 'UPDATE_TASK'; id: string; updates: Record<string, unknown> }
  | { type: 'DELETE_TASK'; id: string };

export type MessageResponse<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Typed send helper ────────────────────────────────────────────────────────

export function sendMessage<T = void>(message: Message): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message ?? 'Unknown error' });
      } else {
        resolve(response ?? { ok: true, data: undefined as T });
      }
    });
  });
}

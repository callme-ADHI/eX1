import { storageGet, storageSet, KEYS } from '../shared/storage';
import { DEFAULT_AI_TOOLS, DEFAULT_DOCK_ITEMS, DEFAULT_SETTINGS } from '../shared/defaults';
import { initFocusEngine, startSession, pauseSession, resumeSession, cancelSession } from './focusEngine';
import { initTabEngine, updateTabMeta } from './tabEngine';
import { initSecurityEngine, generateReport } from './securityEngine';
import { initProductivityEngine, addTask, updateTask, deleteTask } from './productivityEngine';
import { initializeTabIntelligence } from './modules/tabIntelligence';
import type { Message, MessageResponse } from '../shared/messaging';
import { extractOrigin } from '../shared/utils';

// ─── Service Worker Entry Point ───────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    // Seed defaults on first install
    await storageSet(KEYS.AI_TOOLS, DEFAULT_AI_TOOLS);
    await storageSet(KEYS.DOCK_ITEMS, DEFAULT_DOCK_ITEMS);
    await storageSet(KEYS.SETTINGS, DEFAULT_SETTINGS);
    await storageSet(KEYS.FOCUS_SESSIONS, []);
    await storageSet(KEYS.TASKS, []);
    console.log('[eX1] First install — defaults seeded.');
  }
});

// ─── Engine initialisation ────────────────────────────────────────────────────

initFocusEngine();
initTabEngine();
initSecurityEngine();
initProductivityEngine();
initializeTabIntelligence();

// ─── Message router ───────────────────────────────────────────────────────────
// IMPORTANT: handlers that respond asynchronously must return true.

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse: (r: MessageResponse) => void) => {
    handleMessage(message, sender)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep channel open for async response
  }
);

async function handleMessage(msg: Message, sender: chrome.runtime.MessageSender): Promise<unknown> {
  switch (msg.type) {
    case 'PAGE_META': {
      const tabId = sender.tab?.id;
      if (tabId && msg.type === 'PAGE_META') {
        updateTabMeta(tabId, msg);
      }
      if (msg.type === 'PAGE_META' && msg.origin && msg.permissions) {
        const cache = (await storageGet<Record<string, any>>(KEYS.SECURITY_CACHE)) ?? {};
        const existingReport = cache[msg.origin] ?? {
          origin: msg.origin,
          riskLevel: 'Safe',
          domainAgeDays: null,
          https: msg.origin.startsWith('https://'),
          certIssuer: null,
          certExpiresAt: null,
          flags: [],
          permissions: {
            camera: 'unknown',
            microphone: 'unknown',
            geolocation: 'unknown',
            notifications: 'unknown',
            clipboard: 'unknown',
            popups: 'unknown',
          },
          generatedAt: Date.now(),
        };
        existingReport.permissions = {
          ...existingReport.permissions,
          ...msg.permissions
        };
        cache[msg.origin] = existingReport;
        await storageSet(KEYS.SECURITY_CACHE, cache);
      }
      return;
    }

    case 'OPEN_TAB':
      await chrome.tabs.create({ url: msg.url, active: msg.active ?? true });
      return;

    case 'START_FOCUS_SESSION':
      return startSession(msg.session);

    case 'PAUSE_FOCUS_SESSION':
      await pauseSession(msg.id);
      return;

    case 'RESUME_FOCUS_SESSION':
      await resumeSession(msg.id);
      return;

    case 'CANCEL_FOCUS_SESSION':
      await cancelSession(msg.id);
      return;

    case 'CLOSE_TABS':
      await Promise.all(msg.tabIds.map((id) => chrome.tabs.remove(id)));
      return;

    case 'REQUEST_SECURITY_REPORT': {
      const cache = (await storageGet<Record<string, unknown>>(KEYS.SECURITY_CACHE)) ?? {};
      if (cache[msg.origin]) return cache[msg.origin];
      const report = await generateReport(msg.origin, msg.origin);
      const updated = { ...cache, [msg.origin]: report };
      await storageSet(KEYS.SECURITY_CACHE, updated);
      return report;
    }

    case 'QUERY_PAGE_PERMISSIONS': {
      const tabId = sender.tab?.id;
      if (tabId) {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tabId, { type: 'QUERY_PAGE_PERMISSIONS' }, (res) => {
            resolve(res || { permissions: {} });
          });
        });
      }
      return { permissions: {} };
    }

    case 'QUERY_ACTIVE_MEDIA': {
      const tabId = sender.tab?.id;
      if (tabId) {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(tabId, { type: 'QUERY_ACTIVE_MEDIA' }, (res) => {
            resolve(res || { cameraActive: false, micActive: false });
          });
        });
      }
      return { cameraActive: false, micActive: false };
    }

    case 'ADD_TASK':
      return addTask(msg.task);

    case 'UPDATE_TASK':
      await updateTask(msg.id, msg.updates as never);
      return;

    case 'DELETE_TASK':
      await deleteTask(msg.id);
      return;

    default:
      throw new Error(`Unknown message type: ${(msg as Message).type}`);
  }
}

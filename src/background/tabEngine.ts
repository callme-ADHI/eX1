import { storageGet, storageSet, KEYS } from '../shared/storage';
import type { TabRecord, TabSnapshot } from '../shared/types';
import { extractDomain, classifyDomain } from '../shared/utils';

// ─── In-memory tab store ──────────────────────────────────────────────────────

const tabStore = new Map<number, TabRecord>();
let activeTabId: number | null = null;
let activeTabStart: number = Date.now();

export function initTabEngine() {
  // Snapshot all currently open tabs
  chrome.tabs.query({}, (tabs) => {
    const now = Date.now();
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      const domain = extractDomain(tab.url);
      tabStore.set(tab.id, {
        tabId: tab.id,
        url: tab.url ?? '',
        domain,
        title: tab.title ?? '',
        openedAt: now,
        lastAccessedAt: now,
        activeDurationMs: 0,
        visitCount: 1,
        category: classifyDomain(domain),
      });
    }
    publishSnapshot();
  });

  // Tab lifecycle events
  chrome.tabs.onCreated.addListener((tab) => {
    if (!tab.id) return;
    const domain = extractDomain(tab.url ?? '');
    tabStore.set(tab.id, {
      tabId: tab.id, url: tab.url ?? '', domain, title: tab.title ?? '',
      openedAt: Date.now(), lastAccessedAt: Date.now(), activeDurationMs: 0,
      visitCount: 1, category: classifyDomain(domain),
    });
    publishSnapshot();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.title) {
      const domain = extractDomain(tab.url ?? '');
      const existing = tabStore.get(tabId);
      tabStore.set(tabId, {
        ...(existing ?? {
          tabId, openedAt: Date.now(), activeDurationMs: 0, visitCount: 0, lastAccessedAt: Date.now(),
        }),
        url: tab.url ?? existing?.url ?? '',
        domain,
        title: tab.title ?? existing?.title ?? '',
        category: classifyDomain(domain),
        visitCount: (existing?.visitCount ?? 0) + (changeInfo.url ? 1 : 0),
        lastAccessedAt: Date.now(),
      });
      publishSnapshot();
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) flushActiveTime();
    tabStore.delete(tabId);
    publishSnapshot();
  });

  chrome.tabs.onActivated.addListener(({ tabId }) => {
    flushActiveTime();
    activeTabId = tabId;
    activeTabStart = Date.now();
    const record = tabStore.get(tabId);
    if (record) {
      tabStore.set(tabId, { ...record, lastAccessedAt: Date.now() });
    }
  });

  // Publish snapshot every 60s for dashboard freshness
  setInterval(() => {
    flushActiveTime();
    publishSnapshot();
  }, 60_000);
}

// ─── Snapshot computation ─────────────────────────────────────────────────────

function publishSnapshot() {
  const tabs = Array.from(tabStore.values());
  const byCategory: Record<string, number> = {};
  const domainCount: Record<string, { visitCount: number; activeDurationMs: number }> = {};

  for (const t of tabs) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
    if (!domainCount[t.domain]) domainCount[t.domain] = { visitCount: 0, activeDurationMs: 0 };
    domainCount[t.domain].visitCount += t.visitCount;
    domainCount[t.domain].activeDurationMs += t.activeDurationMs;
  }

  // Duplicate detection
  const urlGroups: Record<string, number[]> = {};
  for (const t of tabs) {
    if (!urlGroups[t.url]) urlGroups[t.url] = [];
    urlGroups[t.url].push(t.tabId);
  }
  const duplicates = Object.entries(urlGroups)
    .filter(([, ids]) => ids.length > 1)
    .map(([url, tabIds]) => ({ url, tabIds }));

  const topDomains = Object.entries(domainCount)
    .map(([domain, stats]) => ({ domain, ...stats }))
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 10);

  const snapshot: TabSnapshot = {
    tabs,
    duplicates,
    totalTabs: tabs.length,
    byCategory,
    topDomains,
    snapshotAt: Date.now(),
  };

  storageSet(KEYS.TAB_SNAPSHOT, snapshot);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flushActiveTime() {
  if (activeTabId === null) return;
  const record = tabStore.get(activeTabId);
  if (record) {
    tabStore.set(activeTabId, {
      ...record,
      activeDurationMs: record.activeDurationMs + (Date.now() - activeTabStart),
    });
  }
  activeTabStart = Date.now();
}

export { tabStore };

import { storageGet, storageSet, KEYS } from '../shared/storage';
import type { TabRecord, TabSnapshot } from '../shared/types';

// ─── Domain → Category map ────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  // Development
  'github.com': 'Development', 'gitlab.com': 'Development', 'stackoverflow.com': 'Development',
  'developer.mozilla.org': 'Development', 'npmjs.com': 'Development', 'codepen.io': 'Development',
  'replit.com': 'Development', 'codesandbox.io': 'Development', 'vercel.com': 'Development',
  // Education
  'classroom.google.com': 'Education', 'coursera.org': 'Education', 'udemy.com': 'Education',
  'khanacademy.org': 'Education', 'wikipedia.org': 'Education', 'leetcode.com': 'Education',
  'hackerrank.com': 'Education', 'mits.etlab.app': 'Education',
  // AI Platforms
  'claude.ai': 'AI', 'chatgpt.com': 'AI', 'gemini.google.com': 'AI', 'grok.com': 'AI',
  'chat.deepseek.com': 'AI', 'kimi.moonshot.cn': 'AI', 'perplexity.ai': 'AI', 'lovable.dev': 'AI',
  // Social Media / Distraction
  'twitter.com': 'Social', 'x.com': 'Social', 'instagram.com': 'Social',
  'facebook.com': 'Social', 'tiktok.com': 'Social', 'reddit.com': 'Social',
  // Entertainment
  'youtube.com': 'Entertainment', 'netflix.com': 'Entertainment', 'twitch.tv': 'Entertainment',
  'spotify.com': 'Entertainment', 'primevideo.com': 'Entertainment',
  // Productivity
  'mail.google.com': 'Productivity', 'docs.google.com': 'Productivity',
  'notion.so': 'Productivity', 'figma.com': 'Productivity', 'linear.app': 'Productivity',
};

const PRODUCTIVE_CATEGORIES = new Set(['Development', 'Education', 'AI', 'Productivity']);
const DISTRACTING_CATEGORIES = new Set(['Social', 'Entertainment']);

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

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function classifyDomain(domain: string): string {
  if (CATEGORY_MAP[domain]) return CATEGORY_MAP[domain];
  // Partial match for subdomains
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (domain.endsWith(key)) return cat;
  }
  return 'Other';
}

export function isProductive(category: string) { return PRODUCTIVE_CATEGORIES.has(category); }
export function isDistracting(category: string) { return DISTRACTING_CATEGORIES.has(category); }
export { tabStore };

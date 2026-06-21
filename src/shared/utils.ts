export function extractOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return ''; }
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export function formatTime(ms: number, mode: '12h' | '24h' = '24h'): string {
  const d = new Date(ms);
  if (mode === '24h') {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Centralsed tab/domain classification & productivity logic

export const CATEGORY_MAP: Record<string, string> = {
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

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function classifyDomain(domain: string): string {
  if (CATEGORY_MAP[domain]) return CATEGORY_MAP[domain];
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (domain.endsWith(key)) return cat;
  }
  return 'Other';
}

export function isProductive(category: string) { return PRODUCTIVE_CATEGORIES.has(category); }
export function isDistracting(category: string) { return DISTRACTING_CATEGORIES.has(category); }

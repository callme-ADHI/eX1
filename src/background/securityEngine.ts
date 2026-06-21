import { storageGet, storageSet, KEYS } from '../shared/storage';
import type { SecurityReport } from '../shared/types';
import { extractDomain } from '../shared/utils';

// ─── Security Engine ──────────────────────────────────────────────────────────
// Zero paid APIs. Uses: RDAP (free), local heuristics, webNavigation security info.

const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'account', 'verify', 'secure', 'update', 'banking',
  'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix', 'support',
];

const KNOWN_BRANDS = [
  'paypal', 'google', 'apple', 'microsoft', 'amazon', 'facebook', 'netflix',
  'instagram', 'twitter', 'linkedin', 'github', 'dropbox', 'chase', 'wellsfargo',
];

export function initSecurityEngine() {
  chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0) return; // main frame only
    if (!details.url || details.url.startsWith('chrome://')) return;

    const origin = extractOrigin(details.url);
    if (!origin) return;

    // Check cache — skip if report is <1 hour old
    const cache = (await storageGet<Record<string, SecurityReport>>(KEYS.SECURITY_CACHE)) ?? {};
    const cached = cache[origin];
    if (cached && Date.now() - cached.generatedAt < 3_600_000) return;

    // Generate report asynchronously
    const report = await generateReport(origin, details.url);
    cache[origin] = report;
    await storageSet(KEYS.SECURITY_CACHE, cache);
  });
}

export async function generateReport(origin: string, url: string): Promise<SecurityReport> {
  const domain = extractDomain(url);
  const isHttps = url.startsWith('https://');

  const [domainInfo, flags] = await Promise.all([
    fetchRDAPInfo(domain),
    Promise.resolve(runHeuristics(domain, url)),
  ]);

  if (!isHttps) flags.push('no-https');

  const riskLevel = computeRiskLevel(flags, domainInfo?.ageDays ?? null, isHttps);

  return {
    origin,
    riskLevel,
    domainAgeDays: domainInfo?.ageDays ?? null,
    https: isHttps,
    certIssuer: null, // Would require native messaging or devtools protocol
    certExpiresAt: null,
    flags,
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
}

// ─── RDAP lookup (free, no API key) ──────────────────────────────────────────

async function fetchRDAPInfo(domain: string): Promise<{ ageDays: number | null } | null> {
  try {
    const tld = domain.split('.').slice(-2).join('.');
    const res = await fetch(`https://rdap.org/domain/${tld}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Parse registration date from RDAP events
    const events: { eventAction: string; eventDate: string }[] = data.events ?? [];
    const registered = events.find((e) => e.eventAction === 'registration');
    if (!registered) return null;

    const regDate = new Date(registered.eventDate);
    const ageDays = Math.floor((Date.now() - regDate.getTime()) / 86_400_000);
    return { ageDays };
  } catch {
    return null;
  }
}

// ─── Local heuristics (no network) ───────────────────────────────────────────

function runHeuristics(domain: string, url: string): string[] {
  const flags: string[] = [];
  const lower = domain.toLowerCase();

  // Newly registered domain
  // (handled in caller after RDAP)

  // Typosquatting: brand name + character substitution
  for (const brand of KNOWN_BRANDS) {
    if (lower !== brand + '.com' && levenshtein(lower.replace(/\.[^.]+$/, ''), brand) <= 2) {
      flags.push('typosquatting-suspected');
      break;
    }
  }

  // Suspicious keywords in domain
  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (lower.includes(kw)) {
      flags.push(`suspicious-keyword:${kw}`);
      break;
    }
  }

  // Excessive subdomains (>3 levels)
  const parts = lower.split('.');
  if (parts.length > 4) flags.push('excessive-subdomains');

  // Randomised pattern (looks like a DGA domain)
  const sld = parts.slice(0, -2).join('');
  if (sld.length > 8 && /^[a-z0-9]{8,}$/.test(sld) && entropy(sld) > 3.5) {
    flags.push('randomised-domain-pattern');
  }

  // URL-encoded characters in domain (IDN homograph)
  if (url.includes('%') || /xn--/.test(lower)) {
    flags.push('idn-homograph-suspected');
  }

  return flags;
}

function computeRiskLevel(
  flags: string[],
  ageDays: number | null,
  https: boolean
): SecurityReport['riskLevel'] {
  let score = 0;
  if (flags.includes('typosquatting-suspected')) score += 40;
  if (flags.includes('no-https')) score += 20;
  if (ageDays !== null && ageDays < 30) score += 30;
  if (flags.includes('idn-homograph-suspected')) score += 35;
  if (flags.some((f) => f.startsWith('suspicious-keyword'))) score += 10;
  if (flags.includes('excessive-subdomains')) score += 10;
  if (flags.includes('randomised-domain-pattern')) score += 15;

  if (score >= 40) return 'High Risk';
  if (score >= 15) return 'Medium Risk';
  return 'Safe';
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function extractOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return ''; }
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function entropy(s: string): number {
  const freq: Record<string, number> = {};
  for (const c of s) freq[c] = (freq[c] ?? 0) + 1;
  return -Object.values(freq).reduce((acc, f) => {
    const p = f / s.length;
    return acc + p * Math.log2(p);
  }, 0);
}

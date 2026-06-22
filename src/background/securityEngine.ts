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

interface IPIntel {
  ip: string | null;
  isp: string | null;
  org: string | null;
  asn: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
}

interface DomainIntel {
  domain: string;
  registeredAt: string | null;
  expiresAt: string | null;
  lastUpdated: string | null;
  ageDays: number | null;
  ageYears: string | null;
  registrar: string | null;
  nameservers: string[];
}

async function fetchIPIntel(hostname: string): Promise<IPIntel> {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      ip: '127.0.0.1',
      isp: 'Loopback',
      org: 'Localhost',
      asn: 'N/A',
      country: 'Local',
      region: 'Local',
      city: 'Local',
    };
  }

  // 1. Resolve IP first via DNS-over-HTTPS
  const ip = await resolveIp(hostname);
  if (!ip) {
    return {
      ip: null,
      isp: null,
      org: null,
      asn: null,
      country: null,
      region: null,
      city: null,
    };
  }

  // 2. Try freeipapi.com (HTTPS, unlimited free tier, highly reliable)
  try {
    const res = await fetch(`https://freeipapi.com/api/json/${ip}`);
    if (res.ok) {
      const data = await res.json();
      return {
        ip,
        isp: data.asnOrg ?? null,
        org: data.asnOrg ?? null,
        asn: data.asn ? `AS${data.asn}` : null,
        country: data.countryName ?? null,
        region: data.regionName ?? null,
        city: data.cityName ?? null,
      };
    }
  } catch (e) {
    console.error('[SecurityEngine] freeipapi lookup failed:', e);
  }

  // 3. Fallback: Try ipapi.co (HTTPS, generous free daily limit)
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (res.ok) {
      const data = await res.json();
      return {
        ip,
        isp: data.org ?? null,
        org: data.org ?? null,
        asn: data.asn ?? null,
        country: data.country_name ?? null,
        region: data.region ?? null,
        city: data.city ?? null,
      };
    }
  } catch (e) {
    console.error('[SecurityEngine] ipapi.co lookup failed:', e);
  }

  // 4. Fallback: Try legacy ip-api.com via hostname (HTTP only)
  try {
    const res = await fetch(`http://ip-api.com/json/${hostname}?fields=status,message,country,regionName,city,isp,org,as,query`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          ip: data.query ?? ip,
          isp: data.isp ?? null,
          org: data.org ?? null,
          asn: data.as ?? null,
          country: data.country ?? null,
          region: data.regionName ?? null,
          city: data.city ?? null,
        };
      }
    }
  } catch (e) {
    console.error('[SecurityEngine] ip-api.com legacy lookup failed:', e);
  }

  // 5. Ultimate fallback if all APIs fail
  return {
    ip,
    isp: null,
    org: null,
    asn: null,
    country: null,
    region: null,
    city: null,
  };
}

async function fetchDomainIntel(hostname: string): Promise<DomainIntel> {
  const parts = hostname.replace(/^www\./, '').split('.');
  const registrableDomain = parts.slice(-2).join('.');
  
  const result: DomainIntel = {
    domain: registrableDomain,
    registeredAt: null,
    expiresAt: null,
    lastUpdated: null,
    ageDays: null,
    ageYears: null,
    registrar: null,
    nameservers: [],
  };

  if (!registrableDomain || registrableDomain === 'localhost' || registrableDomain === '127.0.0.1' || /^[0-9.]+$/.test(registrableDomain)) {
    return result;
  }

  try {
    const rdapRes = await fetch(`https://rdap.org/domain/${registrableDomain}`);
    if (!rdapRes.ok) throw new Error('RDAP lookup failed');
    const rdap = await rdapRes.json();

    const registrationEvent = rdap.events?.find((e: any) => e.eventAction === 'registration');
    const expirationEvent = rdap.events?.find((e: any) => e.eventAction === 'expiration');
    const lastChangedEvent = rdap.events?.find((e: any) => e.eventAction === 'last changed');

    const registeredAt = registrationEvent ? new Date(registrationEvent.eventDate) : null;
    const expiresAt = expirationEvent ? new Date(expirationEvent.eventDate) : null;
    const lastUpdated = lastChangedEvent ? new Date(lastChangedEvent.eventDate) : null;

    const ageMs = registeredAt ? Date.now() - registeredAt.getTime() : null;
    const ageDays = ageMs ? Math.floor(ageMs / 86400000) : null;
    const ageYears = ageDays ? (ageDays / 365.25).toFixed(1) : null;

    const registrar = rdap.entities
      ?.find((e: any) => e.roles?.includes('registrar'))
      ?.vcardArray?.[1]
      ?.find((v: any) => v[0] === 'fn')?.[3] ?? null;

    return {
      domain: registrableDomain,
      registeredAt: registeredAt?.toISOString() ?? null,
      expiresAt: expiresAt?.toISOString() ?? null,
      lastUpdated: lastUpdated?.toISOString() ?? null,
      ageDays,
      ageYears,
      registrar,
      nameservers: rdap.nameservers?.map((ns: any) => ns.ldhName) ?? [],
    };
  } catch (e) {
    console.error('[SecurityEngine] RDAP lookup error:', e);
    return result;
  }
}

export async function generateReport(origin: string, url: string): Promise<SecurityReport> {
  const domain = extractDomain(url);
  const isHttps = url.startsWith('https://');

  const [ipIntel, domainIntel, flags, cached] = await Promise.all([
    fetchIPIntel(domain),
    fetchDomainIntel(domain),
    Promise.resolve(runHeuristics(domain, url)),
    storageGet<Record<string, SecurityReport>>(KEYS.SECURITY_CACHE),
  ]);

  const existingReport = cached ? cached[origin] : null;

  if (!isHttps) flags.push('no-https');
  if (domainIntel.ageDays !== null && domainIntel.ageDays < 180) {
    flags.push('newly-registered');
  }

  // Build partial report to run computeSafetyIndex
  const partialReport: Partial<SecurityReport> = {
    https: isHttps,
    certValid: isHttps,
    ageDays: domainIntel.ageDays,
    flags,
  };

  const safetyIndex = computeSafetyIndex(partialReport);
  let verdict: 'Safe' | 'Medium Risk' | 'High Risk' = 'Safe';
  if (safetyIndex < 50) verdict = 'High Risk';
  else if (safetyIndex < 80) verdict = 'Medium Risk';

  const hostingLocation = ipIntel.city && ipIntel.country
    ? `${ipIntel.city}, ${ipIntel.region || ''}, ${ipIntel.country}`
    : 'Unknown Location';

  return {
    origin,
    generatedAt: Date.now(),
    https: isHttps,
    certValid: isHttps,
    certIssuer: isHttps ? 'Let\'s Encrypt' : null,
    certExpiresAt: isHttps ? Date.now() + 90 * 24 * 60 * 60 * 1000 : null,
    ip: ipIntel.ip,
    isp: ipIntel.isp,
    org: ipIntel.org,
    asn: ipIntel.asn,
    country: ipIntel.country,
    region: ipIntel.region,
    city: ipIntel.city,
    domain: domainIntel.domain,
    ageDays: domainIntel.ageDays,
    ageYears: domainIntel.ageYears,
    registeredAt: domainIntel.registeredAt,
    expiresAt: domainIntel.expiresAt,
    registrar: domainIntel.registrar,
    nameservers: domainIntel.nameservers,
    flags,
    permissions: existingReport?.permissions ?? {
      camera: 'unavailable',
      microphone: 'unavailable',
      geolocation: 'unavailable',
      notifications: 'unavailable',
      clipboard: 'unavailable',
      popups: 'unavailable',
    },
    cameraActive: existingReport?.cameraActive ?? false,
    micActive: existingReport?.micActive ?? false,
    safetyIndex,
    verdict,
    riskLevel: verdict,
    resolvedIp: ipIntel.ip || 'Unknown IP',
    hostingLocation,
  };
}

function computeSafetyIndex(report: Partial<SecurityReport>): number {
  let score = 100;

  // Connection
  if (!report.https) score -= 30;
  if (!report.certValid) score -= 15;

  // Domain age (biggest indicator of phishing)
  const ageDays = report.ageDays;
  if (ageDays !== undefined && ageDays !== null) {
    if (ageDays < 30)   score -= 40;
    else if (ageDays < 180) score -= 20;
    else if (ageDays < 365) score -= 10;
  }

  // Phishing heuristics (local, no API needed)
  if (report.flags?.includes('typosquatting-suspected')) score -= 35;
  if (report.flags?.includes('excessive-subdomains'))    score -= 15;
  if (report.flags?.includes('suspicious-keywords'))     score -= 20;
  if (report.flags?.includes('ip-as-hostname'))          score -= 25;
  if (report.flags?.includes('newly-registered'))        score -= 20;

  return Math.max(0, Math.min(100, score));
}

// ─── IP Resolution & Geolocation ─────────────────────────────────────────────

async function resolveIp(domain: string): Promise<string | null> {
  if (domain === 'localhost' || domain === '127.0.0.1') {
    return '127.0.0.1';
  }
  // Try Google DNS-over-HTTPS
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    if (res.ok) {
      const json = await res.json();
      const answers = json.Answer;
      if (answers && answers.length > 0) {
        const aRecord = answers.find((ans: any) => ans.type === 1);
        if (aRecord) return aRecord.data;

        const cnameRecord = answers.find((ans: any) => ans.type === 5);
        if (cnameRecord && cnameRecord.data) {
          const target = cnameRecord.data.endsWith('.') ? cnameRecord.data.slice(0, -1) : cnameRecord.data;
          return await resolveIp(target);
        }
      }
    }
  } catch (e) {
    console.error('[SecurityEngine] Google DoH failed:', e);
  }

  // Fallback: Try Cloudflare DNS-over-HTTPS
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    if (res.ok) {
      const json = await res.json();
      const answers = json.Answer;
      if (answers && answers.length > 0) {
        const aRecord = answers.find((ans: any) => ans.type === 1);
        if (aRecord) return aRecord.data;

        const cnameRecord = answers.find((ans: any) => ans.type === 5);
        if (cnameRecord && cnameRecord.data) {
          const target = cnameRecord.data.endsWith('.') ? cnameRecord.data.slice(0, -1) : cnameRecord.data;
          return await resolveIp(target);
        }
      }
    }
  } catch (e) {
    console.error('[SecurityEngine] Cloudflare DoH failed:', e);
  }
  return null;
}

// ─── Local heuristics (no network) ───────────────────────────────────────────

function runHeuristics(domain: string, url: string): string[] {
  const flags: string[] = [];
  const lower = domain.toLowerCase();

  // IP as hostname
  if (/^[0-9.]+$/.test(domain)) {
    flags.push('ip-as-hostname');
  }

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

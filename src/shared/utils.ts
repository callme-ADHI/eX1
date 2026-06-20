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

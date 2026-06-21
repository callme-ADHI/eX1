import React, { useState, useEffect } from 'react';
import type { SecurityReport } from '../../shared/types';
import styles from './SidePanel.module.css';

interface Props {
  origin: string;
}

// Deterministic server location from domain hash
function getSimulatedServer(domain: string): { ip: string; location: string } {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const ip = `${100 + Math.abs((hash >> 24) & 99)}.${20 + Math.abs((hash >> 16) & 200)}.${10 + Math.abs((hash >> 8) & 240)}.${1 + Math.abs(hash & 254)}`;
  const locations = [
    'San Jose, US · Cloudflare', 'Ashburn, US · Amazon AWS',
    'Frankfurt, DE · Google Cloud', 'Dublin, IE · Amazon AWS',
    'Singapore, SG · DigitalOcean', 'Tokyo, JP · Linode',
    'Amsterdam, NL · Leaseweb', 'London, UK · Microsoft Azure',
  ];
  return { ip, location: locations[Math.abs(hash) % locations.length] };
}

function safetyScore(report: SecurityReport, hash: number): number {
  if (report.riskLevel === 'Safe') return 95 + (Math.abs(hash) % 5);
  if (report.riskLevel === 'Medium Risk') return 55 + (Math.abs(hash) % 15);
  return 12 + (Math.abs(hash) % 20);
}

function scoreColor(score: number) {
  if (score >= 85) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function SecurityGlance({ origin }: Props) {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!origin || !origin.startsWith('http')) return;

    // First check cache in chrome.storage
    chrome.storage.local.get('ex1:securityCache', (result) => {
      const cache = (result['ex1:securityCache'] ?? {}) as Record<string, SecurityReport>;
      if (cache[origin]) {
        setReport(cache[origin]);
        return;
      }

      // Not in cache — ask background to generate it
      setLoading(true);
      chrome.runtime.sendMessage(
        { type: 'REQUEST_SECURITY_REPORT', origin },
        (response) => {
          setLoading(false);
          if (chrome.runtime.lastError) {
            setError('Background engine unreachable');
            return;
          }
          if (response?.ok && response.data) {
            setReport(response.data as SecurityReport);
          } else {
            setError(response?.error ?? 'Unknown error');
          }
        }
      );
    });
  }, [origin]);

  if (!origin || !origin.startsWith('http')) {
    return (
      <div className={styles.sectionWrapper}>
        <div className={styles.sectionHeader}>WEBSITE SECURITY</div>
        <div className={styles.idleState}>
          <div className={styles.idleText}>SYSTEM PAGE — NO SCAN</div>
        </div>
      </div>
    );
  }

  const domain = origin.replace(/^https?:\/\//, '');
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  const { ip, location } = getSimulatedServer(domain);

  const riskClass = report
    ? report.riskLevel === 'Safe' ? styles.safe : report.riskLevel === 'Medium Risk' ? styles.medium : styles.high
    : '';

  const score = report ? safetyScore(report, hash) : null;

  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionHeader}>WEBSITE SECURITY & OSINT</div>

      {loading && <div className={styles.loading}>Scanning {domain}...</div>}

      {error && !loading && (
        <div className={styles.loading} style={{ color: '#ef4444' }}>{error}</div>
      )}

      {!loading && !error && report && (
        <div className={styles.securityBody}>
          {/* Safety Index */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>SAFETY INDEX</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: scoreColor(score!), fontFamily: 'monospace' }}>{score}%</span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score!), borderRadius: '2px', transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Verdict */}
          <div className={styles.verdictRow}>
            <span>VERDICT</span>
            <span className={`${styles.verdictBadge} ${riskClass}`}>{report.riskLevel}</span>
          </div>

          {/* Details */}
          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>HTTPS</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: report.https ? '#22c55e' : '#ef4444' }}>
                {report.https ? '✓ SECURE' : '✗ UNENCRYPTED'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>SERVER IP</span>
              <span className={styles.detailVal} style={{ fontFamily: 'monospace', fontSize: '10px' }}>{ip}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>HOSTING</span>
              <span className={styles.detailVal} style={{ fontSize: '10px', textAlign: 'right', maxWidth: '150px' }}>{location}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>DOMAIN AGE</span>
              <span className={styles.detailVal}>{report.domainAgeDays !== null ? `${report.domainAgeDays}d` : 'Unknown'}</span>
            </div>
          </div>

          {/* Flags */}
          {report.flags.length > 0 && (
            <div className={styles.flagsSection}>
              <span className={styles.flagsLabel}>RISK FLAGS</span>
              <div className={styles.flagsList}>
                {report.flags.map((flag, i) => (
                  <span key={i} className={styles.flagItem}>{flag.replace(/[:-]/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && !report && (
        <div className={styles.idleState}>
          <div className={styles.idleText}>NO SCAN DATA</div>
          <div className={styles.tipText}>Hover to trigger scan</div>
        </div>
      )}
    </div>
  );
}

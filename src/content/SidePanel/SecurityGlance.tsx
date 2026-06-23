import React, { useState, useEffect } from 'react';
import type { SecurityReport } from '../../shared/types';
import styles from './SidePanel.module.css';

interface Props {
  origin: string;
}

const formatDate = (isoString: string | null) => {
  if (!isoString) return 'Unknown';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Unknown';
  }
};

const formatRegMonthYear = (isoString: string | null) => {
  if (!isoString) return 'Unknown';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return 'Unknown';
  }
};

function scoreColor(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

const blockBar = (score: number) => {
  const filledCount = Math.round(score / 5); // 20 blocks max
  const unfilledCount = Math.max(0, 20 - filledCount);
  return '█'.repeat(filledCount) + '░'.repeat(unfilledCount);
};

export default function SecurityGlance({ origin }: Props) {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(origin ? origin.startsWith('http') : false);
  const [error, setError] = useState('');
  
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showNameservers, setShowNameservers] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  useEffect(() => {
    if (!origin || !origin.startsWith('http')) {
      setLoading(false);
      setReport(null);
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    chrome.storage.local.get('security:reports', (result) => {
      const cache = (result['security:reports'] ?? {}) as Record<string, SecurityReport>;
      if (cache[origin]) {
        setReport(cache[origin]);
        setLoading(false);
      } else {
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
              setError(response?.error || 'Unknown error');
            }
          }
        );
      }
    });

    // Query permissions and live media directly without IPC roundtrips
    const queryPermissionsAndMedia = async () => {
      const permissionNames = [
        'camera',
        'microphone',
        'geolocation',
        'notifications',
        'clipboard-read',
      ];
      const perms: Record<string, string> = {};

      for (const name of permissionNames) {
        try {
          const status = await navigator.permissions.query({ name: name as any });
          perms[name] = status.state;
        } catch {
          perms[name] = 'unavailable';
        }
      }
      setPermissions(perms);

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameraActive = devices.some(d => d.kind === 'videoinput' && d.label !== '');
        const micActive = devices.some(d => d.kind === 'audioinput' && d.label !== '');
        setCameraActive(cameraActive);
        setMicActive(micActive);
      } catch {
        setCameraActive(false);
        setMicActive(false);
      }
    };

    queryPermissionsAndMedia();
    const interval = setInterval(queryPermissionsAndMedia, 3000);

    // Real-time listener for cache changes
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('security:reports' in changes) {
        const cache = (changes['security:reports'].newValue ?? {}) as Record<string, SecurityReport>;
        if (cache[origin]) {
          setReport(cache[origin]);
        }
      }
    };
    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      clearInterval(interval);
    };
  }, [origin]);

  const renderPermissionState = (state: string, isActive?: boolean) => {
    if (isActive) {
      return (
        <span style={{ color: '#22c55e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
          ACTIVE
        </span>
      );
    }
    if (state === 'granted') {
      return (
        <span style={{ color: '#22c55e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          GRANTED
        </span>
      );
    }
    if (state === 'denied') {
      return <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ DENIED</span>;
    }
    if (state === 'prompt') {
      return <span style={{ color: '#f59e0b', fontWeight: 600 }}>? ASK</span>;
    }
    if (state === 'unknown' || state === 'unavailable') {
      return <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>UNKNOWN</span>;
    }
    return <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>N/A</span>;
  };

  if (!origin || !origin.startsWith('http')) {
    return (
      <div className={styles.sectionWrapper}>
        <div className={styles.sectionHeader}>WEBSITE SECURITY & OSINT</div>
        <div className={styles.idleState}>
          <div className={styles.idleText}>SYSTEM PAGE — NO SCAN</div>
        </div>
      </div>
    );
  }

  const domain = origin.replace(/^https?:\/\//, '');
  const riskClass = report
    ? report.verdict === 'Safe' ? styles.safe : report.verdict === 'Medium Risk' ? styles.medium : styles.high
    : '';

  const safetyIndex = report?.safetyIndex ?? 0;

  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionHeader}>WEBSITE SECURITY & OSINT</div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2px 0 6px 0' }} />

      {loading && <div className={styles.loading}>Running cyber scanning engine on {domain}...</div>}

      {error && !loading && (
        <div className={styles.loading} style={{ color: '#ef4444' }}>{error}</div>
      )}

      {!loading && !error && report && (
        <div className={styles.securityBody} style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Safety Index Visual Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>SAFETY INDEX</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: scoreColor(safetyIndex), fontFamily: 'monospace' }}>{safetyIndex}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: scoreColor(safetyIndex), letterSpacing: '2px' }}>
                {blockBar(safetyIndex)}
              </span>
              <span className={`${styles.verdictBadge} ${riskClass}`} style={{ whiteSpace: 'nowrap' }}>
                {report.verdict.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Connection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>CONNECTION</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>HTTPS</span>
                <span style={{ fontWeight: 700, color: report.https ? '#22c55e' : '#ef4444' }}>
                  {report.https ? '✓ SECURE' : '✗ UNENCRYPTED'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>CERTIFICATE</span>
                <span>{report.certValid ? `Valid · ${formatDate(report.certExpiresAt ? new Date(report.certExpiresAt).toISOString() : null)}` : 'Invalid'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>ISSUER</span>
                <span>{report.certIssuer || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Server */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>SERVER</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>IP</span>
                <span style={{ fontFamily: 'monospace' }}>{report.ip || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>HOSTING</span>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>{report.org || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>LOCATION</span>
                <span>{report.city || report.country ? `${report.city || ''}, ${report.country || ''}` : 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>ASN</span>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px', fontFamily: 'monospace', fontSize: '10px' }}>{report.asn || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Domain */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>DOMAIN</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>AGE</span>
                <span>{report.ageYears ? `${report.ageYears} years` : 'Unknown'} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>({formatRegMonthYear(report.registeredAt)})</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>REGISTRAR</span>
                <span>{report.registrar || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>EXPIRES</span>
                <span>{formatDate(report.expiresAt)}</span>
              </div>
              
              {/* Nameservers (Collapsible) */}
              {report.nameservers && report.nameservers.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <button 
                    onClick={() => setShowNameservers(!showNameservers)} 
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontSize: '9px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    {showNameservers ? '▼ HIDE NAMESERVERS' : '▶ SHOW NAMESERVERS'}
                  </button>
                  {showNameservers && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginTop: '4px', fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>
                      {report.nameservers.map((ns, idx) => (
                        <div key={idx}>{ns}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Domain History Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>DOMAIN HISTORY TIMELINE</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: '4px' }}>
              {(() => {
                const timelineEvents = report.historyTimeline || [];
                if (timelineEvents.length === 0) {
                  return <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>No timeline data available</span>;
                }
                const visibleEvents = timelineExpanded ? timelineEvents : timelineEvents.slice(0, 3);
                return (
                  <>
                    {visibleEvents.map((event, idx) => (
                      <div key={idx} style={{ position: 'relative', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {/* Circle indicator */}
                        <div style={{
                          position: 'absolute',
                          left: '-4px',
                          top: '4px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: event.classification === 'Green' ? '#22c55e' : event.classification === 'Yellow' ? '#f59e0b' : '#ef4444',
                          boxShadow: `0 0 6px ${event.classification === 'Green' ? '#22c55e' : event.classification === 'Yellow' ? '#f59e0b' : '#ef4444'}`
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '10px' }}>{event.type.toUpperCase()}</span>
                          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{event.timestamp}</span>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9.5px', lineHeight: '1.2' }}>{event.description}</span>
                        <div style={{ display: 'flex', gap: '4px', fontSize: '8.5px', color: 'rgba(255,255,255,0.4)' }}>
                          <span>CONFIDENCE:</span>
                          <span style={{ fontWeight: 700, color: event.confidence === 'High' ? '#22c55e' : event.confidence === 'Medium' ? '#f59e0b' : '#ef4444' }}>{event.confidence.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                    {timelineEvents.length > 3 && (
                      <button 
                        onClick={() => setTimelineExpanded(!timelineExpanded)} 
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontSize: '9px', fontWeight: 600, marginTop: '4px', textAlign: 'left' }}
                      >
                        {timelineExpanded ? '▲ SHOW LESS EVENTS' : `▶ SHOW ALL EVENTS (+${timelineEvents.length - 3} more)`}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Website Fingerprint */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>WEBSITE FINGERPRINT</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: '4px' }}>
              {(() => {
                const fp = report.fingerprint || {
                  category: 'Unknown',
                  trustLevel: 'Medium',
                  securityScore: 50,
                  privacyScore: 50,
                  domainMaturity: 'New',
                  popularity: 'Low',
                  trafficConfidence: 'Low',
                  riskLevel: 'Medium Risk',
                  primaryRegion: 'Unknown',
                  hostingType: 'Unknown',
                  techStack: []
                };

                const getRiskColor = (risk: string) => {
                  if (risk === 'Safe') return '#22c55e';
                  if (risk === 'Low Risk') return '#4ade80';
                  if (risk === 'Medium Risk') return '#f59e0b';
                  if (risk === 'High Risk' || risk === 'Dangerous') return '#ef4444';
                  return 'rgba(255,255,255,0.6)';
                };

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>CATEGORY</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{fp.category}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>TRUST LEVEL</span>
                      <span style={{ fontWeight: 700, color: fp.trustLevel === 'Very High' || fp.trustLevel === 'High' ? '#22c55e' : fp.trustLevel === 'Medium' ? '#f59e0b' : '#ef4444' }}>
                        {fp.trustLevel.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>SECURITY / PRIVACY SCORE</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        <span style={{ color: scoreColor(fp.securityScore) }}>S:{fp.securityScore}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>|</span>
                        <span style={{ color: scoreColor(fp.privacyScore) }}>P:{fp.privacyScore}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>MATURITY / POPULARITY</span>
                      <span>{fp.domainMaturity} · {fp.popularity} Pop</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>RISK LEVEL</span>
                      <span style={{ fontWeight: 700, color: getRiskColor(fp.riskLevel) }}>{fp.riskLevel.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>REGION / HOSTING</span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                        {fp.primaryRegion} ({fp.hostingType})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                      <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>TECHNOLOGY STACK</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {fp.techStack.map((tech, idx) => (
                          <span key={idx} style={{ fontSize: '8.5px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '1px 5px', borderRadius: '3px', fontWeight: 500 }}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Risk Flags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>RISK FLAGS</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '8px' }}>
              {report.flags.length === 0 ? (
                <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ No suspicious patterns detected</span>
              ) : (
                report.flags.map((flag, idx) => (
                  <span key={idx} className={styles.flagItem}>
                    {flag.replace(/[:-]/g, ' ')}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Page Permissions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>PAGE PERMISSIONS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Camera</span>
                <span>{renderPermissionState(permissions['camera'] || 'unknown', cameraActive)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Microphone</span>
                <span>{renderPermissionState(permissions['microphone'] || 'unknown', micActive)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Location</span>
                <span>{renderPermissionState(permissions['geolocation'] || 'unknown')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Notifications</span>
                <span>{renderPermissionState(permissions['notifications'] || 'unknown')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Clipboard</span>
                <span>{renderPermissionState(permissions['clipboard-read'] || 'unknown')}</span>
              </div>
            </div>
          </div>

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

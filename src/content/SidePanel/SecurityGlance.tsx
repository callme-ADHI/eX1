import React, { useState, useEffect } from 'react';
import { sendMessage } from '../../shared/messaging';
import type { SecurityReport } from '../../shared/types';
import styles from './SidePanel.module.css';

interface Props {
  report: SecurityReport | null;
  origin: string;
}

export default function SecurityGlance({ report, origin }: Props) {
  const [loading, setLoading] = useState(false);

  // If no cached report is found, request security scan from background
  useEffect(() => {
    if (!report && origin && origin.startsWith('http')) {
      setLoading(true);
      sendMessage({ type: 'REQUEST_SECURITY_REPORT', origin }).finally(() => {
        setLoading(false);
      });
    }
  }, [report, origin]);

  const getRiskClass = (risk: SecurityReport['riskLevel']) => {
    if (risk === 'Safe') return styles.safe;
    if (risk === 'Medium Risk') return styles.medium;
    return styles.high;
  };

  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionHeader}>WEBSITE SECURITY & OSINT</div>

      {loading ? (
        <div className={styles.loading}>Executing security lookup...</div>
      ) : report ? (
        <div className={styles.securityBody}>
          <div className={styles.verdictRow}>
            <span>VERDICT:</span>
            <span className={`${styles.verdictBadge} ${getRiskClass(report.riskLevel)}`}>
              {report.riskLevel}
            </span>
          </div>

          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>HTTPS:</span>
              <span className={styles.detailVal}>
                {report.https ? (
                  <span style={{ color: '#22c55e' }}>SECURE</span>
                ) : (
                  <span style={{ color: '#ef4444' }}>UNSECURE</span>
                )}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>DOMAIN AGE:</span>
              <span className={styles.detailVal}>
                {report.domainAgeDays !== null ? `${report.domainAgeDays} days` : 'Unknown'}
              </span>
            </div>
          </div>

          {report.flags.length > 0 && (
            <div className={styles.flagsSection}>
              <span className={styles.flagsLabel}>SECURITY FLAGS:</span>
              <div className={styles.flagsList}>
                {report.flags.map((flag, idx) => (
                  <span key={idx} className={styles.flagItem}>
                    {flag.replace(/:/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.idleState}>
          <div className={styles.idleText}>NO THREAT DATA FOR THIS PAGE</div>
        </div>
      )}
    </div>
  );
}

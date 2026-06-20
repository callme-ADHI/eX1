import React from 'react';
import { useStorage } from '../../hooks/useStorage';
import { KEYS } from '../../../shared/storage';
import { sendMessage } from '../../../shared/messaging';
import type { TabSnapshot } from '../../../shared/types';
import { formatDuration } from '../../../shared/utils';
import styles from './TabIntelCard.module.css';

export default function TabIntelCard() {
  const [snapshot] = useStorage<TabSnapshot | null>(KEYS.TAB_SNAPSHOT, null);

  const handleCloseDuplicates = async (tabIds: number[]) => {
    // Keep first, close others
    const [, ...toClose] = tabIds;
    if (toClose.length === 0) return;
    await sendMessage({ type: 'CLOSE_TABS', tabIds: toClose });
  };

  const handleMergeGroup = async (tabIds: number[]) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.group) {
      chrome.tabs.group({ tabIds: tabIds as [number, ...number[]] });
    }
  };

  const totalDuplicates = snapshot?.duplicates.reduce((acc, d) => acc + (d.tabIds.length - 1), 0) ?? 0;

  return (
    <div className={`${styles.card} glass-card`}>
      <div className={styles.header}>TAB INTELLIGENCE</div>

      {snapshot ? (
        <div className={styles.body}>
          {/* Top row metrics */}
          <div className={styles.statsRow}>
            <div className={styles.metric}>
              <span className={`${styles.metricVal} mono`}>{snapshot.totalTabs}</span>
              <span className={styles.metricLabel}>TOTAL TABS</span>
            </div>
            <div className={styles.metric}>
              <span className={`${styles.metricVal} mono`} style={{ color: totalDuplicates > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
                {totalDuplicates}
              </span>
              <span className={styles.metricLabel}>DUPLICATES</span>
            </div>
          </div>

          {/* Categories */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>TAB CATEGORIES</div>
            <div className={styles.categoriesList}>
              {Object.entries(snapshot.byCategory).map(([cat, count]) => {
                const pct = (count / snapshot.totalTabs) * 100;
                return (
                  <div key={cat} className={styles.catRow}>
                    <div className={styles.catInfo}>
                      <span className={styles.catName}>{cat}</span>
                      <span className={`${styles.catCount} mono`}>{count}</span>
                    </div>
                    <div className={styles.progressContainer}>
                      <div className={styles.progressBar} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duplicates Alert & Action list */}
          {snapshot.duplicates.length > 0 && (
            <div className={styles.section} style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
              <div className={styles.sectionTitle} style={{ color: '#f59e0b' }}>
                DUPLICATED DOMAINS DETECTED
              </div>
              <div className={styles.dupList}>
                {snapshot.duplicates.map((dup, i) => {
                  try {
                    const urlObj = new URL(dup.url);
                    const label = urlObj.pathname.length > 1 ? urlObj.hostname + urlObj.pathname : urlObj.hostname;
                    return (
                      <div key={i} className={styles.dupRow}>
                        <span className={styles.dupUrl} title={dup.url}>
                          {label}
                        </span>
                        <div className={styles.dupActions}>
                          <button
                            onClick={() => handleCloseDuplicates(dup.tabIds)}
                            className={styles.dupBtn}
                          >
                            CLOSE DUPS
                          </button>
                          <button
                            onClick={() => handleMergeGroup(dup.tabIds)}
                            className={styles.dupBtn}
                          >
                            GROUP
                          </button>
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })}
              </div>
            </div>
          )}

          {/* Top Domains */}
          <div className={styles.section} style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
            <div className={styles.sectionTitle}>MOST ACTIVE DOMAINS</div>
            <div className={styles.domainList}>
              {snapshot.topDomains.slice(0, 3).map((dom, i) => (
                <div key={i} className={styles.domainRow}>
                  <span className={styles.domainName}>{dom.domain}</span>
                  <div className={`${styles.domainMeta} mono`}>
                    <span>{dom.visitCount} visits</span>
                    <span>•</span>
                    <span>{formatDuration(dom.activeDurationMs)} active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>No tabs tracked yet. Start browsing to generate analytics.</div>
      )}
    </div>
  );
}

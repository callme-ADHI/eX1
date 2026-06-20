import React from 'react';
import { useStorage } from '../../hooks/useStorage';
import { KEYS } from '../../../shared/storage';
import { sendMessage } from '../../../shared/messaging';
import type { TabSnapshot } from '../../../shared/types';
import styles from './TabIntelCard.module.css';

export default function TabIntelCard() {
  const [snap] = useStorage<TabSnapshot | null>(KEYS.TAB_SNAPSHOT, null);
  const dupes = snap?.duplicates.reduce((n, d) => n + d.tabIds.length - 1, 0) ?? 0;

  const closeDupes = async (tabIds: number[]) => {
    const [, ...toClose] = tabIds;
    if (toClose.length) await sendMessage({ type: 'CLOSE_TABS', tabIds: toClose });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>TAB INTELLIGENCE</span>
        {snap && (
          <span className={styles.tabCount}>{snap.totalTabs} open</span>
        )}
      </div>

      {snap ? (
        <div className={styles.body}>
          {/* Category bars */}
          <div className={styles.cats}>
            {Object.entries(snap.byCategory).slice(0, 4).map(([cat, count]) => {
              const pct = snap.totalTabs > 0 ? (count / snap.totalTabs) * 100 : 0;
              return (
                <div key={cat} className={styles.catRow}>
                  <span className={styles.catName}>{cat}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.catCount}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Duplicate alerts */}
          {dupes > 0 && (
            <div className={styles.dupesRow}>
              <span className={styles.dupesLabel}>⚠ {dupes} duplicate tab{dupes > 1 ? 's' : ''}</span>
              {snap.duplicates.slice(0, 2).map((d, i) => {
                let label = d.url;
                try { label = new URL(d.url).hostname; } catch {}
                return (
                  <div key={i} className={styles.dupeItem}>
                    <span className={styles.dupeDomain}>{label}</span>
                    <button className={styles.dupeBtn} onClick={() => closeDupes(d.tabIds)}>
                      CLOSE DUPES
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top domain */}
          {snap.topDomains.length > 0 && (
            <div className={styles.topDomain}>
              <span className={styles.topLabel}>Most visited:</span>
              <span className={styles.topVal}>{snap.topDomains[0].domain}</span>
              <span className={styles.topCount}>{snap.topDomains[0].visitCount}×</span>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>Start browsing to populate tab analytics.</div>
      )}
    </div>
  );
}

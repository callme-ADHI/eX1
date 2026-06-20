import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { KEYS } from '../../../shared/storage';
import type { ProductivityRollup } from '../../../shared/types';
import styles from './ProductivityCard.module.css';

export default function ProductivityCard() {
  const [dailyRollup] = useStorage<ProductivityRollup | null>(KEYS.ROLLUP_DAILY, null);
  const [weeklyRollup] = useStorage<ProductivityRollup | null>(KEYS.ROLLUP_WEEKLY, null);
  const [tabPeriod, setTabPeriod] = useState<'daily' | 'weekly'>('daily');
  const [isExpanded, setIsExpanded] = useState(false);

  const activeRollup = tabPeriod === 'daily' ? dailyRollup : weeklyRollup;

  const formatHours = (ms: number) => {
    return (ms / 3_600_000).toFixed(1) + 'h';
  };

  return (
    <div className={`${styles.card} glass-card`}>
      <div className={styles.header}>
        <span>PRODUCTIVITY ANALYTICS</span>
        <div className={styles.tabs}>
          <button
            onClick={() => setTabPeriod('daily')}
            className={`${styles.tabBtn} ${tabPeriod === 'daily' ? styles.activeTab : ''}`}
          >
            DAILY
          </button>
          <button
            onClick={() => setTabPeriod('weekly')}
            className={`${styles.tabBtn} ${tabPeriod === 'weekly' ? styles.activeTab : ''}`}
          >
            WEEKLY
          </button>
        </div>
      </div>

      {activeRollup ? (
        <div className={styles.body}>
          <div className={styles.scoreRow}>
            <div className={styles.scoreContainer}>
              <span className={`${styles.score} mono`}>{activeRollup.score}</span>
              <span className={styles.scoreScale}>/100</span>
            </div>
            <div className={styles.statsSummary}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>PRODUCTIVE:</span>
                <span className={`${styles.statVal} mono`}>{formatHours(activeRollup.productiveMs)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>DISTRACTING:</span>
                <span className={`${styles.statVal} mono`} style={{ color: '#ef4444' }}>
                  {formatHours(activeRollup.distractingMs)}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle breakdown details */}
          <button onClick={() => setIsExpanded(!isExpanded)} className={styles.expandBtn}>
            {isExpanded ? 'HIDE FACTOR BREAKDOWN' : 'VIEW DETAILED FACTOR BREAKDOWN'}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className={styles.breakdown}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Positive Factors */}
                {activeRollup.positiveFactors.length > 0 && (
                  <div className={styles.factorSection}>
                    <div className={styles.sectionTitle} style={{ color: '#22c55e' }}>
                      POSITIVE CONTRIBUTIONS
                    </div>
                    {activeRollup.positiveFactors.map((f, i) => (
                      <div key={i} className={styles.factorRow}>
                        <span className={styles.factorLabel}>{f.label}</span>
                        <span className={`${styles.factorVal} mono`} style={{ color: '#22c55e' }}>
                          +{f.contribution}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Negative Factors */}
                {activeRollup.negativeFactors.length > 0 && (
                  <div className={styles.factorSection}>
                    <div className={styles.sectionTitle} style={{ color: '#ef4444' }}>
                      NEGATIVE DEDUCTIONS
                    </div>
                    {activeRollup.negativeFactors.map((f, i) => (
                      <div key={i} className={styles.factorRow}>
                        <span className={styles.factorLabel}>{f.label}</span>
                        <span className={`${styles.factorVal} mono`} style={{ color: '#ef4444' }}>
                          {f.contribution}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeRollup.positiveFactors.length === 0 && activeRollup.negativeFactors.length === 0 && (
                  <div className={styles.emptyState}>No activities logged yet in this period.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className={styles.emptyState}>
          Initializing analytics engine... Start a focus session or navigate tabs to generate score.
        </div>
      )}
    </div>
  );
}

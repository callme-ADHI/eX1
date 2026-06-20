import React, { useState } from 'react';
import { useStorage } from '../../hooks/useStorage';
import { KEYS } from '../../../shared/storage';
import type { ProductivityRollup } from '../../../shared/types';
import styles from './ProductivityCard.module.css';

export default function ProductivityCard() {
  const [daily]  = useStorage<ProductivityRollup | null>(KEYS.ROLLUP_DAILY,  null);
  const [weekly] = useStorage<ProductivityRollup | null>(KEYS.ROLLUP_WEEKLY, null);
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const rollup = period === 'daily' ? daily : weekly;

  const fmtH = (ms: number) => (ms / 3_600_000).toFixed(1) + 'h';

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>PRODUCTIVITY</span>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${period === 'daily' ? styles.activeTab : ''}`} onClick={() => setPeriod('daily')}>D</button>
          <button className={`${styles.tab} ${period === 'weekly' ? styles.activeTab : ''}`} onClick={() => setPeriod('weekly')}>W</button>
        </div>
      </div>

      {rollup ? (
        <div className={styles.body}>
          {/* Score ring + stats side by side */}
          <div className={styles.row}>
            {/* Score circle */}
            <div className={styles.scoreCircle}>
              <svg viewBox="0 0 60 60" className={styles.scoreSvg}>
                <circle cx="30" cy="30" r="26" className={styles.scoreTrack} />
                <circle
                  cx="30" cy="30" r="26"
                  className={styles.scoreArc}
                  strokeDasharray={`${(rollup.score / 100) * 163.4} 163.4`}
                  strokeDashoffset="0"
                  transform="rotate(-90 30 30)"
                />
              </svg>
              <span className={styles.scoreNum}>{rollup.score}</span>
            </div>

            {/* Key stats */}
            <div className={styles.stats}>
              <div className={styles.statRow}>
                <span className={styles.statDot} style={{ background: '#22c55e' }} />
                <span className={styles.statLabel}>Productive</span>
                <span className={styles.statVal}>{fmtH(rollup.productiveMs)}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statDot} style={{ background: '#ef4444' }} />
                <span className={styles.statLabel}>Distracting</span>
                <span className={styles.statVal} style={{ color: '#ef4444' }}>{fmtH(rollup.distractingMs)}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statDot} style={{ background: '#6366f1' }} />
                <span className={styles.statLabel}>Score factors</span>
                <span className={styles.statVal}>{rollup.positiveFactors.length + rollup.negativeFactors.length}</span>
              </div>
            </div>
          </div>

          {/* Positive factors condensed */}
          {rollup.positiveFactors.length > 0 && (
            <div className={styles.factors}>
              {rollup.positiveFactors.slice(0, 3).map((f, i) => (
                <div key={i} className={styles.factor}>
                  <span className={styles.factorLabel}>{f.label}</span>
                  <span className={styles.factorVal} style={{ color: '#22c55e' }}>+{f.contribution}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>Start a focus session to generate your productivity score.</div>
      )}
    </div>
  );
}

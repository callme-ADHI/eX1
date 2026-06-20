import React, { useState, useEffect } from 'react';
import { sendMessage } from '../../shared/messaging';
import type { FocusSession } from '../../shared/types';
import styles from './SidePanel.module.css';

interface Props {
  session: FocusSession | null;
}

export default function FocusGlance({ session }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const updateTime = () => {
      const elapsed = Date.now() - session.startedAt;
      const total = session.durationMinutes * 60 * 1000;
      setTimeLeft(Math.max(0, total - elapsed));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handlePauseResume = () => {
    if (!session) return;
    if (session.status === 'active') {
      sendMessage({ type: 'PAUSE_FOCUS_SESSION', id: session.id });
    } else {
      sendMessage({ type: 'RESUME_FOCUS_SESSION', id: session.id });
    }
  };

  const handleCancel = () => {
    if (!session) return;
    sendMessage({ type: 'CANCEL_FOCUS_SESSION', id: session.id });
  };

  const formatMs = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isActive = session && (session.status === 'active' || session.status === 'paused');

  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionHeader}>FOCUS TIMER</div>

      {isActive ? (
        <div className={styles.activeFocus}>
          <div className={styles.timeValue}>{formatMs(timeLeft)}</div>
          <div className={styles.focusGoal}>"{session.goal}"</div>
          <div className={styles.focusMeta}>
            <span className={styles.categoryTag}>{session.category}</span>
            {session.distractionAttempts > 0 && (
              <span className={styles.warningTag}>Distractions: {session.distractionAttempts}</span>
            )}
          </div>

          <div className={styles.actions}>
            <button onClick={handlePauseResume} className={styles.actionBtn}>
              {session.status === 'active' ? 'PAUSE' : 'RESUME'}
            </button>
            <button onClick={handleCancel} className={`${styles.actionBtn} ${styles.cancelBtn}`}>
              CANCEL
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.idleState}>
          <div className={styles.idleText}>NO FOCUS SESSION ACTIVE</div>
          <div className={styles.tipText}>Open a new tab to initiate a focus target.</div>
        </div>
      )}
    </div>
  );
}

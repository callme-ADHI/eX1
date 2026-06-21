import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FocusSession } from '../../shared/types';
import FocusGlance from './FocusGlance';
import SecurityGlance from './SecurityGlance';
import styles from './SidePanel.module.css';

interface Props {
  container: HTMLDivElement;
}

export default function SidePanel({ container }: Props) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [open, setOpen] = useState(false);
  const leaveTimeout = useRef<number | null>(null);

  // Read focus session directly from chrome.storage
  useEffect(() => {
    setCurrentOrigin(window.location.origin);

    const readSession = () => {
      chrome.storage.local.get('ex1:currentSession', (result) => {
        setCurrentSession((result['ex1:currentSession'] as FocusSession) ?? null);
      });
    };
    readSession();

    // Subscribe to storage changes
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('ex1:currentSession' in changes) {
        setCurrentSession((changes['ex1:currentSession'].newValue as FocusSession) ?? null);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Sync container width based on open state
  useEffect(() => {
    if (container) {
      container.style.width = open ? '300px' : '15px';
    }
  }, [open, container]);

  const handleMouseEnter = () => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimeout.current = window.setTimeout(() => {
      setOpen(false);
    }, 600);
  };

  return (
    <div className={styles.hostWrapper} onMouseLeave={handleMouseLeave}>
      {/* Edge trigger strip — hidden when panel is open */}
      <div
        className={`${styles.triggerStrip} ${open ? styles.triggerStripHidden : ''}`}
        onMouseEnter={handleMouseEnter}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panelContainer}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            onMouseEnter={handleMouseEnter}
          >
            {/* Focus timer — top half */}
            <div className={styles.topHalf}>
              <FocusGlance session={currentSession} />
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Security scan — bottom half */}
            <div className={styles.bottomHalf}>
              <SecurityGlance origin={currentOrigin} />
            </div>

            {/* Glowing right edge */}
            <div className={styles.activeBorderLine} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

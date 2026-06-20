import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../newtab/hooks/useStorage';
import { KEYS } from '../../shared/storage';
import type { FocusSession, SecurityReport } from '../../shared/types';
import FocusGlance from './FocusGlance';
import SecurityGlance from './SecurityGlance';
import styles from './SidePanel.module.css';

interface Props {
  onClose: () => void;
}

export default function SidePanel({ onClose }: Props) {
  const [currentSession] = useStorage<FocusSession | null>(KEYS.CURRENT_SESSION, null);
  const [securityCache] = useStorage<Record<string, SecurityReport>>(KEYS.SECURITY_CACHE, {});
  const [currentOrigin, setCurrentOrigin] = useState('');

  useEffect(() => {
    setCurrentOrigin(window.location.origin);
  }, []);

  const cachedReport = currentOrigin ? securityCache[currentOrigin] : null;

  return (
    <motion.div
      className={`${styles.panelContainer} glass-card`}
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 220, damping: 25 }}
    >
      {/* Top half: Focus glance */}
      <div className={styles.topHalf}>
        <FocusGlance session={currentSession} />
      </div>

      {/* Vertical divider */}
      <div className={styles.divider} />

      {/* Bottom half: Website Security glance */}
      <div className={styles.bottomHalf}>
        <SecurityGlance report={cachedReport} origin={currentOrigin} />
      </div>
    </motion.div>
  );
}

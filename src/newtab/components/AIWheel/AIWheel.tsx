import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { KEYS } from '../../../shared/storage';
import { DEFAULT_AI_TOOLS } from '../../../shared/defaults';
import type { AITool, AppSettings } from '../../../shared/types';
import { DEFAULT_SETTINGS } from '../../../shared/defaults';
import styles from './AIWheel.module.css';

export default function AIWheel() {
  const [tools]    = useStorage<AITool[]>(KEYS.AI_TOOLS, DEFAULT_AI_TOOLS);
  const [settings] = useStorage<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  const [open, setOpen]       = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const leaveRef = useRef<number | undefined>(undefined);
  const enterRef = useRef<number | undefined>(undefined);

  const active = tools
    .filter(t => t.pinned !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  /* keyboard toggle */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') { e.preventDefault(); setOpen(p => !p); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const startOpen = () => {
    clearTimeout(leaveRef.current);
    enterRef.current = window.setTimeout(() => setOpen(true), 100);
  };
  const scheduleClose = () => {
    clearTimeout(enterRef.current);
    leaveRef.current = window.setTimeout(() => { setOpen(false); setHovered(null); }, 500);
  };
  const cancelClose = () => clearTimeout(leaveRef.current);

  /* navigate */
  const go = (tool: AITool, e: React.MouseEvent) => {
    e.preventDefault();
    const url = tool.url;
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  /* radial math — right-facing semicircle */
  const N = active.length;
  const R = 200;           // radius
  const PAD = 0.28;        // angular padding from top/bottom
  const t0 = -Math.PI / 2 + PAD;
  const t1 =  Math.PI / 2 - PAD;
  // The 500×500 circle is centred at (250, 250), shifted left by 250px so only right half shows
  const CX = 250, CY = 250;

  return (
    <>
      {/* ── Invisible 8px strip on left edge ── */}
      {settings.edgeActivation !== false && (
        <div className={styles.edgeTrigger} onMouseEnter={startOpen} onMouseLeave={scheduleClose} />
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* dim backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
            />

            {/* semi-circle panel */}
            <motion.div
              className={styles.panel}
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 270, damping: 28 }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              {/* glass circle background */}
              <div className={styles.circle}>

                {/* Center AI button */}
                <button className={styles.center} onClick={() => setOpen(false)}>
                  <span>AI</span>
                </button>

                {/* Arc nodes */}
                {active.map((tool, i) => {
                  const angle = N > 1 ? t0 + (i / (N - 1)) * (t1 - t0) : 0;
                  const x = CX + R * Math.cos(angle);
                  const y = CY + R * Math.sin(angle);
                  const isHov = hovered === tool.id;

                  return (
                    <motion.div
                      key={tool.id}
                      className={styles.nodeWrap}
                      style={{ left: x, top: y }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: i * 0.035, type: 'spring', stiffness: 340, damping: 26 }}
                    >
                      <a
                        href={tool.url}
                        className={`${styles.node} ${isHov ? styles.nodeHov : ''}`}
                        onClick={e => go(tool, e)}
                        onMouseEnter={() => setHovered(tool.id)}
                        onMouseLeave={() => setHovered(null)}
                        title={tool.name}
                      >
                        <span
                          className={styles.icon}
                          dangerouslySetInnerHTML={{ __html: tool.icon }}
                        />
                      </a>
                      <AnimatePresence>
                        {isHov && (
                          <motion.span
                            className={styles.label}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.12 }}
                          >
                            {tool.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

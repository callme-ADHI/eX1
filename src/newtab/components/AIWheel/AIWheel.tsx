import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '../../hooks/useStorage';
import { KEYS } from '../../../shared/storage';
import { DEFAULT_AI_TOOLS } from '../../../shared/defaults';
import type { AITool, AppSettings } from '../../../shared/types';
import styles from './AIWheel.module.css';

const DEFAULT_SETTINGS_PARTIAL = { edgeActivation: true } as AppSettings;

export default function AIWheel() {
  const [tools] = useStorage<AITool[]>(KEYS.AI_TOOLS, DEFAULT_AI_TOOLS);
  const [settings] = useStorage<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS_PARTIAL);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const leaveTimeout = useRef<number | undefined>(undefined);
  const hoverTimeout = useRef<number | undefined>(undefined);

  const activeTools = tools
    .filter(t => t.pinned !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Alt+Space toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') { e.preventDefault(); setIsOpen(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openWheel = () => {
    clearTimeout(hoverTimeout.current);
    clearTimeout(leaveTimeout.current);
    hoverTimeout.current = window.setTimeout(() => setIsOpen(true), 120);
  };

  const closeWheel = () => {
    clearTimeout(hoverTimeout.current);
    leaveTimeout.current = window.setTimeout(() => {
      setIsOpen(false);
      setHoveredId(null);
    }, 500);
  };

  const keepOpen = () => {
    clearTimeout(leaveTimeout.current);
  };

  const handleNodeClick = (tool: AITool, e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: tool.url });
    } else {
      window.open(tool.url, '_blank');
    }
  };

  // Distribute nodes along a right-facing semicircle
  const N = activeTools.length;
  const RADIUS = 195;
  const padding = 0.3;
  const startAngle = -Math.PI / 2 + padding;
  const endAngle   =  Math.PI / 2 - padding;

  return (
    <>
      {/* Invisible edge trigger strip */}
      {settings.edgeActivation && (
        <div
          className={styles.edgeTrigger}
          onMouseEnter={openWheel}
          onMouseLeave={closeWheel}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click to close */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Semicircular panel */}
            <motion.div
              className={styles.wheelContainer}
              initial={{ x: -360 }}
              animate={{ x: 0 }}
              exit={{ x: -360 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onMouseEnter={keepOpen}
              onMouseLeave={closeWheel}
            >
              {/* The semi-circle background */}
              <div className={styles.semiCircle}>
                {/* Center AI label */}
                <button
                  className={styles.centerNode}
                  onClick={() => setIsOpen(false)}
                >
                  <span>AI</span>
                </button>

                {/* Nodes placed on the arc */}
                {activeTools.map((tool, index) => {
                  const angle = N > 1
                    ? startAngle + (index / (N - 1)) * (endAngle - startAngle)
                    : 0;
                  const x = 250 + RADIUS * Math.cos(angle); // 250 = center of circle
                  const y = 250 + RADIUS * Math.sin(angle);

                  return (
                    <motion.div
                      key={tool.id}
                      className={styles.nodeWrapper}
                      style={{ left: x, top: y }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: index * 0.04, type: 'spring', stiffness: 320, damping: 24 }}
                    >
                      <a
                        href={tool.url}
                        className={`${styles.node} ${hoveredId === tool.id ? styles.nodeHovered : ''}`}
                        onClick={e => handleNodeClick(tool, e)}
                        onMouseEnter={() => setHoveredId(tool.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        title={tool.name}
                      >
                        <span
                          className={styles.nodeIcon}
                          dangerouslySetInnerHTML={{ __html: tool.icon }}
                        />
                      </a>
                      <AnimatePresence>
                        {hoveredId === tool.id && (
                          <motion.div
                            className={styles.label}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.15 }}
                          >
                            {tool.name}
                          </motion.div>
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

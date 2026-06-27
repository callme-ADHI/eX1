import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AevoarxLogo — eX1 brand mark
 * Compact icon: right-slash = white, left-slash = accent color.
 * On hover: expands into full "eX1" wordmark.
 *   - 'e' is accent-colored
 *   - 'X' is accent-colored
 *   - '1' is white
 * The slash icon always stays on the right side.
 */

export default function AevoarxLogo() {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'default',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* ── Expanded wordmark: slides in from the left on hover ── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="wordmark"
            initial={{ opacity: 0, x: 14, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 'auto' }}
            exit={{ opacity: 0, x: 14, width: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0px',
              whiteSpace: 'nowrap',
            }}
          >
            {/* "e" — accent color */}
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: '18px',
              letterSpacing: '-0.04em',
              color: 'var(--accent)',
              lineHeight: 1,
            }}>e</span>

            {/* "X" — accent color */}
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: '18px',
              letterSpacing: '-0.04em',
              color: 'var(--accent)',
              lineHeight: 1,
            }}>X</span>

            {/* "1" — white */}
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              fontSize: '18px',
              color: '#FFFFFF',
              lineHeight: 1,
              marginRight: '6px',
            }}>1</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Slash mark logo icon — always visible ── */}
      <motion.svg
        viewBox="0 0 24 30"
        width="20"
        height="26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ scale: hovered ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{ flexShrink: 0 }}
      >
        {/*
          The Aevoarx logo mark: two angled slashes.
          Left slash → accent color (theme-reactive via CSS var)
          Right slash → always white
        */}
        {/* Left slash — accent colored */}
        <line
          x1="5" y1="28"
          x2="13" y2="2"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Right slash — white */}
        <line
          x1="11" y1="28"
          x2="19" y2="2"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </motion.svg>
    </motion.div>
  );
}

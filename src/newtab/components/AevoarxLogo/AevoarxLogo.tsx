import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AevoarxLogo — Official brand mark for Aevoarx / eX1
 *
 * Icon mark: "A"-shaped chevron (two legs meeting at apex).
 *   - Left leg  → always WHITE
 *   - Right leg → accent color (theme-reactive)
 *
 * Wordmark on hover: "AEVOARX" spaced, uppercase
 *   - A, E, V, O, A, R → WHITE
 *   - X                → accent color
 * Plus the eX1 product tag beneath it.
 *   - e, X → accent color
 *   - 1    → white
 */

export default function AevoarxLogo() {
  const [hovered, setHovered] = useState(false);

  const baseFont: React.CSSProperties = {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontWeight: 700,
    letterSpacing: '0.18em',
    lineHeight: 1,
    fontSize: '11px',
  };

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* ── Chevron "A" mark — always visible ───────────────────────────── */}
      <motion.svg
        viewBox="0 0 44 36"
        width={hovered ? 32 : 28}
        height={hovered ? 28 : 24}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        style={{ flexShrink: 0, overflow: 'visible' }}
      >
        {/*
          The Aevoarx "A" mark:
          Two thick strokes meeting at a peak (like a chevron / mountain).
          Left leg = WHITE (from top-center down to bottom-left)
          Right leg = ACCENT COLOR (from top-center down to bottom-right)

          SVG coords: apex at (22, 2), left foot at (2, 34), right foot at (42, 34)
        */}
        {/* Left leg — WHITE */}
        <line
          x1="22" y1="3"
          x2="3"  y2="34"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Right leg — ACCENT (theme color) */}
        <line
          x1="22" y1="3"
          x2="41" y2="34"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* ── Wordmark: expands on hover ───────────────────────────────────── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="wordmark"
            initial={{ opacity: 0, x: -10, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 'auto' }}
            exit={{ opacity: 0, x: -10, width: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              whiteSpace: 'nowrap',
            }}
          >
            {/* ── Top row: AEVOARX wordmark ── */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px' }}>
              {/* A E V O A R — white */}
              <span style={{ ...baseFont, color: '#FFFFFF' }}>AEVOAR</span>
              {/* X — accent color */}
              <span style={{ ...baseFont, color: 'var(--accent)' }}>X</span>
            </div>

            {/* ── Bottom row: eX1 product tag ── */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0px',
              opacity: 0.75,
            }}>
              {/* e — accent */}
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '9px',
                letterSpacing: '0.04em',
                color: 'var(--accent)',
              }}>e</span>
              {/* X — accent */}
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '9px',
                letterSpacing: '0.04em',
                color: 'var(--accent)',
              }}>X</span>
              {/* 1 — white */}
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
                fontSize: '9px',
                color: 'rgba(255,255,255,0.6)',
              }}>1</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

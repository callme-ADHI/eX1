import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AevoarxLogo — Precise recreation of the Aevoarx brand identity.
 *
 * Chevron "A" Mark:
 *   - Left leg is WHITE.
 *   - Right leg is ACCENT (blue/theme color) and attaches slightly below the apex.
 *
 * Wordmark on Hover (EVOARX):
 *   - Scaled down (height=10px) to be smaller than the main chevron mark.
 *   - E consists of 3 horizontal lines (no vertical spine).
 *   - A is rendered as a clean chevron (Λ) with no crossbar, matching the logo style.
 *   - E and X are in the selected accent color; V, O, A, R are white.
 */
export default function AevoarxLogo() {
  const [hovered, setHovered] = useState(false);

  const sw = 1.5; // Stroke width for the small wordmark letters
  const lh = 10;  // Height of the small wordmark letters

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      {/* ── Chevron "A" Logo Mark ── */}
      <motion.svg
        viewBox="0 0 32 28"
        width="24"
        height="24"
        fill="none"
        overflow="visible"
        animate={{ scale: hovered ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      >
        {/* Left leg — White */}
        <line
          x1="4"
          y1="27"
          x2="16.5"
          y2="2"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="butt"
        />
        {/* Right leg — Accent (Blue/Theme), meets slightly below the peak */}
        <line
          x1="16.5"
          y1="6"
          x2="27"
          y2="27"
          stroke="var(--accent)"
          strokeWidth="4.5"
          strokeLinecap="butt"
        />
      </motion.svg>

      {/* ── Wordmark (EVOARX) ── */}
      <AnimatePresence>
        {hovered && (
          <motion.svg
            key="wordmark"
            viewBox="0 0 74 10"
            width="74"
            height={lh}
            fill="none"
            overflow="visible"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* E — Accent (3 horizontal bars, no vertical spine) */}
            <line x1="0" y1="0" x2="8" y2="0" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="0" y1="5" x2="6.5" y2="5" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="0" y1="10" x2="8" y2="10" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />

            {/* V — White */}
            <line x1="13" y1="0" x2="17.5" y2="10" stroke="white" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="22" y1="0" x2="17.5" y2="10" stroke="white" strokeWidth={sw} strokeLinecap="butt" />

            {/* O — White */}
            <rect x="26.5" y="0.5" width="7" height="9" rx="2" stroke="white" strokeWidth={sw} fill="none" />

            {/* A (Λ Chevron) — White (meets slightly below apex) */}
            <line x1="43.5" y1="0.5" x2="39" y2="10" stroke="white" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="43.5" y1="2.5" x2="47" y2="10" stroke="white" strokeWidth={sw} strokeLinecap="butt" />

            {/* R — White */}
            <line x1="52" y1="0" x2="52" y2="10" stroke="white" strokeWidth={sw} strokeLinecap="butt" />
            <path d="M 52,0.75 L 55.5,0.75 C 57.5,0.75 57.5,5.25 55.5,5.25 L 52,5.25" stroke="white" strokeWidth={sw} fill="none" strokeLinecap="butt" />
            <line x1="55.5" y1="5.25" x2="59.5" y2="10" stroke="white" strokeWidth={sw} strokeLinecap="butt" />

            {/* X — Accent (Blue/Theme) */}
            <line x1="65" y1="0" x2="73" y2="10" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="73" y1="0" x2="65" y2="10" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}

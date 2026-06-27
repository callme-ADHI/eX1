import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AevoarxLogo
 *
 * Compact: Only the "A" chevron mark (left=white, right=accent).
 * Hover:   EVOARX wordmark slides in to the right, smaller than the mark.
 *          E = 3 horizontal bars only (no spine) per brand style.
 *          X = accent color. All others = white.
 */
export default function AevoarxLogo() {
  const [hovered, setHovered] = useState(false);

  // Letter stroke weight and height for the compact wordmark
  const sw = 2;     // stroke width
  const lh = 14;    // letter height (smaller than the 26px chevron mark)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none', cursor: 'default' }}
    >
      {/* ── Chevron "A" mark — always visible, dominant ── */}
      <motion.svg
        viewBox="0 0 30 28"
        width="24"
        height="24"
        fill="none"
        overflow="visible"
        animate={{ scale: hovered ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      >
        {/* Left leg — white */}
        <line x1="15" y1="1" x2="0"  y2="27" stroke="#FFFFFF"        strokeWidth="5" strokeLinecap="butt" />
        {/* Right leg — accent */}
        <line x1="15" y1="1" x2="30" y2="27" stroke="var(--accent)"  strokeWidth="5" strokeLinecap="butt" />
      </motion.svg>

      {/* ── EVOARX wordmark — slides in on hover ── */}
      <AnimatePresence>
        {hovered && (
          <motion.svg
            key="wordmark"
            viewBox="0 0 92 14"
            width="92"
            height={lh}
            fill="none"
            overflow="visible"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/*
              Layout (height=14, gap=5 between letters):
              E  x=0   w=11
              V  x=16  w=12
              O  x=33  w=11
              A  x=49  w=12
              R  x=66  w=10
              X  x=81  w=11
            */}

            {/* ── E — accent color — 3 horizontal bars, NO spine ── */}
            <line x1="0"  y1="0"    x2="11" y2="0"    stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />
            <line x1="0"  y1={lh/2} x2="9"  y2={lh/2} stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />
            <line x1="0"  y1={lh}   x2="11" y2={lh}   stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />

            {/* ── V — white ── */}
            <line x1="16" y1="0"  x2="22" y2={lh} stroke="white" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="28" y1="0"  x2="22" y2={lh} stroke="white" strokeWidth={sw} strokeLinecap="butt" />

            {/* ── O — white — oval stroke ── */}
            <ellipse cx="38.5" cy={lh/2} rx="5.5" ry={lh/2} stroke="white" strokeWidth={sw} fill="none" />

            {/* ── A — white — two legs + crossbar ── */}
            <line x1="55" y1="0"  x2="49" y2={lh}   stroke="white" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="55" y1="0"  x2="61" y2={lh}   stroke="white" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="51" y1="9"  x2="59" y2="9"     stroke="white" strokeWidth={sw - 0.4} strokeLinecap="square" />

            {/* ── R — white — spine + arch + leg ── */}
            <line x1="66" y1="0"  x2="66" y2={lh} stroke="white" strokeWidth={sw} strokeLinecap="butt" />
            <path d={`M 66 0 Q 76 0 76 3.5 Q 76 7 66 7`} stroke="white" strokeWidth={sw} fill="none" strokeLinecap="butt" />
            <line x1="68" y1="7"  x2="76" y2={lh} stroke="white" strokeWidth={sw} strokeLinecap="butt" />

            {/* ── X — accent color ── */}
            <line x1="81" y1="0"  x2="92" y2={lh} stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
            <line x1="92" y1="0"  x2="81" y2={lh} stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}

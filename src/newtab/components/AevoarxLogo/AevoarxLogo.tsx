import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AevoarxLogo() {
  const [hovered, setHovered] = useState(false);
  const sw = 4.2; // stroke weight used for all letters

  // Each letter drawn as SVG strokes — pure vector, no font rendering
  // Layout: E(16) V(17) O(17) A(17) R(16) X(17), gap=5 between each
  // Offsets: E=0, V=21, O=43, A=65, R=87, X=108  total≈130
  const lh = 24; // letter height

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', userSelect: 'none', cursor: 'default' }}
    >
      <svg
        viewBox={`0 0 ${hovered ? 198 : 32} 32`}
        height="26"
        width={hovered ? 198 : 32}
        fill="none"
        overflow="visible"
        style={{ transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* ── "A" Chevron mark — left=white, right=accent ── */}
        {/* apex at (16,2), left foot at (1,30), right foot at (31,30) */}
        <line x1="16" y1="2"  x2="1"  y2="30" stroke="white"         strokeWidth="5.5" strokeLinecap="butt" />
        <line x1="16" y1="2"  x2="31" y2="30" stroke="var(--accent)" strokeWidth="5.5" strokeLinecap="butt" />

        {/* ── EVOARX wordmark — only visible on hover, fades in ── */}
        {/* Starts at x=42 (after 32px chevron + 10px gap) */}
        {/* Baseline: y=lh+4=28, top: y=4 */}
        <g opacity={hovered ? 1 : 0} style={{ transition: 'opacity 0.3s ease 0.05s' }}>

          {/* E — accent color (x=42) */}
          {/* spine, top, mid (short), bottom */}
          <line x1="44"  y1="4"  x2="44"  y2="28" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />
          <line x1="44"  y1="4"  x2="60"  y2="4"  stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />
          <line x1="44"  y1="16" x2="57"  y2="16" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />
          <line x1="44"  y1="28" x2="60"  y2="28" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />

          {/* V — white (x=65) */}
          <line x1="65"  y1="4"  x2="73"  y2="28" stroke="white" strokeWidth={sw} strokeLinecap="square" />
          <line x1="81"  y1="4"  x2="73"  y2="28" stroke="white" strokeWidth={sw} strokeLinecap="square" />

          {/* O — white (x=87) — as stroked rounded rect */}
          <rect x="87" y="4" width="16" height="24" rx="8" ry="8"
            stroke="white" strokeWidth={sw} fill="none" />

          {/* A — white (x=109) — chevron with crossbar */}
          <line x1="117" y1="4"  x2="109" y2="28" stroke="white" strokeWidth={sw} strokeLinecap="square" />
          <line x1="117" y1="4"  x2="125" y2="28" stroke="white" strokeWidth={sw} strokeLinecap="square" />
          <line x1="111" y1="20" x2="123" y2="20" stroke="white" strokeWidth={sw - 0.5} strokeLinecap="square" />

          {/* R — white (x=131) */}
          {/* spine */}
          <line x1="133" y1="4"  x2="133" y2="28" stroke="white" strokeWidth={sw} strokeLinecap="square" />
          {/* arch: top half circle using path */}
          <path d="M 133 4 Q 149 4 149 12 Q 149 20 133 20" stroke="white" strokeWidth={sw} fill="none" strokeLinecap="square" />
          {/* diagonal leg */}
          <line x1="133" y1="20" x2="149" y2="28" stroke="white" strokeWidth={sw} strokeLinecap="square" />

          {/* X — accent color (x=155) */}
          <line x1="155" y1="4"  x2="171" y2="28" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />
          <line x1="171" y1="4"  x2="155" y2="28" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="square" />

        </g>
      </svg>
    </motion.div>
  );
}

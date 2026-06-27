import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * AevoarxLogo — High-fidelity SVG vector design.
 *
 * Layout:
 *   - Both the Logo Mark (A) and the Wordmark (EVOARX) are drawn inside a single SVG.
 *   - This guarantees perfect baseline alignment mathematically.
 *   - The logo mark's legs are drawn as geometric polygons with flat horizontal cuts.
 *   - The right leg attaches below the apex of the left leg, matching the brand asset.
 *   - The wordmark letters are drawn with sw=1.5 and height=10 (smaller than the A),
 *     with their bases exactly aligned at y=26.
 */
export default function AevoarxLogo() {
  const [hovered, setHovered] = useState(false);
  const sw = 1.5; // Stroke width for wordmark letters

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      <svg
        viewBox={hovered ? '0 0 118 28' : '0 0 32 28'}
        width={hovered ? '118' : '32'}
        height="24"
        fill="none"
        overflow="visible"
        style={{
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ─── Logo Mark: A (Chevron) ─── */}
        {/* Left Leg (White) */}
        <polygon
          points="13,2 17,2 7.5,26 3.5,26"
          fill="#FFFFFF"
        />
        {/* Right Leg (Accent / Blue), meets below the apex on the right side of the left leg */}
        <polygon
          points="15.2,7.5 19.2,7.5 28.7,26 24.7,26"
          fill="var(--accent)"
        />

        {/* ─── Wordmark: EVOARX (Aligned to base at y=26) ─── */}
        <g
          opacity={hovered ? 1 : 0}
          style={{
            transition: 'opacity 0.25s ease',
          }}
        >
          {/* E — Accent (3 horizontal bars, no vertical spine) */}
          <line x1="40" y1="16" x2="48" y2="16" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
          <line x1="40" y1="21" x2="46.5" y2="21" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
          <line x1="40" y1="26" x2="48" y2="26" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />

          {/* V — White */}
          <line x1="53" y1="16" x2="57" y2="26" stroke="white" strokeWidth={sw} strokeLinecap="butt" />
          <line x1="61" y1="16" x2="57" y2="26" stroke="white" strokeWidth={sw} strokeLinecap="butt" />

          {/* O — White */}
          <rect x="66" y="16.5" width="7" height="9" rx="2" stroke="white" strokeWidth={sw} fill="none" />

          {/* A (Λ Chevron) — White (meets slightly below apex) */}
          <line x1="78.5" y1="16.5" x2="74" y2="26" stroke="white" strokeWidth={sw} strokeLinecap="butt" />
          <line x1="78.5" y1="18.5" x2="82" y2="26" stroke="white" strokeWidth={sw} strokeLinecap="butt" />

          {/* R — White */}
          <line x1="87" y1="16" x2="87" y2="26" stroke="white" strokeWidth={sw} strokeLinecap="butt" />
          <path d="M 87,16.75 L 90.5,16.75 C 92.5,16.75 92.5,21.25 90.5,21.25 L 87,21.25" stroke="white" strokeWidth={sw} fill="none" strokeLinecap="butt" />
          <line x1="90.5" y1="21.25" x2="94.5" y2="26" stroke="white" strokeWidth={sw} strokeLinecap="butt" />

          {/* X — Accent (Blue/Theme) */}
          <line x1="100" y1="16" x2="108" y2="26" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
          <line x1="108" y1="16" x2="100" y2="26" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" />
        </g>
      </svg>
    </div>
  );
}

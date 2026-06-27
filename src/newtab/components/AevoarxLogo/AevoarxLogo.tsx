import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AevoarxLogo — Faithful recreation of the official Aevoarx brand mark.
 *
 * Mark: Open "A" chevron (rooftop shape, no crossbar).
 *   Left leg  → WHITE
 *   Right leg → accent color (theme-reactive)
 *
 * Wordmark: AEVOARX (spaced geometric caps)
 *   A E V O A R → WHITE
 *   X           → accent color
 *
 * Tagline (on hover): — ENGINEERED TO OUTLIVE TIME. —
 */

export default function AevoarxLogo() {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ opacity: hovered ? 1 : 0.85 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '5px',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* ── Row: chevron mark + wordmark ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
      }}>

        {/* ── "A" Chevron mark ─────────────────────────────────────────── */}
        <motion.svg
          viewBox="0 0 40 34"
          width="28"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          style={{ flexShrink: 0, overflow: 'visible' }}
        >
          {/*
            Open "A" / chevron — apex at top-center, two legs going down.
            Exactly as in the Aevoarx logo: thick strokes, no crossbar.
            Left leg  = WHITE
            Right leg = ACCENT (blue / theme color)

            Viewbox 40×34. Apex at (20, 1). Feet at (2, 33) and (38, 33).
          */}

          {/* Left leg — WHITE */}
          <line
            x1="20" y1="2"
            x2="2"  y2="33"
            stroke="#FFFFFF"
            strokeWidth="5.5"
            strokeLinecap="butt"
          />

          {/* Right leg — ACCENT */}
          <line
            x1="20" y1="2"
            x2="38" y2="33"
            stroke="var(--accent)"
            strokeWidth="5.5"
            strokeLinecap="butt"
          />
        </motion.svg>

        {/* ── AEVOARX wordmark ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0',
          lineHeight: 1,
        }}>
          {/* A E V O A R — white, bold, wide tracking */}
          <span style={{
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.22em',
            color: '#FFFFFF',
            lineHeight: 1,
          }}>
            AEVOAR
          </span>

          {/* X — accent color */}
          <span style={{
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.22em',
            color: 'var(--accent)',
            lineHeight: 1,
          }}>
            X
          </span>
        </div>
      </div>

      {/* ── Tagline: only visible on hover ────────────────────────────── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tagline"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '38px',   /* aligns with wordmark, past the chevron */
            }}
          >
            {/* left rule */}
            <div style={{
              width: '14px',
              height: '1px',
              background: 'rgba(255,255,255,0.25)',
            }} />

            <span style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontWeight: 400,
              fontSize: '7.5px',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              ENGINEERED TO OUTLIVE TIME.
            </span>

            {/* right rule */}
            <div style={{
              width: '14px',
              height: '1px',
              background: 'rgba(255,255,255,0.25)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

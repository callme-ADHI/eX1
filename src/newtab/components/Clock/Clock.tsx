import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { AppSettings } from '../../../shared/types';
import styles from './Clock.module.css';

interface Props { settings: AppSettings; }

export default function Clock({ settings }: Props) {
  const [now, setNow] = useState(new Date());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setNow(new Date());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
  }, []);

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {settings.clockStyle === 'analog'
        ? <AnalogFace now={now} />
        : <DigitalFace now={now} mode={settings.clockMode} />}
    </motion.div>
  );
}

// ─── Digital face ─────────────────────────────────────────────────────────────

function DigitalFace({ now, mode }: { now: Date; mode: '12h' | '24h' }) {
  const timeStr = now.toLocaleTimeString(mode === '12h' ? 'en-US' : 'en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: mode === '12h',
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className={styles.digital}>
      <div className={styles.timeDisplay}>{timeStr}</div>
      <div className={styles.dateDisplay}>{dateStr}</div>
    </div>
  );
}

// ─── Analog face ──────────────────────────────────────────────────────────────

function AnalogFace({ now }: { now: Date }) {
  const s = now.getSeconds() + now.getMilliseconds() / 1000;
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;

  const secDeg = s * 6;
  const minDeg = m * 6;
  const hrDeg  = h * 30;

  return (
    <div className={styles.analogWrapper}>
      <svg className={styles.analogSvg} viewBox="0 0 200 200">
        {/* Tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const isMajor = i % 5 === 0;
          const angle = (i / 60) * 360;
          const r1 = isMajor ? 84 : 88;
          const r2 = 92;
          const x1 = 100 + r1 * Math.sin((angle * Math.PI) / 180);
          const y1 = 100 - r1 * Math.cos((angle * Math.PI) / 180);
          const x2 = 100 + r2 * Math.sin((angle * Math.PI) / 180);
          const y2 = 100 - r2 * Math.cos((angle * Math.PI) / 180);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isMajor ? 'var(--text-secondary)' : 'var(--border)'}
              strokeWidth={isMajor ? 2 : 1} strokeLinecap="round" />
          );
        })}

        {/* Hour hand */}
        <line x1="100" y1="100"
          x2={100 + 45 * Math.sin((hrDeg * Math.PI) / 180)}
          y2={100 - 45 * Math.cos((hrDeg * Math.PI) / 180)}
          stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" />

        {/* Minute hand */}
        <line x1="100" y1="100"
          x2={100 + 65 * Math.sin((minDeg * Math.PI) / 180)}
          y2={100 - 65 * Math.cos((minDeg * Math.PI) / 180)}
          stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />

        {/* Second hand — accent color */}
        <line x1={100 - 15 * Math.sin((secDeg * Math.PI) / 180)}
          y1={100 + 15 * Math.cos((secDeg * Math.PI) / 180)}
          x2={100 + 75 * Math.sin((secDeg * Math.PI) / 180)}
          y2={100 - 75 * Math.cos((secDeg * Math.PI) / 180)}
          stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx="100" cy="100" r="3" fill="var(--accent)" />
      </svg>

      <div className={styles.dateDisplay}>
        {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

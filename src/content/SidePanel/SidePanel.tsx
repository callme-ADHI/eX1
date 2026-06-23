import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FocusSession } from '../../shared/types';
import { KEYS } from '../../shared/storage';
import FocusGlance from './FocusGlance';
import SecurityGlance from './SecurityGlance';

interface Props {
  container: HTMLDivElement;
}

const TRIGGER_ZONE_PX = 25;  // px from right edge that opens the panel
const CLOSE_ZONE_PX = 320; // px from right edge — beyond this, start close timer

export default function SidePanel({ container }: Props) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [open, setOpen] = useState(false);

  // useRef so the mousemove listener always reads the current value
  // without needing to re-register on every state change
  const openRef = useRef(false);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // ── Force container to the RIGHT side once, on mount ──────────────────
  useEffect(() => {
    container.style.setProperty('position', 'fixed', 'important');
    container.style.setProperty('top', '0', 'important');
    container.style.setProperty('bottom', '0', 'important');
    container.style.setProperty('right', '0', 'important');
    container.style.setProperty('left', 'auto', 'important');
    container.style.setProperty('width', '20px', 'important');
    container.style.setProperty('z-index', '2147483647', 'important');
    container.style.setProperty('pointer-events', 'auto', 'important');
    container.style.setProperty('background', 'transparent', 'important');
    container.style.setProperty('overflow', 'visible', 'important');
  }, [container]);

  // ── Sync container size + hit-test when open state changes ────────────
  useEffect(() => {
    if (open) {
      container.style.setProperty('width', '300px', 'important');
      container.style.setProperty('pointer-events', 'auto', 'important');
    } else {
      container.style.setProperty('width', '20px', 'important');
      container.style.setProperty('pointer-events', 'auto', 'important');
    }
  }, [open, container]);

  // ── Focus session from storage ─────────────────────────────────────────
  useEffect(() => {
    setCurrentOrigin(window.location.origin);

    const read = () =>
      chrome.storage.local.get(KEYS.CURRENT_SESSION, (res) =>
        setCurrentSession((res[KEYS.CURRENT_SESSION] as FocusSession) ?? null)
      );
    read();

    const onChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (KEYS.CURRENT_SESSION in changes)
        setCurrentSession((changes[KEYS.CURRENT_SESSION].newValue as FocusSession) ?? null);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  // ── Keyboard Shortcut & Messages (Ctrl+Space) ──────────────────────────
  useEffect(() => {
    const handleMsg = (msg: any) => {
      if (msg.type === 'TOGGLE_HUD') {
        setOpen(prev => !prev);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(prev => !prev);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMsg);
    }
    window.addEventListener('keydown', onKeyDown, { capture: true });

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMsg);
      }
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, []);

  // ── Mouse tracking — registered ONCE, reads state via ref ────────────
  useEffect(() => {
    const clearClose = () => {
      if (leaveTimeout.current) {
        clearTimeout(leaveTimeout.current);
        leaveTimeout.current = null;
      }
    };

    const scheduleClose = () => {
      if (!leaveTimeout.current) {
        leaveTimeout.current = setTimeout(() => {
          setOpen(false);
          leaveTimeout.current = null;
        }, 500);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const distFromRight = window.innerWidth - e.clientX;

      if (!openRef.current) {
        // Trigger: mouse enters the right-edge zone
        if (distFromRight <= TRIGGER_ZONE_PX) {
          clearClose();
          setOpen(true);
        }
      } else {
        // Close: mouse has moved past the left edge of the panel
        if (distFromRight > CLOSE_ZONE_PX) {
          scheduleClose();
        } else {
          // Mouse came back into the panel — cancel pending close
          clearClose();
        }
      }
    };

    const onMouseLeave = () => {
      // Mouse left the browser window entirely
      if (openRef.current) scheduleClose();
    };

    const onContainerEnter = () => {
      if (!openRef.current) {
        clearClose();
        setOpen(true);
      }
    };

    const onContainerLeave = () => {
      if (openRef.current) {
        scheduleClose();
      }
    };

    container.addEventListener('mouseenter', onContainerEnter);
    container.addEventListener('mouseleave', onContainerLeave);
    window.addEventListener('mousemove', onMouseMove, { capture: true, passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', onContainerEnter);
      container.removeEventListener('mouseleave', onContainerLeave);
      window.removeEventListener('mousemove', onMouseMove, { capture: true });
      document.removeEventListener('mouseleave', onMouseLeave);
      clearClose();
    };
  }, [container]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* Subtle edge glow — visible when panel is closed, guides the eye */}
      {!open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '1px',
          height: '100%',
          background: 'linear-gradient(to bottom, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)',
          pointerEvents: 'none',
        }} />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="side-panel"
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(10, 10, 12, 0.94)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
              color: '#e8e8f0',
              fontFamily: "'Inter', 'IBM Plex Mono', system-ui, sans-serif",
            }}
          >
            {/* ── Top half: Focus timer (1/4 height) ── */}
            <div style={{ flex: 1, padding: '20px 16px 12px', overflowY: 'auto' }}>
              <FocusGlance session={currentSession} />
            </div>

            {/* ── Divider ── */}
            <div style={{
              height: '1px',
              margin: '0 16px',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.06)',
            }} />

            {/* ── Bottom half: Security (3/4 height) ── */}
            <div style={{ flex: 3, padding: '12px 16px 20px', overflowY: 'auto' }}>
              <SecurityGlance origin={currentOrigin} />
            </div>

            {/* Accent line on the left border */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: '20%',
              height: '60%',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, var(--ex1-accent, #2452FF), transparent)',
              pointerEvents: 'none',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
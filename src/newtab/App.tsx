import React, { useEffect } from 'react';
import { useStorage } from './hooks/useStorage';
import { KEYS } from '../shared/storage';
import { DEFAULT_SETTINGS } from '../shared/defaults';
import type { AppSettings } from '../shared/types';

import Clock from './components/Clock/Clock';
import AIWheel from './components/AIWheel/AIWheel';
import SearchBar from './components/SearchBar/SearchBar';
import Dock from './components/Dock/Dock';
import FocusCard from './components/FocusCard/FocusCard';
import ProductivityCard from './components/ProductivityCard/ProductivityCard';
import TabIntelCard from './components/TabIntelCard/TabIntelCard';
import SettingsPanel from './components/Settings/SettingsPanel';

import styles from './App.module.css';

export default function App() {
  const [settings] = useStorage<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme ?? 'platinum');
  }, [settings.theme]);

  return (
    <div className={styles.root}>
      {/* ── Left column ──────────────────────────────── */}
      <div className={styles.leftCol}>
        <Clock settings={settings} />
        <FocusCard />
      </div>

      {/* ── Right column ─────────────────────────────── */}
      <div className={styles.rightCol}>
        <SearchBar />
        <ProductivityCard />
        <TabIntelCard />
      </div>

      {/* ── AI Wheel (edge-triggered, layers over all) ─ */}
      <AIWheel />

      {/* ── Bottom Dock ──────────────────────────────── */}
      <Dock />

      {/* ── Settings gear (fixed bottom-right) ───────── */}
      <SettingsPanel />
    </div>
  );
}

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme ?? 'platinum');
  }, [settings.theme]);

  return (
    <div className={styles.root}>
      {/* ── Big clock left-center ─────────────────────── */}
      <div className={styles.clockArea}>
        <Clock settings={settings} />
      </div>

      {/* ── Search bar top-right ──────────────────────── */}
      <div className={styles.searchArea}>
        <SearchBar />
      </div>

      {/* ── Dashboard cards right panel ───────────────── */}
      <div className={styles.cardsArea}>
        <FocusCard />
        <ProductivityCard />
        <TabIntelCard />
      </div>

      {/* ── AI Wheel edge-triggered left side ────────── */}
      <AIWheel />

      {/* ── Bottom Dock ───────────────────────────────── */}
      <Dock />

      {/* ── Settings gear bottom-right ────────────────── */}
      <div className={styles.settingsArea}>
        <SettingsPanel />
      </div>
    </div>
  );
}

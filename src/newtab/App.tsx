import React, { useEffect } from 'react';
import { useStorage } from './hooks/useStorage';
import { KEYS } from '../shared/storage';
import { DEFAULT_SETTINGS } from '../shared/defaults';
import type { AppSettings } from '../shared/types';

import Clock from './components/Clock/Clock';
import AIDock from './components/AIDock/AIDock';
import SearchBar from './components/SearchBar/SearchBar';
import Dock from './components/Dock/Dock';
import FocusStrip from './components/FocusCard/FocusStrip';
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
      {/* ── Large clock — left center ───────────── */}
      <div className={styles.clockArea}>
        <Clock settings={settings} />
      </div>

      {/* ── Focus strip — below clock ───────────── */}
      <div className={styles.focusArea}>
        <FocusStrip />
      </div>

      {/* ── Search bar — top right ──────────────── */}
      <div className={styles.searchArea}>
        <SearchBar />
      </div>

      {/* ── Productivity + Tab cards — right col ── */}
      <div className={styles.cardsArea}>
        <ProductivityCard />
        <TabIntelCard />
      </div>

      {/* ── AI Dock — left edge triggered ────────── */}
      <AIDock />

      {/* ── Dock — bottom center ────────────────── */}
      <Dock />

      {/* ── Settings gear ───────────────────────── */}
      <div className={styles.settingsArea}>
        <SettingsPanel />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SearchBar.module.css';

interface EngineOption {
  key: string;
  name: string;
  prefix: string;
  url: string;
}

const SEARCH_ENGINES: EngineOption[] = [
  { key: 'google', name: 'Google', prefix: 'g:', url: 'https://www.google.com/search?q=' },
  { key: 'youtube', name: 'YouTube', prefix: 'yt:', url: 'https://www.youtube.com/results?search_query=' },
  { key: 'github', name: 'GitHub', prefix: 'gh:', url: 'https://github.com/search?q=' },
  { key: 'leetcode', name: 'LeetCode', prefix: 'lc:', url: 'https://leetcode.com/problemset/?search=' },
  { key: 'hackerrank', name: 'HackerRank', prefix: 'hr:', url: 'https://www.hackerrank.com/search?q=' },
];

const QUICK_AI: Record<string, string> = {
  chatgpt: 'https://chatgpt.com',
  claude: 'https://claude.ai',
  gemini: 'https://gemini.google.com',
  grok: 'https://grok.com',
  deepseek: 'https://chat.deepseek.com',
  kimi: 'https://kimi.moonshot.cn',
  lovable: 'https://lovable.dev',
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeEngine, setActiveEngine] = useState<EngineOption>(SEARCH_ENGINES[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside listener to dismiss search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // Detect prefix command typing (e.g. "yt:")
    for (const eng of SEARCH_ENGINES) {
      if (val.toLowerCase().startsWith(eng.prefix)) {
        setActiveEngine(eng);
        setQuery(val.slice(eng.prefix.length).trimStart());
        break;
      }
    }
  };

  const handleSearchSubmit = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage({ type: 'OPEN_TAB', url, active: true });
    } else {
      window.open(url, '_blank');
    }
    setQuery('');
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // 1. Direct AI match check
    const lower = trimmed.toLowerCase();
    if (QUICK_AI[lower]) {
      handleSearchSubmit(QUICK_AI[lower]);
      return;
    }

    // 2. Fallback to active engine search
    const searchUrl = `${activeEngine.url}${encodeURIComponent(trimmed)}`;
    handleSearchSubmit(searchUrl);
  };

  const handleSuggestionClick = (engineUrl: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    handleSearchSubmit(`${engineUrl}${encodeURIComponent(trimmed)}`);
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className={styles.container} ref={containerRef}>
      <form onSubmit={handleSubmit} className={`${styles.searchForm} ${isFocused ? styles.focused : ''}`}>
        {/* Engine indicator/selector */}
        <div className={styles.engineBadge}>
          <span className={styles.engineText}>{activeEngine.prefix}</span>
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          placeholder="Command search... (e.g., claude, g: query, yt: query)"
          className={styles.input}
          autoComplete="off"
          spellCheck="false"
        />

        {hasQuery && (
          <button type="button" onClick={() => setQuery('')} className={styles.clearBtn}>
            ×
          </button>
        )}
      </form>

      {/* Suggested Search Options Dropdown */}
      <AnimatePresence>
        {isFocused && hasQuery && (
          <motion.div
            className={`${styles.dropdown} glass-card`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.dropdownHeader}>SEARCH PROVIDERS</div>
            <div className={styles.optionsList}>
              {SEARCH_ENGINES.map((eng) => (
                <button
                  key={eng.key}
                  type="button"
                  onClick={() => handleSuggestionClick(eng.url)}
                  className={styles.optionRow}
                >
                  <span className={`${styles.optionPrefix} mono`}>{eng.prefix}</span>
                  <span className={styles.optionLabel}>Search with {eng.name}</span>
                </button>
              ))}

              <div className={styles.dropdownDivider} />

              <div className={styles.dropdownHeader}>QUICK LAUNCH</div>
              {Object.keys(QUICK_AI).map((aiKey) => (
                <button
                  key={aiKey}
                  type="button"
                  onClick={() => handleSearchSubmit(QUICK_AI[aiKey])}
                  className={styles.optionRow}
                >
                  <span className={`${styles.optionPrefix} mono`}>launch</span>
                  <span className={styles.optionLabel}>{aiKey}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

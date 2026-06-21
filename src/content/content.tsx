import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from './SidePanel/SidePanel';

// ─── Content Script ──────────────────────────────────────────────────────────
// Surface B: Mounts once and handles side-panel state via CSS/React events.

function init() {
  // Avoid running on New Tab override page or system pages
  if (
    window.location.protocol === 'chrome-extension:' || 
    window.location.href.startsWith('chrome://') ||
    window.location.href.startsWith('about:')
  ) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'ex1-hud-sidepanel-root';
  Object.assign(container.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    height: '100vh',
    width: '15px', // initial trigger strip width
    zIndex: '2147483647',
    pointerEvents: 'auto',
  });

  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Ingest design tokens & styling inside Shadow DOM
  const tokensLink = document.createElement('link');
  tokensLink.rel = 'stylesheet';
  tokensLink.href = chrome.runtime.getURL('newtab.css');
  shadowRoot.appendChild(tokensLink);

  const stylesLink = document.createElement('link');
  stylesLink.rel = 'stylesheet';
  stylesLink.href = chrome.runtime.getURL('content.css');
  shadowRoot.appendChild(stylesLink);

  // Custom inline styles for shadow DOM host layout
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :host {
      all: initial;
    }
  `;
  shadowRoot.appendChild(styleEl);

  const mountPoint = document.createElement('div');
  mountPoint.style.height = '100%';
  shadowRoot.appendChild(mountPoint);

  document.body.appendChild(container);

  const reactRoot = createRoot(mountPoint);
  reactRoot.render(
    <React.StrictMode>
      <SidePanel container={container} />
    </React.StrictMode>
  );
}

// Wait for document to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

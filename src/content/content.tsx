import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import SidePanel from './SidePanel/SidePanel';

// ─── Content Script ──────────────────────────────────────────────────────────
// Surface B: Render minimal hover trigger strip, lazy-load React panel on hover.

const TRIGGER_WIDTH = 5; // px
const GRACE_PERIOD = 500; // ms

let container: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let reactRoot: Root | null = null;
let hoverStrip: HTMLDivElement | null = null;
let leaveTimeout: number | null = null;
let isMounted = false;

function init() {
  // Avoid running on New Tab override page
  if (window.location.protocol === 'chrome-extension:' || window.location.href.startsWith('chrome://')) {
    return;
  }

  // Create minimal 5px trigger strip on left edge
  hoverStrip = document.createElement('div');
  hoverStrip.id = 'ex1-hover-trigger-strip';
  Object.assign(hoverStrip.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${TRIGGER_WIDTH}px`,
    height: '100vh',
    zIndex: '2147483646',
    background: 'transparent',
    cursor: 'w-resize',
  });

  hoverStrip.addEventListener('mouseenter', handleMouseEnter);
  document.body.appendChild(hoverStrip);
}

function handleMouseEnter() {
  if (leaveTimeout) {
    clearTimeout(leaveTimeout);
    leaveTimeout = null;
  }
  mountPanel();
}

function handleMouseLeave() {
  leaveTimeout = window.setTimeout(() => {
    unmountPanel();
  }, GRACE_PERIOD);
}

function mountPanel() {
  if (isMounted) return;

  // Create isolated container
  container = document.createElement('div');
  container.id = 'ex1-hud-sidepanel-root';
  Object.assign(container.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '280px',
    height: '100vh',
    zIndex: '2147483647',
    pointerEvents: 'auto',
  });

  shadowRoot = container.attachShadow({ mode: 'open' });

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
  shadowRoot.appendChild(mountPoint);

  document.body.appendChild(container);

  reactRoot = createRoot(mountPoint);
  reactRoot.render(
    <React.StrictMode>
      <div
        onMouseEnter={() => {
          if (leaveTimeout) {
            clearTimeout(leaveTimeout);
            leaveTimeout = null;
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        <SidePanel onClose={unmountPanel} />
      </div>
    </React.StrictMode>
  );

  isMounted = true;
}

function unmountPanel() {
  if (!isMounted) return;

  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
  shadowRoot = null;
  isMounted = false;
}

// Wait for document to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

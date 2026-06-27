/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  eX1 Security Extension Panel
 *  Copyright (c) Aevoarx. All rights reserved.
 *
 *  Brand: Aevoarx
 *  Product: eX1 Suite
 *  Website: https://aevoarx.com
 *
 *  This software contains proprietary designs and cyber intelligence engines
 *  developed by Aevoarx. Unauthorized copying, modification, or distribution
 *  of this file, via any medium, is strictly prohibited.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from './SidePanel/SidePanel';

// ─── Content Script ──────────────────────────────────────────────────────────
// Injected into every http/https page.
// Key design principles:
//  1. The container is pointer-events:none when CLOSED — so the page receives
//     all clicks normally. Only when the panel opens does it become interactive.
//  2. Mouse-edge detection uses document-level capture listeners (not the
//     container itself) so they always fire regardless of page content.
//  3. Init retries every 100 ms until document.body exists, so SPAs and pages
//     with late-loading DOMs are reliably covered.

const ROOT_ID = 'ex1-hud-sidepanel-root';

function isSystemPage() {
  try {
    const href = window.location.href;
    return (
      href.startsWith('chrome://') ||
      href.startsWith('chrome-extension://') ||
      href.startsWith('about:') ||
      href.startsWith('devtools:') ||
      href.startsWith('edge://')
    );
  } catch {
    return true;
  }
}

function init() {
  if (isSystemPage()) return;

  // Guard against double-injection (e.g. hot reload, back-forward cache restore)
  if (document.getElementById(ROOT_ID)) return;

  // We NEED document.body to exist so we can appendChild.
  // Retry if it isn't ready yet (document_end should usually have it, but SPAs
  // sometimes wipe and recreate body during their bootstrap phase).
  const parent = document.body || document.documentElement;
  if (!parent) {
    setTimeout(init, 100);
    return;
  }

  // ── Create host container ────────────────────────────────────────────────
  const container = document.createElement('div');
  container.id = ROOT_ID;

  // CRITICAL: pointer-events NONE when closed.
  // The React component switches this to 'auto' when the panel opens.
  // This is the fix for "can't click things near the right edge of the page".
  applyClosedStyles(container);

  // ── Inject into DOM ──────────────────────────────────────────────────────
  const inject = () => {
    const p = document.body || document.documentElement;
    if (!p) return;
    // If we were somehow reparented to <html> but body now exists, move to body
    if (p === document.body && container.parentElement === document.documentElement) {
      try { document.documentElement.removeChild(container); } catch { /* ignore */ }
    }
    if (!p.contains(container)) {
      p.appendChild(container);
    }
  };

  inject();

  // ── Shadow DOM ──────────────────────────────────────────────────────────
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Design tokens (from newtab build) + component styles
  const tokensLink = document.createElement('link');
  tokensLink.rel = 'stylesheet';
  tokensLink.href = chrome.runtime.getURL('newtab.css');
  shadowRoot.appendChild(tokensLink);

  const stylesLink = document.createElement('link');
  stylesLink.rel = 'stylesheet';
  stylesLink.href = chrome.runtime.getURL('content.css');
  shadowRoot.appendChild(stylesLink);

  // Reset host element so page styles don't leak in
  const styleEl = document.createElement('style');
  styleEl.textContent = ':host { all: initial; }';
  shadowRoot.appendChild(styleEl);

  const mountPoint = document.createElement('div');
  mountPoint.style.height = '100%';
  shadowRoot.appendChild(mountPoint);

  // ── Mount React ──────────────────────────────────────────────────────────
  const reactRoot = createRoot(mountPoint);
  reactRoot.render(
    <React.StrictMode>
      <SidePanel container={container} />
    </React.StrictMode>
  );

  // ── Self-healing: restore if an SPA destroys our container ───────────────
  const domObserver = new MutationObserver(() => inject());
  domObserver.observe(document.documentElement, { childList: true, subtree: false });

  // Also watch body directly (handles React/Vue root replacements)
  const bodyObserver = new MutationObserver(() => inject());
  if (document.body) {
    bodyObserver.observe(document.body, { childList: true, subtree: false });
  }

  // ── Page metadata tracking ───────────────────────────────────────────────
  startTracker();
}

// ── Container style helpers (called by SidePanel via window events) ──────────
export function applyClosedStyles(el: HTMLElement) {
  el.style.setProperty('position',       'fixed',        'important');
  el.style.setProperty('top',            '0',            'important');
  el.style.setProperty('bottom',         '0',            'important');
  el.style.setProperty('right',          '0',            'important');
  el.style.setProperty('left',           'auto',         'important');
  el.style.setProperty('width',          '0px',          'important'); // zero-width when closed
  el.style.setProperty('z-index',        '2147483647',   'important');
  el.style.setProperty('pointer-events', 'none',         'important'); // CRITICAL: don't block page
  el.style.setProperty('background',     'transparent',  'important');
  el.style.setProperty('overflow',       'visible',      'important');
}

export function applyOpenStyles(el: HTMLElement) {
  el.style.setProperty('position',       'fixed',        'important');
  el.style.setProperty('top',            '0',            'important');
  el.style.setProperty('bottom',         '0',            'important');
  el.style.setProperty('right',          '0',            'important');
  el.style.setProperty('left',           'auto',         'important');
  el.style.setProperty('width',          '300px',        'important');
  el.style.setProperty('z-index',        '2147483647',   'important');
  el.style.setProperty('pointer-events', 'auto',         'important');
  el.style.setProperty('background',     'transparent',  'important');
  el.style.setProperty('overflow',       'visible',      'important');
}

// ─── API Usage and Metadata Reporting ────────────────────────────────────────

let cameraAccessCount = 0;
let micAccessCount = 0;
let fetchCount = 0;

function startTracker() {
  if (!window.location.protocol.startsWith('http')) return;

  window.addEventListener('ex1:api_access', (e: any) => {
    const detail = e.detail;
    if (detail) {
      cameraAccessCount = detail.cameraCount;
      micAccessCount    = detail.micCount;
      fetchCount        = detail.fetchCount;
      sendPageMeta();
    }
  });

  sendPageMeta();

  // Re-send when page title changes (covers SPAs that update it asynchronously)
  const titleEl = document.querySelector('title');
  if (titleEl) {
    const obs = new MutationObserver(() => sendPageMeta());
    obs.observe(titleEl, { subtree: true, childList: true, characterData: true });
  }
}

async function getPagePermissions(): Promise<Record<string, string>> {
  const perms = ['camera', 'microphone', 'geolocation', 'notifications'];
  const result: Record<string, string> = {
    camera: 'unknown', microphone: 'unknown',
    geolocation: 'unknown', notifications: 'unknown',
    clipboard: 'unknown', popups: 'unknown',
  };

  for (const name of perms) {
    try {
      const status = await navigator.permissions.query({ name: name as any });
      result[name] = status.state;
      status.onchange = () => sendPageMeta();
    } catch { /* ignore */ }
  }
  return result;
}

async function sendPageMeta() {
  const title   = document.title || '';
  const descEl  = document.querySelector('meta[name="description"]') ||
                  document.querySelector('meta[property="og:description"]');
  const description = descEl?.getAttribute('content') || '';
  const ogTypeEl    = document.querySelector('meta[property="og:type"]');
  const ogType      = ogTypeEl?.getAttribute('content') || '';
  const perms       = await getPagePermissions();

  chrome.runtime.sendMessage({
    type: 'PAGE_META',
    origin: window.location.origin,
    title, description, ogType,
    cameraAccessCount, micAccessCount, fetchCount,
    permissions: perms,
  }).catch(() => { /* service worker may not be ready yet */ });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Run immediately — document_end means HTML is parsed. If body isn't there yet
// (extremely rare), the init() function itself retries.
init();

// ─── Message listeners ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'QUERY_PAGE_PERMISSIONS') {
    const names = ['camera', 'microphone', 'geolocation', 'notifications', 'clipboard-read'];
    Promise.allSettled(
      names.map(name =>
        navigator.permissions.query({ name: name as any }).then(s => ({ name, state: s.state }))
      )
    ).then(results => {
      const permissions: Record<string, string> = {};
      results.forEach((r, i) => {
        permissions[names[i]] = r.status === 'fulfilled' ? r.value.state : 'unavailable';
      });
      sendResponse({ permissions });
    });
    return true;
  }

  if (msg.type === 'QUERY_ACTIVE_MEDIA') {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        sendResponse({
          cameraActive: devices.some(d => d.kind === 'videoinput' && d.label !== ''),
          micActive:    devices.some(d => d.kind === 'audioinput' && d.label !== ''),
        });
      })
      .catch(() => sendResponse({ cameraActive: false, micActive: false }));
    return true;
  }
});

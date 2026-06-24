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

  // Prevent multiple injections
  if (document.getElementById('ex1-hud-sidepanel-root')) return;

  const container = document.createElement('div');
  container.id = 'ex1-hud-sidepanel-root';
  container.style.setProperty('position', 'fixed', 'important');
  container.style.setProperty('right', '0', 'important');
  container.style.setProperty('top', '0', 'important');
  container.style.setProperty('bottom', '0', 'important');
  container.style.setProperty('width', '20px', 'important');
  container.style.setProperty('z-index', '2147483647', 'important');
  container.style.setProperty('pointer-events', 'auto', 'important');
  container.style.setProperty('background', 'transparent', 'important');
  container.style.setProperty('display', 'block', 'important');

  // Self-healing injection function
  const inject = () => {
    const parent = document.body || document.documentElement;
    if (parent) {
      if (parent === document.body && container.parentElement === document.documentElement) {
        try {
          document.documentElement.removeChild(container);
        } catch (e) {
          // ignore
        }
      }
      if (!parent.contains(container)) {
        parent.appendChild(container);
      }
    }
  };

  inject();

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

  const reactRoot = createRoot(mountPoint);
  reactRoot.render(
    <React.StrictMode>
      <SidePanel container={container} />
    </React.StrictMode>
  );

  // Setup MutationObserver to restore container if deleted by SPA scripts
  const observer = new MutationObserver(() => {
    inject();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Start tracking page API usage & permissions
  startTracker();
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
      micAccessCount = detail.micCount;
      fetchCount = detail.fetchCount;
      sendPageMeta();
    }
  });

  sendPageMeta();

  const titleEl = document.querySelector('title');
  if (titleEl) {
    const observer = new MutationObserver(() => {
      sendPageMeta();
    });
    observer.observe(titleEl, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }
}

async function getPagePermissions(): Promise<Record<string, string>> {
  const perms = ['camera', 'microphone', 'geolocation', 'notifications'];
  const result: Record<string, string> = {
    camera: 'unknown',
    microphone: 'unknown',
    geolocation: 'unknown',
    notifications: 'unknown',
    clipboard: 'unknown',
    popups: 'unknown'
  };

  for (const name of perms) {
    try {
      const status = await navigator.permissions.query({ name: name as any });
      result[name] = status.state;
      status.onchange = () => {
        sendPageMeta();
      };
    } catch (e) {
      // ignore
    }
  }
  return result;
}

async function sendPageMeta() {
  const title = document.title || '';
  const descEl = document.querySelector('meta[name="description"]') || 
                 document.querySelector('meta[property="og:description"]');
  const description = descEl ? descEl.getAttribute('content') || '' : '';
  const ogTypeEl = document.querySelector('meta[property="og:type"]');
  const ogType = ogTypeEl ? ogTypeEl.getAttribute('content') || '' : '';
  
  const perms = await getPagePermissions();

  chrome.runtime.sendMessage({
    type: 'PAGE_META',
    origin: window.location.origin,
    title,
    description,
    ogType,
    cameraAccessCount,
    micAccessCount,
    fetchCount,
    permissions: perms
  });
}

// Wait for document to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'QUERY_PAGE_PERMISSIONS') {
    const permissionNames = [
      'camera',
      'microphone',
      'geolocation',
      'notifications',
      'clipboard-read',
    ];

    Promise.allSettled(
      permissionNames.map(name =>
        navigator.permissions.query({ name: name as any }).then(status => ({
          name,
          state: status.state, // 'granted' | 'denied' | 'prompt'
        }))
      )
    ).then(results => {
      const permissions: Record<string, string> = {};
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          permissions[permissionNames[i]] = result.value.state;
        } else {
          permissions[permissionNames[i]] = 'unavailable';
        }
      });
      sendResponse({ permissions });
    });

    return true; // keep message channel open for async response
  }

  if (msg.type === 'QUERY_ACTIVE_MEDIA') {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const cameraActive = devices.some(d => d.kind === 'videoinput' && d.label !== '');
      const micActive = devices.some(d => d.kind === 'audioinput' && d.label !== '');
      sendResponse({ cameraActive, micActive });
    }).catch(() => {
      sendResponse({ cameraActive: false, micActive: false });
    });
    return true;
  }
});

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
    right: '0',
    top: '0',
    height: '100vh',
    width: '15px', // initial trigger strip width
    zIndex: '2147483647',
    pointerEvents: 'auto',
    background: 'rgba(0, 0, 0, 0.01)', // ensure compositor hit-testing works on all platforms
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

  // Start tracking page API usage & permissions
  startTracker();
}

// ─── API Usage and Metadata Reporting ────────────────────────────────────────

let cameraAccessCount = 0;
let micAccessCount = 0;
let fetchCount = 0;

function injectMainWorldTracker() {
  const code = `
    (() => {
      let cameraCount = 0;
      let micCount = 0;
      let fetchCount = 0;

      const reportAccess = () => {
        window.dispatchEvent(new CustomEvent('ex1:api_access', {
          detail: { cameraCount, micCount, fetchCount }
        }));
      };

      // Intercept getUserMedia
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = async function(constraints) {
          if (constraints) {
            if (constraints.video) cameraCount++;
            if (constraints.audio) micCount++;
            reportAccess();
          }
          return origGetUserMedia(constraints);
        };
      }

      // Intercept fetch
      const origFetch = window.fetch;
      window.fetch = async function(...args) {
        fetchCount++;
        reportAccess();
        return origFetch.apply(this, args);
      };

      // Intercept XHR
      const origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(...args) {
        fetchCount++;
        reportAccess();
        return origOpen.apply(this, args);
      };
    })();
  `;
  try {
    const script = document.createElement('script');
    script.textContent = code;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    console.error('[eX1] Main world tracker injection failed:', e);
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

function startTracker() {
  if (!window.location.protocol.startsWith('http')) return;

  injectMainWorldTracker();

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

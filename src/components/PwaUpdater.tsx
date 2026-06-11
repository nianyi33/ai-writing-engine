/// <reference types="vite/client" />

import { useEffect } from 'react';

/**
 * PWA Update Prompter — detects when a new version of the app is available
 * and shows a toast prompting the user to refresh.
 *
 * Uses the `registerType: 'autoUpdate'` SW registration from vite-plugin-pwa.
 * The workbox-window library emits events when an update is waiting.
 */

// Declare the virtual module injected by vite-plugin-pwa
declare global {
  interface Window {
    __SW_READY__?: boolean;
  }
}

export function PwaUpdater() {
  useEffect(() => {
    // Only in browser, only in production build (not dev)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return;

    // Listen for service worker updates via the workbox-window
    // that vite-plugin-pwa auto-injects
    const handleUpdateFound = () => {
      showUpdateToast();
    };

    // Check if workbox registered an update waiting
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          const stateChangeHandler = () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New SW installed but not yet active → update available
              handleUpdateFound();
            }
            newWorker.removeEventListener('statechange', stateChangeHandler);
          };

          newWorker.addEventListener('statechange', stateChangeHandler);
        });

        // Check if there's already a waiting worker
        if (registration.waiting) {
          handleUpdateFound();
        }
      });
    }
  }, []);

  return null;
}

// ── Simple update toast ──
let toastShown = false;

function showUpdateToast() {
  if (toastShown) return;
  toastShown = true;

  // Create a styled toast element
  const toast = document.createElement('div');
  toast.className = 'pwa-update-toast';
  toast.innerHTML = `
    <span>🔄 新版本可用</span>
    <button id="pwa-reload-btn">立即更新</button>
  `;

  // Inject styles once
  if (!document.getElementById('pwa-toast-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-toast-style';
    style.textContent = `
      .pwa-update-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        background: #3b82f6;
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 24px rgba(233, 69, 96, 0.4);
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        animation: pwaSlideIn 0.3s ease-out;
      }
      @keyframes pwaSlideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .pwa-update-toast button {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.4);
        color: #fff;
        padding: 6px 14px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        transition: background 0.15s;
      }
      .pwa-update-toast button:hover {
        background: rgba(255,255,255,0.35);
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Reload on click
  document.getElementById('pwa-reload-btn')?.addEventListener('click', () => {
    // Tell the waiting SW to skip waiting, then reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
    window.location.reload();
  });
}

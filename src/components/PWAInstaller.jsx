"use client";

import { useEffect, useState } from "react";

// Exposed via window so PWAInstallGuide can call triggerInstall() directly
let _deferredPrompt = null;

export function triggerInstall() {
  if (_deferredPrompt) {
    _deferredPrompt.prompt();
    return _deferredPrompt.userChoice.then((result) => {
      _deferredPrompt = null;
      return result.outcome; // 'accepted' | 'dismissed'
    });
  }
  return Promise.resolve(null);
}

export function canNativeInstall() {
  return !!_deferredPrompt;
}

const PWAInstaller = ({ onPromptReady, onInstalled }) => {
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    // ── 1. Register Service Worker ────────────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered:", reg.scope);
          setSwReady(true);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // ── 2. beforeinstallprompt (Chrome, Edge, Samsung Internet, Opera) ────
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      _deferredPrompt = e;
      console.log("[PWA] beforeinstallprompt fired — native install available");
      if (onPromptReady) onPromptReady(e);
    };

    // ── 3. appinstalled ───────────────────────────────────────────────────
    const handleAppInstalled = () => {
      _deferredPrompt = null;
      console.log("[PWA] App installed successfully");
      if (onInstalled) onInstalled();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [onPromptReady, onInstalled]);

  // This component renders nothing visible — UI is handled by PWAInstallGuide
  return null;
};

export default PWAInstaller;
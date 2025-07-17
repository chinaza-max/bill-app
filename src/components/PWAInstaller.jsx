"use client";

import { useEffect, useState } from "react";

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    }

    // Handle app installation prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const checkServiceWorker = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log("Service Workers:", registrations);
        alert(`Found ${registrations.length} service worker(s)`);
      });
    }
  };

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "#007bff",
            color: "white",
            padding: "10px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <span>Install this app for the best experience!</span>
          <button
            onClick={installApp}
            style={{
              marginLeft: "10px",
              padding: "5px 10px",
              backgroundColor: "white",
              color: "#007bff",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            style={{
              marginLeft: "5px",
              padding: "5px 10px",
              backgroundColor: "transparent",
              color: "white",
              border: "1px solid white",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* PWA Controls */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h3>PWA Features</h3>
        <button
          onClick={installApp}
          disabled={!deferredPrompt}
          style={{
            padding: "12px 24px",
            backgroundColor: deferredPrompt ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: deferredPrompt ? "pointer" : "not-allowed",
            fontSize: "16px",
            marginRight: "10px",
          }}
        >
          📱 Install App
        </button>
        {/*
        <button
          onClick={checkServiceWorker}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          🔧 Check Service Worker
        </button>
       */}
      </div>
    </>
  );
};

export default PWAInstaller;

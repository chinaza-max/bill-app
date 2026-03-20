"use client";
import { useEffect, useCallback } from "react";

export function usePushNotification(accessToken, userId) {
  const registerPushSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!userId || !accessToken) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) return;
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "savePushSubscription",
          accessToken,
          subscription,
        }),
      });
    } catch (err) {
      console.error("Push subscription error:", err);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    registerPushSubscription();
  }, [registerPushSubscription]);

  return { registerPushSubscription };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
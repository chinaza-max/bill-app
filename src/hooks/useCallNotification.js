"use client";
import { useEffect, useState, useCallback } from "react";

export function useCallNotification(socket, userId, accessToken) {
  const [incomingCall, setIncomingCall] = useState(null);

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
        body: JSON.stringify({ apiType: "savePushSubscription", accessToken, subscription }),
      });
    } catch (err) {
      console.error("Push subscription error:", err);
    }
  }, [userId, accessToken]);

  useEffect(() => {
    if (!socket || !userId) return;
    const handleIncomingCall = (data) => {

      console.log("data")
            console.log(data)
      console.log("data")

      setIncomingCall(data);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`📞 Incoming call from ${data.callerName}`, {
          body: `Order #${data.orderId}`,
          icon: data.callerAvatar || "/icon-192.png",
          tag: "incoming-call",
          requireInteraction: true,
        });
      }
    };
    const handleCallEnded = (data) => {
      setIncomingCall((prev) => prev?.orderId === data.orderId ? null : prev);
    };
    socket.on("incomingCall", handleIncomingCall);
    socket.on("callEnded", handleCallEnded);
    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callEnded", handleCallEnded);
    };
  }, [socket, userId]);

  useEffect(() => { registerPushSubscription(); }, [registerPushSubscription]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleSWMessage = (event) => {
      if (event.data?.type === "INCOMING_CALL") setIncomingCall(event.data.payload);
    };
    navigator.serviceWorker.addEventListener("message", handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleSWMessage);
  }, []);

  const clearIncomingCall = useCallback(() => setIncomingCall(null), []);
  return { incomingCall, clearIncomingCall };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
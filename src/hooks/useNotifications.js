"use client";

import { useState, useEffect } from "react";
import {
  requestNotificationPermission,
  onMessageListener,
} from "../lib/firebase";

export const useNotifications = () => {
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Request permission and get token
    const initNotifications = async () => {
      try {
        const fcmToken = await requestNotificationPermission();
        setToken(fcmToken);
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    initNotifications();

    // Listen for foreground messages
    const unsubscribe = onMessageListener().then((payload) => {
      setNotification(payload);
      // Play sound and vibrate for foreground notifications
      playNotificationSound();
      vibrateDevice();

      // Show browser notification if app is in foreground
      if (Notification.permission === "granted") {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          // icon: payload.notification.icon || "../images/icons/icon-192x192.png",
          // image: payload.notification.image,
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
        });
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const playNotificationSound = () => {
    try {
      console.log("Playing notification sound");
      const audio = new Audio(
        "https://res.cloudinary.com/dvznn9s4g/video/upload/v1749487536/mixkit-positive-notification-951_zcnfqp.wav"
      );
      audio.volume = 1.0;
      audio.play().catch(console.error);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const vibrateDevice = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }
  };

  const sendTestNotification = () => {
    /* if (Notification.permission === "granted") {
      const notification = new Notification("Test Notification", {
        body: "This is a test notification with sound and vibration",
        icon: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
      });

      playNotificationSound();
      vibrateDevice();

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }*/
  };

  return {
    token,
    notification,
    sendTestNotification,
    playNotificationSound,
    vibrateDevice,
  };
};

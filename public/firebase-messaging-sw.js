importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyBsWtMTVmZwLAG8P6Gp5_SqV6r24WYPuc0",
  authDomain:        "fintread-70e2e.firebaseapp.com",
  projectId:         "fintread-70e2e",
  storageBucket:     "fintread-70e2e.firebasestorage.app",
  messagingSenderId: "1709448650",
  appId:             "1:1709448650:web:de5e07a842e36bc9394333",
  measurementId:     "G-2FNTWKFS0X",
});

const messaging = firebase.messaging();

const NEW_ORDER_SOUND_URL = "https://res.cloudinary.com/dvznn9s4g/video/upload/v1781476716/2927f28c_1781476435_ee632def_1_h5ak2v.mp3";

// Vibration patterns — [vibrate, pause, vibrate, pause, ...]
const VIBRATE = {
  // Long aggressive bursts — for incoming calls
  CALL: [
    1000, 200, 1000, 200, 1000, 200,
    1000, 200, 1000, 200, 1000, 200,
    1000, 200, 1000, 200, 1000,
  ],
  // Strong repeating pulses — for new orders
  NEW_ORDER: [
    800, 150, 800, 150, 800, 150,
    800, 150, 800, 150, 800, 150,
    800, 150, 800,
  ],
  // Medium alert — for generic notifications
  DEFAULT: [
    500, 100, 500, 100, 500, 100,
    500, 100, 500, 100, 500,
  ],
};

async function playSoundOnClient(soundUrl) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => {
    client.postMessage({ type: "PLAY_SOUND", soundUrl });
  });
}

// ── Handle background push messages ─────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log("📬 Background message:", payload);

  const data = payload.data || {};

  // ── Incoming Call ────────────────────────────────────────────────────────
  if (payload.notification?.title === "INCOMING_CALL") {
    self.registration.showNotification(payload.notification?.title || "Incoming Call", {
      body:               payload.notification?.body || "Someone is calling you",
      icon:               "/images/icons/icon-72x72.png",
      badge:              "/images/icons/icon-72x72.png",
      tag:                "incoming-call",
      requireInteraction: true,
      vibrate:            VIBRATE.CALL,
      data: {
        type:         "INCOMING_CALL",
        orderId:      data.orderId      ?? 1,
        callerId:     data.callerId     ?? 11,
        callerName:   data.callerName   ?? "John Doe",
        callerAvatar: data.callerAvatar ?? "/icons/default-avatar.png",
        url:          `/orders/${data.orderId}`,
      },
      actions: [
        { action: "accept",  title: "✅ Accept",  icon: "/icons/open-icon.png"  },
        { action: "decline", title: "❌ Decline", icon: "/icons/close-icon.png" },
      ],
    });
    return;
  }

  // ── New Order ────────────────────────────────────────────────────────────
  if (data.event === "NEW_ORDER" || data.type === "NEW_ORDER") {
    playSoundOnClient(NEW_ORDER_SOUND_URL);

    self.registration.showNotification(payload.notification?.title || "New Order 🚀", {
      body:               payload.notification?.body || "You have a new order",
      icon:               payload.notification?.image || "/icons/icon-192x192.png",
      badge:              "/icons/badge-72x72.png",
      tag:                `new-order-${data.orderId}`,
      requireInteraction: true,
      vibrate:            VIBRATE.NEW_ORDER,
      data: {
        type:    "NEW_ORDER",
        orderId: data.orderId,
        url:     `/orders/${data.orderId}`,
        sound:   NEW_ORDER_SOUND_URL,
      },
      actions: [
        { action: "open",  title: "View Order", icon: "/images/icons/icon-72x72.png"  },
        { action: "close", title: "Dismiss",    icon: "/images/icons/icon-72x72.png" },
      ],
    });
    return;
  }

  // ── Generic / default ────────────────────────────────────────────────────
  self.registration.showNotification(payload.notification?.title || "New Notification", {
    body:               payload.notification?.body || "You have a new message",
    icon:               "/images/icons/icon-72x72.png",
    badge:              "/images/icons/icon-72x72.png",
    tag:                "notification-tag",
    requireInteraction: true,
    vibrate:            VIBRATE.DEFAULT,
    data: {
      url:   payload.data?.url || "/",
      sound: NEW_ORDER_SOUND_URL,
    },
    actions: [
      { action: "open",  title: "Open App", icon: "/images/icons/icon-72x72.png"  },
      { action: "close", title: "Close",    icon: "/images/icons/icon-72x72.png" },
    ],
  });
});

// ── Handle notification click ────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data   = event.notification.data || {};
  const action = event.action;

  // ── Incoming Call actions ────────────────────────────────────────────────
  if (data.type === "INCOMING_CALL") {
    if (action === "decline") {
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "DECLINE_CALL", payload: data });
        });
      });
      return;
    }

    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          for (const client of clients) {
            if ("focus" in client) {
              client.focus();
              client.postMessage({ type: "INCOMING_CALL", payload: data });
              return;
            }
          }
          return self.clients.openWindow(data.url || "/");
        })
    );
    return;
  }

  // ── Generic actions ──────────────────────────────────────────────────────
  if (action === "close") return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.focus();
            return;
          }
        }
        return self.clients.openWindow(data.url || "/");
      })
  );
});
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

// ── Handle background push messages ─────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log("📬 Background message:", payload);

  const data = payload.data || {};


  console.log("🔍 Payload data:", data);
    console.log("🔍 Payload payload.notification?.title:", payload.notification?.title);

  // ── Incoming Call notification ───────────────────────────────────────────
  if (payload.notification?.title === "INCOMING_CALL") {
    console.log("📞 kkkk kkkk  kkkkkk");
    self.registration.showNotification(payload.notification?.title || "Incoming Call", {
      body:               payload.notification?.body || "Someone is calling you",
      icon:               "/icons/icon-192x192.png",
      badge:              "/icons/badge-72x72.png",
      tag:                "incoming-call",
      requireInteraction: true,
      vibrate:            [500, 300, 500, 300, 500],
      data: {
        type:         "INCOMING_CALL",
        orderId:      data.orderId??1,
        callerId:     data.callerId??11,
        callerName:   data.callerName??"John Doe",
        callerAvatar: data.callerAvatar??"/icons/default-avatar.png",
        url:          `/orders/${data.orderId}`,
      },
      actions: [
        { action: "accept",  title: "✅ Accept",  icon: "/icons/open-icon.png"  },
        { action: "decline", title: "❌ Decline", icon: "/icons/close-icon.png" },
      ],
    });
    return;
  }

  // ── Generic / default notification ──────────────────────────────────────
  const notificationTitle = payload.notification?.title || "New Notification";

  self.registration.showNotification(notificationTitle, {
    body:               payload.notification?.body || "You have a new message",
    icon:               "/icons/icon-192x192.png",
    badge:              "/icons/badge-72x72.png",
    tag:                "notification-tag",
    requireInteraction: true,
    vibrate:            [200, 100, 200, 100, 200, 100, 200],
    data: {
      url:   payload.data?.url || "/",
      sound: "https://res.cloudinary.com/dvznn9s4g/video/upload/v1749487536/mixkit-positive-notification-951_zcnfqp.wav",
    },
    actions: [
      { action: "open",  title: "Open App", icon: "/icons/open-icon.png"  },
      { action: "close", title: "Close",    icon: "/icons/close-icon.png" },
    ],
  });
});

// ── Handle notification click ────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
 console.log("🔔 Notification click:", event);
  const data   = event.notification.data || {};
  const action = event.action;

  // ── Incoming Call actions ────────────────────────────────────────────────
  if (data.type === "INCOMING_CALL") {
    if (action === "decline") {
      // Broadcast decline to all open app windows
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "DECLINE_CALL", payload: data });
        });
      });
      return;
    }

    // "accept" action or tapping the notification body → open / focus app
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
          // App not open — launch it
          return self.clients.openWindow(data.url || "/");
        })
    );
    return;
  }

  // ── Generic notification actions ─────────────────────────────────────────
  if (action === "close") return;

  // "open" action or tapping notification body
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
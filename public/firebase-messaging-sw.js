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

// Sound files for push notifications
const SOUNDS = {
  VOICE_ALERT: "https://res.cloudinary.com/dvznn9s4g/video/upload/v1781476716/2927f28c_1781476435_ee632def_1_h5ak2v.mp3",
  VOICE_LOCAL: "/sound/voice_request_alert.mp3",
  // Call ringtone: local copy of soundreality-phone-ringtone-clean-273554
  // Original: https://res.cloudinary.com/dvznn9s4g/video/upload/v1785074803/soundreality-phone-ringtone-clean-273554_zgyg6f.mp3
  CALL:        "/sound/call_ring.mp3",
  POSITIVE:    "/sound/mixkit-positive-notification-951.wav",
  NEGATIVE:    "/sound/message1.wav",
  HINT:        "/sound/mixkit-interface-hint-notification-911.wav",
};

// Vibration patterns — [vibrate, pause, vibrate, pause, ...]
const VIBRATE = {
  // Long aggressive bursts — for incoming calls
  CALL: [
    1000, 200, 1000, 200, 1000, 200,
    1000, 200, 1000, 200, 1000, 200,
    1000, 200, 1000, 200, 1000,
  ],
  // Strong repeating pulses — for new requests / orders
  NEW_ORDER: [
    800, 150, 800, 150, 800, 150,
    800, 150, 800, 150, 800, 150,
    800, 150, 800,
  ],
  // Medium alert — for status updates
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
  console.log("📬 Background message received:", payload);

  const data = payload.data || {};
  const eventType = data.type || data.event || "";
  const title = payload.notification?.title || data.title || "Notification Alert";
  const body = payload.notification?.body || data.body || "Tap to view details in app";

  // ── 1. INCOMING CALL ──────────────────────────────────────────────────────
  if (eventType === "INCOMING_CALL" || title.includes("Incoming call")) {
    playSoundOnClient(SOUNDS.CALL);

    self.registration.showNotification(title, {
      body,
      icon:               "/images/icons/icon-72x72.png",
      badge:              "/images/icons/icon-72x72.png",
      tag:                "incoming-call",
      requireInteraction: true,
      vibrate:            VIBRATE.CALL,
      sound:              SOUNDS.CALL,
      data: {
        type:         "INCOMING_CALL",
        orderId:      data.orderId      ?? 1,
        callerId:     data.callerId     ?? 11,
        callerName:   data.callerName   ?? "Customer",
        callerAvatar: data.callerAvatar ?? "/icons/default-avatar.png",
        url:          "/",
      },
      actions: [
        { action: "accept",  title: "✅ Answer",  icon: "/images/icons/icon-72x72.png" },
        { action: "decline", title: "❌ Decline", icon: "/images/icons/icon-72x72.png" },
      ],
    });
    return;
  }

  // ── 2. NEW WITHDRAWAL REQUESTS (NEW_ORDER & SW_NEW_REQUEST) ───────────────
  if (eventType === "NEW_ORDER" || eventType === "SW_NEW_REQUEST") {
    // Spoken Voice alert for incoming request
    const voiceSoundUrl = SOUNDS.VOICE_ALERT;
    playSoundOnClient(voiceSoundUrl);

    const isSW = eventType === "SW_NEW_REQUEST";
    const targetUrl = isSW ? "/specialWithdrawal" : `/orders/${data.orderId || ""}`;

    self.registration.showNotification(title || (isSW ? "New Special Withdrawal Request 💵" : "New Withdrawal Request Alert 🚀"), {
      body,
      icon:               payload.notification?.image || "/icons/icon-192x192.png",
      badge:              "/icons/badge-72x72.png",
      tag:                `new-request-${data.orderId || data.requestId || Date.now()}`,
      requireInteraction: true,
      vibrate:            VIBRATE.NEW_ORDER,
      sound:              voiceSoundUrl,
      data: {
        type:    eventType,
        orderId: data.orderId || data.requestId,
        url:     targetUrl,
        sound:   voiceSoundUrl,
      },
      actions: [
        { action: "open",  title: "View Request", icon: "/images/icons/icon-72x72.png" },
        { action: "close", title: "Dismiss",      icon: "/images/icons/icon-72x72.png" },
      ],
    });
    return;
  }

  // ── 3. REJECTIONS & CANCELLATIONS ──────────────────────────────────────────
  if (
    eventType.includes("REJECTED") ||
    eventType.includes("CANCELLED") ||
    eventType.includes("SUSPENDED") ||
    eventType.includes("DISABLED")
  ) {
    const soundUrl = SOUNDS.NEGATIVE;
    playSoundOnClient(soundUrl);

    const targetUrl = eventType.startsWith("SW") ? "/specialWithdrawal" : "/orders";

    self.registration.showNotification(title, {
      body,
      icon:               "/images/icons/icon-72x72.png",
      badge:              "/images/icons/icon-72x72.png",
      tag:                `alert-${data.orderId || data.requestId || Date.now()}`,
      requireInteraction: true,
      vibrate:            VIBRATE.DEFAULT,
      sound:              soundUrl,
      data: {
        type:  eventType,
        url:   targetUrl,
        sound: soundUrl,
      },
      actions: [
        { action: "open",  title: "Open App", icon: "/images/icons/icon-72x72.png" },
        { action: "close", title: "Close",    icon: "/images/icons/icon-72x72.png" },
      ],
    });
    return;
  }

  // ── 4. ACCEPTED / COMPLETED / ACTIVATED STATUS EVENTS ─────────────────────
  if (
    eventType.includes("ACCEPTED") ||
    eventType.includes("COMPLETED") ||
    eventType.includes("ACTIVATED") ||
    eventType.includes("ENABLED")
  ) {
    const soundUrl = SOUNDS.POSITIVE;
    playSoundOnClient(soundUrl);

    const targetUrl = eventType.startsWith("SW") ? "/specialWithdrawal" : "/orders";

    self.registration.showNotification(title, {
      body,
      icon:               "/images/icons/icon-72x72.png",
      badge:              "/images/icons/icon-72x72.png",
      tag:                `status-${data.orderId || data.requestId || Date.now()}`,
      requireInteraction: true,
      vibrate:            VIBRATE.DEFAULT,
      sound:              soundUrl,
      data: {
        type:  eventType,
        url:   targetUrl,
        sound: soundUrl,
      },
      actions: [
        { action: "open",  title: "Open App", icon: "/images/icons/icon-72x72.png" },
        { action: "close", title: "Close",    icon: "/images/icons/icon-72x72.png" },
      ],
    });
    return;
  }

  // ── 5. DEFAULT / GENERIC PUSH NOTIFICATION ─────────────────────────────────
  const defaultSound = SOUNDS.HINT;
  playSoundOnClient(defaultSound);

  const fallbackUrl = data.url || (eventType.startsWith("SW") ? "/specialWithdrawal" : "/");

  self.registration.showNotification(title, {
    body,
    icon:               "/images/icons/icon-72x72.png",
    badge:              "/images/icons/icon-72x72.png",
    tag:                "generic-notification",
    requireInteraction: true,
    vibrate:            VIBRATE.DEFAULT,
    sound:              defaultSound,
    data: {
      type:  eventType,
      url:   fallbackUrl,
      sound: defaultSound,
    },
    actions: [
      { action: "open",  title: "Open App", icon: "/images/icons/icon-72x72.png" },
      { action: "close", title: "Close",    icon: "/images/icons/icon-72x72.png" },
    ],
  });
});

// ── Handle notification click (Tap -> Focus/Navigate/Wake PWA) ─────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data   = event.notification.data || {};
  const action = event.action;

  if (action === "close") return;

  // If user clicked Decline on incoming call
  if (data.type === "INCOMING_CALL" && action === "decline") {
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "DECLINE_CALL", payload: data });
      });
    });
    return;
  }

  const targetUrl = data.url || (
    data.type?.startsWith("SW") ? "/specialWithdrawal" :
    data.type === "INCOMING_CALL" ? "/" :
    data.type?.includes("ORDER") ? "/orders" : "/"
  );

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // If an open PWA window exists, focus it, navigate, and send postMessage
        for (const client of clients) {
          if ("focus" in client) {
            client.focus();
            if (client.navigate) {
              client.navigate(targetUrl);
            }
            client.postMessage({ type: data.type || "NOTIFICATION_CLICKED", payload: data });
            return;
          }
        }
        // If PWA app is inactive/closed, launch it immediately
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
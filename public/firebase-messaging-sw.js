importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyBsWtMTVmZwLAG8P6Gp5_SqV6r24WYPuc0",
  authDomain: "fintread-70e2e.firebaseapp.com",
  projectId: "fintread-70e2e",
  storageBucket: "fintread-70e2e.firebasestorage.app",
  messagingSenderId: "1709448650",
  appId: "1:1709448650:web:de5e07a842e36bc9394333",
  measurementId: "G-2FNTWKFS0X",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background Message:", payload);

  const notificationTitle = payload.notification.title || "New Notification";
  const notificationOptions = {
    body: /*payload.notification.body || */ "You have a new message",
    //icon: payload.notification.icon || "/icons/icon-192x192.png",
    //   image: payload.notification.image,
    // badge: "/icons/badge-72x72.png",
    tag: "notification-tag",
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    sound:
      "https://res.cloudinary.com/dvznn9s4g/video/upload/v1749487536/mixkit-positive-notification-951_zcnfqp.wav",
    data: {
      url: payload.data?.url || "/",
      sound:
        "https://res.cloudinary.com/dvznn9s4g/video/upload/v1749487536/mixkit-positive-notification-951_zcnfqp.wav",
    },
    actions: [
      {
        action: "open",
        title: "Open App",
        icon: "/icons/open-icon.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/close-icon.png",
      },
    ],
  };

  // Play sound when notification is received
  self.registration.showNotification(notificationTitle, notificationOptions);

  // Trigger sound and vibration
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register("background-sound");
    });
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
  }
});

// Play sound in background
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sound") {
    event.waitUntil(playNotificationSound());
  }
});

function playNotificationSound() {
  return new Promise((resolve) => {
    // For browsers that support audio in service worker
    try {
      const audio = new Audio("/sound/notification.mp3");
      audio
        .play()
        .then(() => {
          resolve();
        })
        .catch(() => {
          resolve();
        });
    } catch (error) {
      resolve();
    }
  });
}

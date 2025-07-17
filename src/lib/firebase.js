// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsWtMTVmZwLAG8P6Gp5_SqV6r24WYPuc0",
  authDomain: "fintread-70e2e.firebaseapp.com",
  projectId: "fintread-70e2e",
  storageBucket: "fintread-70e2e.firebasestorage.app",
  messagingSenderId: "1709448650",
  appId: "1:1709448650:web:de5e07a842e36bc9394333",
  measurementId: "G-2FNTWKFS0X",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let messaging;
if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

export { messaging };

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log(process.env.NEXT_PUBLIC_VAPID_KEY);
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY, // Get from Firebase Console
      });
      console.log("FCM Token:", token);
      return token;
    }
  } catch (error) {
    console.error("Error getting notification permission:", error);
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

"use client";

import { useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";

const NotificationManager = () => {
  const { token, notification, sendTestNotification } = useNotifications();

  useEffect(() => {
    if (token) {
      // Send token to your backend to store for sending notifications
      console.log("FCM Token:", token);
      // sendTokenToServer(token);
    }
  }, [token]);

  useEffect(() => {
    if (notification) {
      console.log("Received notification:", notification);
      // Handle the notification in your app
    }
  }, [notification]);

  return (
    <div className="notification-manager">
      <h2>Push Notifications</h2>
      <p>Token: {token ? "Received" : "Not received"}</p>
      <button onClick={sendTestNotification}>Send Test Notification</button>
      {notification && (
        <div className="notification-display">
          <h3>Last Notification:</h3>
          <p>
            <strong>Title:</strong> {notification.notification?.title}
          </p>
          <p>
            <strong>Body:</strong> {notification.notification?.body}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;

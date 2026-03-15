"use client";

import { useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";

const NotificationManager = () => {
  const { token, notification, sendTestNotification } = useNotifications();

  useEffect(() => {
    if (token) {
      // Send token to your backend to store for sending notifications
      // sendTokenToServer(token);
    }
  }, [token]);

  useEffect(() => {
    if (notification) {
      console.log("Received notification: 2", notification);
      // Handle  the notification in your app
    }
  }, [notification]);

  return (
    <div className="notification-manager">
  
    </div>
  );
};

export default NotificationManager;

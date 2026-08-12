"use client";
import { useEffect, useState } from "react";
import { useSocket } from "@/components/call/CallLayout";

/**
 * Custom hook to track real-time online/offline presence of a specific user.
 * Listens for 'userStatusChanged' events emitted by the backend via the global Socket.IO connection.
 *
 * @param {string|number} targetUserId - The ID of the user whose status to monitor.
 * @param {boolean} initialStatus - Initial fallback status (default: false).
 * @returns {boolean} isOnline - Real-time online status of target user.
 */
export function useUserPresence(targetUserId, initialStatus = false) {
  const socket = useSocket();
  const [isOnline, setIsOnline] = useState(initialStatus);

  useEffect(() => {
    setIsOnline(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!socket || !targetUserId) return;

    const handleStatusChange = (data) => {
      if (data && String(data.userId) === String(targetUserId)) {
        setIsOnline(Boolean(data.isOnline));
      }
    };

    socket.on("userStatusChanged", handleStatusChange);
    socket.on("userOnlineStatus", handleStatusChange);

    return () => {
      socket.off("userStatusChanged", handleStatusChange);
      socket.off("userOnlineStatus", handleStatusChange);
    };
  }, [socket, targetUserId]);

  return isOnline;
}

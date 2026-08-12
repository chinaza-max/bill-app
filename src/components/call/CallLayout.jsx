"use client";
import { useEffect, useState, createContext, useContext } from "react";
import { useSelector } from "react-redux";
import { CallProvider } from "@/components/call/CallProvider";
import IncomingCallModal from "@/components/call/IncomingCallModal";

export const SocketContext = createContext(null);
export function useSocket() {
  return useContext(SocketContext);
}

export default function CallLayout({ children }) {
  const [socket, setSocket] = useState(null);

  const userId = useSelector(
    (state) =>
      state.user.user?.user?.id ??
      state.user.user?.id ??
      state.user.user?.data?.id ??
      state.user.userId ??
      state.user.id ??
      null
  );

  const accessToken = useSelector((state) => state.user.accessToken);
  console.log("🎬 CallLayout render - userId:", userId, "accessToken:", accessToken);

  // ── Connect socket once on mount ────────────────────────────────────────────
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "https://bill-bolt.onrender.com";

    const { io } = require("socket.io-client");
    const s = io(url, {
      reconnection:        true,
      reconnectionAttempts: 10,
      reconnectionDelay:   2000,
    });

    s.on("connect", () => {
      console.log("✅ Global socket connected:", s.id);
    });

    s.on("disconnect", (reason) => {
      console.log("⚠️ Socket disconnected:", reason);
    });


    const handleSWMessage = (event) => {


      console.log("Received message from Service Worker:", event);
            console.log("Received message from Service Worker:", event.data.data);

  if (event.data?.data?.type === "INCOMING_CALL") {
    // App was opened from push notification — show call
   // if (!activeCall) {
      setIncomingCall(event.data.payload);
      playRingtone();
   // }
  }

  if (event.data?.type === "DECLINE_CALL") {
    // User declined from notification action button
    const data = event.data.payload;
    if (socket) {
      socket.emit("callDeclined", {
        orderId:    data.orderId,
        callerId:   data.callerId,
        declinedBy: userId,
      });
    }
    setIncomingCall(null);
    callLockRef.current = false;
  }
    };

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", handleSWMessage);
}

    setSocket(s);
    return () => { 
      s.disconnect();
    if ("serviceWorker" in navigator) {
  navigator.serviceWorker.removeEventListener("message", handleSWMessage);
}

    };
  }, []);

  // ── Join user-level room & manage presence ──────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    if (!userId) {
      // User logged out — disconnect socket so backend receives disconnect & sets isOnline = false
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    // Ensure socket is connected when user is logged in
    if (socket.disconnected) {
      socket.connect();
    }

    const joinUserRoom = () => {
      console.log("🟢 Emitting joinUserRoom for userId:", userId);
      socket.emit("joinUserRoom", { userId });
    };

    if (socket.connected) joinUserRoom();
    socket.on("connect", joinUserRoom); // re-join on reconnect

    // Re-assert presence when window/app tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (socket.disconnected) {
          socket.connect();
        } else {
          joinUserRoom();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.off("connect", joinUserRoom);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, userId]);

  return (
    <SocketContext.Provider value={socket}>
      <CallProvider socket={socket}>
        <IncomingCallModal />
        {children}
      </CallProvider>
    </SocketContext.Provider>
  );
}
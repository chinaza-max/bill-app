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

  const userId      = useSelector((state) => state.user.user?.user?.id ?? null);

  const accessToken = useSelector((state) => state.user.accessToken);
  console.log("🎬 CallLayout render - userId:", userId, "accessToken:", accessToken);

  // ── Connect socket once on mount ────────────────────────────────────────────
  useEffect(() => {



    const url = "https://fidopoint.onrender.com";
    //const url = "http://localhost:5000";

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
    if (!activeCall) {
      setIncomingCall(event.data.payload);
      playRingtone();
    }
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

  // ── Join user-level room when userId is available ───────────────────────────
  // This runs whenever socket connects OR userId changes (login/logout)
// CallLayout.jsx — runs when user logs in, on any page
useEffect(() => {
  if (!socket || !userId) return;

  const joinUserRoom = () => {
    socket.emit("joinUserRoom", { userId });
  };

  if (socket.connected) joinUserRoom();
  socket.on("connect", joinUserRoom); // re-join after reconnect

  return () => socket.off("connect", joinUserRoom);
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
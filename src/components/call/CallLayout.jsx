"use client";
import { useEffect, useState, createContext, useContext } from "react";
import { CallProvider } from "@/components/call/CallProvider";
import IncomingCallModal from "@/components/call/IncomingCallModal";

// ── Export socket context so any page can access the SAME socket ──────────────
export const SocketContext = createContext(null);
export function useSocket() {
  return useContext(SocketContext);
}

export default function CallLayout({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const { io } = require("socket.io-client");
    const s = io("https://fidopoint.onrender.com");
   // const s = io("http://localhost:5000");

    s.on("connect", () => {
      console.log("✅ Layout socket connected:", s.id);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <CallProvider socket={socket}>
        <IncomingCallModal />
        {children}
      </CallProvider>
    </SocketContext.Provider>
  );
}
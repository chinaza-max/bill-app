"use client";
import { useEffect, useState, useRef, createContext, useContext } from "react";
import { CallProvider } from "@/components/call/CallProvider";
import IncomingCallModal from "@/components/call/IncomingCallModal";

export const SocketContext = createContext(null);
export function useSocket() {
  return useContext(SocketContext);
}

export default function CallLayout({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const { io } = require("socket.io-client");
    const s = io("https://fidopoint.onrender.com");
    s.on("connect", () => console.log("✅ Layout socket connected:", s.id));
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
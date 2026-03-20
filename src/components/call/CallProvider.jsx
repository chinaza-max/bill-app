"use client";
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { usePushNotification } from "@/hooks/usePushNotification";

const CallContext = createContext(null);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside <CallProvider>");
  return ctx;
}

export function CallProvider({ children, socket }) {
  const accessToken = useSelector((state) => state.user.accessToken);
  const userId = useSelector(
    (state) => state.user.userId || state.user.user?.id || state.user.id
  );

  usePushNotification(accessToken, userId);

  const [activeCall,   setActiveCall]   = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(null);

  const playRingtone = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (time) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.start(time); osc.stop(time + 0.4);
      };
      const interval = setInterval(() => {
        const now = ctx.currentTime;
        playBeep(now); playBeep(now + 0.5); playBeep(now + 1.0);
      }, 3000);
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.5);
      playBeep(ctx.currentTime + 1.0);
      ringtoneRef.current = { stop: () => { clearInterval(interval); ctx.close(); } };
    } catch (e) { console.warn("Ringtone:", e); }
  }, []);

  const stopRingtone = useCallback(() => {
    ringtoneRef.current?.stop?.();
    ringtoneRef.current = null;
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", (data) => {
      setIncomingCall(data);
      playRingtone();
      if ("vibrate" in navigator) navigator.vibrate([500, 300, 500, 300, 500]);
    });
    socket.on("callCancelled", () => { stopRingtone(); setIncomingCall(null); });
    socket.on("callEnded",     () => { stopRingtone(); setIncomingCall(null); setActiveCall(null); });
    socket.on("callDeclined",  () => { setActiveCall(null); });

    const handleSWMessage = (event) => {
      if (event.data?.type === "INCOMING_CALL") {
        setIncomingCall(event.data.payload);
        playRingtone();
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    return () => {
      socket.off("incomingCall");
      socket.off("callCancelled");
      socket.off("callEnded");
      socket.off("callDeclined");
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [socket, playRingtone, stopRingtone]);

  const startCall = useCallback((data) => {
    setActiveCall({ ...data, isIncoming: false });
    if (socket) {
      socket.emit("initiateCall", {
        orderId:      data.orderId,
        callerId:     userId,
        callerName:   data.myName   || "User",
        callerAvatar: data.myAvatar || "",
        receiverId:   data.receiverId,
      });
    }
  }, [socket, userId]);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    stopRingtone();
    setActiveCall({
      orderId:         incomingCall.orderId,
      otherUserName:   incomingCall.callerName,
      otherUserAvatar: incomingCall.callerAvatar,
      isIncoming:      true,
      callerId:        incomingCall.callerId,
    });
    setIncomingCall(null);
  }, [incomingCall, stopRingtone]);

  const declineCall = useCallback(() => {
    stopRingtone();
    if (socket && incomingCall) {
      socket.emit("callDeclined", {
        orderId:    incomingCall.orderId,
        callerId:   incomingCall.callerId,
        declinedBy: userId,
      });
    }
    setIncomingCall(null);
  }, [socket, incomingCall, userId, stopRingtone]);

  const endCall = useCallback(() => {
    stopRingtone();
    if (socket && activeCall) {
      socket.emit("callEnded", { orderId: activeCall.orderId, userId });
    }
    setActiveCall(null);
    setIncomingCall(null);
  }, [socket, activeCall, userId, stopRingtone]);

  return (
    <CallContext.Provider value={{
      activeCall, incomingCall,
      startCall, acceptCall, declineCall, endCall,
      userId, accessToken, socket,
    }}>
      {children}
    </CallContext.Provider>
  );
}
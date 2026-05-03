"use client";
import {
  createContext, useContext, useState,
  useCallback, useRef, useEffect,
} from "react";
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
  const userId      = useSelector(
    (state) => state.user.user?.user?.id ?? null
  );

  usePushNotification(accessToken, userId);

  const [activeCall,   setActiveCall]   = useState(null);
  // activeCall: { orderId, otherUserName, otherUserAvatar, isIncoming }

  const [incomingCall, setIncomingCall] = useState(null);
  // incomingCall: { orderId, callerId, callerName, callerAvatar }

  const ringtoneRef  = useRef(null);
  const callLockRef  = useRef(false); // ← prevents double call

  // ── Ringtone ────────────────────────────────────────────────────────────────
  const playRingtone = useCallback(() => {
    if (typeof window === "undefined" || ringtoneRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (time) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.start(time);
        osc.stop(time + 0.4);
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

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", (data) => {
      // Ignore if we're already in an active call
      if (activeCall) {
        console.log("Already in call — ignoring incomingCall");
        return;
      }
      setIncomingCall(data);
      playRingtone();
      if ("vibrate" in navigator) navigator.vibrate([500, 300, 500, 300, 500]);
    });

    socket.on("callCancelled", () => {
      stopRingtone();
      setIncomingCall(null);
    });

    socket.on("callEnded", () => {
      stopRingtone();
      setIncomingCall(null);
      setActiveCall(null);
      callLockRef.current = false;
    });

    socket.on("callDeclined", () => {
      setActiveCall(null);
      callLockRef.current = false;
    });

    const handleSWMessage = (event) => {
      if (event.data?.type === "INCOMING_CALL" && !activeCall) {
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
  }, [socket, activeCall, playRingtone, stopRingtone]);

  // ── Start outgoing call — prevent double call ───────────────────────────────
  const startCall = useCallback((data) => {
    // Already in a call or call already being placed
    if (activeCall || callLockRef.current) {
      console.warn("Call already active — ignoring startCall");
      return;
    }
    callLockRef.current = true;

    setActiveCall({
      orderId:         data.orderId,
      otherUserName:   data.otherUserName,
      otherUserAvatar: data.otherUserAvatar,
      isIncoming:      false,
    });

    if (socket) {
      socket.emit("initiateCall", {
        orderId:      data.orderId,
        callerId:     userId,
        callerName:   data.myName   || "User",
        callerAvatar: data.myAvatar || "",
        receiverId:   data.receiverId,
      });
    }
  }, [socket, userId, activeCall]);

  // ── Accept incoming — one tap only ─────────────────────────────────────────
  const acceptCall = useCallback(() => {
    if (!incomingCall || callLockRef.current) return;
    callLockRef.current = true;
    stopRingtone();
    setActiveCall({
      orderId:         incomingCall.orderId,
      otherUserName:   incomingCall.callerName,
      otherUserAvatar: incomingCall.callerAvatar,
      isIncoming:      true,
    });
    setIncomingCall(null);
  }, [incomingCall, stopRingtone]);

  // ── Decline ─────────────────────────────────────────────────────────────────
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
    callLockRef.current = false;
  }, [socket, incomingCall, userId, stopRingtone]);

  // ── End call ────────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    stopRingtone();
    if (socket && activeCall) {
      socket.emit("callEnded", { orderId: activeCall.orderId, userId });
    }
    setActiveCall(null);
    setIncomingCall(null);
    callLockRef.current = false;
  }, [socket, activeCall, userId, stopRingtone]);

  return (
    <CallContext.Provider value={{
      activeCall,
      incomingCall,
      startCall,
      acceptCall,
      declineCall,
      endCall,
      userId,
      accessToken,
      socket,
    }}>
      {children}
    </CallContext.Provider>
  );
}
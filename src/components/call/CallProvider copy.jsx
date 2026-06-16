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
  const userId      = useSelector((state) => state.user.user?.user?.id ?? null);

  usePushNotification(accessToken, userId);

  const [activeCall,   setActiveCall]   = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [offlineError, setOfflineError] = useState(null);

  const ringtoneRef       = useRef(null);
  const callLockRef       = useRef(false);
  const userInteractedRef = useRef(false);

  // ── Track first user interaction (browser blocks audio without it) ──────────
  useEffect(() => {
    const mark = () => { userInteractedRef.current = true; };
    window.addEventListener("click",      mark, { once: true });
    window.addEventListener("touchstart", mark, { once: true });
    window.addEventListener("keydown",    mark, { once: true });
    return () => {
      window.removeEventListener("click",      mark);
      window.removeEventListener("touchstart", mark);
      window.removeEventListener("keydown",    mark);
    };
  }, []);

  // ── Ringtone ────────────────────────────────────────────────────────────────
  const playRingtone = useCallback(() => {
    if (typeof window === "undefined" || ringtoneRef.current) return;

    if (!userInteractedRef.current) {
      console.log("Ringtone skipped — no user interaction yet");
      return;
    }

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
      ringtoneRef.current = {
        stop: () => { clearInterval(interval); ctx.close(); },
      };
    } catch (e) { console.warn("Ringtone error:", e); }
  }, []);

  const stopRingtone = useCallback(() => {
    ringtoneRef.current?.stop?.();
    ringtoneRef.current = null;
  }, []);

  // ── Single shared handler for ALL incoming call sources ─────────────────────
  // Used by: socket, FCM foreground, SW message (push tap)
  const handleIncomingCallData = useCallback((data) => {
    if (activeCall || callLockRef.current) {
      console.log("Already in call — ignoring incoming call");
      return;
    }
    console.log("📞 Incoming call from:", data);

    setIncomingCall({
      orderId:      data.orderId,
      callerId:     data.callerId,
      callerName:   data.callerName,
      callerAvatar: data.callerAvatar,
    });

    playRingtone();
    try { navigator.vibrate?.([500, 300, 500, 300, 500]); } catch (e) {}
  }, [activeCall, playRingtone]);

  // ── FCM foreground listener ─────────────────────────────────────────────────
  // Fires when: app IS open but socket missed the call
  // OR when: app just opened from push notification tap
  useEffect(() => {
    let unsubscribeFCM = null;

    const setupFCM = async () => {
      try {
        const { getApps, initializeApp }               = await import("firebase/app");
        const { getMessaging, onMessage, isSupported } = await import("firebase/messaging");

        if (!(await isSupported())) return;

        const firebaseConfig = {
          apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        // Reuse existing Firebase app if already initialized
        const app = getApps().length === 0
          ? initializeApp(firebaseConfig)
          : getApps()[0];

        const messaging = getMessaging(app);

        unsubscribeFCM = onMessage(messaging, (payload) => {
          console.log("📬 FCM foreground in CallProvider:", payload);
          const data = payload.data || {};

          // Only handle call notifications here
          if (data.type === "INCOMING_CALL") {
            handleIncomingCallData(data);
          }
        });

        console.log("✅ FCM foreground listener ready");
      } catch (err) {
        console.error("FCM setup error:", err);
      }
    };

    setupFCM();
    return () => { if (unsubscribeFCM) unsubscribeFCM(); };
  }, [handleIncomingCallData]);

  // ── Socket + Service Worker listeners ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Socket: app is open and connected
    const onIncomingCall    = (data) => handleIncomingCallData(data);
    const onCallCancelled   = () => { stopRingtone(); setIncomingCall(null); };
    const onCallEnded       = () => {
      stopRingtone();
      setIncomingCall(null);
      setActiveCall(null);
      callLockRef.current = false;
    };
    const onCallDeclined    = () => {
      setActiveCall(null);
      callLockRef.current = false;
    };
    const onReceiverOffline = () => {
      setActiveCall(null);
      callLockRef.current = false;
      setOfflineError("The other party is currently offline. Try again later.");
      setTimeout(() => setOfflineError(null), 4000);
    };

    // SW message: fires when user taps push notification
    // Two cases:
    //   1. App was open in background — SW posts message to existing window
    //   2. App was closed — SW opens app then posts message after delay
    const handleSWMessage = (event) => {
      console.log("[CallProvider] SW message:", event.data);

      if (event.data?.type === "INCOMING_CALL") {
        handleIncomingCallData(event.data.payload);
      }

      if (event.data?.type === "DECLINE_CALL") {
        // User tapped Decline on the push notification
        const d = event.data.payload;
        socket.emit("callDeclined", {
          orderId:    d.orderId,
          callerId:   d.callerId,
          declinedBy: userId,
        });
        stopRingtone();
        setIncomingCall(null);
        callLockRef.current = false;
      }
    };

    socket.on("incomingCall",    onIncomingCall);
    socket.on("callCancelled",   onCallCancelled);
    socket.on("callEnded",       onCallEnded);
    socket.on("callDeclined",    onCallDeclined);
    socket.on("receiverOffline", onReceiverOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    return () => {
      socket.off("incomingCall",    onIncomingCall);
      socket.off("callCancelled",   onCallCancelled);
      socket.off("callEnded",       onCallEnded);
      socket.off("callDeclined",    onCallDeclined);
      socket.off("receiverOffline", onReceiverOffline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [socket, userId, handleIncomingCallData, stopRingtone]);

  // ── Start outgoing call ─────────────────────────────────────────────────────
  const startCall = useCallback((data) => {
    if (activeCall || callLockRef.current) {
      console.warn("Call already active");
      return;
    }
    callLockRef.current = true;
    setActiveCall({
      orderId:         data.orderId,
      otherUserName:   data.otherUserName,
      otherUserAvatar: data.otherUserAvatar,
      isIncoming:      false,
    });
    socket?.emit("initiateCall", {
      orderId:      data.orderId,
      callerId:     userId,
      callerName:   data.myName   || "User",
      callerAvatar: data.myAvatar || "",
      receiverId:   data.receiverId,
    });
  }, [socket, userId, activeCall]);

  // ── Accept ──────────────────────────────────────────────────────────────────
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
      offlineError,
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
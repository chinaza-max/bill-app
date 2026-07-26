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
  const audioUnlockRef    = useRef(null); // holds the silent unlocked Audio instance

  // ── Track first user interaction + unlock audio context ─────────────────────
  useEffect(() => {
    const unlock = () => {
      userInteractedRef.current = true;

      // Pre-unlock the audio pipeline so later .play() calls won't be blocked
      // even when the page is in background / no gesture is active
      try {
        const silentAudio = new Audio(
          "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
        );
        silentAudio.volume = 0;
        silentAudio.play().catch(() => {});
        audioUnlockRef.current = silentAudio;
      } catch (e) {}

      window.removeEventListener("click",      unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown",    unlock);
    };

    window.addEventListener("click",      unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("keydown",    unlock, { once: true });

    return () => {
      window.removeEventListener("click",      unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown",    unlock);
    };
  }, []);

  // ── Play a sound by URL (called from SW PLAY_SOUND message) ─────────────────
  const playSoundByUrl = useCallback((soundUrl) => {
    if (typeof window === "undefined") return;
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 1.0;
      audio.play().catch((err) => {
        console.warn("🔇 Audio play blocked:", err);
        // Retry once after a short delay — sometimes the first attempt
        // fails due to the page just becoming visible again
        setTimeout(() => {
          audio.play().catch((e) => console.error("🔇 Audio retry failed:", e));
        }, 300);
      });
    } catch (e) {
      console.error("🔇 Audio error:", e);
    }
  }, []);

  // ── Custom ringtone URL (fallback when system ring can't be accessed) ─────
  const CALL_RINGTONE_URL = "https://res.cloudinary.com/dvznn9s4g/video/upload/v1785074803/soundreality-phone-ringtone-clean-273554_zgyg6f.mp3";
  const CALL_RINGTONE_LOCAL = "/sound/call_ring.mp3";

  // ── Ringtone ────────────────────────────────────────────────────────────────
  // Strategy:
  //   1. On Android/iOS PWAs, attempt to trigger the device's default ringtone
  //      via the Notification API (uses the OS notification sound channel when
  //      the PWA has notification permission and runs in a trusted context).
  //   2. If that's blocked or unavailable, fall back to our custom audio file.
  const playRingtone = useCallback(() => {
    if (typeof window === "undefined" || ringtoneRef.current) return;

    let stopped = false;
    let audioEl = null;
    let vibInterval = null;

    const stopAll = () => {
      stopped = true;
      clearInterval(vibInterval);
      if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; }
      try { navigator.vibrate?.(0); } catch (_) {}
    };

    // ── Attempt 1: System ringtone via the Notification API ─────────────────
    // On Android Chrome/PWA the Notification API plays the system notification
    // sound when silent is NOT set. We show a silent "call" notification — the
    // OS itself handles the ring channel for CallStyle / full-screen-intent.
    let usedSystemSound = false;
    if ("Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
      try {
        navigator.serviceWorker.ready.then((reg) => {
          if (stopped) return;
          reg.showNotification("📞 Incoming call", {
            tag:                "ringtone-pulse",
            requireInteraction: false,
            silent:             false, // ← let the OS use its own notification ring
            vibrate:            [0],    // suppress vibrate here; we handle it below
          }).then(() => {
            // Close the silent notification immediately — we just needed the ring
            reg.getNotifications({ tag: "ringtone-pulse" }).then((notes) => {
              notes.forEach((n) => n.close());
            });
            usedSystemSound = true;
            console.log("🔔 System ringtone triggered via Notification API");
          }).catch(() => {});
        }).catch(() => {});
      } catch (_) {}
    }

    // ── Attempt 2: Custom audio fallback ────────────────────────────────────
    // Always start our own audio in parallel. If the system sound worked the
    // user hears the system tone + ours (both at full vol) — we resolve the
    // conflict by delaying our audio slightly so it doesn't double-up on devices
    // that successfully fire the system ring.
    const startCustomAudio = () => {
      if (stopped) return;
      const src = CALL_RINGTONE_LOCAL;
      audioEl = new Audio(src);
      audioEl.loop   = true;
      audioEl.volume = 1.0;
      audioEl.play().catch((err) => {
        console.warn("🔇 Custom ringtone blocked:", err, "— trying Cloudinary CDN source");
        // Final fallback: CDN URL
        audioEl = new Audio(CALL_RINGTONE_URL);
        audioEl.loop   = true;
        audioEl.volume = 1.0;
        audioEl.play().catch((e) => console.warn("🔇 CDN ringtone failed:", e));
      });
    };

    // Give system ring a 300 ms head-start; if it didn't fire, our audio starts anyway
    setTimeout(() => {
      if (!stopped) startCustomAudio();
    }, usedSystemSound ? 300 : 0);

    // ── Aggressive vibration pattern for tactile alert ───────────────────────
    const vibratePattern = [700, 300, 700, 300, 700, 300, 700, 300, 700, 300];
    try {
      navigator.vibrate?.(vibratePattern);
      vibInterval = setInterval(() => {
        if (!stopped) navigator.vibrate?.(vibratePattern);
      }, 4000);
    } catch (_) {}

    ringtoneRef.current = { stop: stopAll };
  }, []);

  const stopRingtone = useCallback(() => {
    ringtoneRef.current?.stop?.();
    ringtoneRef.current = null;
  }, []);

  // ── Single shared handler for ALL incoming call sources ─────────────────────
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

        const app = getApps().length === 0
          ? initializeApp(firebaseConfig)
          : getApps()[0];

        const messaging = getMessaging(app);

        unsubscribeFCM = onMessage(messaging, (payload) => {
          console.log("📬 FCM foreground in CallProvider:", payload);
          const data = payload.data || {};

          if (data.type === "INCOMING_CALL") {
            handleIncomingCallData(data);
          } else if (data.type === "NEW_ORDER" || data.type === "SW_NEW_REQUEST") {
            playSoundByUrl("/sound/voice_request_alert.mp3");
          } else {
            const soundUrl = (data.type?.includes("REJECT") || data.type?.includes("CANCEL"))
              ? "/sound/message1.wav"
              : "/sound/mixkit-positive-notification-951.wav";
            playSoundByUrl(soundUrl);
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

    // ── SW → client message handler ──────────────────────────────────────────
    const handleSWMessage = (event) => {
      console.log("[CallProvider] SW message:", event.data);

      // ── INCOMING_CALL: user tapped the push notification ─────────────────
      if (event.data?.type === "INCOMING_CALL") {
        handleIncomingCallData(event.data.payload);
        return;
      }

      // ── DECLINE_CALL: user tapped Decline on push notification ───────────
      if (event.data?.type === "DECLINE_CALL") {
        const d = event.data.payload;
        socket.emit("callDeclined", {
          orderId:    d.orderId,
          callerId:   d.callerId,
          declinedBy: userId,
        });
        stopRingtone();
        setIncomingCall(null);
        callLockRef.current = false;
        return;
      }

      // ── PLAY_SOUND: SW asking client to play a notification sound ─────────
      // Fires for NEW_ORDER and any other event that sends a soundUrl
      if (event.data?.type === "PLAY_SOUND") {
        const { soundUrl } = event.data;
        if (soundUrl) {
          console.log("🔊 Playing sound from SW:", soundUrl);
          playSoundByUrl(soundUrl);
          // Also vibrate for reinforcement
          try {
            navigator.vibrate?.([
              800, 150, 800, 150, 800, 150,
              800, 150, 800, 150, 800,
            ]);
          } catch (e) {}
        }
        return;
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
  }, [socket, userId, handleIncomingCallData, stopRingtone, playSoundByUrl]);

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
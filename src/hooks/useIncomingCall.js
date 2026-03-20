"use client";
import { useEffect, useState, useCallback, useRef } from "react";

export function useIncomingCall(socket, userId, orderId) {
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneRef = useRef(null);

  const playRingtone = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (time) => {
        const osc = ctx.createOscillator();
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
        playBeep(now);
        playBeep(now + 0.5);
        playBeep(now + 1.0);
      }, 3000);
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.5);
      playBeep(ctx.currentTime + 1.0);
      ringtoneRef.current = { stop: () => { clearInterval(interval); ctx.close(); } };
    } catch (e) { console.warn("Ringtone error:", e); }
  }, []);

  const stopRingtone = useCallback(() => {
    ringtoneRef.current?.stop?.();
    ringtoneRef.current = null;
  }, []);

  const handleIncomingCall = useCallback((data) => {
    if (orderId && String(data.orderId) !== String(orderId)) return;
    setIncomingCall(data);
    playRingtone();
    if ("vibrate" in navigator) navigator.vibrate([500, 300, 500, 300, 500]);
  }, [orderId, playRingtone]);

  // Socket listener
  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callCancelled", (data) => {
      if (String(data.orderId) === String(orderId)) {
        stopRingtone();
        setIncomingCall(null);
      }
    });
    socket.on("callEnded", (data) => {
      if (String(data.orderId) === String(orderId)) {
        stopRingtone();
        setIncomingCall(null);
      }
    });

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callCancelled");
      socket.off("callEnded");
    };
  }, [socket, handleIncomingCall, orderId, stopRingtone]);

  // Service Worker postMessage
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleSWMessage = (event) => {
      if (event.data?.type === "INCOMING_CALL") handleIncomingCall(event.data.payload);
    };
    navigator.serviceWorker.addEventListener("message", handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleSWMessage);
  }, [handleIncomingCall]);

  const clearIncomingCall = useCallback(() => {
    stopRingtone();
    setIncomingCall(null);
  }, [stopRingtone]);

  const declineCall = useCallback(() => {
    stopRingtone();
    if (socket && incomingCall) {
      socket.emit("callDeclined", {
        orderId: incomingCall.orderId,
        callerId: incomingCall.callerId,
        declinedBy: userId,
      });
    }
    setIncomingCall(null);
  }, [socket, incomingCall, userId, stopRingtone]);

  useEffect(() => () => stopRingtone(), [stopRingtone]);

  return { incomingCall, clearIncomingCall, declineCall };
}
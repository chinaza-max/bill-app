"use client";
import { useRef, useState, useCallback } from "react";

let AgoraRTC = null;
if (typeof window !== "undefined") {
  AgoraRTC = require("agora-rtc-sdk-ng");
}

export function useAgoraCall(accessToken) {
  const clientRef   = useRef(null);
  const micTrackRef = useRef(null);
  const durationRef = useRef(null);

  const [inCall,       setInCall]       = useState(false);
  const [isMuted,      setIsMuted]      = useState(false);
  const [callStatus,   setCallStatus]   = useState("idle");
  const [remoteUsers,  setRemoteUsers]  = useState([]);
  const [error,        setError]        = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  // ── Fetch token ─────────────────────────────────────────────────────────────
  const fetchToken = useCallback(async (channelName, uid) => {
    const queryParams = new URLSearchParams({
      apiType:     "agoraToken",
      token:       accessToken,
      channelName: channelName,
      uid:         uid || 0,
    }).toString();

    const res = await fetch(`/api/user?${queryParams}`, { method: "GET" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to fetch Agora token");
    }

    const json = await res.json();
    const payload = json?.data?.data ?? json?.data ?? json;

    if (!payload?.token) throw new Error("Invalid token response — token missing");

    return { token: payload.token, appId: payload.appId };
  }, [accessToken]);

  // ── Convert uid to Agora integer ────────────────────────────────────────────
  const toAgoraUid = (uid) => {
    if (uid === null || uid === undefined) return 0;
    const cleaned = String(uid).replace(/\D/g, "").slice(0, 8);
    return parseInt(cleaned) || Math.floor(Math.random() * 100000);
  };

  // ── Timer ───────────────────────────────────────────────────────────────────
  const startTimer = () => {
    setCallDuration(0);
    durationRef.current = setInterval(() => setCallDuration((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    setCallDuration(0);
  };

  const formatDuration = useCallback((secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  // ── Join ────────────────────────────────────────────────────────────────────
  const joinCall = useCallback(async (channelName, uid) => {
    if (!AgoraRTC) { setError("Agora SDK not available"); return; }
    try {
      setError(null);
      setCallStatus("connecting");

      const { token, appId } = await fetchToken(channelName, uid);

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack.play();
          setRemoteUsers((prev) =>
            prev.find((u) => u.uid === user.uid) ? prev : [...prev, user]
          );
          setCallStatus("connected");
          startTimer();
        }
      });

      client.on("user-joined", (user) => {
        console.log("Remote user joined channel:", user.uid);
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      client.on("user-left", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        stopTimer();
        setCallStatus("ended");
        setTimeout(() => setCallStatus("idle"), 3000);
      });

      const agoraUid = toAgoraUid(uid);
      console.log(`Joining Agora — channel: ${channelName}, uid: ${agoraUid}`);
      await client.join(appId, channelName, token, agoraUid);

      // Check if users already in channel (receiver joined first)
      const existingUsers = client.remoteUsers;
      if (existingUsers.length > 0) {
        console.log("Already in channel:", existingUsers.length, "user(s)");
        for (const remoteUser of existingUsers) {
          if (remoteUser.hasAudio) {
            await client.subscribe(remoteUser, "audio");
            remoteUser.audioTrack?.play();
          }
        }
        setRemoteUsers([...existingUsers]);
        setCallStatus("connected");
        startTimer();
      }

      // Publish mic — audio only
      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = micTrack;
      await client.publish([micTrack]);

      setInCall(true);
      // Only set ringing if we haven't already connected
      setCallStatus((prev) => prev === "connected" ? "connected" : "ringing");

    } catch (err) {
      console.error("Agora joinCall error:", err);
      setError(err.message);
      setCallStatus("idle");
    }
  }, [fetchToken]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const leaveCall = useCallback(async () => {
    stopTimer();
    micTrackRef.current?.stop();
    micTrackRef.current?.close();
    await clientRef.current?.leave();
    clientRef.current   = null;
    micTrackRef.current = null;
    setInCall(false);
    setIsMuted(false);
    setRemoteUsers([]);
    setCallStatus("ended");
    setTimeout(() => setCallStatus("idle"), 2000);
  }, []);

  // ── Mute ────────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(async () => {
    if (!micTrackRef.current) return;
    const next = !isMuted;
    await micTrackRef.current.setEnabled(!next);
    setIsMuted(next);
  }, [isMuted]);

  return {
    joinCall,
    leaveCall,
    toggleMute,
    inCall,
    isMuted,
    callStatus,
    remoteUsers,
    error,
    callDuration,
    formatDuration,
  };
}
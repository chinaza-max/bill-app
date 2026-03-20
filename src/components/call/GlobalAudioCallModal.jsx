"use client";
import { useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, X, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCall } from "@/components/call/CallProvider";
import { useAgoraCall } from "@/hooks/useAgoraCall";

export default function GlobalAudioCallModal({
  isOpen, onClose, orderId,
  otherUserName, otherUserAvatar,
  isIncoming, socket,
}) {
  const { userId, accessToken } = useCall();

  const {
    joinCall, leaveCall, toggleMute,
    inCall, isMuted, callStatus,
    remoteUsers, error, callDuration, formatDuration,
  } = useAgoraCall(accessToken);

  const hasJoined = useRef(false);

  // Auto-join when modal opens
  // isIncoming=false → caller joins immediately
  // isIncoming=true  → receiver already accepted in CallProvider, join now
  useEffect(() => {
    if (isOpen && orderId && userId && !hasJoined.current) {
      hasJoined.current = true;
      joinCall(String(orderId), userId);
    }
    if (!isOpen) {
      hasJoined.current = false;
    }
  }, [isOpen, orderId, userId]);
  // ↑ No isIncoming check — both caller and receiver join when modal opens

  const handleClose = async () => {
    await leaveCall();
    if (socket) socket.emit("callEnded", { orderId, userId });
    onClose();
  };

  const statusLabel = {
    idle:       "Initializing…",
    connecting: "Connecting…",
    ringing:    "Ringing…",
    connected:  remoteUsers.length > 0
                  ? formatDuration(callDuration)
                  : "Waiting for other party…",
    ended:      "Call Ended",
  }[callStatus] ?? "…";

  const statusColor = {
    idle:       "text-amber-300",
    connecting: "text-amber-300",
    ringing:    "text-amber-200",
    connected:  remoteUsers.length > 0 ? "text-green-400" : "text-amber-200",
    ended:      "text-red-400",
  }[callStatus] ?? "text-amber-300";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1,    y: 0,  opacity: 1 }}
            exit={{    scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(160deg, #92400e 0%, #78350f 40%, #1c0a00 100%)" }}
          >
            {/* Decorative circles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
                style={{ background: "rgba(251,191,36,0.08)" }} />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full"
                style={{ background: "rgba(251,191,36,0.06)" }} />
            </div>

            {/* Close only when not connected */}
            {callStatus !== "connected" && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            )}

            <div className="relative z-10 flex flex-col items-center px-8 pt-12 pb-10">
              {/* Avatar + animated rings */}
              <div className="relative mb-6">
                {(callStatus === "ringing" || callStatus === "connecting") && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-amber-400/40"
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      style={{ margin: "-12px" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-amber-400/30"
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8, delay: 0.4 }}
                      style={{ margin: "-12px" }}
                    />
                  </>
                )}
                {callStatus === "connected" && remoteUsers.length > 0 && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400/50"
                    animate={{ scale: [1, 1.15], opacity: [0.7, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ margin: "-6px" }}
                  />
                )}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-400/40 shadow-xl">
                  <img
                    src={otherUserAvatar || "/default-avatar.png"}
                    alt={otherUserName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
                  />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-white mb-1">
                {otherUserName || "Unknown"}
              </h2>
              <p className={`text-sm font-medium mb-2 ${statusColor}`}>
                {statusLabel}
              </p>

              {/* Live waveform */}
              {callStatus === "connected" && remoteUsers.length > 0 && (
                <div className="flex items-end space-x-1 mb-6 h-6">
                  {[0.4, 0.7, 1, 0.7, 0.4, 0.6, 0.9, 0.6, 0.4].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-green-400"
                      animate={{ scaleY: [h, 1, h * 0.5, 1, h] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                      style={{ height: "100%", transformOrigin: "bottom" }}
                    />
                  ))}
                </div>
              )}

              {error && (
                <div
                  className="w-full mb-4 px-3 py-2 rounded-xl text-sm text-red-300 text-center"
                  style={{ background: "rgba(239,68,68,0.15)" }}
                >
                  {error}
                </div>
              )}

              <p className="text-xs text-amber-500/60 mb-6">Order #{orderId}</p>

              {/* Controls — mute + end */}
              <div className="flex items-center justify-center space-x-8 w-full">
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={toggleMute}
                    disabled={!inCall}
                    className="w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-40"
                    style={{ background: isMuted ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.15)" }}
                  >
                    {isMuted
                      ? <MicOff className="w-6 h-6 text-white" />
                      : <Mic    className="w-6 h-6 text-white" />
                    }
                  </button>
                  <span className="text-xs text-white/50">{isMuted ? "Unmute" : "Mute"}</span>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={handleClose}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                    style={{ background: "rgba(239,68,68,0.9)" }}
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-xs text-white/50">End</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import { useCall } from "@/components/call/CallProvider";
import GlobalAudioCallModal from "@/components/call/GlobalAudioCallModal";

export default function IncomingCallModal() {
  const {
    incomingCall, activeCall,
    acceptCall, declineCall, endCall, socket,
  } = useCall();

  return (
    <>
      {/* Ringing banner — only when incoming and NOT yet active */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0,    opacity: 1 }}
            exit={{    y: -120, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-[200] px-3 pt-2"
          >
            <div
              className="flex items-center justify-between rounded-2xl px-4 py-3 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #92400e, #451a03)",
                border:     "1px solid rgba(251,191,36,0.25)",
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400/40">
                    <img
                      src={incomingCall.callerAvatar || "/default-avatar.png"}
                      alt={incomingCall.callerName}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
                    />
                  </div>
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border border-white"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </div>
                <div>
                  <p className="text-xs text-amber-300/70 leading-none mb-0.5">
                    Incoming call · Order #{incomingCall.orderId}
                  </p>
                  <p className="text-sm font-semibold text-white leading-tight">
                    {incomingCall.callerName || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={declineCall}
                    className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "rgba(239,68,68,0.85)" }}
                  >
                    <PhoneOff className="w-5 h-5 text-white" />
                  </button>
                  <span className="text-[10px] text-white/40">Decline</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <motion.button
                    onClick={acceptCall}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                    className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: "rgba(34,197,94,0.9)" }}
                  >
                    <Phone className="w-5 h-5 text-white" />
                  </motion.button>
                  <span className="text-[10px] text-white/40">Accept</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global call modal — persists across page navigation */}
      <GlobalAudioCallModal
        isOpen={!!activeCall}
        onClose={endCall}
        orderId={activeCall?.orderId}
        otherUserName={activeCall?.otherUserName}
        otherUserAvatar={activeCall?.otherUserAvatar}
        isIncoming={activeCall?.isIncoming ?? false}
        socket={socket}
      />
    </>
  );
}
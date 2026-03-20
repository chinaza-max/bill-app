"use client";
import { toast, Toaster } from "sonner";
import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { XCircle } from "lucide-react";

import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Circle,
  AlertTriangle,
  Receipt,
  X,
  QrCode,
  CheckCircle,
  Camera,
  ScanLine,
  Flag,
  Clock,
  Navigation,
  PhoneOff,
  Mic,
  MicOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import useRequest from "@/hooks/useRequest";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import { useAgoraCall } from "@/hooks/useAgoraCall";
//import { useSocket } from "@/app/c"; // ← shared socket
import { useSocket } from "@/components/call/CallLayout"; // ← new import

// ─────────────────────────────────────────────────────────────────────────────
// MINI HOOKS
// ─────────────────────────────────────────────────────────────────────────────

const useQRSubmission = () => {
  const {
    data: qrSubmissionData,
    loading: qrSubmissionLoading,
    request: submitQRData,
    error: qrSubmissionError,
    errorDetail: qrErrorDetail,
  } = useRequest();
  return { qrSubmissionData, qrSubmissionLoading, submitQRData, qrSubmissionError, qrErrorDetail };
};

const useCancelOrder = () => {
  const {
    data: cancelData,
    loading: cancelLoading,
    request: cancelOrder,
    error: cancelError,
  } = useRequest();
  return { cancelData, cancelLoading, cancelOrder, cancelError };
};

const useQRGeneration = () => {
  const {
    data: qrCodeData,
    loading: qrCodeLoading,
    request: generateQRCode,
    error: qrCodeError,
  } = useRequest();
  return { qrCodeData, qrCodeLoading, generateQRCode, qrCodeError };
};

// ─────────────────────────────────────────────────────────────────────────────
// LEAFLET MAP
// ─────────────────────────────────────────────────────────────────────────────

const LeafletMap = ({ orderData }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!orderData?.userDetails) return;
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;

      if (!document.getElementById("leaflet-css")) {
        const link  = document.createElement("link");
        link.id     = "leaflet-css";
        link.rel    = "stylesheet";
        link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const source      = orderData.userDetails.sourceCoordinate;
      const destination = orderData.userDetails.destinationCoordinate;

      const newMap = L.map(mapContainer).setView(
        [parseFloat(source.lat), parseFloat(source.lng)], 13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(newMap);

      const sourceIcon = L.divIcon({
        className: "relative",
        html: `<div class="bg-blue-500 text-white px-2 py-1 rounded-full font-medium text-sm whitespace-nowrap">Start Point</div>
               <div class="bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-blue-500">
                 <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
               </div>`,
        iconSize: [40, 40], iconAnchor: [20, 40],
      });

      L.marker([parseFloat(source.lat), parseFloat(source.lng)], { icon: sourceIcon }).addTo(newMap);

      const createDestinationIcon = (isVisible) => L.divIcon({
        className: "relative",
        html: `<div class="bg-red-500 text-white px-2 py-1 rounded-full font-medium text-sm whitespace-nowrap">Destination</div>
               <div class="bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-red-500 ${isVisible ? "opacity-100" : "opacity-30"}">
                 <div class="w-3 h-3 bg-red-500 rounded-full ${isVisible ? "animate-pulse" : ""}"></div>
               </div>`,
        iconSize: [40, 40], iconAnchor: [20, 40],
      });

      const destinationMarker = L.marker(
        [parseFloat(destination.lat), parseFloat(destination.lng)],
        { icon: createDestinationIcon(true) }
      ).addTo(newMap);

      let isVisible = true;
      const interval = setInterval(() => {
        isVisible = !isVisible;
        destinationMarker.setIcon(createDestinationIcon(isVisible));
      }, 1000);

      const routeLine = L.polyline(
        [[parseFloat(source.lat), parseFloat(source.lng)],
         [parseFloat(destination.lat), parseFloat(destination.lng)]],
        { color: "#f59e0b", weight: 4, dashArray: "10, 5" }
      ).addTo(newMap);

      newMap.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
      mapRef.current = newMap;
      newMap._blinkInterval = interval;
    });

    return () => {
      if (mapRef.current) {
        if (mapRef.current._blinkInterval) clearInterval(mapRef.current._blinkInterval);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [orderData]);

  return <div id="map" className="h-64 rounded-lg"></div>;
};

// ─────────────────────────────────────────────────────────────────────────────
// MERCHANT SCANNER
// ─────────────────────────────────────────────────────────────────────────────

const MerchantScanner = ({ onClose, onScan, accessToken, orderId, socket }) => {
  const [hasCamera,   setHasCamera]   = useState(false);
  const [isScanning,  setIsScanning]  = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [error,       setError]       = useState(null);
  const scannerRef = useRef(null);
  const { qrSubmissionData, submitQRData, qrSubmissionLoading, qrSubmissionError, qrErrorDetail } = useQRSubmission();

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => setHasCamera(devices && devices.length > 0))
      .catch(() => setError("Camera access denied or no cameras found"));
    return () => stopScanner();
  }, []);

  useEffect(() => {
    if (qrSubmissionError || qrErrorDetail) {
      toast.custom((t) => (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md shadow-md w-full max-w-md flex items-start justify-between space-x-3">
          <div>
            <div className="font-semibold flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>Error Submitting QR Code</span>
            </div>
            {qrSubmissionError && <p className="mt-1 text-sm">{qrSubmissionError.toString()}</p>}
            {qrErrorDetail     && <p className="mt-1 text-xs text-red-600">{qrErrorDetail.toString()}</p>}
          </div>
          <button onClick={() => toast.dismiss(t)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      ), { id: "qr-error-toast", duration: Infinity, dismissible: true, important: true });
    }
  }, [qrSubmissionError]);

  useEffect(() => {
    if (qrSubmissionData) {
      toast.success("QR Code submitted successfully!", { duration: 10000, id: "qr-success-toast" });
      if (socket) socket.emit("qrVerified", { orderId, status: "verified", timestamp: new Date().toISOString() });
      if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
    }
  }, [qrSubmissionData, orderId, socket]);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode("reader");
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          setScanSuccess(true);
          try {
            await submitQRData(`/api/user`, "POST", {
              accessToken, apiType: "verifyCompleteOrder", orderId, hash: decodedText,
            });
            if (socket) socket.emit("qrScanned", {
              orderId, merchantId: accessToken, hash: decodedText, timestamp: new Date().toISOString(),
            });
            setTimeout(() => onScan(decodedText), 1500);
          } catch (err) { setError("Failed to submit QR code data"); }
        },
        (msg) => { if (!msg.includes("No QR code found")) console.error(msg); }
      );
      setIsScanning(true);
      setError(null);
    } catch (err) { setError("Failed to start camera. Please check permissions."); }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Scan Customer QR Code</h3>
        <button onClick={onClose}><X className="h-6 w-6" /></button>
      </div>
      <div className="p-4">
        {error ? (
          <div className="text-center p-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => { setScanSuccess(false); setError(null); startScanner(); }}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600">
              Retry Camera Access
            </button>
          </div>
        ) : scanSuccess ? (
          <div className="text-center p-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-medium text-green-600 mb-4">
              {qrSubmissionLoading ? "Processing..." : "Scan Successful!"}
            </p>
            <button onClick={() => { setScanSuccess(false); setError(null); startScanner(); }}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
              disabled={qrSubmissionLoading}>
              Scan Another Code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"></div>
            {!isScanning && (
              <div className="text-center">
                <button onClick={startScanner}
                  className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center mx-auto space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>{hasCamera ? "Start Scanning" : "Enable Camera"}</span>
                </button>
              </div>
            )}
            {isScanning && (
              <div className="text-center">
                <button onClick={stopScanner}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors">
                  Stop Scanning
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT QR CODE
// ─────────────────────────────────────────────────────────────────────────────

const ClientQRCode = ({ onClose, orderData, accessToken }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  useEffect(() => {
    if (orderData?.orderId && accessToken) {
      QRCode.toDataURL(orderData.qrCodeHash, {
        width: 300, margin: 2, color: { dark: "#000000", light: "#FFFFFF" },
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [orderData, accessToken]);

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Order QR Code</h3>
        <button onClick={onClose}><X className="h-6 w-6" /></button>
      </div>
      <div className="p-8 text-center flex flex-col justify-center items-center">
        <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center border-2 border-amber-200">
          {qrCodeUrl
            ? <img src={qrCodeUrl} alt="Order QR Code" className="w-full h-full object-contain" />
            : <QrCode className="h-48 w-48 text-amber-500" />
          }
        </div>
        <p className="mt-4 text-amber-700">Show this code to the merchant</p>
        <p className="mt-2 text-sm text-amber-600">Order ID: {orderData?.orderId}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

const OrderStatusBadge = ({ status, startTime, endTime }) => {
  const config = {
    pending:    { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
    inProgress: { color: "bg-blue-100 text-blue-800",    text: "In Progress" },
    completed:  { color: "bg-green-100 text-green-800",  text: "Completed" },
    rejected:   { color: "bg-red-100 text-red-800",      text: "Rejected" },
    cancelled:  { color: "bg-gray-100 text-gray-800",    text: "Cancelled" },
  }[status] || { color: "bg-gray-100 text-gray-800", text: "Unknown" };

  return (
    <div className="space-y-2">
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>{config.text}</span>
      {startTime && (
        <div className="flex items-center space-x-2 text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          <span>Started: {new Date(startTime).toLocaleString()}</span>
        </div>
      )}
      {endTime && status === "completed" && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Completed: {new Date(endTime).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO CALL MODAL
// ─────────────────────────────────────────────────────────────────────────────

const AudioCallModal = ({ isOpen, onClose, orderId, otherUserName, otherUserAvatar, isIncoming, onAccept, socket }) => {
  const accessToken = useSelector((state) => state.user.accessToken);
  const userId      = useSelector((state) => state.user.user?.user?.id ?? null);

  const {
    joinCall, leaveCall, toggleMute,
    inCall, isMuted, callStatus,
    remoteUsers, error, callDuration, formatDuration,
  } = useAgoraCall(accessToken);

  const hasJoined = useRef(false);

  useEffect(() => {
    if (isOpen && orderId && userId && !isIncoming && !hasJoined.current) {
      hasJoined.current = true;
      joinCall(String(orderId), userId);
    }
    if (!isOpen) hasJoined.current = false;
  }, [isOpen, orderId, userId, isIncoming]);

  const handleAccept = () => {
    hasJoined.current = true;
    joinCall(String(orderId), userId);
    onAccept?.();
  };

  const handleClose = async () => {
    await leaveCall();
    if (socket) socket.emit("callEnded", { orderId, userId });
    onClose();
  };

  const statusLabel = {
    idle:       "Initializing…",
    connecting: "Connecting…",
    ringing:    "Ringing…",
    connected:  remoteUsers.length > 0 ? formatDuration(callDuration) : "Waiting for other party…",
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "rgba(251,191,36,0.08)" }} />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full" style={{ background: "rgba(251,191,36,0.06)" }} />
            </div>

            {callStatus !== "connected" && (
              <button onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <X className="w-4 h-4 text-white/70" />
              </button>
            )}

            <div className="relative z-10 flex flex-col items-center px-8 pt-12 pb-10">
              <div className="relative mb-6">
                {(callStatus === "ringing" || callStatus === "connecting") && (
                  <>
                    <motion.div className="absolute inset-0 rounded-full border-2 border-amber-400/40"
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      style={{ margin: "-12px" }} />
                    <motion.div className="absolute inset-0 rounded-full border-2 border-amber-400/30"
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8, delay: 0.4 }}
                      style={{ margin: "-12px" }} />
                  </>
                )}
                {callStatus === "connected" && remoteUsers.length > 0 && (
                  <motion.div className="absolute inset-0 rounded-full border-2 border-green-400/50"
                    animate={{ scale: [1, 1.15], opacity: [0.7, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ margin: "-6px" }} />
                )}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-400/40 shadow-xl">
                  <img src={otherUserAvatar || "/default-avatar.png"} alt={otherUserName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }} />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-white mb-1">{otherUserName || "Unknown"}</h2>
              <p className={`text-sm font-medium mb-2 ${statusColor}`}>{statusLabel}</p>

              {callStatus === "connected" && remoteUsers.length > 0 && (
                <div className="flex items-end space-x-1 mb-6 h-6">
                  {[0.4, 0.7, 1, 0.7, 0.4, 0.6, 0.9, 0.6, 0.4].map((h, i) => (
                    <motion.div key={i} className="w-1 rounded-full bg-green-400"
                      animate={{ scaleY: [h, 1, h * 0.5, 1, h] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                      style={{ height: "100%", transformOrigin: "bottom" }} />
                  ))}
                </div>
              )}

              {error && (
                <div className="w-full mb-4 px-3 py-2 rounded-xl text-sm text-red-300 text-center"
                  style={{ background: "rgba(239,68,68,0.15)" }}>{error}</div>
              )}

              <p className="text-xs text-amber-500/60 mb-6">Order #{orderId}</p>

              {isIncoming && !inCall ? (
                <div className="flex items-center justify-center space-x-10 w-full">
                  <div className="flex flex-col items-center space-y-2">
                    <button onClick={handleClose} className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: "rgba(239,68,68,0.9)" }}>
                      <PhoneOff className="w-7 h-7 text-white" />
                    </button>
                    <span className="text-xs text-white/50">Decline</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <motion.button onClick={handleAccept}
                      animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: "rgba(34,197,94,0.9)" }}>
                      <Phone className="w-7 h-7 text-white" />
                    </motion.button>
                    <span className="text-xs text-white/50">Accept</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-8 w-full">
                  <div className="flex flex-col items-center space-y-2">
                    <button onClick={toggleMute} disabled={!inCall}
                      className="w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-40"
                      style={{ background: isMuted ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.15)" }}>
                      {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                    </button>
                    <span className="text-xs text-white/50">{isMuted ? "Unmute" : "Mute"}</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <button onClick={handleClose} className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                      style={{ background: "rgba(239,68,68,0.9)" }}>
                      <PhoneOff className="w-7 h-7 text-white" />
                    </button>
                    <span className="text-xs text-white/50">End</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// INCOMING CALL BANNER
// ─────────────────────────────────────────────────────────────────────────────

const IncomingCallBanner = ({ incomingCall, onAccept, onDecline }) => (
  <AnimatePresence>
    {incomingCall && (
      <motion.div
        initial={{ y: -120, opacity: 0 }}
        animate={{ y: 0,    opacity: 1 }}
        exit={{    y: -120, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-[200] px-3 pt-2"
      >
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #92400e, #451a03)", border: "1px solid rgba(251,191,36,0.25)" }}>
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400/40">
                <img src={incomingCall.callerAvatar || "/default-avatar.png"} alt={incomingCall.callerName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }} />
              </div>
              <motion.div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border border-white"
                animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
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
              <button onClick={onDecline}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(239,68,68,0.85)" }}>
                <PhoneOff className="w-5 h-5 text-white" />
              </button>
              <span className="text-[10px] text-white/40">Decline</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <motion.button onClick={onAccept}
                animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: "rgba(34,197,94,0.9)" }}>
                <Phone className="w-5 h-5 text-white" />
              </motion.button>
              <span className="text-[10px] text-white/40">Accept</span>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────

const Modal = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
          className="bg-white rounded-lg w-full max-w-md p-4">
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const OrderTrackingPage = () => {
  const [showExternalMapModal, setShowExternalMapModal] = useState(false);
  const [showInAppMap,         setShowInAppMap]         = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showQRScanner,        setShowQRScanner]        = useState(false);
  const [isMerchant,           setIsMerchant]           = useState(true);
  const [scanComplete,         setScanComplete]         = useState(false);
  const [currentLocation,      setCurrentLocation]      = useState(null);
  const [showReportModal,      setShowReportModal]      = useState(false);
  const [userType,             setUserType]             = useState("");
  const [showSuccessModal,     setShowSuccessModal]     = useState(false);
  const [successMessage,       setSuccessMessage]       = useState("");
  const [showCallModal,        setShowCallModal]        = useState(false);
  const [isIncomingCall,       setIsIncomingCall]       = useState(false);
  const [activeCallData,       setActiveCallData]       = useState(null);

  // ── Redux ───────────────────────────────────────────────────────────────────
  const accessToken = useSelector((state) => state.user.accessToken);
  const userId      = useSelector((state) => state.user.user?.user?.id ?? null);
  const user        = useSelector((state) => state.user.user?.user);

  // ── Shared socket from layout ───────────────────────────────────────────────
  const socket = useSocket(); // ← ONE socket used everywhere

  const {
    data: OrderDetails,
    loading: loadingFetchOrderDetails,
    request: fetchOrderDetails,
    error: errorFetchOrderDetails,
  } = useRequest();

  const { cancelOrder, cancelLoading } = useCancelOrder();
  const params    = useParams();
  const orderId   = params?.orderId;
  const router    = useRouter();
  const orderData = OrderDetails?.data?.data?.orderDetails;

  // ── useIncomingCall — uses same socket ──────────────────────────────────────
  const { incomingCall, clearIncomingCall, declineCall } = useIncomingCall(
    socket, userId, orderId
  );

  const handleAcceptIncomingCall = () => {
    setActiveCallData({
      otherUserName:   incomingCall.callerName,
      otherUserAvatar: incomingCall.callerAvatar,
    });
    setIsIncomingCall(true);
    setShowCallModal(true);
    clearIncomingCall();
  };

  const handleDeclineIncomingCall = () => declineCall();

  // ── Outgoing call ───────────────────────────────────────────────────────────
  const handleStartCall = () => {
    if (!socket) {
      console.warn("Socket not ready");
      return;
    }
    setIsIncomingCall(false);
    setActiveCallData({
      otherUserName:   orderData?.userDetails?.displayname,
      otherUserAvatar: orderData?.userDetails?.avatar,
    });
    setShowCallModal(true);

    socket.emit("initiateCall", {
      orderId:      orderData?.id,
      callerId:     userId,
      callerName:   user?.firstName || "User",
      callerAvatar: user?.imageUrl  || "",
      receiverId:   isMerchant ? orderData?.clientId : orderData?.merchantId,
    });
  };

  // ── Geolocation + userType ──────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("who");
    if (stored) { setUserType(stored); setIsMerchant(stored === "merchant"); }
    else         { setUserType("merchant"); setIsMerchant(true); }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !orderData?.id) return;

    // Join the order room with the shared socket
    socket.emit("joinOrderRoom", {
      orderId:  orderData.id,
      userType: userType,
    });

    console.log(`✅ Joined room order_${orderData.id} as ${userType}`);

    const onQrScanSuccess = () => {
      setShowQRScanner(false);
      setSuccessMessage(
        isMerchant
          ? "QR Code verified successfully! Customer has been notified."
          : "Your QR Code was scanned successfully by the merchant!"
      );
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      refreshOrder();
    };

    const onOrderStatusUpdate = (data) => {
      if (data.orderId === orderData.id) refreshOrder();
    };

    const onCallEnded = (data) => {
      if (String(data.orderId) === String(orderData.id)) {
        setShowCallModal(false);
        setIsIncomingCall(false);
        setActiveCallData(null);
        clearIncomingCall();
      }
    };

    const onCallDeclined = (data) => {
      if (String(data.orderId) === String(orderData.id)) {
        setShowCallModal(false);
        setActiveCallData(null);
      }
    };

    socket.on("qrScanSuccess",    onQrScanSuccess);
    socket.on("orderStatusUpdate", onOrderStatusUpdate);
    socket.on("callEnded",         onCallEnded);
    socket.on("callDeclined",      onCallDeclined);

    // ── Cleanup listeners only — do NOT disconnect the shared socket ──────────
    return () => {
      socket.off("qrScanSuccess",    onQrScanSuccess);
      socket.off("orderStatusUpdate", onOrderStatusUpdate);
      socket.off("callEnded",         onCallEnded);
      socket.off("callDeclined",      onCallDeclined);
    };
  }, [socket, orderData?.id, userType]);

  // ── Fetch order ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (accessToken && userType) {
      const q = new URLSearchParams({
        token: accessToken, apiType: "getMyOrderDetails", userType, orderId,
      }).toString();
      fetchOrderDetails(`/api/user?${q}`, "GET");
    }
  }, [accessToken, userType, orderId]);

  const refreshOrder = () => {
    const q = new URLSearchParams({
      token: accessToken, apiType: "getMyOrderDetails", userType, orderId,
    }).toString();
    fetchOrderDetails(`/api/user?${q}`, "GET");
  };

  const openGoogleMaps = () => {
    const dest = OrderDetails?.data?.data?.orderDetails?.userDetails?.destinationCoordinate;
    if (!dest) return alert("Destination coordinates not available.");
    const url = currentLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${dest.lat},${dest.lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${dest.lat},${dest.lng}`;
    window.open(url, "_blank");
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(`/api/user`, "POST", {
        accessToken, apiType: "orderAcceptOrCancel", orderId, type: "cancel",
      });
      setShowCancelOrderModal(false);
      refreshOrder();
    } catch (err) { console.error("Failed to cancel order:", err); }
  };

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (loadingFetchOrderDetails) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-amber-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-amber-700">Loading order details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (errorFetchOrderDetails) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-amber-50">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Failed to load order details</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg">
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <Toaster position="top-right" richColors />

      {/* Incoming call banner */}
      <IncomingCallBanner
        incomingCall={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      <div className="flex flex-col h-screen bg-amber-50" style={{ paddingBottom: "700px" }}>

        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
              <h1 className="text-lg font-semibold">Order Details</h1>
            </div>
            {isMerchant ? (
              <button onClick={() => setShowQRScanner(true)}
                className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">
                <ScanLine className="h-5 w-5" /><span>Scan QR</span>
              </button>
            ) : (
              <button onClick={() => setShowQRScanner(true)}
                className="p-2 bg-amber-100 rounded-full text-black hover:bg-amber-200">
                <QrCode className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-16 px-4 pb-4">
          <div className="bg-white rounded-lg shadow-md p-4 mt-4">

            <div className="mb-4">
              <OrderStatusBadge
                status={orderData?.orderStatus}
                startTime={orderData?.startTime}
                endTime={orderData?.endTime}
              />
            </div>

            {/* User Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <img
                      src={orderData?.userDetails?.avatar || "/default-avatar.png"}
                      alt={orderData?.userDetails?.displayname || "User"}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { e.target.src = "/default-avatar.png"; }}
                    />
                  </div>
                  {orderData?.isOnline && (
                    <div className="absolute -bottom-1 -right-1">
                      <Circle className="h-4 w-4 fill-green-500 text-green-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">
                    {orderData?.userDetails?.displayname || "Unknown User"}
                  </h3>
                  <p className="text-sm text-amber-600">Order ID: {orderData?.orderId}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button onClick={handleStartCall}
                  className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200 transition-colors"
                  title="Start audio call">
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push(`/orders/${orderData?.id}/${Math.min(orderData?.clientId, orderData?.merchantId)}-${Math.max(orderData?.clientId, orderData?.merchantId)}room/chat`)}
                  className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200">
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center p3 bg-amber-50 rounded-lg">
                <div className="bg-amber-50 rounded-lg mb-2 w-full pl-2 pr-2 pb-1 pt-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Receipt className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">Order Summary</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Order Amount</span>
                      <span className="font-medium text-amber-900">₦{orderData?.amountOrder || "0"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Distance</span>
                      <span className="font-medium text-amber-900">{orderData?.distance || "0"} m</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Estimated Time</span>
                      <span className="font-medium text-amber-900">{orderData?.estimatedDeliveryTime || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Options */}
            <div className="space-y-3">
              <button onClick={() => setShowInAppMap(true)}
                className="w-full p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200">
                <MapPin className="h-5 w-5" /><span>Track in App</span>
              </button>
              <button onClick={openGoogleMaps}
                className="w-full p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200">
                <Navigation className="h-5 w-5" /><span>Navigate with Google Maps</span>
              </button>
            </div>

            {(orderData?.orderStatus === "pending" || orderData?.orderStatus === "inProgress") && (
              <button onClick={() => setShowCancelOrderModal(true)}
                className="w-full mt-4 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                disabled={cancelLoading}>
                {cancelLoading ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
          </div>
        </div>

        {/* QR Scanner */}
        <Modal isOpen={showQRScanner} onClose={() => setShowQRScanner(false)}>
          {isMerchant
            ? <MerchantScanner
                onClose={() => setShowQRScanner(false)}
                onScan={() => { setScanComplete(true); setShowQRScanner(false); }}
                accessToken={accessToken}
                orderId={orderData?.id}
                socket={socket}
              />
            : <ClientQRCode
                onClose={() => setShowQRScanner(false)}
                orderData={orderData}
                accessToken={accessToken}
              />
          }
        </Modal>

        {/* Report Modal */}
        <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Flag className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-amber-900">Report Issue</h3>
            </div>
            <button onClick={() => setShowReportModal(false)}><X className="h-6 w-6 text-amber-500" /></button>
          </div>
          <div className="space-y-4">
            {["Delivery Delay", "Wrong Order Details", "Payment Issue", "Other Issue"].map((issue) => (
              <button key={issue} onClick={() => router.push(`/orders/order/complain`)}
                className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50">
                {issue}
              </button>
            ))}
          </div>
        </Modal>

        {/* External Map Modal */}
        <Modal isOpen={showExternalMapModal} onClose={() => setShowExternalMapModal(false)}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-amber-900">Leave App?</h3>
            </div>
            <button onClick={() => setShowExternalMapModal(false)}><X className="h-6 w-6 text-amber-500" /></button>
          </div>
          <p className="text-amber-700 mb-4">You are about to leave the app and open Google Maps. Continue?</p>
          <div className="flex space-x-3">
            <button onClick={() => setShowExternalMapModal(false)}
              className="flex-1 p-2 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50">Cancel</button>
            <button onClick={() => window.open("https://maps.google.com", "_blank")}
              className="flex-1 p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">Continue</button>
          </div>
        </Modal>

        {/* In-App Map */}
        <Modal isOpen={showInAppMap} onClose={() => setShowInAppMap(false)}>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-900">Live Tracking</h3>
            <button onClick={() => setShowInAppMap(false)}><X className="h-6 w-6 text-amber-500" /></button>
          </div>
          <LeafletMap orderData={orderData} />
        </Modal>

        {/* Cancel Order */}
        <Modal isOpen={showCancelOrderModal} onClose={() => setShowCancelOrderModal(false)}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-amber-900">Cancel Order</h3>
            </div>
            <button onClick={() => setShowCancelOrderModal(false)}><X className="h-6 w-6 text-amber-500" /></button>
          </div>
          <p className="text-amber-700 mb-4">Are you sure you want to cancel this order?</p>
          <div className="flex space-x-3">
            <button onClick={() => setShowCancelOrderModal(false)}
              className="flex-1 p-2 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50">
              No, Keep Order
            </button>
            <button onClick={handleCancelOrder}
              className="flex-1 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Yes, Cancel Order
            </button>
          </div>
        </Modal>

        {/* Success Modal */}
        <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
          <div className="text-center p-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Success!</h3>
            <p className="text-green-600 mb-4">{successMessage}</p>
            <button onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">OK</button>
          </div>
        </Modal>

        {/* Fixed Report Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg z-10">
          <button onClick={() => setShowReportModal(true)}
            className="w-full p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200">
            <Flag className="h-5 w-5" /><span>Report Issue</span>
          </button>
        </div>

        {/* Audio Call Modal */}
        <AudioCallModal
          isOpen={showCallModal}
          onClose={() => {
            setShowCallModal(false);
            setIsIncomingCall(false);
            setActiveCallData(null);
          }}
          orderId={orderData?.id}
          otherUserName={activeCallData?.otherUserName}
          otherUserAvatar={activeCallData?.otherUserAvatar}
          isIncoming={isIncomingCall}
          onAccept={() => setIsIncomingCall(false)}
          socket={socket}
        />

      </div>
    </ProtectedRoute>
  );
};

export default OrderTrackingPage;
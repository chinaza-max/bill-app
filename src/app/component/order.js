"use client";
import { toast, Toaster } from "sonner";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Send,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import useRequest from "@/hooks/useRequest";
import { useSocket } from "@/components/call/CallLayout";
import { useCall } from "@/components/call/CallProvider";

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * QROnboardingTooltip
 *
 * Shows a small animated tooltip anchored beneath the header icon on the
 * user's FIRST visit. Persisted in localStorage so it never shows again
 * after being dismissed.
 *
 * Props:
 *   isMerchant  – boolean, controls copy and icon shown
 *   onDismiss   – called when the user explicitly closes the tooltip
 */
const QROnboardingTooltip = ({ isMerchant, onDismiss }) => {
  const heading = isMerchant
    ? "Scan customer QR code"
    : "View your order QR code";

  const body = isMerchant
    ? "Tap the scan icon to open the camera and verify the customer's barcode at delivery."
    : "Tap the QR icon to display your barcode. Show it to the merchant to complete your order.";

  const Icon = isMerchant ? ScanLine : QrCode;

  return (
    <AnimatePresence>
      <motion.div
        key="qr-onboarding-tooltip"
        initial={{ opacity: 0, y: -6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{    opacity: 0, y: -6, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        // Position: fixed, just below the header (header is ~56 px tall + 8 px gap)
        className="fixed top-[68px] right-3 z-[200] w-64 rounded-2xl bg-white shadow-xl border border-amber-100"
        style={{ pointerEvents: "auto" }}
      >
        {/* Caret pointing up toward the icon */}
        <div
          className="absolute -top-2 right-5 w-4 h-4 bg-white border-l border-t border-amber-100 rotate-45 rounded-tl-sm"
          aria-hidden="true"
        />

        <div className="p-4 pt-5">
          {/* Icon + title row */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Icon className="h-5 w-5 text-amber-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 leading-snug">
                {heading}
              </p>
              <p className="mt-1 text-xs text-amber-600 leading-relaxed">
                {body}
              </p>
            </div>

            {/* Dismiss ✕ */}
            <button
              onClick={onDismiss}
              className="flex-shrink-0 -mt-0.5 p-1 rounded-full text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              aria-label="Dismiss tip"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Dismiss button (secondary CTA for clarity) */}
          <button
            onClick={onDismiss}
            className="mt-3 w-full py-2 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

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

      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

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
// MODAL (centre overlay — for QR, map, cancel, success)
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
// REPORT ISSUE — BOTTOM SHEET with complaint form
// ─────────────────────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  "Delivery Delay",
  "Wrong Order Details",
  "Payment Issue",
  "Other Issue",
];

const ReportBottomSheet = ({ isOpen, onClose, accessToken, userId, numericOrderId }) => {
  const [selectedIssue,      setSelectedIssue]      = useState("");
  const [complaint,          setComplaint]          = useState("");
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [submitted,          setSubmitted]          = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIssue("");
      setComplaint("");
      setSubmitted(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  const handleComplaintChange = useCallback((e) => {
    setComplaint(e.target.value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedIssue || !complaint.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          apiType:       "submitSupportRequest",
          userId,
          orderId:       numericOrderId,
          title:         selectedIssue,
          message:       complaint,
          complaintType: "service",
        }),
      });
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2800);
    } catch (err) {
      console.error("Failed to submit report:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIssue, complaint, accessToken, userId, numericOrderId, onClose]);

  const canSubmit = !!selectedIssue && complaint.trim().length > 0 && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="report-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
          />

          <motion.div
            key="report-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-amber-200 rounded-full" />
            </div>

            <div className="px-5 pb-10 pt-2">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-7 w-7 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-1">Report submitted!</h3>
                  <p className="text-amber-600 text-sm">We will look into this and follow up with you.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-2">
                      <Flag className="h-5 w-5 text-amber-500" />
                      <div>
                        <h2 className="text-base font-semibold text-amber-900">Report an Issue</h2>
                        <p className="text-xs text-amber-500 mt-0.5">Order #{numericOrderId}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-1.5 rounded-full bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs font-medium text-amber-700 mb-2 uppercase tracking-wide">
                    Select issue type
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {ISSUE_TYPES.map((issue) => (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => setSelectedIssue(issue)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                          selectedIssue === issue
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {issue}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs font-medium text-amber-700 mb-2 uppercase tracking-wide">
                    Describe the issue
                  </p>
                  <textarea
                    value={complaint}
                    onChange={handleComplaintChange}
                    placeholder="Tell us what happened..."
                    rows={4}
                    className="w-full p-3 rounded-xl text-sm text-amber-900 placeholder-amber-300 bg-amber-50 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
                  />

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <span>Submit</span>
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

// localStorage key — change version suffix to re-show after major UX changes
const ONBOARDING_SEEN_KEY = "qr_icon_onboarding_seen_v1";

const OrderTrackingPage = () => {
  const [showExternalMapModal, setShowExternalMapModal] = useState(false);
  const [showInAppMap,         setShowInAppMap]         = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showQRScanner,        setShowQRScanner]        = useState(false);
  const [isMerchant,           setIsMerchant]           = useState(true);
  const [scanComplete,         setScanComplete]         = useState(false);
  const [currentLocation,      setCurrentLocation]      = useState(null);
  const [showReportSheet,      setShowReportSheet]      = useState(false);
  const [userType,             setUserType]             = useState("");
  const [showSuccessModal,     setShowSuccessModal]     = useState(false);
  const [successMessage,       setSuccessMessage]       = useState("");

  // ── Onboarding tooltip state ────────────────────────────────────────────────
  // Start as false; we resolve from localStorage inside the useEffect below
  // so we avoid a SSR/hydration mismatch.
  const [showOnboarding, setShowOnboarding] = useState(false);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    } catch (_) {
      // localStorage unavailable (private/incognito edge-case) — ignore
    }
  }, []);

  // ── Redux ───────────────────────────────────────────────────────────────────
  const accessToken = useSelector((state) => state.user.accessToken);
  const userId      = useSelector((state) => state.user.user?.user?.id ?? null);
  const user        = useSelector((state) => state.user.user?.user);

  // ── Socket + call ───────────────────────────────────────────────────────────
  const socket = useSocket();
  const { startCall, activeCall } = useCall();

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

  const numericOrderId = orderData?.id ? Number(orderData.id) : null;

  // ── Outgoing call ───────────────────────────────────────────────────────────
  const handleStartCall = () => {
    if (activeCall) { console.warn("Already in a call"); return; }
    if (!socket)    { console.warn("Socket not ready");  return; }
    startCall({
      orderId:         orderData?.id,
      otherUserName:   orderData?.userDetails?.displayname,
      otherUserAvatar: orderData?.userDetails?.avatar,
      myName:          user?.firstName || "User",
      myAvatar:        user?.imageUrl  || "",
      receiverId:      isMerchant ? orderData?.clientId : orderData?.merchantId,
    });
  };

  // ── Geolocation + userType + onboarding check ───────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("who");
    if (stored) { setUserType(stored); setIsMerchant(stored === "merchant"); }
    else         { setUserType("merchant"); setIsMerchant(true); }

    // Show onboarding tooltip only if user hasn't seen it before
    try {
      const seen = localStorage.getItem(ONBOARDING_SEEN_KEY);
      if (!seen) {
        // Small delay so the page header has time to render before the tooltip pops in
        const timer = setTimeout(() => setShowOnboarding(true), 600);
        return () => clearTimeout(timer);
      }
    } catch (_) {
      // localStorage blocked — skip onboarding silently
    }

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

    socket.emit("joinOrderRoom", { orderId: orderData.id, userType });

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
      if (String(data.orderId) === String(orderData.id)) refreshOrder();
    };

    socket.on("qrScanSuccess",     onQrScanSuccess);
    socket.on("orderStatusUpdate", onOrderStatusUpdate);

    return () => {
      socket.off("qrScanSuccess",     onQrScanSuccess);
      socket.off("orderStatusUpdate", onOrderStatusUpdate);
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
    const dest = orderData?.userDetails?.destinationCoordinate;
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

      {/* ── QR icon onboarding tooltip (first-visit only) ─────────────────── */}
      {showOnboarding && (
        <QROnboardingTooltip
          isMerchant={isMerchant}
          onDismiss={dismissOnboarding}
        />
      )}

      {/* Active call banner */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{    y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[150] px-3 pt-2 pointer-events-none"
          >
            <div className="bg-green-600 text-white px-4 py-2 rounded-2xl flex items-center justify-center space-x-2 shadow-lg pointer-events-auto">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-sm font-medium">
                Call in progress · {activeCall.otherUserName || "Unknown"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-screen bg-amber-50" style={{ paddingBottom: "700px" }}>

        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
              <h1 className="text-lg font-semibold">Order Details</h1>
            </div>

            {/*
              ── QR / Scan icon ─────────────────────────────────────────────
              Tapping this icon dismisses the onboarding tooltip automatically
              (user clearly understood what the button does).
            */}
            {isMerchant ? (
              <button
                onClick={() => { dismissOnboarding(); setShowQRScanner(true); }}
                className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
                aria-label="Scan customer QR code"
              >
                <ScanLine className="h-5 w-5" />
                <span>Scan QR</span>
              </button>
            ) : (
              <button
                onClick={() => { dismissOnboarding(); setShowQRScanner(true); }}
                className="p-2 bg-amber-100 rounded-full text-black hover:bg-amber-200"
                aria-label="View your order QR code"
              >
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
                <button
                  onClick={handleStartCall}
                  disabled={!!activeCall}
                  className={`p-2 rounded-full transition-colors ${
                    activeCall
                      ? "bg-green-100 text-green-600 cursor-not-allowed"
                      : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                  }`}
                  title={activeCall ? "Call in progress" : "Start audio call"}
                >
                  <Phone className="h-5 w-5" />
                </button>

                <button
                  onClick={() => router.push(
                    `/orders/${orderData?.id}/${Math.min(orderData?.clientId, orderData?.merchantId)}-${Math.max(orderData?.clientId, orderData?.merchantId)}room/chat`
                  )}
                  className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200">
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
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

        {/* QR Scanner Modal */}
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

        {/* In-App Map Modal */}
        <Modal isOpen={showInAppMap} onClose={() => setShowInAppMap(false)}>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-900">Live Tracking</h3>
            <button onClick={() => setShowInAppMap(false)}><X className="h-6 w-6 text-amber-500" /></button>
          </div>
          <LeafletMap orderData={orderData} />
        </Modal>

        {/* Cancel Order Modal */}
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

        {/* Report Issue — Bottom Sheet */}
        <ReportBottomSheet
          isOpen={showReportSheet}
          onClose={() => setShowReportSheet(false)}
          accessToken={accessToken}
          userId={userId}
          numericOrderId={numericOrderId}
        />

        {/* Fixed Report Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg z-10">
          <button
            onClick={() => setShowReportSheet(true)}
            className="w-full p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200"
          >
            <Flag className="h-5 w-5" /><span>Report Issue</span>
          </button>
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default OrderTrackingPage;
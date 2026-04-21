"use client";

import { LocationStatusIndicator, LocationStatusBadge } from '../component/LocationStatusIndicator';

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Bell,
  ChevronDown,
  ShoppingBag,
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Camera,
  Upload,
  RotateCcw,
  X,
  Check,
  FlipHorizontal,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import ProtectedRoute from "@/app/component/protect";
import WalletBalanceCard from "@/app/component/walletBalanceCard";
import useRequest from "@/hooks/useRequest";

import { useRouter, usePathname } from "next/navigation";
import BottomNav from "../component/bottomNav";
import { useSelector } from "react-redux";
import useVisibility from "../component/useVisibility";
import { useQuery } from "@tanstack/react-query";
import getErrorMessage from "@/app/component/error";
import { useNotifications } from "../../hooks/useNotifications";
import { useLocationService } from "@/hooks/locationService";
import { AttentionAnimation } from "../component/AttentionAnimation";
import { PaymentStatusBadge } from "../component/PaymentStatusBadge";
import { EmptyTransactionState } from "../component/EmptyTransactionState";
import LocationNotificationModal from "../component/LocationNotificationModal";

// ─── Google Drive image formatter ─────────────────────────────────────────────
const formatGoogleDriveImage = (url) => {
  if (!url) return "/default-avatar.png";
  if (url.includes("uc?export=view&id=")) return url;
  const match = url.match(/\/d\/(.*?)\//);
  if (match && match[1])
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────
const fetchUserProfile = async (accessToken) => {
  if (!accessToken) return null;
  const queryParams = new URLSearchParams({
    token: accessToken,
    apiType: "userData",
  }).toString();
  const response = await fetch(`/api/user?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return response.json();
};

const fetchTransaction = async (accessToken) => {
  if (!accessToken) throw new Error("No access token");
  const queryParams = new URLSearchParams({
    limit: 3, offset: 0, token: accessToken, apiType: "getGeneralTransaction",
  }).toString();
  const response = await fetch(`/api/user?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Error: ${response.status}`);
  }
  return response.json();
};

// ─── Verification Settings Fetcher ────────────────────────────────────────────
const fetchVerificationSettings = async (accessToken) => {
  if (!accessToken) throw new Error("No access token");
  const queryParams = new URLSearchParams({
    token: accessToken,
    apiType: "getVerificationSettings",
  }).toString();
  const response = await fetch(`/api/user?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Error: ${response.status}`);
  }
  const json = await response.json();
  // Normalise — support both flat and nested response shapes
  const setting =
    json?.data?.data ??
    json?.data ??
    json ??
    {};
  return {
    ninVerificationEnabled:  setting.ninVerificationEnabled  ?? true,
    ninImageUploadEnabled:   setting.ninImageUploadEnabled   ?? true,
    nameVerificationEnabled: setting.nameVerificationEnabled ?? true,
    faceVerificationEnabled: setting.faceVerificationEnabled ?? true,
  };
};

// ─── Profile Picture Upload API ───────────────────────────────────────────────
const uploadProfilePicture = async (accessToken, imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("accessToken", accessToken);
  formData.append("apiType", "updateUserProfileWithImage");

  const response = await fetch("/api/user", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Upload failed: ${response.status}`);
  }
  return response.json();
};

// ─── Live Activity Ticker ─────────────────────────────────────────────────────
const FIRST_NAMES = ["Amina","Chukwudi","Fatima","Emeka","Ngozi","Tunde","Aisha","Kelechi","Blessing","Usman","Adaeze","Seun","Halima","Tobi","Chisom","Musa","Yetunde","Ifeanyi","Zainab","Babatunde","Chiamaka","Abdullahi","Sola","Chinyere","Ahmed","Folake","Obinna","Rukayat","Gbenga","Nneka"];
const LAST_NAMES  = ["Okafor","Adeyemi","Ibrahim","Nwosu","Bello","Eze","Lawal","Obi","Yusuf","Adeleke","Nwachukwu","Suleiman","Okonkwo","Abubakar","Dike","Omotayo","Garba","Onuoha","Aliyu","Fashola"];
const ACTIONS = [
  { type: "placed",          label: "just placed an order of",    icon: Clock,        color: "#f59e0b" },
  { type: "completed",       label: "just completed an order of", icon: CheckCircle2, color: "#16a34a" },
  { type: "order_completed", label: "order has been completed —", icon: CheckCircle2, color: "#d97706" },
  { type: "cancelled",       label: "cancelled an order of",      icon: XCircle,      color: "#dc2626" },
];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomName    = () => `${FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)][0]}.`;
const randomAmount  = () => `₦${Math.min(randomBetween(10, 200) * 100, 20000).toLocaleString("en-NG")}`;
const randomAction  = () => ACTIONS[randomBetween(0, ACTIONS.length - 1)];
const generateFeed  = (count = 20) => Array.from({ length: count }, (_, i) => ({ id: i, name: randomName(), amount: randomAmount(), action: randomAction() }));

const LiveActivityTicker = () => {
  const [feed, setFeed]                 = useState(() => generateFeed(20));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible]           = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % feed.length;
          if (next === 0) setFeed(generateFeed(20));
          return next;
        });
        setVisible(true);
      }, 300);
    }, 3200);
    return () => clearInterval(interval);
  }, [feed.length]);

  const item = feed[currentIndex];
  const Icon = item.action.icon;

  return (
    <div
      className="mx-4 mb-3 overflow-hidden rounded-xl px-3 py-2 flex items-center gap-2"
      style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.22)" }}
    >
      <span className="relative flex-shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style={{ background: item.action.color }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: item.action.color }} />
      </span>

      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={`${currentIndex}-${item.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex items-center gap-1.5 min-w-0 flex-1"
          >
            <Icon className="flex-shrink-0 h-3.5 w-3.5" style={{ color: item.action.color }} />
            <p className="text-xs truncate" style={{ color: "rgba(0,0,0,0.65)" }}>
              <span className="font-semibold" style={{ color: "#92400e" }}>{item.name}</span>
              {" "}{item.action.label}{" "}
              <span className="font-bold" style={{ color: "#b45309" }}>{item.amount}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <span
        className="ml-auto flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
        style={{ background: "rgba(220,38,38,0.12)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)" }}
      >
        LIVE
      </span>
    </div>
  );
};

// ─── In-App Camera Modal (getUserMedia — works on both mobile & desktop) ───────
const CameraModal = ({ onCapture, onClose }) => {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);

  const [facingMode, setFacingMode]   = useState("user"); // "user" | "environment"
  const [permissionErr, setPermErr]   = useState("");
  const [ready, setReady]             = useState(false);
  const [flash, setFlash]             = useState(false);

  // ── Start / restart the camera stream ──────────────────────────────────
  const startStream = useCallback(async (facing) => {
    // Kill any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
    setPermErr("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Some browsers need both onloadedmetadata + play()
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => setReady(true)).catch(() => setReady(true));
        };
      }
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermErr("Camera permission denied. Please allow camera access in your browser/device settings, then try again.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setPermErr("No camera found on this device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setPermErr("Camera is already in use by another app. Please close it and try again.");
      } else {
        setPermErr(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Start on mount
  useEffect(() => {
    startStream("user");
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flip camera ────────────────────────────────────────────────────────
  const handleFlip = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startStream(next);
  };

  // ── Shutter: draw video frame onto canvas → Blob → File ───────────────
  const handleShutter = () => {
    if (!videoRef.current || !canvasRef.current || !ready) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 160);

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");

    // Mirror front-cam so the saved image matches what the user saw
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        // Stop stream before handing off
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "#000",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* ── Top controls ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 16px 0",
      }}>
        {/* Close */}
        <button
          type="button"
          onClick={() => {
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            onClose();
          }}
          style={{
            background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "50%", width: 42, height: 42,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Flip camera */}
        <button
          type="button"
          onClick={handleFlip}
          style={{
            background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "50%", width: 42, height: 42,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <FlipHorizontal className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* ── Video area ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Shutter flash */}
        {flash && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 8,
            background: "#fff", opacity: 0.8,
            pointerEvents: "none",
          }} />
        )}

        {/* Permission / device error */}
        {permissionErr ? (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 32px", textAlign: "center", gap: 16,
          }}>
            <XCircle className="h-14 w-14 text-red-400" />
            <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.6 }}>{permissionErr}</p>
            <button
              type="button"
              onClick={() => startStream(facingMode)}
              style={{
                padding: "10px 28px", borderRadius: 10,
                background: "#f59e0b", border: "none",
                fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Loading spinner */}
            {!ready && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 4,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
              }}>
                <RefreshCw className="h-9 w-9 text-amber-400 animate-spin" />
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Starting camera…</p>
              </div>
            )}

            {/* Live video */}
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                // Mirror preview only for front cam — the captured image is also mirrored on canvas
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                opacity: ready ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            />

            {/* Circular face-guide overlay */}
            {ready && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <div style={{
                  width: 210, height: 210,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)",
                }} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden canvas used only to capture the frame */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Shutter bar ── */}
      <div style={{
        height: 130, background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={handleShutter}
          disabled={!ready || !!permissionErr}
          aria-label="Take photo"
          style={{
            width: 72, height: 72,
            borderRadius: "50%",
            background: ready && !permissionErr ? "#ffffff" : "rgba(255,255,255,0.25)",
            border: "5px solid rgba(255,255,255,0.5)",
            boxShadow: ready && !permissionErr ? "0 0 0 6px rgba(255,255,255,0.12)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: ready && !permissionErr ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
          }}
        >
          <Camera className="h-7 w-7 text-gray-800" />
        </button>
      </div>
    </div>
  );
};

// ─── Profile Picture Bottom Sheet ─────────────────────────────────────────────
const ProfilePictureSheet = ({ onClose, onUploaded, accessToken }) => {
  // stage: "picker" | "camera" | "preview" | "uploading" | "done" | "error"
  const [stage, setStage]               = useState("picker");
  const [previewSrc, setPreviewSrc]     = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg]         = useState("");

  const galleryInputRef = useRef(null);

  // ── Camera captured a file ─────────────────────────────────────────────
  const handleCameraCapture = useCallback((file) => {
    // createObjectURL is fine here — we revoke it on retake/unmount
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
    setSelectedFile(file);
    setStage("preview");
  }, []);

  // ── Gallery file selected ──────────────────────────────────────────────
  const handleGalleryFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selection of the same file

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPG, PNG, WEBP, etc.).");
      setStage("error");
      return;
    }

    const reader = new FileReader();
    reader.onload  = (ev) => { setPreviewSrc(ev.target.result); setSelectedFile(file); setStage("preview"); };
    reader.onerror = ()   => { setErrorMsg("Could not read file. Please try again."); setStage("error"); };
    reader.readAsDataURL(file);
  }, []);

  // ── Upload ─────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedFile) return;
    setStage("uploading");
    setErrorMsg("");
    try {
      const result = await uploadProfilePicture(accessToken, selectedFile);
      const newUrl =
        result?.data?.data?.imageUrl ??
        result?.data?.imageUrl ??
        result?.imageUrl ??
        null;
      setStage("done");
      setTimeout(() => onUploaded(newUrl), 800);
    } catch (err) {
      setErrorMsg(err.message || "Upload failed. Please try again.");
      setStage("error");
    }
  };

  // ── Retake / reset ─────────────────────────────────────────────────────
  const handleRetake = () => {
    if (previewSrc?.startsWith("blob:")) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setSelectedFile(null);
    setErrorMsg("");
    setStage("picker");
  };

  // ── If stage === "camera" render the full-screen camera modal ──────────
  if (stage === "camera") {
    return (
      <CameraModal
        onCapture={handleCameraCapture}
        onClose={() => setStage("picker")}
      />
    );
  }

  // ── Otherwise render the bottom sheet ──────────────────────────────────
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Gallery input — no capture attribute, just opens files/photos */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleGalleryFile}
        aria-hidden="true"
        tabIndex={-1}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "0 0 40px",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
        </div>

        {/* Close */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 0" }}>
          <button type="button" onClick={onClose}
            style={{
              background: "#f3f4f6", border: "none", borderRadius: "50%",
              width: 30, height: 30, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer",
            }}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* ── PICKER ── */}
        {stage === "picker" && (
          <div style={{ padding: "8px 24px 0" }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#78350f", marginBottom: 4 }}>
              Add a profile photo
            </p>
            <p style={{ fontSize: 13, color: "#a16207", marginBottom: 24 }}>
              Complete your profile. This takes less than a minute.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Take photo — opens in-app camera via getUserMedia */}
              <button
                type="button"
                onClick={() => setStage("camera")}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 14,
                  background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                  border: "1px solid #fbbf24",
                  cursor: "pointer", width: "100%",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: "#f59e0b",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#78350f", margin: 0 }}>Take a photo</p>
                  <p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>Opens live camera view</p>
                </div>
              </button>

              {/* Upload from gallery */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 14,
                  background: "#f9fafb", border: "1px solid #e5e7eb",
                  cursor: "pointer", width: "100%",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: "#b45309",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#374151", margin: 0 }}>Upload from gallery</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Choose an existing photo</p>
                </div>
              </button>
            </div>

            <button type="button" onClick={onClose}
              style={{
                width: "100%", marginTop: 20, padding: "10px 0",
                background: "none", border: "none",
                fontSize: 13, color: "#9ca3af", cursor: "pointer",
              }}
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {stage === "preview" && previewSrc && (
          <div style={{ padding: "8px 24px 0", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#78350f", marginBottom: 4 }}>Looks good?</p>
            <p style={{ fontSize: 13, color: "#a16207", marginBottom: 20 }}>Preview your photo before saving it.</p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{
                width: 140, height: 140, borderRadius: "50%", overflow: "hidden",
                border: "4px solid #f59e0b", boxShadow: "0 0 0 4px #fef3c7",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleRetake}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "12px 0", borderRadius: 12,
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  fontSize: 14, fontWeight: 500, color: "#374151", cursor: "pointer",
                }}
              >
                <RotateCcw className="h-4 w-4" /> Retake
              </button>
              <button type="button" onClick={handleConfirm}
                style={{
                  flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "12px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, #92400e, #d97706)", border: "none",
                  fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer",
                }}
              >
                <Check className="h-4 w-4" /> Save photo
              </button>
            </div>
          </div>
        )}

        {/* ── UPLOADING ── */}
        {stage === "uploading" && (
          <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
            {previewSrc && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid #f59e0b", opacity: 0.7 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewSrc} alt="Uploading" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
              <p style={{ fontSize: 15, fontWeight: 500, color: "#78350f" }}>Uploading…</p>
            </div>
            <p style={{ fontSize: 12, color: "#a16207" }}>Almost done, please wait</p>
          </div>
        )}

        {/* ── DONE ── */}
        {stage === "done" && (
          <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#dcfce7",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            }}>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#15803d" }}>Photo saved!</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Your profile photo has been updated.</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {stage === "error" && (
          <div style={{ padding: "8px 24px 0", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#fee2e2",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            }}>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#b91c1c", marginBottom: 6 }}>Upload failed</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>{errorMsg}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleRetake}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "#f3f4f6", border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 500, color: "#374151", cursor: "pointer" }}
              >Try again</button>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "none", border: "1px solid #e5e7eb", fontSize: 14, color: "#9ca3af", cursor: "pointer" }}
              >Cancel</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const MobileApp = () => {
  const [userType, setUserType]                               = useState("Client");
  const [activeTab, setActiveTab]                             = useState("home");
  const [firstName, setFirstName]                             = useState("");
  const [imageUrl, setImageUrl]                               = useState("");
  const [isDropdownOpen, setIsDropdownOpen]                   = useState(false);
  const [walletBalance, setWalletBalance]                     = useState(0);
  const [isBalanceVisible, setIsBalanceVisible]               = useState(false);
  const [showPulseAnimation, setShowPulseAnimation]           = useState(false);
  const [hasInteractedWithSwitch, setHasInteractedWithSwitch] = useState(false);
  const [unreadCount, setUnreadCount]                         = useState(0);

  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const profilePromptTimerRef = useRef(null);

  // ── Merchant navigation loading state ─────────────────────────────────
  const [isMerchantNavLoading, setIsMerchantNavLoading] = useState(false);

  const { token }                  = useNotifications();
  const [numberOfOrder, setNumberOfOrder] = useState(0);

  const data2           = useSelector((state) => state.user);
  const accessToken     = useSelector((state) => state.user.accessToken);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const myUserData      = useSelector((state) => state.user.user);

  const dropdownRef   = useRef(null);
  const pulseTimerRef = useRef(null);

  const { data: order, request: getOrder } = useRequest();
  const { request: StoreFCMToken }         = useRequest();

  const {
    showLocationNotification, locationError, isRetrying,
    retryLocation, dismissNotification, getCurrentLocation,
    locationStatus, currentAccuracy, lastLocationUpdate,
  } = useLocationService();

  useVisibility();

  const router   = useRouter();
  const pathname = usePathname();

  const {
    data: profileData,
    refetch: refetchProfile,
    isFetching: isProfileFetching,
  } = useQuery({
    queryKey: ["userProfile", accessToken],
    queryFn: () => fetchUserProfile(accessToken),
    enabled: !!accessToken,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const {
    data: transactionData,
    isError,
    error,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", accessToken],
    queryFn: () => fetchTransaction(accessToken),
    enabled: !!accessToken,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
    keepPreviousData: true,
  });

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && accessToken) {
        refetchProfile();
        refetchTransactions();
        fetchUnreadCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const who = typeof window !== "undefined" && localStorage.getItem("who") === "client"
        ? "CLIENT" : "MERCHANT";
      const q = new URLSearchParams({
        apiType: "notificationCountUnread", user_type: who, token: accessToken,
      }).toString();
      const res = await fetch(`/api/user?${q}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(Number(json?.data?.data?.unreadCount ?? 0));
    } catch { /* non-critical */ }
  }, [accessToken]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasInteractedWithSwitch(localStorage.getItem("hasInteractedWithSwitch") === "true");
    }
    (async () => { await getCurrentLocation(); })();
  }, []);

  useEffect(() => { if (accessToken) fetchUnreadCount(); }, [accessToken, fetchUnreadCount]);

  useEffect(() => {
    if (token && accessToken) {
      StoreFCMToken("/api/user", "POST", { accessToken, apiType: "updateToken", fcmToken: token });
    }
  }, [token, accessToken]);

  useEffect(() => {
    if (accessToken) {
      const q = new URLSearchParams({
        token: accessToken, apiType: "getMyOrders", type: "active", userType: "client",
      }).toString();
      getOrder(`/api/user?${q}`, "GET");
    }
  }, [accessToken]);

  useEffect(() => { if (order) setNumberOfOrder(order.data?.data?.length); }, [order]);

  const handleSwitchInteraction = () => {
    setHasInteractedWithSwitch(true);
    localStorage.setItem("hasInteractedWithSwitch", "true");
    setShowPulseAnimation(false);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
  };

  const setupPulseTimer = () => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    if (!hasInteractedWithSwitch) {
      setShowPulseAnimation(true);
      setTimeout(() => setShowPulseAnimation(false), 3000);
    }
    pulseTimerRef.current = setTimeout(setupPulseTimer, 300000);
  };

  const toggleBalanceVisibility = () => setIsBalanceVisible((v) => !v);

  useEffect(() => {
    const freshUser =
      profileData?.data?.data ??
      profileData?.data?.user ??
      null;
    const user = freshUser ?? data2?.user?.user;
    if (!user) return;

    try {
      setImageUrl(user.imageUrl);
      setFirstName(user.firstName || "");
      const raw = user.walletBalance;
      let walletData = { current: 0, previous: 0 };
      if (typeof raw === "string")                      walletData = JSON.parse(raw);
      else if (typeof raw === "object" && raw !== null) walletData = raw;
      setWalletBalance(walletData?.current ?? walletData?.previous ?? 0);
    } catch { setWalletBalance(0); }

    const imageUrlUpdated = user.imageUrlUpdated;
    if (imageUrlUpdated === false) {
      if (profilePromptTimerRef.current) clearTimeout(profilePromptTimerRef.current);
      profilePromptTimerRef.current = setTimeout(() => setShowProfileSheet(true), 7000);
    }

    return () => { if (profilePromptTimerRef.current) clearTimeout(profilePromptTimerRef.current); };
  }, [profileData, data2.user]);

  useEffect(() => {
    if (error) getErrorMessage(error, router, "", isAuthenticated);
  }, [error, router, isAuthenticated]);

  useEffect(() => {
    if (typeof window !== "undefined" && pathname) localStorage.setItem("pathname", pathname);
    localStorage.setItem("who", "client");
    setupPulseTimer();
    return () => { if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current); };
  }, [pathname, hasInteractedWithSwitch]);

  const handleTabChange = (tab) => { setActiveTab(tab); router.push(`/${tab}`); };

  // ─── moveToMerchant — fetches verification settings and skips disabled steps ──
  const moveToMerchant = useCallback(async () => {
    const u = myUserData?.user;

    // Fetch verification settings from API; fall back to all-enabled on error
    let settings = {
      ninVerificationEnabled:  true,
      ninImageUploadEnabled:   true,
      nameVerificationEnabled: true,
      faceVerificationEnabled: true,
    };

    setIsMerchantNavLoading(true);
    try {
      settings = await fetchVerificationSettings(accessToken);
    } catch {
      // Non-critical — proceed with defaults (all verifications required)
    } finally {
      setIsMerchantNavLoading(false);
    }

    const {
      ninVerificationEnabled,
      ninImageUploadEnabled,
      nameVerificationEnabled,
      faceVerificationEnabled,
    } = settings;

    console.log("Verification settings:", settings);
    // Step 1 — NIN verification (skip if disabled)
    if (ninVerificationEnabled && !u?.isNinVerified) {
      return router.push("/userProfile/merchantProfile");
    }

    // Step 2 — NIN image upload (skip if disabled)
    if (ninImageUploadEnabled && !u?.isninImageVerified) {
      return router.push("/userProfile/merchantProfile/merchantProfile1");
    }

    // Step 3 — Display name / name verification (skip if disabled)
    if (nameVerificationEnabled && !u?.isDisplayNameMerchantSet) {
      return router.push("/userProfile/merchantProfile/merchantProfile2");
    }

    // Step 4 — Face verification (skip if disabled)
    if (faceVerificationEnabled && !u?.isFaceVerified) {
      return router.push("/userProfile/merchantProfile/merchantProfile3");
    }

    // Account status checks — always enforced regardless of settings
    const s = u?.MerchantProfile?.accountStatus;
    if (s === "processing") return router.push("/userProfile/merchantProfile/merchantProfile4");
    if (s === "rejected")   return router.push("/userProfile/merchantProfile/merchantProfile5");
    if (s === "suspended")  return router.push("/userProfile/merchantProfile/merchantProfile6");

    return router.push("/userProfile/merchantProfile/merchantHome");
  }, [accessToken, myUserData, router]);

  useEffect(() => {
    [
      "userProfile/merchantProfile/merchantHome", "userProfile/merchantProfile",
      "userProfile/merchantProfile/merchantProfile2", "userProfile/merchantProfile/merchantProfile3",
      "userProfile/merchantProfile/merchantProfile4", "userProfile/merchantProfile/merchantProfile5",
      "userProfile/merchantProfile/merchantProfile6", "userProfile/fundwallet",
      "history", "p2p", "userProfile",
    ].forEach((r) => router.prefetch(r));
  }, [router]);

  const recentTransactions = useMemo(() => {
    if (!transactionData?.data?.data) return [];
    return transactionData.data.data.map((t) => ({
      id:            t.id || Math.random().toString(),
      title:         t.title || "Transaction",
      initials:      t.initials || (t.title ? t.title.substring(0, 2).toUpperCase() : "TX"),
      date:          t.date || new Date(t.createdAt).toLocaleDateString(),
      type:          t.type || "outgoing",
      amount:        t.amount || "0.00 ₦",
      paymentStatus: t.paymentStatus || "pending",
    }));
  }, [transactionData]);

  const handleManualRefresh = useCallback(() => {
    refetchProfile();
    refetchTransactions();
  }, [refetchProfile, refetchTransactions]);

  const handleProfileUploaded = useCallback((newUrl) => {
    if (newUrl) setImageUrl(newUrl);
    setShowProfileSheet(false);
    refetchProfile();
  }, [refetchProfile]);

  const renderTransactionsSection = () => {
    if (!transactionData && isError) return <EmptyTransactionState handleTabChange={handleTabChange} />;
    if (recentTransactions.length === 0) return <EmptyTransactionState handleTabChange={handleTabChange} />;

    return (
      <div className="space-y-3">
        {recentTransactions.map((tx) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium">
                  {tx.initials}
                </div>
                <div>
                  <p className="font-medium text-amber-900">{tx.title}</p>
                  <p className="text-xs text-amber-600">{tx.date}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className={`font-semibold ${tx.type === "incoming" ? "text-green-600" : "text-amber-700"}`}>
                  {tx.type === "incoming" ? "+" : "-"}{tx.amount}
                </p>
                <div className="mt-1">
                  <PaymentStatusBadge status={tx.paymentStatus} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="flex justify-center mt-2 pb-2">
          <button
            onClick={refetchTransactions}
            className="flex items-center gap-1.5 text-amber-500/70 text-xs py-1 px-3 rounded-full transition-colors hover:text-amber-600"
          >
            <RefreshCw className={`h-3 w-3 ${isProfileFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">

        {/* ── Top Navigation ── */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center relative">
                <Image
                  onClick={() => handleTabChange("userProfile")}
                  src={formatGoogleDriveImage(imageUrl)}
                  alt="avatar"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover rounded-full cursor-pointer"
                />
                {!showProfileSheet && (
                  <button
                    type="button"
                    onClick={() => setShowProfileSheet(true)}
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-300 flex items-center justify-center border border-amber-600"
                    title="Add profile photo"
                  >
                    <Camera className="h-2.5 w-2.5 text-amber-900" />
                  </button>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/70 leading-none">Welcome</p>
                <p className="font-semibold text-sm leading-tight truncate max-w-[110px]">{firstName || "User"}</p>
              </div>
              <LocationStatusBadge status={locationStatus} size="sm" />
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <motion.button whileTap={{ scale: 0.82 }} onClick={handleManualRefresh} title="Refresh balance">
                <RefreshCw className={`h-5 w-5 transition-colors ${isProfileFetching ? "text-white animate-spin" : "text-white/70 hover:text-white"}`} />
              </motion.button>

              <div className="relative">
                <Bell className="h-5 w-5 cursor-pointer" onClick={() => router.push("/home/notification")} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-[9px] font-bold min-w-[16px] h-4 px-0.5 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => { setIsDropdownOpen(!isDropdownOpen); handleSwitchInteraction(); }}
                  className="flex items-center space-x-1 text-white hover:bg-amber-600 px-2.5 py-1.5 rounded relative overflow-hidden"
                  disabled={isMerchantNavLoading}
                >
                  <AttentionAnimation isVisible={showPulseAnimation} duration={2} />
                  <span className="relative z-10 text-sm">{userType}</span>
                  {isMerchantNavLoading
                    ? <RefreshCw className="h-3.5 w-3.5 relative z-10 animate-spin" />
                    : <ChevronDown className="h-3.5 w-3.5 relative z-10" />
                  }
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                    >
                      <button
                        onClick={() => {
                          setUserType("Merchant");
                          setIsDropdownOpen(false);
                          handleSwitchInteraction();
                          moveToMerchant();
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 w-full text-left"
                        disabled={isMerchantNavLoading}
                      >
                        {isMerchantNavLoading ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Checking…
                          </span>
                        ) : "Merchant"}
                      </button>
                      <button
                        onClick={() => { setUserType("Client"); setIsDropdownOpen(false); handleSwitchInteraction(); }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 w-full text-left"
                      >
                        Client
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <LocationStatusIndicator status={locationStatus} accuracy={currentAccuracy} lastUpdate={lastLocationUpdate} />
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-auto">
          <WalletBalanceCard
            balance={walletBalance}
            isVisible={isBalanceVisible}
            onToggleVisibility={toggleBalanceVisibility}
            onRefresh={handleManualRefresh}
            isRefreshing={isProfileFetching}
          />

          <div className="px-4 pb-3 pt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTabChange("p2p")}
              className="w-full relative overflow-hidden rounded-2xl shadow-md"
              style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)" }}
            >
              <motion.div
                className="absolute inset-0 -skew-x-12 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)" }}
                initial={{ x: "-100%" }} animate={{ x: "220%" }}
                transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 88% 18%, rgba(255,255,255,0.18) 0%, transparent 50%)" }} />
              <div className="relative z-10 flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-base leading-tight">Place New Order</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>Fast &amp; secure P2P transaction</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                  <Zap className="h-3 w-3" /><span>Start</span><ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </motion.button>
          </div>

          <LiveActivityTicker />

          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-amber-900">Recent Transactions</h2>
              {recentTransactions.length > 0 && (
                <button onClick={() => router.push("/history")} className="text-sm text-amber-600 hover:text-amber-700">View All</button>
              )}
            </div>
            {renderTransactionsSection()}
          </div>
        </div>

        {showLocationNotification && (
          <LocationNotificationModal
            error={locationError?.message}
            isRetrying={isRetrying}
            onRetry={retryLocation}
            onDismiss={dismissNotification}
          />
        )}

        <AnimatePresence>
          {showProfileSheet && (
            <ProfilePictureSheet
              accessToken={accessToken}
              onClose={() => setShowProfileSheet(false)}
              onUploaded={handleProfileUploaded}
            />
          )}
        </AnimatePresence>

        <BottomNav handleTabChangeP={handleTabChange} activeTabP={activeTab} pendingP={numberOfOrder} />
      </div>
    </ProtectedRoute>
  );
};

export default MobileApp;
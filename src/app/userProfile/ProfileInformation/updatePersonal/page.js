"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  CalendarDays,
  X,
  FlipHorizontal,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";

// ─── DEBUG LOGGER ─────────────────────────────────────────────────────────────
const LOG_PREFIX = "[PersonalInfoEdit]";
const log  = (...args) => console.log(LOG_PREFIX,  ...args);
const warn = (...args) => console.warn(LOG_PREFIX, ...args);
const err  = (...args) => console.error(LOG_PREFIX, ...args);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatImageUrl = (url) => {
  if (!url) return "/default-avatar.png";
  if (url.includes("uc?export=view&id=")) return url;
  const match = url.match(/\/d\/(.*?)\//);
  if (match?.[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
};

const parseTel = (raw) => {
  log("parseTel() raw input:", JSON.stringify(raw), "| typeof:", typeof raw);
  if (!raw) {
    log("parseTel() → empty, defaulting to +234 / ''");
    return { telCode: "+234", tel: "" };
  }
  const str   = String(raw).trim();
  const match = str.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    const result = { telCode: match[1], tel: match[2].replace(/\s/g, "") };
    log("parseTel() → matched prefix:", result);
    return result;
  }
  const result = { telCode: "+234", tel: str.replace(/\s/g, "") };
  log("parseTel() → no prefix, used raw number:", result);
  return result;
};

/**
 * Bulletproof: slice first 10 chars, then validate shape.
 * Handles "2008-06-05T00:00:00.000Z", "2008-06-05", any variant.
 */
const toDateInputValue = (raw) => {
  log("toDateInputValue() raw:", JSON.stringify(raw));
  if (!raw) {
    log("toDateInputValue() → empty/null → ''");
    return "";
  }
  const sliced = String(raw).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(sliced)) {
    log("toDateInputValue() → sliced to:", sliced);
    return sliced;
  }
  warn("toDateInputValue() → unexpected format after slice:", raw, "→", sliced);
  return "";
};

/** Max DOB for picker: today minus 18 years as "YYYY-MM-DD" */
const getMaxDOB = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  const result = `${yyyy}-${mm}-${dd}`;
  log("getMaxDOB() →", result);
  return result;
};

/** True if "YYYY-MM-DD" is at least 18 years before today (birthday itself is valid) */
const isAtLeast18 = (dateStr) => {
  if (!dateStr) return false;
  const [y, m, day] = dateStr.slice(0, 10).split("-").map(Number);
  if (!y || !m || !day) return false;
  const dob    = new Date(y, m - 1, day);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  cutoff.setHours(23, 59, 59, 999);
  const result = dob <= cutoff;
  log(`isAtLeast18("${dateStr}") dob=${dob.toDateString()} cutoff=${cutoff.toDateString()} → ${result}`);
  return result;
};

/** "YYYY-MM-DD" → "5 June 2008" (UTC-safe, no timezone drift) */
const formatDOBPreview = (dateStr) => {
  if (!dateStr) return null;
  const s = dateStr.slice(0, 10);
  const [y, m, day] = s.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
};

/** Age in whole years from "YYYY-MM-DD" */
const calcAge = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, day] = dateStr.slice(0, 10).split("-").map(Number);
  const dob   = new Date(y, m - 1, day);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasBirthdayPassed) age--;
  return age;
};

const isEmpty = (v) => !v || String(v).trim() === "";

const REQUIRED_FIELDS = ["firstName", "lastName", "dateOfBirth", "tel"];

// ─── API ──────────────────────────────────────────────────────────────────────

const fetchUserProfile = async (accessToken) => {
  log("fetchUserProfile() → calling /api/user");
  const q   = new URLSearchParams({ token: accessToken, apiType: "userData" }).toString();
  const res = await fetch(`/api/user?${q}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  });
  log("fetchUserProfile() → status:", res.status);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json = await res.json();
  log("fetchUserProfile() → raw JSON:", JSON.stringify(json, null, 2));
  return json;
};

const updateUser = async (accessToken, payload) => {
  log("updateUser() → payload:", payload);
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ ...payload, accessToken: accessToken, apiType: "updateUser" }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    err("updateUser() failed:", res.status, errBody);
    throw new Error(errBody?.message || `Update failed: ${res.status}`);
  }
  const json = await res.json();
  log("updateUser() → response:", json);
  return json;
};

// Profile picture upload — same endpoint/contract used in MobileApp's
// ProfilePictureSheet (apiType: "updateUserProfileWithImage").
const uploadProfilePicture = async (accessToken, imageFile) => {
  log("uploadProfilePicture() → file:", imageFile.name, imageFile.type, imageFile.size);
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("accessToken", accessToken);
  formData.append("apiType", "updateUserProfileWithImage");
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    err("uploadProfilePicture() failed:", res.status, errBody);
    throw new Error(errBody?.message || `Upload failed: ${res.status}`);
  }
  const json = await res.json();
  log("uploadProfilePicture() → response:", json);
  return json;
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#b45309", marginBottom: 5,
};

const baseInput = {
  width: "100%", padding: "10px 12px",
  border: "1.5px solid #fde68a", borderRadius: 10,
  fontSize: 14, color: "#374151", background: "#fffef8",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const errorInput = {
  ...baseInput,
  border: "1.5px solid #f59e0b", color: "#92400e",
  background: "#fffbeb", boxShadow: "0 0 0 3px rgba(245,158,11,0.18)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const RequiredTag = () => (
  <span style={{
    marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#dc2626",
    background: "#fee2e2", padding: "1px 7px", borderRadius: 10, verticalAlign: "middle",
  }}>Required</span>
);

const EmptyHint = ({ text = "This field is required" }) => (
  <p style={{ fontSize: 11, color: "#d97706", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
    <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} />{text}
  </p>
);

const Toast = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3600); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 48, scale: 0.95 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      style={{
        position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 200,
        display: "flex", alignItems: "center", gap: 10, padding: "13px 22px", borderRadius: 16,
        background: type === "success" ? "#064e3b" : "#7f1d1d",
        color: "#fff", fontSize: 14, fontWeight: 500,
        boxShadow: "0 12px 40px rgba(0,0,0,0.22)", maxWidth: "92vw",
      }}
    >
      {type === "success"
        ? <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} />
        : <XCircle      style={{ width: 18, height: 18, flexShrink: 0 }} />}
      <span style={{ whiteSpace: "pre-wrap" }}>{message}</span>
    </motion.div>
  );
};

const MissingBanner = ({ count }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
    style={{
      padding: "11px 14px", borderRadius: 12,
      background: "linear-gradient(135deg,#fef3c7,#fde68a)",
      border: "1.5px solid #fbbf24", display: "flex", alignItems: "center", gap: 10,
    }}
  >
    <AlertCircle style={{ width: 18, height: 18, color: "#d97706", flexShrink: 0 }} />
    <div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#78350f", margin: 0 }}>Complete your profile</p>
      <p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>
        {count} field{count !== 1 ? "s" : ""} still missing — highlighted below.
      </p>
    </div>
  </motion.div>
);

// ─── Confetti burst (small SVG-free pure CSS/JS particles) ────────────────────
const CONFETTI_COLORS = ["#f59e0b", "#d97706", "#fbbf24", "#16a34a", "#3b82f6", "#ec4899", "#a78bfa"];

const ConfettiBurst = () => {
  const pieces = React.useMemo(() => {
    return Array.from({ length: 26 }, (_, i) => {
      const angle    = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
      const distance = 90 + Math.random() * 70;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      return {
        id: i,
        x, y,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.08,
        shape: i % 3 === 0 ? "circle" : "square",
      };
    });
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y + 40, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: 1.1, delay: p.delay, ease: [0.25, 0.8, 0.25, 1] }}
          style={{
            position: "absolute", top: "50%", left: "50%",
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : 2,
          }}
        />
      ))}
    </div>
  );
};

// ─── iOS-style centered success modal with confetti burst ─────────────────────
const PhotoSuccessModal = ({ onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(2px)",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 8 }}
        transition={{ type: "spring", damping: 18, stiffness: 320 }}
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 24,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 280,
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}
      >
        <ConfettiBurst />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 260, delay: 0.05 }}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg,#16a34a,#22c55e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
            position: "relative", zIndex: 1,
          }}
        >
          <Check style={{ width: 30, height: 30, color: "#fff", strokeWidth: 3 }} />
        </motion.div>

        <p style={{ fontSize: 17, fontWeight: 700, color: "#1f2937", margin: 0, position: "relative", zIndex: 1 }}>
          Profile photo updated!
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6, position: "relative", zIndex: 1 }}>
          Looking good ✨
        </p>
      </motion.div>
    </motion.div>
  );
};

// ─── In-App Camera Modal (ported from MobileApp's ProfilePictureSheet) ────────
const CameraModal = ({ onCapture, onClose }) => {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user");
  const [permissionErr, setPermErr] = useState("");
  const [ready, setReady]           = useState(false);
  const [flash, setFlash]           = useState(false);

  const startStream = useCallback(async (facing) => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setReady(false); setPermErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => setReady(true)).catch(() => setReady(true));
        };
      }
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")
        setPermErr("Camera permission denied. Allow camera access then try again.");
      else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError")
        setPermErr("No camera found on this device.");
      else if (e.name === "NotReadableError" || e.name === "TrackStartError")
        setPermErr("Camera is in use by another app. Close it and try again.");
      else setPermErr(`Camera error: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    startStream("user");
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startStream(next);
  };

  const handleShutter = () => {
    if (!videoRef.current || !canvasRef.current || !ready) return;
    setFlash(true); setTimeout(() => setFlash(false), 160);
    const video = videoRef.current; const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      onCapture(new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 0" }}>
        <button type="button" onClick={() => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); onClose(); }}
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X className="h-5 w-5 text-white" />
        </button>
        <button type="button" onClick={handleFlip}
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <FlipHorizontal className="h-5 w-5 text-white" />
        </button>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {flash && <div style={{ position: "absolute", inset: 0, zIndex: 8, background: "#fff", opacity: 0.8, pointerEvents: "none" }} />}
        {permissionErr ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center", gap: 16 }}>
            <XCircle className="h-14 w-14 text-red-400" />
            <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.6 }}>{permissionErr}</p>
            <button type="button" onClick={() => startStream(facingMode)} style={{ padding: "10px 28px", borderRadius: 10, background: "#f59e0b", border: "none", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Try again</button>
          </div>
        ) : (
          <>
            {!ready && (
              <div style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <RefreshCw className="h-9 w-9 text-amber-400 animate-spin" />
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Starting camera…</p>
              </div>
            )}
            <video ref={videoRef} playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none", opacity: ready ? 1 : 0, transition: "opacity 0.3s ease" }} />
            {ready && (
              <div style={{ position: "absolute", inset: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: 210, height: 210, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)" }} />
              </div>
            )}
          </>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ height: 130, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <button type="button" onClick={handleShutter} disabled={!ready || !!permissionErr} aria-label="Take photo"
          style={{ width: 72, height: 72, borderRadius: "50%", background: ready && !permissionErr ? "#ffffff" : "rgba(255,255,255,0.25)", border: "5px solid rgba(255,255,255,0.5)", boxShadow: ready && !permissionErr ? "0 0 0 6px rgba(255,255,255,0.12)" : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: ready && !permissionErr ? "pointer" : "not-allowed", transition: "all 0.15s ease" }}>
          <Camera className="h-7 w-7 text-gray-800" />
        </button>
      </div>
    </div>
  );
};

// ─── Picture source picker (camera vs gallery) ─────────────────────────────────
const PictureSourceSheet = ({ onClose, onChooseCamera, onChooseGallery }) => (
  <div
    style={{
      position: "fixed", inset: 0, zIndex: 250,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "flex-end",
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      style={{ width: "100%", background: "#fff", borderRadius: "24px 24px 0 0", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}
    >
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 0" }}>
        <div style={{ width: 30 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e", letterSpacing: "0.04em", textTransform: "uppercase" }}>Profile Photo</span>
        <button type="button" onClick={onClose}
          style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div style={{ padding: "20px 24px 36px" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#78350f", marginBottom: 4, textAlign: "center" }}>Update profile photo</p>
        <p style={{ fontSize: 13, color: "#a16207", marginBottom: 20, textAlign: "center" }}>Choose how you would like to add a photo.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" onClick={onChooseCamera}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "1px solid #fbbf24", cursor: "pointer", width: "100%" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#78350f", margin: 0 }}>Take a photo</p>
              <p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>Opens live camera view</p>
            </div>
          </button>

          <button type="button" onClick={onChooseGallery}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "#f9fafb", border: "1px solid #e5e7eb", cursor: "pointer", width: "100%" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>Upload from gallery</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Choose an existing photo</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const PersonalInfoEditPage = () => {
  const accessToken = useSelector((state) => state.user.accessToken);
  const router      = useRouter();

  const [isFetching, setIsFetching]       = useState(true);
  const [isSaving, setIsSaving]           = useState(false);
  const [fetchError, setFetchError]       = useState("");
  const [toast, setToast]                 = useState(null);
  const [showHighlight, setShowHighlight] = useState(false);
  const [dobError, setDobError]           = useState(""); // "" | "empty" | "underage"

  const [form, setForm] = useState({
    firstName:       "",
    lastName:        "",
    dateOfBirth:     "", // always "YYYY-MM-DD" or ""
    emailAddress:    "",
    telCode:         "+234",
    tel:             "",
    isPhoneVerified: false,
  });

  const originalRef   = useRef(null);
  const firstEmptyRef = useRef(null);

  const [serverImageUrl, setServerImageUrl] = useState("");
  const [previewSrc, setPreviewSrc]         = useState(null);
  const fileInputRef = useRef(null);

  // ── Profile picture picker / upload state ─────────────────────────────
  const [showSourceSheet, setShowSourceSheet]   = useState(false);
  const [showCamera, setShowCamera]             = useState(false);
  const [isUploadingPic, setIsUploadingPic]     = useState(false);
  const [showPhotoSuccess, setShowPhotoSuccess] = useState(false);

  const maxDOB = getMaxDOB();

  // ── DOB validation ─────────────────────────────────────────────────────
  const validateDOB = useCallback((dateStr) => {
    log("validateDOB() →", JSON.stringify(dateStr));
    if (isEmpty(dateStr)) {
      log("validateDOB() → EMPTY");
      setDobError("empty");
      return;
    }
    if (!isAtLeast18(dateStr)) {
      log("validateDOB() → UNDERAGE");
      setDobError("underage");
      return;
    }
    log("validateDOB() → OK");
    setDobError("");
  }, []);

  // ── Load profile ───────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!accessToken) {
      warn("loadProfile() → no accessToken, skipping");
      return;
    }
    log("loadProfile() → start");
    setIsFetching(true);
    setFetchError("");
    try {
      const json = await fetchUserProfile(accessToken);

      log("loadProfile() → json.data?.data:", json?.data?.data);
      log("loadProfile() → json.data?.user:", json?.data?.user);
      log("loadProfile() → json.data:", json?.data);

      const user =
        json?.data?.data ??
        json?.data?.user ??
        json?.data ??
        {};

      log("loadProfile() → resolved user:", JSON.stringify(user, null, 2));
      log("loadProfile() → user.dateOfBirth raw:", JSON.stringify(user.dateOfBirth));
      log("loadProfile() → user.tel raw:", JSON.stringify(user.tel));

      const { telCode, tel } = parseTel(user.tel);

      // BULLETPROOF: slice(0,10) before anything else
      const dateOfBirth = toDateInputValue(user.dateOfBirth);

      log("loadProfile() → dateOfBirth after toDateInputValue:", JSON.stringify(dateOfBirth));

      const loaded = {
        firstName:       user.firstName    ?? "",
        lastName:        user.lastName     ?? "",
        dateOfBirth,
        emailAddress:    user.emailAddress ?? "",
        telCode,
        tel,
        isPhoneVerified: user.isTelValid   ?? false,
      };

      log("loadProfile() → final form:", loaded);

      setForm(loaded);
      originalRef.current = { ...loaded };
      setServerImageUrl(user.imageUrl ?? "");
      validateDOB(dateOfBirth);

      const missingCount = REQUIRED_FIELDS.filter((k) => isEmpty(loaded[k])).length;
      const hasAgeErr    = loaded.dateOfBirth && !isAtLeast18(loaded.dateOfBirth);
      log(`loadProfile() → missingCount=${missingCount}, hasAgeErr=${hasAgeErr}`);

      if (missingCount > 0 || hasAgeErr) {
        setShowHighlight(true);
        setTimeout(
          () => firstEmptyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
          420,
        );
      }
    } catch (e) {
      err("loadProfile() → FAILED:", e);
      setFetchError(e.message || "Could not load profile.");
    } finally {
      setIsFetching(false);
      log("loadProfile() → done");
    }
  }, [accessToken, validateDOB]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    return () => { if (previewSrc?.startsWith("blob:")) URL.revokeObjectURL(previewSrc); };
  }, [previewSrc]);

  useEffect(() => { log("form state updated:", form); }, [form]);
  useEffect(() => { log("dobError updated:", dobError); }, [dobError]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    log(`handleChange() name="${name}" value="${value}"`);
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "dateOfBirth") validateDOB(value);
  };

  // ── Core: auto-upload as soon as a file is picked/captured ─────────────
  const autoUploadPhoto = useCallback(async (file, localPreviewUrl) => {
    setPreviewSrc(localPreviewUrl);
    setIsUploadingPic(true);
    try {
      const result = await uploadProfilePicture(accessToken, file);
      const newUrl =
        result?.data?.data?.imageUrl ??
        result?.data?.imageUrl ??
        result?.imageUrl ??
        null;

      if (newUrl) setServerImageUrl(newUrl);

      // Clear local preview once the real URL is known so we display the
      // server-hosted image going forward; keep preview as fallback otherwise.
      if (localPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(localPreviewUrl);
      setPreviewSrc(null);

      setShowPhotoSuccess(true);
    } catch (e) {
      err("autoUploadPhoto() failed:", e);
      if (localPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(localPreviewUrl);
      setPreviewSrc(null);
      setToast({ message: e.message || "Photo upload failed. Please try again.", type: "error" });
    } finally {
      setIsUploadingPic(false);
    }
  }, [accessToken]);

  // Gallery file selection → immediately upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      setToast({ message: "Please select a valid image file.", type: "error" });
      return;
    }
    log("handleFileChange() →", file.name, file.type, file.size);
    const localUrl = URL.createObjectURL(file);
    autoUploadPhoto(file, localUrl);
  };

  // Camera capture → immediately upload
  const handleCameraCapture = useCallback((file) => {
    log("handleCameraCapture() →", file.name, file.type, file.size);
    setShowCamera(false);
    const localUrl = URL.createObjectURL(file);
    autoUploadPhoto(file, localUrl);
  }, [autoUploadPhoto]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    log("handleSubmit() → form:", form);

    const missing = REQUIRED_FIELDS.filter((k) => isEmpty(form[k]));
    if (missing.length > 0) {
      warn("handleSubmit() → missing:", missing);
      setShowHighlight(true);
      setTimeout(() => firstEmptyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      setToast({ message: "Please fill in all highlighted fields.", type: "error" });
      return;
    }

    if (!isAtLeast18(form.dateOfBirth)) {
      warn("handleSubmit() → underage:", form.dateOfBirth);
      setDobError("underage");
      setShowHighlight(true);
      setTimeout(() => firstEmptyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      setToast({ message: "You must be at least 18 years old to use this platform.", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const orig    = originalRef.current ?? {};
      const payload = {};

      ["firstName", "lastName", "dateOfBirth"].forEach((k) => {
        const v = form[k].trim();
        if (v && v !== (orig[k] ?? "").trim()) {
          payload[k] = v;
          log(`handleSubmit() → changed: ${k} "${orig[k]}" → "${v}"`);
        }
      });

      const telChanged =
        form.tel.trim()     !== (orig.tel     ?? "").trim() ||
        form.telCode.trim() !== (orig.telCode ?? "").trim();
      if (telChanged && form.tel.trim()) {
        payload.tel     = Number(form.tel.trim());
        payload.telCode = form.telCode.trim();
        log("handleSubmit() → tel changed:", payload.tel, payload.telCode);
      }

      if (Object.keys(payload).length > 0) {
        log("handleSubmit() → updateUser payload:", payload);
        await updateUser(accessToken, payload);
        originalRef.current = { ...form };
      } else {
        log("handleSubmit() → nothing changed, skipping API call");
      }

      setShowHighlight(false);
      setDobError("");
      setToast({ message: "Profile updated successfully!", type: "success" });
      setTimeout(() => router.back(), 1800);
    } catch (e) {
      err("handleSubmit() → save failed:", e);
      setToast({ message: e.message || "Update failed. Please try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────
  const displayImage = previewSrc || formatImageUrl(serverImageUrl);
  const dobHasError  = showHighlight && (dobError === "empty" || dobError === "underage");

  const missingCount =
    REQUIRED_FIELDS.filter((k) => isEmpty(form[k])).length +
    (!isEmpty(form.dateOfBirth) && dobError === "underage" ? 1 : 0);

  // Safe DOB value for the input — ALWAYS slice(0,10), never pass ISO string
  const safeDOBValue = form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : "";

  // Human-readable preview (only when valid)
  const dobPreview = safeDOBValue && !dobError ? formatDOBPreview(safeDOBValue) : null;
  const dobAge     = safeDOBValue && !dobError ? calcAge(safeDOBValue)          : null;

  log("render() → safeDOBValue:", safeDOBValue, "| dobError:", dobError,
      "| dobPreview:", dobPreview, "| dobAge:", dobAge);

  let _firstAssigned = false;

  const getFieldStyle = (key, extra = {}) => {
    const hasErr =
      showHighlight &&
      (isEmpty(form[key]) || (key === "dateOfBirth" && dobError !== ""));
    return hasErr ? { ...errorInput, ...extra } : { ...baseInput, ...extra };
  };

  const getEmptyRef = (key) => {
    const hasErr =
      showHighlight &&
      (isEmpty(form[key]) || (key === "dateOfBirth" && dobError !== ""));
    if (hasErr && !_firstAssigned) {
      _firstAssigned = true;
      return firstEmptyRef;
    }
    return undefined;
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <div style={{ minHeight: "100vh", background: "#fffbeb" }}>
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          background: "linear-gradient(to right,#d97706,#f59e0b)",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <ArrowLeft style={{ width: 24, height: 24, color: "#fff", cursor: "pointer" }} onClick={() => router.back()} />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 17 }}>Edit Personal Information</span>
        </div>
        <div style={{ paddingTop: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <RefreshCw style={{ width: 30, height: 30, color: "#d97706", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#a16207", fontSize: 14 }}>Loading your profile…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Fetch error ────────────────────────────────────────────────────────
  if (fetchError && !form.firstName && !form.emailAddress) {
    return (
      <div style={{ minHeight: "100vh", background: "#fffbeb" }}>
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          background: "linear-gradient(to right,#d97706,#f59e0b)",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <ArrowLeft style={{ width: 24, height: 24, color: "#fff", cursor: "pointer" }} onClick={() => router.back()} />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 17 }}>Edit Personal Information</span>
        </div>
        <div style={{ padding: "100px 24px 0", textAlign: "center" }}>
          <XCircle style={{ width: 48, height: 48, color: "#dc2626", margin: "0 auto 12px" }} />
          <p style={{ color: "#b91c1c", fontWeight: 600, marginBottom: 6 }}>Failed to load profile</p>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>{fetchError}</p>
          <button onClick={loadProfile} style={{
            padding: "10px 28px", borderRadius: 10, background: "#d97706",
            border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>Retry</button>
        </div>
      </div>
    );
  }

  _firstAssigned = false;

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fffbeb", paddingBottom: 48 }}>

      {/* Header */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
        background: "linear-gradient(to right,#d97706,#f59e0b)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <ArrowLeft
          style={{ width: 24, height: 24, color: "#fff", cursor: "pointer", flexShrink: 0 }}
          onClick={() => router.back()}
        />
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 17, flex: 1 }}>
          Edit Personal Information
        </span>
        {showHighlight && missingCount > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#78350f",
            background: "#fef3c7", borderRadius: 20, padding: "3px 9px", flexShrink: 0,
          }}>
            {missingCount} issue{missingCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ paddingTop: 60, padding: "60px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        <AnimatePresence>
          {showHighlight && missingCount > 0 && <MissingBanner count={missingCount} />}
        </AnimatePresence>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Profile picture ── */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
            <p style={{ fontWeight: 600, color: "#78350f", fontSize: 15, marginBottom: 16 }}>Profile Picture</p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 110, height: 110, borderRadius: "50%",
                  border: "3px solid #f59e0b", overflow: "hidden", background: "#fef3c7",
                  position: "relative",
                }}>
                  <Image
                    src={displayImage}
                    alt="Profile"
                    width={110}
                    height={110}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      filter: isUploadingPic ? "brightness(0.6)" : "none",
                      transition: "filter 0.2s",
                    }}
                    unoptimized={displayImage.startsWith("data:") || displayImage.startsWith("blob:")}
                  />
                  {isUploadingPic && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <RefreshCw style={{ width: 26, height: 26, color: "#fff", animation: "spin 1s linear infinite" }} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSourceSheet(true)}
                  disabled={isUploadingPic}
                  style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 34, height: 34, borderRadius: "50%",
                    background: isUploadingPic ? "#d1d5db" : "#d97706",
                    border: "3px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: isUploadingPic ? "not-allowed" : "pointer",
                  }}
                >
                  <Camera style={{ width: 16, height: 16, color: "#fff" }} />
                </button>
              </div>

              {/* Hidden gallery input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <p style={{ fontSize: 12, color: "#9ca3af" }}>
                {isUploadingPic ? "Uploading your photo…" : "Tap the camera icon to update your photo"}
              </p>
            </div>
          </div>

          {/* ── Personal details ── */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
            <p style={{ fontWeight: 600, color: "#78350f", fontSize: 15, marginBottom: 20 }}>Personal Details</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* First name */}
              <div ref={getEmptyRef("firstName")}>
                <label style={labelStyle}>
                  First Name {showHighlight && isEmpty(form.firstName) && <RequiredTag />}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  style={getFieldStyle("firstName")}
                />
                {showHighlight && isEmpty(form.firstName) && <EmptyHint />}
              </div>

              {/* Last name */}
              <div ref={getEmptyRef("lastName")}>
                <label style={labelStyle}>
                  Last Name {showHighlight && isEmpty(form.lastName) && <RequiredTag />}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  style={getFieldStyle("lastName")}
                />
                {showHighlight && isEmpty(form.lastName) && <EmptyHint />}
              </div>

              {/* Date of birth */}
              <div ref={getEmptyRef("dateOfBirth")}>
                <label style={labelStyle}>
                  Date of Birth {dobHasError && <RequiredTag />}
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={safeDOBValue}    
                    onChange={handleChange}
                    max={maxDOB}
                    style={getFieldStyle("dateOfBirth", { paddingRight: 36 })}
                  />
                  <CalendarDays style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)", pointerEvents: "none",
                    width: 16, height: 16,
                    color: dobHasError ? "#d97706" : "#9ca3af",
                  }} />
                </div>

                {/* Valid: human-readable preview */}
                {dobPreview && (
                  <p style={{ fontSize: 11, color: "#16a34a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check style={{ width: 11, height: 11 }} />
                    {dobPreview} · {dobAge} years old
                  </p>
                )}

                {/* Empty error */}
                {dobHasError && dobError === "empty" && (
                  <EmptyHint text="Date of birth is required" />
                )}

                {/* Under-18 warning */}
                {dobHasError && dobError === "underage" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      marginTop: 6, padding: "9px 12px", borderRadius: 9,
                      background: "#fff7ed", border: "1px solid #fed7aa",
                      display: "flex", alignItems: "flex-start", gap: 8,
                    }}
                  >
                    <AlertCircle style={{ width: 15, height: 15, color: "#ea580c", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#c2410c", margin: 0 }}>
                        You must be at least 18 years old
                      </p>
                      <p style={{ fontSize: 11, color: "#9a3412", margin: "2px 0 0" }}>
                        Only users aged 18 and above can register. The latest allowed date of birth
                        is <strong>{formatDOBPreview(maxDOB)}</strong>.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Email — read-only */}
              <div>
                <label style={labelStyle}>
                  Email Address
                  <span style={{
                    marginLeft: 6, fontSize: 10, fontWeight: 600,
                    background: "#f3f4f6", color: "#6b7280",
                    padding: "1px 7px", borderRadius: 10, verticalAlign: "middle",
                  }}>
                    Cannot be changed
                  </span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    value={form.emailAddress}
                    readOnly
                    tabIndex={-1}
                    style={{
                      width: "100%", padding: "10px 36px 10px 12px",
                      border: "1.5px solid #e5e7eb", borderRadius: 10,
                      fontSize: 14, color: "#6b7280", background: "#f9fafb",
                      outline: "none", boxSizing: "border-box", cursor: "default",
                    }}
                  />
                  <Lock style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)", width: 15, height: 15, color: "#9ca3af",
                  }} />
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                  Contact support to update your email address.
                </p>
              </div>

              {/* Phone */}
              <div ref={getEmptyRef("tel")}>
                <label style={labelStyle}>
                  Phone Number {showHighlight && isEmpty(form.tel) && <RequiredTag />}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    name="telCode"
                    value={form.telCode}
                    onChange={handleChange}
                    placeholder="+234"
                    maxLength={6}
                    style={{
                      width: 76, flexShrink: 0, padding: "10px 8px",
                      border: `1.5px solid ${showHighlight && isEmpty(form.tel) ? "#f59e0b" : "#fde68a"}`,
                      borderRadius: 10, fontSize: 14, color: "#374151",
                      background: showHighlight && isEmpty(form.tel) ? "#fffbeb" : "#fffef8",
                      outline: "none", boxSizing: "border-box", textAlign: "center",
                    }}
                  />
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="tel"
                      name="tel"
                      value={form.tel}
                      onChange={handleChange}
                      placeholder="8001234567"
                      style={getFieldStyle("tel", { paddingRight: 36 })}
                    />
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                      {form.isPhoneVerified
                        ? <Check       style={{ width: 17, height: 17, color: "#16a34a" }} />
                        : <AlertCircle style={{ width: 17, height: 17, color: showHighlight && isEmpty(form.tel) ? "#f59e0b" : "#d1d5db" }} />}
                    </span>
                  </div>
                </div>
                {showHighlight && isEmpty(form.tel) && <EmptyHint text="Phone number is required" />}
                {!isEmpty(form.tel) && !form.isPhoneVerified && (
                  <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 3 }}>Phone not yet verified</p>
                )}
              </div>

            </div>

            {/* Save button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSaving}
              style={{
                width: "100%", marginTop: 28, padding: "14px 0",
                borderRadius: 12, border: "none",
                background: isSaving
                  ? "rgba(217,119,6,0.45)"
                  : "linear-gradient(135deg,#92400e 0%,#d97706 100%)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: isSaving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  Saving…
                </>
              ) : "Save Changes"}
            </motion.button>
          </div>

        </form>
      </div>

      {/* ── Picture source picker sheet ── */}
      <AnimatePresence>
        {showSourceSheet && (
          <PictureSourceSheet
            onClose={() => setShowSourceSheet(false)}
            onChooseCamera={() => { setShowSourceSheet(false); setShowCamera(true); }}
            onChooseGallery={() => { setShowSourceSheet(false); fileInputRef.current?.click(); }}
          />
        )}
      </AnimatePresence>

      {/* ── In-app camera ── */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* ── iOS-style success modal w/ confetti burst ── */}
      <AnimatePresence>
        {showPhotoSuccess && (
          <PhotoSuccessModal onClose={() => setShowPhotoSuccess(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            key={`${toast.type}-${toast.message}`}
            message={toast.message}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus:not([readOnly]) {
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.18) !important;
        }
      `}</style>
    </div>
  );
};

export default PersonalInfoEditPage;
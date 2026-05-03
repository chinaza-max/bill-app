"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  CreditCard,
  Bell,
  Users,
  Shield,
  FileText,
  ChevronRight,
  Wallet,
  Store,
  HelpCircle,
  Camera,
  Upload,
  RotateCcw,
  X,
  Check,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FlipHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── MUST match home page exactly ─────────────────────────────────────────────
const formatGoogleDriveImage = (url) => {
  if (!url) return "/default-avatar.png";
  if (url.includes("uc?export=view&id=")) return url;
  const match = url.match(/\/d\/(.*?)\//);
  if (match && match[1])
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
};

// ─── MUST match home page query key + fetcher exactly ─────────────────────────
const USER_PROFILE_QUERY_KEY = "userProfile";

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

// ─── Profile Picture Upload ───────────────────────────────────────────────────
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

// ─── Camera Modal ─────────────────────────────────────────────────────────────
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play().then(() => setReady(true)).catch(() => setReady(true));
      }
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") setPermErr("Camera permission denied. Please allow camera access in your settings.");
      else if (err.name === "NotFoundError") setPermErr("No camera found on this device.");
      else if (err.name === "NotReadableError") setPermErr("Camera is in use by another app. Please close it and try again.");
      else setPermErr(`Camera error: ${err.message}`);
    }
  }, []);

  useEffect(() => { startStream("user"); return () => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = () => { const next = facingMode === "user" ? "environment" : "user"; setFacingMode(next); startStream(next); };

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
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", padding: "16px 16px 0" }}>
        <button type="button" onClick={() => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); onClose(); }} style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X className="h-5 w-5 text-white" /></button>
        <button type="button" onClick={handleFlip} style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><FlipHorizontal className="h-5 w-5 text-white" /></button>
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
            {!ready && <div style={{ position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}><RefreshCw className="h-9 w-9 text-amber-400 animate-spin" /><p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Starting camera…</p></div>}
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none", opacity: ready ? 1 : 0, transition: "opacity 0.3s ease" }} />
            {ready && <div style={{ position: "absolute", inset: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><div style={{ width: 210, height: 210, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)" }} /></div>}
          </>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ height: 130, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <button type="button" onClick={handleShutter} disabled={!ready || !!permissionErr} style={{ width: 72, height: 72, borderRadius: "50%", background: ready && !permissionErr ? "#fff" : "rgba(255,255,255,0.25)", border: "5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: ready && !permissionErr ? "pointer" : "not-allowed" }}>
          <Camera className="h-7 w-7 text-gray-800" />
        </button>
      </div>
    </div>
  );
};

// ─── Profile Picture Sheet ────────────────────────────────────────────────────
const ProfilePictureSheet = ({ onClose, onUploaded, accessToken }) => {
  const [stage, setStage]               = useState("picker");
  const [previewSrc, setPreviewSrc]     = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg]         = useState("");
  const galleryInputRef                 = useRef(null);

  const handleCameraCapture = useCallback((file) => { setPreviewSrc(URL.createObjectURL(file)); setSelectedFile(file); setStage("preview"); }, []);

  const handleGalleryFile = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    if (!file.type.startsWith("image/")) { setErrorMsg("Please select a valid image file."); setStage("error"); return; }
    const reader = new FileReader();
    reader.onload  = (ev) => { setPreviewSrc(ev.target.result); setSelectedFile(file); setStage("preview"); };
    reader.onerror = ()   => { setErrorMsg("Could not read file. Please try again."); setStage("error"); };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = async () => {
    if (!selectedFile) return;
    setStage("uploading");
    try {
      const result = await uploadProfilePicture(accessToken, selectedFile);
      const newUrl = result?.data?.data?.imageUrl ?? result?.data?.imageUrl ?? result?.imageUrl ?? null;
      setStage("done");
      setTimeout(() => onUploaded(newUrl), 800);
    } catch (err) { setErrorMsg(err.message || "Upload failed. Please try again."); setStage("error"); }
  };

  const handleRetake = () => { if (previewSrc?.startsWith("blob:")) URL.revokeObjectURL(previewSrc); setPreviewSrc(null); setSelectedFile(null); setErrorMsg(""); setStage("picker"); };

  if (stage === "camera") return <CameraModal onCapture={handleCameraCapture} onClose={() => setStage("picker")} />;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleGalleryFile} aria-hidden="true" tabIndex={-1} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
        style={{ width: "100%", background: "#fff", borderRadius: "24px 24px 0 0", padding: "0 0 40px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb" }} /></div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 0" }}>
          <button type="button" onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X className="h-4 w-4 text-gray-500" /></button>
        </div>

        {stage === "picker" && (
          <div style={{ padding: "8px 24px 0" }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#78350f", marginBottom: 4 }}>Update profile photo</p>
            <p style={{ fontSize: 13, color: "#a16207", marginBottom: 24 }}>Choose how you would like to update your photo.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button type="button" onClick={() => setStage("camera")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1px solid #fbbf24", cursor: "pointer", width: "100%" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Camera className="h-5 w-5 text-white" /></div>
                <div style={{ textAlign: "left" }}><p style={{ fontSize: 14, fontWeight: 500, color: "#78350f", margin: 0 }}>Take a photo</p><p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>Opens live camera view</p></div>
              </button>
              <button type="button" onClick={() => galleryInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: "#f9fafb", border: "1px solid #e5e7eb", cursor: "pointer", width: "100%" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Upload className="h-5 w-5 text-white" /></div>
                <div style={{ textAlign: "left" }}><p style={{ fontSize: 14, fontWeight: 500, color: "#374151", margin: 0 }}>Upload from gallery</p><p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Choose an existing photo</p></div>
              </button>
            </div>
            <button type="button" onClick={onClose} style={{ width: "100%", marginTop: 20, padding: "10px 0", background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer" }}>Cancel</button>
          </div>
        )}

        {stage === "preview" && previewSrc && (
          <div style={{ padding: "8px 24px 0", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#78350f", marginBottom: 4 }}>Looks good?</p>
            <p style={{ fontSize: 13, color: "#a16207", marginBottom: 20 }}>Preview your photo before saving it.</p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", border: "4px solid #f59e0b" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleRetake} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 12, background: "#f3f4f6", border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 500, color: "#374151", cursor: "pointer" }}><RotateCcw className="h-4 w-4" /> Retake</button>
              <button type="button" onClick={handleConfirm} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 12, background: "linear-gradient(135deg,#92400e,#d97706)", border: "none", fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer" }}><Check className="h-4 w-4" /> Save photo</button>
            </div>
          </div>
        )}

        {stage === "uploading" && (
          <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
            {previewSrc && <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid #f59e0b", opacity: 0.7 }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={previewSrc} alt="Uploading" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}><RefreshCw className="h-5 w-5 animate-spin text-amber-600" /><p style={{ fontSize: 15, fontWeight: 500, color: "#78350f" }}>Uploading…</p></div>
            <p style={{ fontSize: 12, color: "#a16207" }}>Almost done, please wait</p>
          </div>
        )}

        {stage === "done" && (
          <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#15803d" }}>Photo saved!</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Your profile photo has been updated.</p>
          </div>
        )}

        {stage === "error" && (
          <div style={{ padding: "8px 24px 0", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><XCircle className="h-8 w-8 text-red-500" /></div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#b91c1c", marginBottom: 6 }}>Upload failed</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>{errorMsg}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleRetake} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "#f3f4f6", border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 500, color: "#374151", cursor: "pointer" }}>Try again</button>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: "none", border: "1px solid #e5e7eb", fontSize: 14, color: "#9ca3af", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
const ProfilePage = () => {
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const router      = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useSelector((state) => state.user.accessToken);
  const myUserData  = useSelector((state) => state.user.user);

  // ── Uses the SAME query key as home page so both screens share one cache ──
  const { data: profileData } = useQuery({
    queryKey: [USER_PROFILE_QUERY_KEY, accessToken],
    queryFn:  () => fetchUserProfile(accessToken),
    enabled:  !!accessToken,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // ── Derive display values directly from query data — no separate useState ──
  // Any cache update from home page (or here) immediately reflects here too.
  const freshUser =
    profileData?.data?.data ??
    profileData?.data?.user ??
    myUserData?.user ??
    null;

  const name     = freshUser ? `${freshUser.firstName ?? ""} ${freshUser.lastName ?? ""}`.trim() : "";
  const email    = freshUser?.emailAddress ?? "";
  const imageUrl = formatGoogleDriveImage(freshUser?.imageUrl ?? "");

  // ── After upload: invalidate shared cache — home page updates too ─────
  const handleProfileUploaded = useCallback(() => {
    setShowProfileSheet(false);
    // Invalidating this key forces BOTH home page and profile page to refetch,
    // so they always show the same image without passing props or using extra state.
    queryClient.invalidateQueries({ queryKey: [USER_PROFILE_QUERY_KEY, accessToken] });
  }, [queryClient, accessToken]);

  const handleBack = () => router.push("/home");

  const handleNavigation = (path) => {
    if (path === "/userProfile") moveToMerchant();
    else router.push(path);
  };

  useEffect(() => {
    router.prefetch("userProfile/ProfileInformation");
    router.prefetch("userProfile/merchantProfile");
    router.prefetch("userProfile/fundwallet");
    router.prefetch("sign-in");
  }, [router]);

  const moveToMerchant = () => {
    const u = myUserData?.user;
    if (!u?.isNinVerified)                                  return router.push("/userProfile/merchantProfile");
    if (!u?.isDisplayNameMerchantSet)                       return router.push("/userProfile/merchantProfile/merchantProfile2");
    if (!u?.isFaceVerified)                                 return router.push("/userProfile/merchantProfile/merchantProfile3");
    if (u?.MerchantProfile?.accountStatus === "processing") return router.push("/userProfile/merchantProfile/merchantProfile4");
    if (u?.MerchantProfile?.accountStatus === "rejected")   return router.push("/userProfile/merchantProfile/merchantProfile5");
    if (u?.MerchantProfile?.accountStatus === "suspended")  return router.push("/userProfile/merchantProfile/merchantProfile6");
    return router.push("/userProfile/merchantProfile/merchantHome");
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("userToken");
    router.push("/sign-in");
  };

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-emerald-700 px-4 mb-2">{title}</h2>
      <div className="bg-white rounded-lg shadow-sm">{children}</div>
    </div>
  );

  const MenuItem = ({ icon: Icon, title, subtitle, path, highlight }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-between p-4 border-b border-amber-100 last:border-0 hover:bg-emerald-50/30"
      onClick={() => handleNavigation(path)}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full ${highlight ? "bg-emerald-50" : "bg-amber-50"} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${highlight ? "text-emerald-600" : "text-amber-600"}`} />
        </div>
        <div className="text-left">
          <div className="text-amber-900 font-medium">{title}</div>
          {subtitle && <div className={`text-sm ${highlight ? "text-emerald-600" : "text-amber-500"}`}>{subtitle}</div>}
        </div>
      </div>
      <ChevronRight className={`h-5 w-5 ${highlight ? "text-emerald-400" : "text-amber-400"}`} />
    </motion.button>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Top Nav */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft className="h-6 w-6 cursor-pointer" onClick={handleBack} />
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-gradient-to-b from-amber-500 to-amber-600 text-white p-6">
          <div className="flex items-center space-x-4">
            {/* Avatar — same imageUrl derivation as home page */}
            <div className="relative flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileSheet(true)}
                className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center border-2 border-emerald-400/30 overflow-hidden focus:outline-none"
              >
                {imageUrl && imageUrl !== "/default-avatar.png" ? (
                  <Image
                    src={imageUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-full"
                    unoptimized={
                      imageUrl.includes("drive.google.com") ||
                      imageUrl.includes("googleusercontent.com")
                    }
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <User className="h-8 w-8 text-white/70" />
                )}
              </motion.button>

              {/* Camera badge */}
              <button
                type="button"
                onClick={() => setShowProfileSheet(true)}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center border border-amber-600 shadow"
              >
                <Camera className="h-3 w-3 text-amber-900" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-semibold">{name || "User"}</h2>
              <p className="text-emerald-100">{email}</p>
              <span className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full text-xs mt-2 text-emerald-100">
                Verified Account
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto py-4">
          <Section title="Account">
            <MenuItem icon={User}       title="Profile Information"  subtitle="Change phone number, email address" path="/userProfile/ProfileInformation" highlight />
            <MenuItem icon={Store}      title="Merchant Account"     subtitle="Create a merchant account"          path="/userProfile"                    highlight />
            <MenuItem icon={CreditCard} title="Payment Methods"      subtitle="Saved cards, PayPal"                path="/userProfile/payment-methods" />
            <MenuItem icon={Wallet}     title="Wallet"               subtitle="Upgrade to wallet"                  path="/userProfile/fundwallet"         highlight />
            <MenuItem icon={Shield}     title="Tier"                 subtitle="Upgrade your Tier"                  path="/userProfile/tier"               highlight />
            <MenuItem icon={Shield}     title="Security"             subtitle="Change your pin"                    path="/userProfile/updatepin"          highlight />
          </Section>

          <Section title="Preferences">
            <MenuItem icon={Bell}  title="Notifications"  subtitle="Push notifications" path="/userProfile/notification" />
            <MenuItem icon={Users} title="Invite Friends" subtitle="Tell a friend"      path="/userProfile/invite"       highlight />
          </Section>

          <Section title="Help & Support">
            <MenuItem icon={Shield}     title="Privacy Policy"        subtitle="Security notifications" path="/profile/privacy" />
            <MenuItem icon={FileText}   title="Terms & Conditions"    subtitle="Cancellation Policy"    path="/profile/terms" />
            <MenuItem icon={HelpCircle} title="Support or suggestion" subtitle="Get help"               path="/userProfile/support" highlight />
          </Section>

          <div className="px-4 py-6 space-y-4">
            <div className="text-center text-amber-400 text-sm">Version 1.0.0</div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-red-50 text-red-600 rounded-lg py-3 px-4 font-medium hover:bg-red-100 transition-colors"
              onClick={handleLogout}
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showProfileSheet && (
          <ProfilePictureSheet
            accessToken={accessToken}
            onClose={() => setShowProfileSheet(false)}
            onUploaded={handleProfileUploaded}
          />
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
};

export default ProfilePage;
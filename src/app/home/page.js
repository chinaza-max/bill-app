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

// ─── Profile Picture Upload API ───────────────────────────────────────────────
const uploadProfilePicture = async (accessToken, imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("accessToken", accessToken);
  formData.append("apiType", "updateUserProfileWithImage");

  const response = await fetch("/api/user", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Do NOT set Content-Type — let the browser set multipart/form-data boundary
    },
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

// ─── Profile Picture Bottom Sheet ─────────────────────────────────────────────
const ProfilePictureSheet = ({ onClose, onUploaded, accessToken }) => {
  const [stage, setStage]               = useState("picker");
  const [previewSrc, setPreviewSrc]     = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg]         = useState("");

  const cameraInputRef  = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewSrc(ev.target.result);
      setSelectedFile(file);
      setStage("preview");
    };
    reader.readAsDataURL(file);
  };

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

  const handleRetake = () => {
    setPreviewSrc(null);
    setSelectedFile(null);
    setErrorMsg("");
    setStage("picker");
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <input
        key="camera-input"
        ref={cameraInputRef}
        type="file"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      <input
        key="gallery-input"
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileSelected}
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

        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 0" }}>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6", border: "none", borderRadius: "50%",
              width: 30, height: 30, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer",
            }}
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* ── PICKER STAGE ── */}
        {stage === "picker" && (
          <div style={{ padding: "8px 24px 0" }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#78350f", marginBottom: 4 }}>
              Add a profile photo
            </p>
            <p style={{ fontSize: 13, color: "#a16207", marginBottom: 24 }}>
              Complete your profile. This takes less than a minute.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 14,
                  background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                  border: "1px solid #fbbf24",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "#f59e0b", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#78350f", margin: 0 }}>Take a photo</p>
                  <p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>Opens your camera directly</p>
                </div>
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 14,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "#b45309", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#374151", margin: 0 }}>Upload from gallery</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Choose an existing photo</p>
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
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

        {/* ── PREVIEW STAGE ── */}
        {stage === "preview" && previewSrc && (
          <div style={{ padding: "8px 24px 0", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 500, color: "#78350f", marginBottom: 4 }}>
              Looks good?
            </p>
            <p style={{ fontSize: 13, color: "#a16207", marginBottom: 20 }}>
              Preview your photo before saving it.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{
                width: 140, height: 140, borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid #f59e0b",
                boxShadow: "0 0 0 4px #fef3c7",
              }}>
                <img
                  src={previewSrc}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleRetake}
                style={{
                  flex: 1, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  padding: "12px 0", borderRadius: 12,
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  fontSize: 14, fontWeight: 500, color: "#374151",
                  cursor: "pointer",
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </button>

              <button
                onClick={handleConfirm}
                style={{
                  flex: 2, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  padding: "12px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, #92400e, #d97706)",
                  border: "none",
                  fontSize: 14, fontWeight: 500, color: "#fff",
                  cursor: "pointer",
                }}
              >
                <Check className="h-4 w-4" />
                Save photo
              </button>
            </div>
          </div>
        )}

        {/* ── UPLOADING STAGE ── */}
        {stage === "uploading" && (
          <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
            {previewSrc && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  overflow: "hidden", border: "3px solid #f59e0b", opacity: 0.7,
                }}>
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

        {/* ── DONE STAGE ── */}
        {stage === "done" && (
          <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#dcfce7", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#15803d" }}>Photo saved!</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Your profile photo has been updated.</p>
          </div>
        )}

        {/* ── ERROR STAGE ── */}
        {stage === "error" && (
          <div style={{ padding: "8px 24px 0", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#fee2e2", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#b91c1c", marginBottom: 6 }}>Upload failed</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>{errorMsg}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleRetake}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12,
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  fontSize: 14, fontWeight: 500, color: "#374151", cursor: "pointer",
                }}
              >
                Try again
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12,
                  background: "none", border: "1px solid #e5e7eb",
                  fontSize: 14, color: "#9ca3af", cursor: "pointer",
                }}
              >
                Cancel
              </button>
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

  // ─── Profile picture prompt state ─────────────────────────────────────────
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const profilePromptTimerRef = useRef(null);

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

  // ─── Profile query ────────────────────────────────────────────────────────
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

  // ─── Transactions query ───────────────────────────────────────────────────
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

  // ─── visibilitychange ─────────────────────────────────────────────────────
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

  // ─── Unread count ─────────────────────────────────────────────────────────
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

  // ─── Sync profile data + trigger profile picture prompt ───────────────────
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

    // Only prompt if imageUrlUpdated is explicitly false
    const imageUrlUpdated = user.imageUrlUpdated;
    if (imageUrlUpdated === false) {
      if (profilePromptTimerRef.current) clearTimeout(profilePromptTimerRef.current);
      profilePromptTimerRef.current = setTimeout(() => {
        setShowProfileSheet(true);
      }, 7000);
    }

    return () => {
      if (profilePromptTimerRef.current) clearTimeout(profilePromptTimerRef.current);
    };
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

  const moveToMerchant = () => {
    const u = myUserData?.user;
    if (!u?.isNinVerified)            return router.push("/userProfile/merchantProfile");
    if (!u?.isninImageVerified) return router.push("/userProfile/merchantProfile/merchantProfile1");
    if (!u?.isDisplayNameMerchantSet) return router.push("/userProfile/merchantProfile/merchantProfile2");
    if (!u?.isFaceVerified)           return router.push("/userProfile/merchantProfile/merchantProfile3");
    const s = u?.MerchantProfile?.accountStatus;
    if (s === "processing")           return router.push("/userProfile/merchantProfile/merchantProfile4");
    if (s === "rejected")             return router.push("/userProfile/merchantProfile/merchantProfile5");
    if (s === "suspended")            return router.push("/userProfile/merchantProfile/merchantProfile6");
    return router.push("/userProfile/merchantProfile/merchantHome");
  };

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

  // ─── Called when the sheet completes a successful upload ──────────────────
  const handleProfileUploaded = useCallback((newUrl) => {
    if (newUrl) setImageUrl(newUrl);
    setShowProfileSheet(false);
    refetchProfile();
  }, [refetchProfile]);

  const renderTransactionsSection = () => {
    if (!transactionData && isError) {
      return <EmptyTransactionState handleTabChange={handleTabChange} />;
    }
    if (recentTransactions.length === 0) {
      return <EmptyTransactionState handleTabChange={handleTabChange} />;
    }

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

            {/* Left — avatar + name */}
            <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center relative">
                {/* ── FIXED: use next/image + formatGoogleDriveImage (same as merchant home) ── */}
                <Image
                  onClick={() => handleTabChange("userProfile")}
                  src={formatGoogleDriveImage(imageUrl)}
                  alt="avatar"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover rounded-full cursor-pointer"
                />
                {/* Small camera badge on avatar */}
                {showProfileSheet === false && (
                  <button
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
                <p className="font-semibold text-sm leading-tight truncate max-w-[110px]">
                  {firstName || "User"}
                </p>
              </div>
              <LocationStatusBadge status={locationStatus} size="sm" />
            </div>

            {/* Right — refresh + bell + role switcher */}
            <div className="flex items-center space-x-3 flex-shrink-0">

              <motion.button
                whileTap={{ scale: 0.82 }}
                onClick={handleManualRefresh}
                title="Refresh balance"
              >
                <RefreshCw
                  className={`h-5 w-5 transition-colors ${
                    isProfileFetching
                      ? "text-white animate-spin"
                      : "text-white/70 hover:text-white"
                  }`}
                />
              </motion.button>

              <div className="relative">
                <Bell
                  className="h-5 w-5 cursor-pointer"
                  onClick={() => router.push("/home/notification")}
                />
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
                >
                  <AttentionAnimation isVisible={showPulseAnimation} duration={2} />
                  <span className="relative z-10 text-sm">{userType}</span>
                  <ChevronDown className="h-3.5 w-3.5 relative z-10" />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
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
                      >
                        Merchant
                      </button>
                      <button
                        onClick={() => {
                          setUserType("Client");
                          setIsDropdownOpen(false);
                          handleSwitchInteraction();
                        }}
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
            <LocationStatusIndicator
              status={locationStatus}
              accuracy={currentAccuracy}
              lastUpdate={lastLocationUpdate}
            />
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
                initial={{ x: "-100%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 88% 18%, rgba(255,255,255,0.18) 0%, transparent 50%)" }}
              />
              <div className="relative z-10 flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
                  >
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-base leading-tight">Place New Order</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                      Fast &amp; secure P2P transaction
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}
                >
                  <Zap className="h-3 w-3" />
                  <span>Start</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </motion.button>
          </div>

          <LiveActivityTicker />

          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-amber-900">Recent Transactions</h2>
              {recentTransactions.length > 0 && (
                <button
                  onClick={() => router.push("/history")}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  View All
                </button>
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

        {/* ── Profile Picture Bottom Sheet ── */}
        <AnimatePresence>
          {showProfileSheet && (
            <ProfilePictureSheet
              accessToken={accessToken}
              onClose={() => setShowProfileSheet(false)}
              onUploaded={handleProfileUploaded}
            />
          )}
        </AnimatePresence>

        <BottomNav
          handleTabChangeP={handleTabChange}
          activeTabP={activeTab}
          pendingP={numberOfOrder}
        />
      </div>
    </ProtectedRoute>
  );
};

export default MobileApp;
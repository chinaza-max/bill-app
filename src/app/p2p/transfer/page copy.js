"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Building2,
  Wallet,
  Eye,
  Copy,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BadgeCheck,
  Hash,
  User,
  Banknote,
  Shield,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import useRequest from "@/hooks/useRequest";
import getErrorMessage from "@/app/component/error";

// ── Polling config ────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS  = 5000;
const MAX_POLL_ATTEMPTS = 18;
const INITIAL_DELAY_MS  = 3000;

// ── Account TTL: 30 min ───────────────────────────────────────────────────────
const ACCOUNT_TTL_SECONDS = 1800;

const CONFIRM = {
  IDLE:      "idle",
  CHECKING:  "checking",
  SUCCESS:   "success",
  NOT_FOUND: "not_found",
  ERROR:     "error",
};

const fmt = (n) => Number(n).toLocaleString("en-NG");

const BANK_NAMES = {
  "090286": "Safe Haven MFB",
  "000014": "Access Bank",
  "000004": "United Bank for Africa",
  "000016": "Zenith Bank",
  "000010": "Ecobank",
  "000013": "GTBank",
  "000008": "Polaris Bank",
  "000003": "Sterling Bank",
  "000023": "Citibank",
};
const getBankName = (code) => BANK_NAMES[code] ?? (code ? `Bank (${code})` : "—");

const formatCountdown = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ── useCopy ───────────────────────────────────────────────────────────────────
const useCopy = () => {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  return { copiedKey, copy };
};

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchMerchantInformation = async (accessToken) => {
  if (!accessToken) return { data: null };
  const selectedMerchantId = localStorage.getItem("selectedMerchantId");
  if (!selectedMerchantId) return { data: null };
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId2: selectedMerchantId, accessToken, apiType: "getMerchantInformation" }),
  });
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

const fetchChargeSummary = async (accessToken, amount) => {
  if (!accessToken) return { data: null };
  const selectedMerchantId = localStorage.getItem("selectedMerchantId");
  if (!selectedMerchantId) return { data: null };
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, apiType: "getChargeSummary", amount: Number(amount), userId2: selectedMerchantId }),
  });
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

const makeOrderPayment = async (accessToken, userId, userId2, amount, amountOrder) => {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, apiType: "makeOrderPayment", userId, userId2, amount, amountOrder }),
  });
  return res.json();
};

const fetchWalletBalance = async (accessToken) => {
  if (!accessToken) return null;
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, apiType: "getWalletBalance" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.walletBalance ?? data?.walletBalance ?? null;
};

// ── Countdown Timer (Prominent Banner version) ────────────────────────────────
const CountdownTimerBanner = ({ onExpire }) => {
  const [secs, setSecs] = useState(ACCOUNT_TTL_SECONDS);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSecs((p) => {
        if (p <= 1) { clearInterval(ref.current); onExpire?.(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [onExpire]);

  const pct    = (secs / ACCOUNT_TTL_SECONDS) * 100;
  const urgent = secs <= 300;
  const danger = secs <= 60;

  const bgColor    = danger ? "#ef4444" : urgent ? "#f59e0b" : "#10b981";
  const bgLight    = danger ? "rgba(239,68,68,0.08)" : urgent ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)";
  const borderClr  = danger ? "rgba(239,68,68,0.25)" : urgent ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.25)";
  const label      = danger ? "⚠️ Expiring very soon!" : urgent ? "⏳ Account expiring" : "✅ Account valid for";

  const R    = 18;
  const circ = 2 * Math.PI * R;
  const dash = circ - (pct / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: bgLight, border: `1.5px solid ${borderClr}` }}
    >
      {/* Progress bar along the top */}
      <div className="h-1 w-full" style={{ background: "rgba(0,0,0,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: bgColor, width: `${pct}%`, transition: "width 1s linear, background 0.4s" }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* SVG ring */}
        <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" />
            <circle
              cx="22" cy="22" r={R} fill="none"
              stroke={bgColor} strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dash}
              transform="rotate(-90 22 22)"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Timer style={{ color: bgColor }} className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: bgColor }}>{label}</p>
          <p className="text-[26px] font-bold leading-none tabular-nums" style={{ color: bgColor, fontFamily: "ui-monospace, monospace" }}>
            {formatCountdown(secs)}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: bgColor, opacity: 0.65 }}>
            {secs === 0 ? "Expired — generate a new account" : "Transfer before this timer runs out"}
          </p>
        </div>

        {/* Pulse dot when urgent */}
        {urgent && secs > 0 && (
          <div className="relative w-3 h-3 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: bgColor }} />
            <span className="relative inline-flex rounded-full w-3 h-3" style={{ background: bgColor }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── InfoRow ───────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, iconBg, iconColor, label, value, onCopy, isCopied }) => (
  <div className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <p className="text-[15px] font-semibold text-gray-800 truncate" style={{ fontFamily: "ui-monospace, monospace" }}>{value}</p>
    </div>
    {onCopy && (
      <motion.button
        whileTap={{ scale: 0.86 }}
        onClick={onCopy}
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: isCopied ? "#d1fae5" : "#f3f4f6" }}
      >
        {isCopied
          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
          : <Copy className="h-3.5 w-3.5 text-gray-400" />}
      </motion.button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const TransferPage = () => {
  const [amount, setAmount]                   = useState("");
  const [transferType, setTransferType]       = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sliderPosition, setSliderPosition]   = useState("start");
  const [chargeData, setChargeData]           = useState(null);
  const [walletBalance, setWalletBalance]     = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError]       = useState(null);
  const [virtualAccount, setVirtualAccount]   = useState(null);
  const [transactionId, setTransactionId]     = useState(null); // stored separately from account obj
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);
  const [accountExpired, setAccountExpired]   = useState(false);

  const [confirmStatus, setConfirmStatus]     = useState(CONFIRM.IDLE);
  const [confirmMessage, setConfirmMessage]   = useState("");
  const [pollAttempt, setPollAttempt]         = useState(0);
  const pollTimerRef        = useRef(null);
  const isMountedRef        = useRef(true);

  // ── Scroll refs ───────────────────────────────────────────────────────────
  const accountCardRef  = useRef(null);
  const transferSecRef  = useRef(null);

  const sliderControls  = useAnimation();
  const SLIDER_THRESHOLD = 0.5;
  const SLIDER_WIDTH     = 300;
  const router = useRouter();

  const { copiedKey, copy } = useCopy();
  const { data: accountData, error: accountError, request: generateAccount, errorDetail: accountErrorDetail } = useRequest();

  const accessToken     = useSelector((s) => s.user.accessToken);
  const isAuthenticated = useSelector((s) => s.user.isAuthenticated);
  const myUserData      = useSelector((s) => s.user.user);

  useEffect(() => {
    return () => { isMountedRef.current = false; clearTimeout(pollTimerRef.current); };
  }, []);

  function safeParse(input) {
    if (typeof input === "string") { try { return JSON.parse(input); } catch { return {}; } }
    return input || {};
  }

  useEffect(() => {
    if (myUserData?.user?.walletBalance) {
      try { const b = safeParse(myUserData.user.walletBalance); setWalletBalance(b.current || 0); }
      catch { setWalletBalance(0); }
    }
  }, [myUserData]);

  useEffect(() => { router.prefetch("orders"); });

  const refreshWalletBalance = useCallback(async () => {
    const fresh = await fetchWalletBalance(accessToken);
    if (fresh === null) return;
    try {
      const parsed = typeof fresh === "string" ? JSON.parse(fresh) : fresh;
      setWalletBalance(Number(parsed?.current ?? parsed ?? 0));
    } catch { setWalletBalance(Number(fresh) || 0); }
  }, [accessToken]);

  // ── Merchant ──────────────────────────────────────────────────────────────
  const { data: merchantData, isLoading: isMerchantLoading } = useQuery({
    queryKey: ["merchantInformation", accessToken],
    queryFn:  () => fetchMerchantInformation(accessToken),
    enabled:  !!accessToken && !!isAuthenticated && !!localStorage.getItem("selectedMerchantId"),
    retry: 3, retryDelay: 1000, refetchOnWindowFocus: false, staleTime: 60000, cacheTime: 300000,
  });

  const merchantInfo = merchantData?.data?.data || null;
  const range   = merchantInfo ? { min: merchantInfo.minAmount || 1000, max: merchantInfo.maxAmount || 5000 } : { min: 0, max: 0 };
  const merchant = merchantInfo ? merchantInfo.displayName || "Unknown" : "Loading...";

  // ── Charge ────────────────────────────────────────────────────────────────
  const { data: chargeSummaryData, isLoading: isChargeSummaryLoading, refetch: refetchChargeSummary } = useQuery({
    queryKey: ["chargeSummary", accessToken, amount],
    queryFn:  () => fetchChargeSummary(accessToken, amount),
    enabled: false, retry: 3, retryDelay: 1000, refetchOnWindowFocus: false,
  });

  useEffect(() => { if (chargeSummaryData?.data?.data) setChargeData(chargeSummaryData.data.data); }, [chargeSummaryData]);
  useEffect(() => { if (amount && isValidAmount(amount) && accessToken) refetchChargeSummary(); }, [amount, accessToken]);

  // ── Account generated ─────────────────────────────────────────────────────
  useEffect(() => {
    if (accountData?.data) {
      // Response shape:
      // accountData.data              → { status, message, data: { status, message, data: { statusCode, message, data: {...}, transactionId } } }
      // accountData.data.data         → { status, message, data: { statusCode, ... } }
      // accountData.data.data.data    → { statusCode, message, data: <account obj>, transactionId }
      // accountData.data.data.data.data → the actual account object
      // transactionId lives at accountData.data.data.data.transactionId (same as externalReference)

      const level3 = accountData.data?.data?.data;           // { statusCode, transactionId, data: {...} }
      const accountObj = level3?.data ?? level3;             // the raw account fields
      const txId = level3?.transactionId                     // "NGTXQGJ0U5"
                ?? accountObj?.externalReference
                ?? accountObj?._id
                ?? null;

      setVirtualAccount(accountObj);
      setTransactionId(txId);
      setIsGeneratingAccount(false);
      setConfirmStatus(CONFIRM.IDLE);
      setConfirmMessage("");
      setPollAttempt(0);
      setAccountExpired(false);
      clearTimeout(pollTimerRef.current);

      // Scroll account card into view after paint
      requestAnimationFrame(() => {
        setTimeout(() => {
          accountCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      });
    }
  }, [accountData]);

  useEffect(() => {
    if (accountError) { setIsGeneratingAccount(false); setPaymentError(accountErrorDetail || accountError); }
  }, [accountError, accountErrorDetail]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isValidAmount   = (v) => { const n = parseFloat(v); return n >= range.min && n <= range.max; };
  const getDirectAmount = () => chargeData?.totalAmount ?? 0;
  const getWalletAmount = () => (chargeData?.totalAmount ?? 0) - (chargeData?.gatewayCharge ?? 0);
  const getAmountToPay  = () => transferType === "wallet" ? getWalletAmount() : getDirectAmount();
  const hasSufficientBalance = () => !!chargeData && walletBalance >= getWalletAmount();

  // ── Confirm / Poll ────────────────────────────────────────────────────────
  const callConfirmTransfer = useCallback(async (transactionId) => {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiType: "confirmTransfer", accessToken, transactionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const details = err?.details ?? err?.message ?? "";
      const stillWaiting =
        res.status === 404 || res.status === 400 ||
        /payment not yet confirmed/i.test(details) || /not yet confirmed/i.test(details) ||
        /transaction not found/i.test(details) || /invalid request/i.test(err?.message ?? "");
      if (stillWaiting) return { pending: true };
      throw new Error(details || "Confirm failed");
    }
    const data = await res.json();
    return { pending: false, data };
  }, [accessToken]);

  const startPolling = useCallback((transactionId, attempt = 0) => {
    if (!isMountedRef.current) return;
    pollTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      setPollAttempt(attempt + 1);
      try {
        const result = await callConfirmTransfer(transactionId);
        if (!isMountedRef.current) return;
        if (result.pending) {
          if (attempt + 1 < MAX_POLL_ATTEMPTS) startPolling(transactionId, attempt + 1);
          else { setConfirmStatus(CONFIRM.NOT_FOUND); setConfirmMessage("Your transfer hasn't reflected yet. Tap Check Again or wait a moment."); }
        } else {
          setConfirmStatus(CONFIRM.SUCCESS);
          setConfirmMessage("Transfer confirmed! Your order has been placed.");
          await refreshWalletBalance();
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        setConfirmStatus(CONFIRM.ERROR);
        setConfirmMessage(getErrorMessage(err) || "Something went wrong. Please try again.");
      }
    }, attempt === 0 ? INITIAL_DELAY_MS : POLL_INTERVAL_MS);
  }, [callConfirmTransfer, refreshWalletBalance]);

  const handleConfirmDirectTransfer = () => {
    const txId = virtualAccount?.transactionId ?? virtualAccount?.externalReference;
    if (!txId) { setPaymentError("No transaction reference. Generate an account first."); return; }
    if (confirmStatus === CONFIRM.CHECKING) return;
    clearTimeout(pollTimerRef.current);
    setConfirmStatus(CONFIRM.CHECKING); setConfirmMessage(""); setPollAttempt(0);
    startPolling(txId, 0);
  };

  const handleCheckAgain = () => {
    const txId = virtualAccount?.transactionId ?? virtualAccount?.externalReference;
    clearTimeout(pollTimerRef.current);
    setConfirmStatus(CONFIRM.CHECKING); setConfirmMessage(""); setPollAttempt(0);
    startPolling(txId, 0);
  };

  const pollProgressLabel = () => {
    if (pollAttempt === 0) return "Waiting for your bank…";
    if (pollAttempt <= 3)  return "Checking payment status…";
    if (pollAttempt <= 8)  return `Still verifying · ${pollAttempt} of ${MAX_POLL_ATTEMPTS}`;
    return `Hang tight… (${pollAttempt}/${MAX_POLL_ATTEMPTS})`;
  };

  // ── UI handlers ───────────────────────────────────────────────────────────
  const handleTabChange = (tab) => router.push(`/${tab}`);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
    setChargeData(null); setPaymentError(null); setVirtualAccount(null);
    setConfirmStatus(CONFIRM.IDLE); setConfirmMessage(""); setAccountExpired(false);
    clearTimeout(pollTimerRef.current);
  };

  const handleViewOrder = () => router.push("/orders");

  const handleGenerateAccount = async () => {
    if (!accessToken || !amount || !chargeData) return;
    setIsGeneratingAccount(true); setPaymentError(null);
    setConfirmStatus(CONFIRM.IDLE); setVirtualAccount(null); setAccountExpired(false);
    clearTimeout(pollTimerRef.current);
    const selectedMerchantId = localStorage.getItem("selectedMerchantId");
    try {
      await generateAccount("/api/user", "POST", {
        accessToken, apiType: "generateAccountVirtual", type: "order",
        userId2: selectedMerchantId, amount: getDirectAmount(),
      });
    } catch { setIsGeneratingAccount(false); setPaymentError("Failed to generate account. Please try again."); }
  };

  // Scroll to transfer section when type picked
  const handleSelectTransferType = (type) => {
    setTransferType(type);
    setConfirmStatus(CONFIRM.IDLE);
    clearTimeout(pollTimerRef.current);
    setTimeout(() => {
      transferSecRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ── Slider ────────────────────────────────────────────────────────────────
  const handleSliderDrag = (_, info) => { sliderControls.set({ x: info.offset.x }); };

  const handlePaymentProcess = async () => {
    if (transferType !== "wallet" || !chargeData) return true;
    if (!hasSufficientBalance()) {
      setPaymentError(`Insufficient balance. Need ₦${fmt(getWalletAmount())} but have ₦${fmt(walletBalance)}`);
      return false;
    }
    setIsProcessingPayment(true); setPaymentError(null);
    try {
      const selectedMerchantId = localStorage.getItem("selectedMerchantId");
      const userId = myUserData?.user?.id || myUserData?.user?.userId;
      const r = await makeOrderPayment(accessToken, userId, selectedMerchantId, getWalletAmount(), Number(amount));
      if (r?.success || r?.data) { await refreshWalletBalance(); return true; }
      setPaymentError(r?.details || "Payment failed. Please try again."); return false;
    } catch { setPaymentError("Payment failed. Please try again."); return false; }
    finally { setIsProcessingPayment(false); }
  };

  const handleDragEnd = async (_, info) => {
    const progress = info.offset.x / SLIDER_WIDTH;
    if (progress >= SLIDER_THRESHOLD) {
      const ok = await handlePaymentProcess();
      if (ok) { sliderControls.start({ x: SLIDER_WIDTH, transition: { duration: 0.2 } }); setSliderPosition("end"); setShowSuccessModal(true); }
      else     { sliderControls.start({ x: 0,          transition: { duration: 0.2 } }); setSliderPosition("start"); }
    } else {
      sliderControls.start({ x: 0, transition: { duration: 0.2 } }); setSliderPosition("start");
    }
  };

  useEffect(() => { sliderControls.start({ x: 0 }); setSliderPosition("start"); }, [transferType, sliderControls]);

  const isChecking = confirmStatus === CONFIRM.CHECKING;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div
        className="flex flex-col min-h-screen"
        style={{ background: "#f2f2f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif" }}
      >

        {/* ── iOS Nav Bar ── */}
        <div
          className="fixed top-0 left-0 right-0 z-20"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "0.5px solid rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleTabChange("p2p")}
              className="flex items-center gap-1" style={{ color: "#FF9500" }}>
              <ArrowLeft className="h-5 w-5" />
              <span className="text-[17px]">Back</span>
            </motion.button>
            <h1 className="text-[17px] font-semibold text-gray-900">Transfer</h1>
            <motion.button whileTap={{ scale: 0.88 }} onClick={refreshWalletBalance}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,149,0,0.12)" }}>
              <RefreshCw className="h-4 w-4" style={{ color: "#FF9500" }} />
            </motion.button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto pt-[60px] pb-36 space-y-3 px-4">

          {isMerchantLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-8 flex flex-col items-center gap-2 py-14">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#FF9500" }} />
              <p className="text-[13px] text-gray-400">Loading merchant info…</p>
            </motion.div>
          )}

          {!isMerchantLoading && (
            <>
              {/* ── Wallet Balance Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
                className="mt-3 rounded-3xl overflow-hidden"
                style={{ background: "linear-gradient(135deg,#FF9500 0%,#FF5E00 100%)", boxShadow: "0 10px 36px rgba(255,149,0,0.38)" }}
              >
                <div className="px-5 pt-5 pb-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-orange-100 mb-1">Wallet Balance</p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-[14px] text-orange-200 font-medium">₦</span>
                    <span className="text-[36px] font-bold text-white leading-none tracking-tight">{fmt(walletBalance)}</span>
                  </div>
                  {merchantInfo && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-px bg-white/20" />
                        <p className="text-[11px] text-orange-200 font-semibold">{merchant}</p>
                        <div className="flex-1 h-px bg-white/20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-orange-200 uppercase tracking-wider">Min</p>
                          <p className="text-[15px] font-bold text-white">₦{fmt(range.min)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-1 mx-4">
                          {[...Array(4)].map((_, i) => <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30" />)}
                          <ArrowRight className="h-3 w-3 text-orange-200 flex-shrink-0" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-orange-200 uppercase tracking-wider">Max</p>
                          <p className="text-[15px] font-bold text-white">₦{fmt(range.max)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* ── Amount Input ── */}
              {merchantInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="bg-white rounded-3xl overflow-hidden"
                  style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                >
                  <div className="px-5 pt-5 pb-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Amount</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[30px] font-bold text-gray-200">₦</span>
                      <input
                        type="text" inputMode="numeric" value={amount}
                        onChange={handleAmountChange} placeholder="0"
                        className="flex-1 text-[34px] font-bold text-gray-900 bg-transparent outline-none placeholder-gray-200"
                      />
                      {isChargeSummaryLoading && amount && isValidAmount(amount) && (
                        <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" style={{ color: "#FF9500" }} />
                      )}
                    </div>
                    {amount && !isValidAmount(amount) && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-red-500 mt-1.5">
                        Enter between ₦{fmt(range.min)} – ₦{fmt(range.max)}
                      </motion.p>
                    )}
                  </div>

                  {/* Charge breakdown */}
                  <AnimatePresence>
                    {chargeData && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4">
                          <div className="h-px bg-gray-100 my-3" />
                          <div className="space-y-2">
                            {[
                              { label: "Amount", value: `₦${fmt(amount)}` },
                              { label: "Service fee", value: `₦${fmt(chargeData.serviceCharge || 0)}` },
                              { label: "Merchant fee", value: `₦${fmt(chargeData.merchantCharge || 0)}` },
                              ...(transferType === "direct" ? [{ label: "Gateway fee", value: `₦${fmt(chargeData.gatewayCharge || 0)}` }] : []),
                            ].map(({ label, value }) => (
                              <div key={label} className="flex justify-between">
                                <span className="text-[13px] text-gray-400">{label}</span>
                                <span className="text-[13px] text-gray-600 font-medium">{value}</span>
                              </div>
                            ))}
                            <div className="h-px bg-gray-100" />
                            <div className="flex justify-between items-center">
                              <span className="text-[14px] font-semibold text-gray-700">
                                {transferType === "wallet" ? "Wallet deduction" : "You pay"}
                              </span>
                              <span className="text-[17px] font-bold text-gray-900">₦{fmt(getAmountToPay())}</span>
                            </div>
                            {transferType === "wallet" && (
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-emerald-500" />
                                <p className="text-[11px] text-emerald-600 font-medium">
                                  Gateway fee (₦{fmt(chargeData.gatewayCharge || 0)}) waived for wallet!
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Payment Method Picker ── */}
              <AnimatePresence>
                {amount && isValidAmount(amount) && chargeData && (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Payment Method</p>
                    <div className="grid grid-cols-2 gap-3">

                      {/* Bank Transfer */}
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelectTransferType("direct")}
                        className="relative p-4 rounded-3xl text-left overflow-hidden"
                        style={{
                          background: transferType === "direct" ? "linear-gradient(135deg,#FF9500,#FF5E00)" : "white",
                          boxShadow: transferType === "direct" ? "0 8px 24px rgba(255,149,0,0.38)" : "0 2px 12px rgba(0,0,0,0.06)",
                        }}
                      >
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-2.5 ${transferType === "direct" ? "bg-white/20" : "bg-orange-50"}`}>
                          <Building2 className={`h-4 w-4 ${transferType === "direct" ? "text-white" : "text-[#FF9500]"}`} />
                        </div>
                        <p className={`text-[14px] font-semibold ${transferType === "direct" ? "text-white" : "text-gray-800"}`}>Bank Transfer</p>
                        <p className={`text-[11px] mt-0.5 ${transferType === "direct" ? "text-orange-100" : "text-gray-400"}`}>₦{fmt(getDirectAmount())}</p>
                        {transferType === "direct" && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </motion.button>

                      {/* Wallet Pay */}
                      <motion.button
                        whileTap={{ scale: hasSufficientBalance() ? 0.96 : 1 }}
                        onClick={() => hasSufficientBalance() && handleSelectTransferType("wallet")}
                        disabled={!hasSufficientBalance()}
                        className="relative p-4 rounded-3xl text-left overflow-hidden"
                        style={{
                          background: transferType === "wallet" ? "linear-gradient(135deg,#059669,#10b981)" : "white",
                          boxShadow: transferType === "wallet" ? "0 8px 24px rgba(16,185,129,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                          opacity: !hasSufficientBalance() ? 0.45 : 1,
                        }}
                      >
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-2.5 ${transferType === "wallet" ? "bg-white/20" : "bg-emerald-50"}`}>
                          <Wallet className={`h-4 w-4 ${transferType === "wallet" ? "text-white" : "text-emerald-600"}`} />
                        </div>
                        <p className={`text-[14px] font-semibold ${transferType === "wallet" ? "text-white" : "text-gray-800"}`}>Wallet Pay</p>
                        <p className={`text-[11px] mt-0.5 ${transferType === "wallet" ? "text-green-100" : "text-emerald-600"}`}>₦{fmt(getWalletAmount())}</p>
                        {!hasSufficientBalance() && <p className="text-[10px] text-red-400 font-medium mt-0.5">Low balance</p>}
                        {transferType === "wallet" && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {hasSufficientBalance() && transferType !== "wallet" && (
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100">
                            <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-700">No fee</span>
                          </div>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error banner */}
              <AnimatePresence>
                {paymentError && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-[13px] text-red-600 font-medium">{paymentError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ══════════════ Transfer Detail Sections ══════════════ */}
              <div ref={transferSecRef} className="scroll-mt-4 space-y-3">

                {/* ── DIRECT TRANSFER ── */}
                <AnimatePresence>
                  {transferType === "direct" && merchantInfo && (
                    <motion.div
                      key="direct-section"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {/* ─────────────────────────────────────────────────────
                          ACCOUNT CARD
                          Layout (top → bottom):
                          1. Header row: "Account Details" label + Generate button (ALWAYS visible)
                          2. [if virtualAccount] Countdown timer banner — right after header, before details
                          3. Account details / loading / empty state
                      ───────────────────────────────────────────────────── */}
                      <div
                        ref={accountCardRef}
                        className="bg-white rounded-3xl overflow-hidden scroll-mt-4"
                        style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}
                      >
                        {/* ── Card Header: always visible, generate button always shown ── */}
                        <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[14px] font-semibold text-gray-800">Account Details</p>

                            {/* Generate / Regenerate button — ALWAYS visible */}
                            <motion.button
                              whileTap={{ scale: isGeneratingAccount || isChecking ? 1 : 0.93 }}
                              onClick={handleGenerateAccount}
                              disabled={isGeneratingAccount || isChecking}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all"
                              style={{
                                background: virtualAccount
                                  ? "rgba(255,149,0,0.10)"
                                  : "linear-gradient(135deg,#FF9500,#FF5E00)",
                                color: virtualAccount ? "#FF9500" : "#fff",
                                boxShadow: virtualAccount ? "none" : "0 4px 14px rgba(255,149,0,0.40)",
                              }}
                            >
                              {isGeneratingAccount ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
                              ) : virtualAccount ? (
                                <><RefreshCw className="h-3.5 w-3.5" />Regenerate</>
                              ) : (
                                <><Sparkles className="h-3.5 w-3.5" />Generate Account</>
                              )}
                            </motion.button>
                          </div>

                          {/* Sub-hint shown when no account generated yet */}
                          {!virtualAccount && !isGeneratingAccount && (
                            <p className="text-[11px] text-gray-400">
                              Tap <span className="font-semibold text-[#FF9500]">Generate Account</span> to get your bank details
                            </p>
                          )}
                        </div>

                        {/* ── Countdown Timer: immediately below header when account exists ── */}
                        <AnimatePresence>
                          {virtualAccount && !accountExpired && (
                            <motion.div
                              key="countdown-banner"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden px-4 pt-3"
                            >
                              <CountdownTimerBanner onExpire={() => setAccountExpired(true)} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ── Expired notice (replaces countdown) ── */}
                        <AnimatePresence>
                          {accountExpired && (
                            <motion.div
                              key="expired-banner"
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="mx-4 mt-3 flex items-start gap-3 p-3.5 rounded-2xl"
                              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}
                            >
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[13px] font-bold text-red-700">Account Expired</p>
                                <p className="text-[11px] text-red-400 mt-0.5">
                                  This account is no longer valid. Tap <span className="font-semibold">Regenerate</span> above to get a new one.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ── Card Body: loading / details / empty ── */}
                        <AnimatePresence mode="wait">
                          {isGeneratingAccount ? (
                            <motion.div key="gen-loading"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="px-5 py-10 flex flex-col items-center gap-2.5"
                            >
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: "rgba(255,149,0,0.1)" }}>
                                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#FF9500" }} />
                              </div>
                              <p className="text-[13px] text-gray-400">Generating account…</p>
                            </motion.div>

                          ) : virtualAccount ? (
                            <motion.div key="account-details"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="px-5 pt-3 pb-3"
                            >
                              <InfoRow icon={Building2} iconBg="bg-orange-50" iconColor="text-[#FF9500]"
                                label="Bank Name" value={virtualAccount.bankName || getBankName(virtualAccount.bankCode) || "—"} />
                              <InfoRow icon={Hash} iconBg="bg-purple-50" iconColor="text-purple-600"
                                label="Account Number" value={virtualAccount.accountNumber || "—"}
                                onCopy={() => copy(virtualAccount.accountNumber, "accnum")}
                                isCopied={copiedKey === "accnum"} />
                              <InfoRow icon={User} iconBg="bg-blue-50" iconColor="text-blue-600"
                                label="Account Name" value={virtualAccount.accountName || "—"} />
                              <InfoRow icon={Banknote} iconBg="bg-emerald-50" iconColor="text-emerald-600"
                                label="Transfer Exactly" value={`₦${fmt(getDirectAmount())}`}
                                onCopy={() => copy(String(getDirectAmount()), "amt")}
                                isCopied={copiedKey === "amt"} />

                              {/* Copy All */}
                              <div className="pt-2 pb-1">
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => copy(
                                    `Bank: ${virtualAccount.bankName || getBankName(virtualAccount.bankCode)}\nAccount: ${virtualAccount.accountNumber}\nName: ${virtualAccount.accountName}\nAmount: ₦${fmt(getDirectAmount())}`,
                                    "all"
                                  )}
                                  className="w-full py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2"
                                  style={{
                                    background: copiedKey === "all" ? "#d1fae5" : "#f9f9f9",
                                    color:      copiedKey === "all" ? "#065f46" : "#374151",
                                    border:     `1px solid ${copiedKey === "all" ? "#6ee7b7" : "#e5e7eb"}`,
                                  }}
                                >
                                  {copiedKey === "all"
                                    ? <><Check className="h-4 w-4" />Copied all details!</>
                                    : <><Copy className="h-4 w-4" />Copy All Details</>}
                                </motion.button>
                              </div>

                              {/* Single-use notice */}
                              <div
                                className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl mt-2 mb-1"
                                style={{ background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.16)" }}
                              >
                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#FF9500" }} />
                                <div>
                                  <p className="text-[12px] font-bold text-orange-800">
                                    Transfer exactly ₦{fmt(getDirectAmount())}
                                  </p>
                                  <p className="text-[11px] text-orange-600 mt-0.5">
                                    Single-use account. Other amounts go to your wallet.
                                  </p>
                                </div>
                              </div>

                              {/* Reference */}
                              {(virtualAccount.reference || virtualAccount.externalReference) && (
                                <div className="flex items-center gap-1.5 pt-2 pb-1">
                                  <Shield className="h-3 w-3 text-gray-300" />
                                  <p className="text-[10px] text-gray-300">
                                    Ref: {virtualAccount.reference || virtualAccount.externalReference}
                                  </p>
                                </div>
                              )}
                            </motion.div>

                          ) : (
                            /* Empty state — shown before first generation */
                            <motion.div key="empty-state"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="px-5 py-10 flex flex-col items-center gap-3"
                            >
                              {/* Big prominent generate CTA in empty state */}
                              <div className="w-14 h-14 rounded-3xl flex items-center justify-center"
                                style={{ background: "rgba(255,149,0,0.10)" }}>
                                <Building2 className="h-7 w-7" style={{ color: "#FF9500" }} />
                              </div>
                              <div className="text-center">
                                <p className="text-[14px] font-semibold text-gray-700">No account yet</p>
                                <p className="text-[12px] text-gray-400 mt-1">
                                  Tap <span className="font-bold text-[#FF9500]">Generate Account</span> above to receive your unique bank details for this transfer
                                </p>
                              </div>
                              {/* Arrow pointing up toward the button */}
                              <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                                className="flex flex-col items-center gap-0.5"
                              >
                                <div className="w-px h-5 rounded-full" style={{ background: "#FF9500", opacity: 0.35 }} />
                                <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "7px solid rgba(255,149,0,0.35)" }} />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Confirm Status Card ── */}
                      <AnimatePresence>
                        {virtualAccount && confirmStatus !== CONFIRM.IDLE && (
                          <motion.div
                            key="confirm-card"
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-3xl overflow-hidden bg-white"
                            style={{
                              boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
                              border:
                                confirmStatus === CONFIRM.SUCCESS   ? "1.5px solid #6ee7b7" :
                                confirmStatus === CONFIRM.ERROR     ? "1.5px solid #fca5a5" :
                                confirmStatus === CONFIRM.NOT_FOUND ? "1.5px solid #fde68a" :
                                                                       "1px solid rgba(255,149,0,0.2)",
                            }}
                          >
                            {/* CHECKING */}
                            {confirmStatus === CONFIRM.CHECKING && (
                              <div className="p-5">
                                <div className="flex items-center gap-4 mb-3">
                                  <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#FF9500" }} />
                                  </div>
                                  <div>
                                    <p className="text-[14px] font-bold text-gray-800">Confirming Transfer</p>
                                    <p className="text-[12px] text-gray-400 mt-0.5">{pollProgressLabel()}</p>
                                  </div>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <motion.div className="h-full rounded-full"
                                    style={{ background: "linear-gradient(90deg,#FF9500,#FF5E00)" }}
                                    initial={{ width: "5%" }}
                                    animate={{ width: `${Math.min(100, ((pollAttempt + 1) / MAX_POLL_ATTEMPTS) * 100)}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                  />
                                </div>
                                <p className="text-[10px] text-gray-300 mt-1.5 text-center">Bank updates can take up to 90 seconds</p>
                              </div>
                            )}

                            {/* SUCCESS */}
                            {confirmStatus === CONFIRM.SUCCESS && (
                              <div className="p-6 text-center">
                                <motion.div
                                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                  className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3"
                                >
                                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </motion.div>
                                <p className="text-[20px] font-bold text-gray-900 mb-1">Order Placed! 🎉</p>
                                <p className="text-[13px] text-gray-400 mb-5">{confirmMessage}</p>
                                <motion.button whileTap={{ scale: 0.96 }} onClick={handleViewOrder}
                                  className="px-6 py-2.5 rounded-2xl text-[14px] font-semibold text-white flex items-center gap-2 mx-auto"
                                  style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
                                  <Eye className="h-4 w-4" /> View Order
                                </motion.button>
                              </div>
                            )}

                            {/* NOT_FOUND */}
                            {confirmStatus === CONFIRM.NOT_FOUND && (
                              <div className="p-5 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                  <HelpCircle className="h-5 w-5 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[14px] font-bold text-gray-800 mb-0.5">Not Found Yet</p>
                                  <p className="text-[12px] text-gray-400 leading-relaxed">{confirmMessage}</p>
                                  <motion.button whileTap={{ scale: 0.94 }} onClick={handleCheckAgain}
                                    className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold"
                                    style={{ background: "rgba(255,149,0,0.1)", color: "#FF9500" }}>
                                    <RefreshCw className="h-3.5 w-3.5" /> Check Again
                                  </motion.button>
                                </div>
                              </div>
                            )}

                            {/* ERROR */}
                            {confirmStatus === CONFIRM.ERROR && (
                              <div className="p-5 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                  <XCircle className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[14px] font-bold text-red-700 mb-0.5">Confirmation Failed</p>
                                  <p className="text-[12px] text-red-400 leading-relaxed">{confirmMessage}</p>
                                  <motion.button whileTap={{ scale: 0.94 }} onClick={handleCheckAgain}
                                    className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold"
                                    style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                                    <RefreshCw className="h-3.5 w-3.5" /> Try Again
                                  </motion.button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── WALLET FLOW ── */}
                <AnimatePresence>
                  {transferType === "wallet" && chargeData && (
                    <motion.div
                      key="wallet-section"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-white rounded-3xl overflow-hidden"
                      style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}
                    >
                      <div className="p-5">
                        <div
                          className="flex items-center gap-3 p-4 rounded-2xl"
                          style={{
                            background: hasSufficientBalance() ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                            border: `1px solid ${hasSufficientBalance() ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                          }}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${hasSufficientBalance() ? "bg-emerald-100" : "bg-red-100"}`}>
                            {hasSufficientBalance()
                              ? <Check className="h-5 w-5 text-emerald-600" />
                              : <XCircle className="h-5 w-5 text-red-500" />}
                          </div>
                          <div>
                            <p className={`text-[14px] font-semibold ${hasSufficientBalance() ? "text-emerald-800" : "text-red-700"}`}>
                              {hasSufficientBalance() ? "Sufficient Balance" : "Insufficient Balance"}
                            </p>
                            <p className={`text-[12px] mt-0.5 ${hasSufficientBalance() ? "text-emerald-600" : "text-red-500"}`}>
                              Balance: ₦{fmt(walletBalance)}
                              {!hasSufficientBalance() && ` · Need ₦${fmt(getWalletAmount())}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* ── Fixed Footer ── */}
        <AnimatePresence>
          {transferType && (
            <motion.div
              initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 px-4 pb-7 pt-3"
              style={{
                background: "rgba(242,242,247,0.94)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderTop: "0.5px solid rgba(0,0,0,0.08)",
              }}
            >
              {/* DIRECT: confirm button */}
              {transferType === "direct" && virtualAccount && confirmStatus !== CONFIRM.SUCCESS && !accountExpired && (
                <motion.button
                  whileTap={{ scale: isChecking ? 1 : 0.97 }}
                  onClick={handleConfirmDirectTransfer}
                  disabled={isChecking}
                  className="w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={{
                    background: isChecking ? "rgba(255,149,0,0.1)" : "linear-gradient(135deg,#059669 0%,#10b981 100%)",
                    color: isChecking ? "#FF9500" : "#fff",
                    boxShadow: isChecking ? "none" : "0 6px 24px rgba(16,185,129,0.38)",
                  }}
                >
                  {isChecking
                    ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Checking…</span></>
                    : <><BadgeCheck className="h-5 w-5" />I've Sent the Money</>}
                </motion.button>
              )}

              {/* DIRECT: expired → regenerate */}
              {transferType === "direct" && virtualAccount && accountExpired && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerateAccount}
                  disabled={isGeneratingAccount}
                  className="w-full py-4 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#FF9500,#FF5E00)", boxShadow: "0 6px 24px rgba(255,149,0,0.38)" }}
                >
                  {isGeneratingAccount
                    ? <><Loader2 className="h-5 w-5 animate-spin" />Generating…</>
                    : <><RefreshCw className="h-5 w-5" />Generate New Account</>}
                </motion.button>
              )}

              {/* DIRECT: no account yet — show a big generate CTA in footer too */}
              {transferType === "direct" && !virtualAccount && !isGeneratingAccount && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerateAccount}
                  className="w-full py-4 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#FF9500,#FF5E00)", boxShadow: "0 6px 24px rgba(255,149,0,0.38)" }}
                >
                  <Sparkles className="h-5 w-5" />Generate Account to Continue
                </motion.button>
              )}

              {/* DIRECT: generating in footer too */}
              {transferType === "direct" && !virtualAccount && isGeneratingAccount && (
                <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,149,0,0.1)" }}>
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#FF9500" }} />
                  <span className="text-[15px] font-semibold" style={{ color: "#FF9500" }}>Generating your account…</span>
                </div>
              )}

              {/* DIRECT: success */}
              {transferType === "direct" && confirmStatus === CONFIRM.SUCCESS && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleViewOrder}
                  className="w-full py-4 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 6px 24px rgba(16,185,129,0.38)" }}>
                  <Eye className="h-5 w-5" /> View Order
                </motion.button>
              )}

              {/* WALLET: slider */}
              {transferType === "wallet" && (
                sliderPosition === "end" ? (
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                    style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-[14px] font-semibold text-emerald-700">Payment Sent!</span>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleViewOrder}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                      style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
                      <Eye className="h-4 w-4" /> View Order
                    </motion.button>
                  </div>
                ) : (
                  <div className="h-14 rounded-2xl relative overflow-hidden"
                    style={{ background: "rgba(255,149,0,0.1)" }}>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-[14px] font-semibold pl-12" style={{ color: "#FF9500" }}>
                        {isProcessingPayment ? "Processing…" : "Slide to pay"}
                      </p>
                    </div>
                    <motion.div
                      className="absolute left-0 top-0 h-full aspect-square rounded-2xl flex items-center justify-center touch-none"
                      style={{
                        background: "linear-gradient(135deg,#FF9500,#FF5E00)",
                        boxShadow: "3px 0 16px rgba(255,149,0,0.45)",
                        cursor: isProcessingPayment ? "wait" : "grab",
                      }}
                      drag={!isProcessingPayment ? "x" : false}
                      dragConstraints={{ left: 0, right: SLIDER_WIDTH }}
                      dragElastic={0.07}
                      dragMomentum={false}
                      animate={sliderControls}
                      onDrag={handleSliderDrag}
                      onDragEnd={handleDragEnd}
                      whileTap={{ scale: 1.06 }}
                    >
                      {isProcessingPayment
                        ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                        : <ChevronRight className="h-6 w-6 text-white" />}
                    </motion.div>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Wallet Success Modal ── */}
        <AnimatePresence>
          {showSuccessModal && transferType === "wallet" && chargeData && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-end justify-center p-4 z-50"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)" }}
            >
              <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="bg-white rounded-3xl p-6 w-full max-w-sm text-center"
                style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.14)" }}
              >
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.08 }}
                  className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </motion.div>
                <h3 className="text-[22px] font-bold text-gray-900 mb-1">Payment Sent! 🎉</h3>
                <p className="text-[14px] text-gray-400 mb-6">₦{fmt(getWalletAmount())} transferred successfully</p>
                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowSuccessModal(false)}
                    className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-gray-600 bg-gray-100">
                    Close
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleViewOrder}
                    className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#FF9500,#FF5E00)", boxShadow: "0 4px 16px rgba(255,149,0,0.35)" }}>
                    <Eye className="h-4 w-4" /> Orders
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
};

export default TransferPage;
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Banknote,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Loader2,
  Shield,
  Zap,
  RefreshCw,
  Building2,
  Hash,
  User,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import getErrorMessage from "@/app/component/error";
import { motion, AnimatePresence } from "framer-motion";

// ── Quick amount presets ──────────────────────────────────────────────────────
const PRESETS = [100, 500, 1000, 5000, 10000];

// ── Confirm polling config ────────────────────────────────────────────────────
const POLL_INTERVAL_MS  = 5000;
const MAX_POLL_ATTEMPTS = 18;
const INITIAL_DELAY_MS  = 3000;

// ── Format helpers ────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString("en-NG");

// ── Parse the real API response ───────────────────────────────────────────────
const parseVirtualAccount = (apiResponse) => {
  const inner =
    apiResponse?.data?.data?.data ??
    apiResponse?.data?.data ??
    apiResponse?.data ??
    apiResponse;

  return {
    accountNumber:     inner?.accountNumber     ?? "—",
    accountName:       inner?.accountName       ?? "—",
    bankCode:          inner?.bankCode          ?? "—",
    amount:            inner?.amount            ?? 0,
    validFor:          inner?.validFor          ?? 900,
    expiryDate:        inner?.expiryDate        ?? null,
    reference:         inner?.externalReference ?? inner?._id ?? "—",
    transactionId:     inner?.externalReference ?? "—",
    status:            inner?.status            ?? "Active",
  };
};

// ── Bank name map ─────────────────────────────────────────────────────────────
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
const getBankName = (code) => BANK_NAMES[code] ?? `Bank (${code})`;

// ── Copy hook ─────────────────────────────────────────────────────────────────
const useCopy = () => {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  return { copiedKey, copy };
};

// ── Circular countdown ring ───────────────────────────────────────────────────
const CountdownRing = ({ seconds, total }) => {
  const r    = 26;
  const circ = 2 * Math.PI * r;
  const pct  = seconds / total;
  const dash = circ * pct;
  const isUrgent = seconds < 60;

  return (
    <svg width={64} height={64} viewBox="0 0 64 64" className="-rotate-90">
      <circle cx={32} cy={32} r={r} fill="none" stroke="#fde68a" strokeWidth={5} />
      <circle
        cx={32} cy={32} r={r}
        fill="none"
        stroke={isUrgent ? "#ef4444" : "#f59e0b"}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }}
      />
    </svg>
  );
};

// ── Detail row ────────────────────────────────────────────────────────────────
const DetailRow = ({ icon: Icon, label, value, copyKey, onCopy, copiedKey, accent }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-3 py-3 border-b border-amber-50 last:border-0"
  >
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: accent ?? "linear-gradient(135deg, #fef3c7, #fde68a)" }}
    >
      <Icon className="h-4 w-4 text-amber-700" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 leading-none mb-0.5">{label}</p>
      <p className="text-sm font-bold text-amber-900 truncate font-mono">{value}</p>
    </div>
    {onCopy && (
      <button
        onClick={() => onCopy(value, copyKey)}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
        style={{
          background: copiedKey === copyKey
            ? "linear-gradient(135deg,#d1fae5,#a7f3d0)"
            : "#fef3c7",
        }}
      >
        {copiedKey === copyKey
          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
          : <Copy className="h-3.5 w-3.5 text-amber-500" />}
      </button>
    )}
  </motion.div>
);

// ── Confirm status enum ───────────────────────────────────────────────────────
const CONFIRM = {
  IDLE:       "idle",
  CHECKING:   "checking",
  SUCCESS:    "success",
  NOT_FOUND:  "not_found",
  ERROR:      "error",
};

// ─────────────────────────────────────────────────────────────────────────────
const FundWalletPage = () => {
  const router          = useRouter();
  const pathname        = usePathname();
  const accessToken     = useSelector((s) => s.user.accessToken);

  const [amountStr, setAmountStr]           = useState("100");
  const [amountError, setAmountError]       = useState("");
  const [accountDetails, setAccountDetails] = useState(null);
  const [isGenerating, setIsGenerating]     = useState(false);

  // Countdown
  const [secondsLeft, setSecondsLeft]   = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(900);
  const [expired, setExpired]           = useState(false);

  // Confirm-transfer state
  const [confirmStatus, setConfirmStatus]     = useState(CONFIRM.IDLE);
  const [confirmMessage, setConfirmMessage]   = useState("");
  const [pollAttempt, setPollAttempt]         = useState(0);
  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const { copiedKey, copy } = useCopy();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── Countdown tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accountDetails || expired) return;
    if (secondsLeft <= 0) { setExpired(true); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [accountDetails, secondsLeft, expired]);

  const fmtTime = (s) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const numericAmount = parseInt(amountStr.replace(/[^\d]/g, ""), 10) || 0;

  // ── Single confirm API call ─────────────────────────────────────────────────
  const callConfirmTransfer = useCallback(async (transactionId) => {
    const qs  = new URLSearchParams({ apiType: "confirmTransfer", token: accessToken });
    const res = await fetch(`/api/user?${qs.toString()}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiType:       "confirmTransfer",
        accessToken,
        transactionId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const details = err?.details ?? err?.message ?? "";

      const stillWaiting =
        res.status === 404 ||
        res.status === 400 ||
        /payment not yet confirmed/i.test(details) ||
        /not yet confirmed/i.test(details) ||
        /transaction not found/i.test(details) ||
        /invalid request/i.test(err?.message ?? "");

      if (stillWaiting) return { pending: true };

      throw new Error(details || "Confirm failed");
    }

    const data = await res.json();
    return { pending: false, data };
  }, [accessToken]);

  // ── Poll logic ──────────────────────────────────────────────────────────────
  const startPolling = useCallback((transactionId, attempt = 0) => {
    if (!isMountedRef.current) return;

    const delay = attempt === 0 ? INITIAL_DELAY_MS : POLL_INTERVAL_MS;

    pollTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      setPollAttempt(attempt + 1);

      try {
        const result = await callConfirmTransfer(transactionId);

        if (!isMountedRef.current) return;

        if (result.pending) {
          if (attempt + 1 < MAX_POLL_ATTEMPTS) {
            startPolling(transactionId, attempt + 1);
          } else {
            setConfirmStatus(CONFIRM.NOT_FOUND);
            setConfirmMessage(
              "Your transfer hasn't reflected yet. Tap Check Again or wait a moment."
            );
          }
        } else {
          setConfirmStatus(CONFIRM.SUCCESS);
          setConfirmMessage("Transfer confirmed! Your wallet has been credited.");
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        setConfirmStatus(CONFIRM.ERROR);
        setConfirmMessage(
          getErrorMessage(err) || "Something went wrong while confirming. Please try again."
        );
      }
    }, delay);
  }, [callConfirmTransfer]);

  const handleConfirmTransfer = () => {
    if (!accountDetails?.transactionId || confirmStatus === CONFIRM.CHECKING) return;
    clearTimeout(pollTimerRef.current);
    setConfirmStatus(CONFIRM.CHECKING);
    setConfirmMessage("");
    setPollAttempt(0);
    startPolling(accountDetails.transactionId, 0);
  };

  const handleCheckAgain = () => {
    clearTimeout(pollTimerRef.current);
    setConfirmStatus(CONFIRM.CHECKING);
    setConfirmMessage("");
    setPollAttempt(0);
    startPolling(accountDetails.transactionId, 0);
  };

  // ── Generate virtual account mutation ───────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async (fundAmount) => {
      if (!accessToken) throw new Error("Access token not available");
      const qs  = new URLSearchParams({ apiType: "generateAccountVirtual", token: accessToken });
      const res = await fetch(`/api/user?${qs.toString()}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType:     "generateAccountVirtual",
          accessToken,
          amount:      fundAmount,
          type:        "fundWallet",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to generate account");
      }
      return res.json();
    },
    onMutate:   () => setIsGenerating(true),
    onSuccess:  (data) => {
      const parsed = parseVirtualAccount(data);
      setAccountDetails(parsed);
      setSecondsLeft(parsed.validFor);
      setTotalSeconds(parsed.validFor);
      setExpired(false);
      setAmountError("");
      setIsGenerating(false);
      setConfirmStatus(CONFIRM.IDLE);
      setConfirmMessage("");
      setPollAttempt(0);
      clearTimeout(pollTimerRef.current);
    },
    onError: (error) => {
      setAmountError(getErrorMessage(error) || "Something went wrong. Please try again.");
      getErrorMessage(error, router, "", false, pathname);
      setIsGenerating(false);
    },
    onSettled: () => setIsGenerating(false),
  });

  const handleGenerate = () => {
    if (isGenerating) return;
    if (numericAmount < 100) { setAmountError("Minimum amount is ₦100"); return; }
    setAmountError("");
    generateMutation.mutate(numericAmount);
  };

  const handleReset = () => {
    clearTimeout(pollTimerRef.current);
    setAccountDetails(null);
    setExpired(false);
    setSecondsLeft(0);
    setAmountError("");
    setConfirmStatus(CONFIRM.IDLE);
    setConfirmMessage("");
    setPollAttempt(0);
  };

  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setAmountStr(digits);
    setAmountError(parseInt(digits) < 100 ? "Minimum amount is ₦100" : "");
  };

  const isLoading    = isGenerating || generateMutation.isPending;
  const isChecking   = confirmStatus === CONFIRM.CHECKING;

  const pollProgressLabel = () => {
    if (pollAttempt === 0) return "Waiting for your bank…";
    if (pollAttempt <= 3)  return "Checking payment status…";
    if (pollAttempt <= 8)  return `Still waiting · attempt ${pollAttempt} of ${MAX_POLL_ATTEMPTS}…`;
    return `Hang tight · checking again… (${pollAttempt}/${MAX_POLL_ATTEMPTS})`;
  };

  // ── Preset label helper ─────────────────────────────────────────────────────
  const presetLabel = (p) => {
    if (p < 1000) return `₦${p}`;
    return `₦${p / 1000}k`;
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen" style={{ background: "#fffbf0" }}>

        {/* ── Header ── */}
        <div
          className="fixed top-0 left-0 right-0 z-20 px-4 pt-10 pb-4"
          style={{ background: "linear-gradient(135deg, #78350f 0%, #b45309 55%, #d97706 100%)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => accountDetails ? handleReset() : router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-none tracking-tight">Fund My Wallet</h1>
              <p className="text-amber-200 text-[11px] mt-0.5">Instant bank transfer</p>
            </div>
            <div
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Zap className="h-3 w-3 text-yellow-300" />
              <span className="text-[10px] text-amber-100 font-bold">Instant</span>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-auto pt-28 pb-28 px-4 space-y-4">
          <AnimatePresence mode="wait">

            {/* ════ AMOUNT ENTRY VIEW ════ */}
            {!accountDetails && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                {/* Amount card */}
                <div
                  className="bg-white rounded-3xl p-5 shadow-sm"
                  style={{ border: "1.5px solid rgba(251,191,36,0.25)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">Enter Amount</p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-amber-900">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amountStr ? fmt(amountStr) : ""}
                      onChange={handleAmountChange}
                      placeholder="0"
                      disabled={isLoading}
                      className="flex-1 text-4xl font-extrabold bg-transparent outline-none text-amber-900 placeholder-amber-200 disabled:opacity-50"
                      style={{ letterSpacing: "-1px" }}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setAmountStr(String(p)); setAmountError(""); }}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                        style={
                          numericAmount === p
                            ? { background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }
                            : { background: "#fef3c7", color: "#92400e" }
                        }
                      >
                        {presetLabel(p)}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {amountError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 mt-3"
                      >
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <p className="text-xs text-red-500">{amountError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* How it works */}
                <div
                  className="bg-white rounded-3xl p-5 shadow-sm"
                  style={{ border: "1.5px solid rgba(251,191,36,0.2)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">How It Works</p>
                  {[
                    { n: "1", text: "Enter the amount you want to add (minimum ₦100)" },
                    { n: "2", text: "Tap Generate to get a one-time bank account" },
                    { n: "3", text: "Transfer the exact amount before it expires" },
                    { n: "4", text: "Tap I've Sent the Money and we'll confirm automatically" },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-3 mb-2.5 last:mb-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-black text-white mt-0.5"
                        style={{ background: "linear-gradient(135deg, #b45309, #f59e0b)" }}
                      >
                        {n}
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-white rounded-3xl p-6 shadow-sm text-center"
                      style={{ border: "1.5px solid rgba(251,191,36,0.3)" }}
                    >
                      <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto mb-3" />
                      <p className="text-sm font-bold text-amber-900 mb-1">Generating your account…</p>
                      <p className="text-xs text-amber-500">Please do not close this page</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ════ ACCOUNT DETAILS VIEW ════ */}
            {accountDetails && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >

                {/* ── Countdown card ── */}
                {confirmStatus !== CONFIRM.SUCCESS && (
                  <div
                    className="bg-white rounded-3xl p-5 shadow-sm"
                    style={{
                      border: expired || secondsLeft < 60
                        ? "1.5px solid #fca5a5"
                        : "1.5px solid rgba(251,191,36,0.3)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <CountdownRing seconds={secondsLeft} total={totalSeconds} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Clock className={`h-4 w-4 ${expired || secondsLeft < 60 ? "text-red-500" : "text-amber-500"}`} />
                        </div>
                      </div>
                      <div className="flex-1">
                        {expired ? (
                          <>
                            <p className="text-sm font-extrabold text-red-600">Account Expired</p>
                            <p className="text-xs text-red-400 mt-0.5">Generate a new account to continue</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-amber-500 font-semibold mb-0.5">Time remaining to transfer</p>
                            <p className={`text-2xl font-black tabular-nums ${secondsLeft < 60 ? "text-red-500" : "text-amber-900"}`}>
                              {fmtTime(secondsLeft)}
                            </p>
                            <p className="text-[10px] text-amber-400 mt-0.5">
                              Expires {accountDetails.expiryDate
                                ? new Date(accountDetails.expiryDate).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
                                : "soon"}
                            </p>
                          </>
                        )}
                      </div>
                      <div
                        className="px-3 py-2 rounded-2xl text-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                      >
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Send</p>
                        <p className="text-base font-extrabold text-amber-900">₦{fmt(accountDetails.amount)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Confirm status card ── */}
                <AnimatePresence>
                  {confirmStatus !== CONFIRM.IDLE && (
                    <motion.div
                      key="confirm-card"
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-white rounded-3xl p-5 shadow-sm overflow-hidden"
                      style={{
                        border:
                          confirmStatus === CONFIRM.SUCCESS  ? "1.5px solid #6ee7b7" :
                          confirmStatus === CONFIRM.ERROR    ? "1.5px solid #fca5a5" :
                          confirmStatus === CONFIRM.NOT_FOUND? "1.5px solid #fde68a" :
                                                               "1.5px solid rgba(251,191,36,0.3)",
                      }}
                    >
                      {confirmStatus === CONFIRM.CHECKING && (
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                            >
                              <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-extrabold text-amber-900 mb-0.5">Confirming Transfer</p>
                            <p className="text-xs text-amber-500">{pollProgressLabel()}</p>
                            <div className="mt-2 h-1 rounded-full bg-amber-100 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, #b45309, #f59e0b)" }}
                                initial={{ width: "5%" }}
                                animate={{ width: `${Math.min(100, ((pollAttempt + 1) / MAX_POLL_ATTEMPTS) * 100)}%` }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                              />
                            </div>
                            <p className="text-[10px] text-amber-300 mt-1">
                              Bank update can take up to 90 seconds — sit tight
                            </p>
                          </div>
                        </div>
                      )}

                      {confirmStatus === CONFIRM.SUCCESS && (
                        <div className="text-center py-2">
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 18 }}
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                            style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}
                          >
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                          </motion.div>
                          <p className="text-base font-extrabold text-emerald-700 mb-1">Wallet Credited! 🎉</p>
                          <p className="text-xs text-emerald-500">{confirmMessage}</p>
                          <button
                            onClick={handleReset}
                            className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
                          >
                            Done
                          </button>
                        </div>
                      )}

                      {confirmStatus === CONFIRM.NOT_FOUND && (
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "#fef3c7" }}
                          >
                            <HelpCircle className="h-5 w-5 text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-extrabold text-amber-900 mb-0.5">Transfer Not Found Yet</p>
                            <p className="text-xs text-amber-600 leading-relaxed">{confirmMessage}</p>
                            <button
                              onClick={handleCheckAgain}
                              className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                              style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e" }}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Check Again
                            </button>
                          </div>
                        </div>
                      )}

                      {confirmStatus === CONFIRM.ERROR && (
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "#fee2e2" }}
                          >
                            <XCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-extrabold text-red-700 mb-0.5">Confirmation Failed</p>
                            <p className="text-xs text-red-500 leading-relaxed">{confirmMessage}</p>
                            <button
                              onClick={handleCheckAgain}
                              className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                              style={{ background: "#fee2e2", color: "#b91c1c" }}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Try Again
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Bank details card ── */}
                {confirmStatus !== CONFIRM.SUCCESS && (
                  <>
                    <div
                      className="bg-white rounded-3xl overflow-hidden shadow-sm"
                      style={{ border: "1.5px solid rgba(251,191,36,0.3)" }}
                    >
                      <div
                        className="px-5 py-3.5 flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}
                      >
                        <BadgeCheck className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-extrabold text-amber-800 uppercase tracking-widest">
                          Transfer Exactly ₦{fmt(accountDetails.amount)}
                        </p>
                      </div>

                      <div className="px-5 py-2">
                        <DetailRow
                          icon={Building2}
                          label="Bank Name"
                          value={getBankName(accountDetails.bankCode)}
                          copyKey="bank"
                          onCopy={copy}
                          copiedKey={copiedKey}
                        />
                        <DetailRow
                          icon={Hash}
                          label="Account Number"
                          value={accountDetails.accountNumber}
                          copyKey="accnum"
                          onCopy={copy}
                          copiedKey={copiedKey}
                          accent="linear-gradient(135deg,#ede9fe,#ddd6fe)"
                        />
                        <DetailRow
                          icon={User}
                          label="Account Name"
                          value={accountDetails.accountName}
                          copyKey="accname"
                          onCopy={copy}
                          copiedKey={copiedKey}
                          accent="linear-gradient(135deg,#d1fae5,#a7f3d0)"
                        />
                        <DetailRow
                          icon={Banknote}
                          label="Exact Amount"
                          value={`₦${fmt(accountDetails.amount)}`}
                          copyKey="amount"
                          onCopy={copy}
                          copiedKey={copiedKey}
                        />
                      </div>

                      <div className="px-5 pb-4">
                        <button
                          onClick={() =>
                            copy(
                              `Bank: ${getBankName(accountDetails.bankCode)}\nAccount: ${accountDetails.accountNumber}\nName: ${accountDetails.accountName}\nAmount: ₦${fmt(accountDetails.amount)}`,
                              "all"
                            )
                          }
                          className="w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-97"
                          style={{
                            background: copiedKey === "all"
                              ? "linear-gradient(135deg,#d1fae5,#a7f3d0)"
                              : "#fef3c7",
                            color: copiedKey === "all" ? "#065f46" : "#92400e",
                          }}
                        >
                          {copiedKey === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedKey === "all" ? "Copied all details!" : "Copy All Details"}
                        </button>
                      </div>
                    </div>

                    <div
                      className="rounded-2xl px-4 py-3 flex items-start gap-3"
                      style={{ background: "#fffbeb", border: "1px solid rgba(251,191,36,0.3)" }}
                    >
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Transfer the <span className="font-bold">exact amount</span> shown. Sending a different amount may delay crediting. This account is single-use and expires once the timer runs out.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 px-1">
                      <Shield className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                      <p className="text-[10px] text-amber-400">
                        Secured by 256-bit encryption · Ref: {accountDetails.reference}
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Fixed Footer ── */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-white"
          style={{ borderTop: "1px solid rgba(251,191,36,0.2)", boxShadow: "0 -8px 32px rgba(0,0,0,0.06)" }}
        >
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isLoading || isChecking}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#fef3c7", color: "#92400e", minWidth: 56 }}
            >
              <ArrowLeft className="h-4 w-4" />
              {accountDetails ? <span>New</span> : null}
            </button>

            {!accountDetails ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={numericAmount < 100 || isLoading}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)" }}
              >
                {!isLoading && (
                  <motion.div
                    className="absolute inset-0 -skew-x-12 pointer-events-none"
                    style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)" }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "220%" }}
                    transition={{ duration: 1.8, delay: 0.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                    : <><Zap className="h-4 w-4" /> Generate Account</>}
                </span>
              </motion.button>

            ) : confirmStatus === CONFIRM.SUCCESS ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Fund Again
              </motion.button>

            ) : expired ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={isLoading || isChecking}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)" }}
              >
                <RefreshCw className="h-4 w-4" />
                Generate New Account
              </motion.button>

            ) : isChecking ? (
              <div
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 opacity-70"
                style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e" }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking…
              </div>

            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirmTransfer}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white relative overflow-hidden flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 55%, #10b981 100%)" }}
              >
                <motion.div
                  className="absolute inset-0 -skew-x-12 pointer-events-none"
                  style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%)" }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "220%" }}
                  transition={{ duration: 2, delay: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  I have Sent the Money
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FundWalletPage;
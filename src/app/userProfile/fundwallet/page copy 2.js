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
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import getErrorMessage from "@/app/component/error";
import { motion, AnimatePresence } from "framer-motion";

// ── Quick amount presets ──────────────────────────────────────────────────────
const PRESETS = [1000, 2000, 5000, 10000, 50000];

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
    accountNumber: inner?.accountNumber ?? "—",
    accountName:   inner?.accountName   ?? "—",
    bankCode:      inner?.bankCode      ?? "—",
    amount:        inner?.amount        ?? 0,
    validFor:      inner?.validFor      ?? 900,
    expiryDate:    inner?.expiryDate    ?? null,
    reference:     inner?.externalReference ?? inner?._id ?? "—",
    status:        inner?.status        ?? "Active",
  };
};

// ── Bank name lookup ──────────────────────────────────────────────────────────
const BANK_NAMES = {
  "090286": "Fido MFB",
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
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = seconds / total;
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
          background: copiedKey === copyKey ? "linear-gradient(135deg,#d1fae5,#a7f3d0)" : "#fef3c7",
        }}
      >
        {copiedKey === copyKey
          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
          : <Copy className="h-3.5 w-3.5 text-amber-500" />}
      </button>
    )}
  </motion.div>
);

// ── SafeHaven Checkout Script Loader ─────────────────────────────────────────
const useSafeHavenScript = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Don't load if already present
    if (window.SafeHavenCheckout) { setReady(true); return; }
    const existing = document.querySelector('script[src*="safehavenmfb.com"]');
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.safehavenmfb.com/assets/checkout.min.js";
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => console.error("SafeHaven script failed to load");
    document.body.appendChild(script);
    return () => {
      // Leave the script — removing & re-adding causes race conditions
    };
  }, []);

  return ready;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const FundWalletPage = () => {
  const router    = useRouter();
  const pathname  = usePathname();
  const accessToken     = useSelector((s) => s.user.accessToken);
  const userProfile     = useSelector((s) => s.user.profile);   // { name, email, phone }

  const [amountStr, setAmountStr]           = useState("1000");
  const [amountError, setAmountError]       = useState("");

  // Payment method: "transfer" | "checkout"
  const [payMethod, setPayMethod]           = useState("transfer");

  // Transfer flow state
  const [accountDetails, setAccountDetails] = useState(null);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [secondsLeft, setSecondsLeft]       = useState(0);
  const [totalSeconds, setTotalSeconds]     = useState(900);
  const [expired, setExpired]               = useState(false);

  // Checkout flow state
  const [checkoutState, setCheckoutState]   = useState("idle"); // "idle" | "loading" | "success" | "failed" | "closed"
  const [checkoutRef, setCheckoutRef]       = useState(null);
  const [checkoutError, setCheckoutError]   = useState("");

  const safeHavenReady = useSafeHavenScript();
  const { copiedKey, copy } = useCopy();

  // ── Countdown tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accountDetails || expired) return;
    if (secondsLeft <= 0) { setExpired(true); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [accountDetails, secondsLeft, expired]);

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const numericAmount = parseInt(amountStr.replace(/[^\d]/g, ""), 10) || 0;

  // ── Transfer mutation ───────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async (fundAmount) => {
      if (!accessToken) throw new Error("Access token not available");
      const qs = new URLSearchParams({ apiType: "generateAccountVirtual", token: accessToken });
      const res = await fetch(`/api/user?${qs.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "generateAccountVirtual",
          accessToken,
          amount: fundAmount,
          type: "fundWallet",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to generate account");
      }
      return res.json();
    },
    onMutate: () => setIsGenerating(true),
    onSuccess: (data) => {
      const parsed = parseVirtualAccount(data);
      setAccountDetails(parsed);
      setSecondsLeft(parsed.validFor);
      setTotalSeconds(parsed.validFor);
      setExpired(false);
      setAmountError("");
      setIsGenerating(false);
    },
    onError: (error) => {
      setAmountError(getErrorMessage(error) || "Something went wrong. Please try again.");
      getErrorMessage(error, router, "", false, pathname);
      setIsGenerating(false);
    },
    onSettled: () => setIsGenerating(false),
  });

  // ── SafeHaven Checkout trigger ──────────────────────────────────────────────
  const handleCheckout = useCallback(() => {
    if (!safeHavenReady || !window.SafeHavenCheckout) {
      setCheckoutError("Payment widget not ready yet. Please try again in a moment.");
      return;
    }
    if (numericAmount < 1000) {
      setAmountError("Minimum amount is ₦1,000");
      return;
    }

    const ref = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setCheckoutRef(ref);
    setCheckoutState("loading");
    setCheckoutError("");

    window.SafeHavenCheckout({
      environment: "production",
      clientId:    "fa1131e41ded9bf593f1d80d681fa922",
      referenceCode: ref,
      amount: numericAmount,          // in Naira (NOT kobo — confirm with SafeHaven docs for your account)
      currency: "NGN",
      customer: {
        firstName: "Test",
        lastName: "User",
        emailAddress: "test@example.com",
        phoneNumber: "08000000000",
      },
      settlementAccount: {
        bankCode:      "090286",
        accountNumber: "0112825591",
      },
      // Optional extras
      feeBearer: "customer",
      webhookUrl: "https://yourapp.com/api/webhooks/safehaven",
      metadata: { source: "fund_wallet", userId: userProfile?.id ?? "" },

      callback: (response) => {
        console.log("[SafeHaven] callback →", response);
        // response.status can be "success" | "failed" | "abandoned"
        if (response?.status === "success") {
          setCheckoutState("success");
          // ⚠️ Always verify server-side — don't trust frontend alone
          verifyTransaction(ref);
        } else {
          setCheckoutState("failed");
          setCheckoutError(response?.message ?? "Payment was not completed.");
        }
      },
      onClose: () => {
        // Only move to "closed" if we haven't already got a terminal state
        setCheckoutState((prev) => {
          if (prev === "loading") return "closed";
          return prev;
        });
      },
    });
  }, [safeHavenReady, numericAmount, userProfile]);

  // ── Server-side verification (fire-and-forget for now) ─────────────────────
  const verifyTransaction = async (ref) => {
    try {
      const qs = new URLSearchParams({ apiType: "verifyCheckout", token: accessToken, referenceCode: ref });
      const res = await fetch(`/api/user?${qs.toString()}`);
      const data = await res.json();
      console.log("[SafeHaven] verify →", data);
      // Handle wallet credit confirmation in your backend
    } catch (err) {
      console.error("[SafeHaven] verify failed", err);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (isGenerating) return;
    if (numericAmount < 1000) { setAmountError("Minimum amount is ₦1,000"); return; }
    setAmountError("");
    generateMutation.mutate(numericAmount);
  };

  const handleReset = () => {
    setAccountDetails(null);
    setExpired(false);
    setSecondsLeft(0);
    setAmountError("");
    setCheckoutState("idle");
    setCheckoutError("");
    setCheckoutRef(null);
  };

  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setAmountStr(digits);
    setAmountError(parseInt(digits) < 1000 ? "Minimum amount is ₦1,000" : "");
  };

  const isLoading = isGenerating || generateMutation.isPending;

  // Whether we're showing a "result" screen (for checkout path)
  const showingCheckoutResult = payMethod === "checkout" &&
    ["success", "failed", "closed"].includes(checkoutState);

  // Whether we're showing transfer details
  const showingTransferDetails = payMethod === "transfer" && !!accountDetails;

  // Whether we're in the entry/method-select view
  const showingEntry = !showingTransferDetails && !showingCheckoutResult;

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
              onClick={() => (showingTransferDetails || showingCheckoutResult) ? handleReset() : router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-none tracking-tight">Fund My Wallet</h1>
              <p className="text-amber-200 text-[11px] mt-0.5">Instant payment</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Zap className="h-3 w-3 text-yellow-300" />
              <span className="text-[10px] text-amber-100 font-bold">Instant</span>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-auto pt-28 pb-28 px-4 space-y-4">
          <AnimatePresence mode="wait">

            {/* ════ ENTRY VIEW (amount + method select) ════ */}
      {/* ════ ENTRY VIEW (amount + method select) ════ */}
{showingEntry && (
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">
        Enter Amount
      </p>

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
            onClick={() => {
              setAmountStr(String(p));
              setAmountError("");
            }}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
            style={
              numericAmount === p
                ? {
                    background: "linear-gradient(135deg, #92400e, #f59e0b)",
                    color: "#fff",
                  }
                : { background: "#fef3c7", color: "#92400e" }
            }
          >
            ₦{p >= 1000 ? `${p / 1000}k` : p}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {amountError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 mt-3"
          >
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs text-red-500">{amountError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Payment Method */}
    <div
      className="bg-white rounded-3xl p-5 shadow-sm"
      style={{ border: "1.5px solid rgba(251,191,36,0.2)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">
        Payment Method
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPayMethod("transfer")}
          className="relative p-4 rounded-2xl text-left transition-all active:scale-95"
        >
          <p className="text-xs font-extrabold text-amber-900">Bank Transfer</p>
        </button>

        <button
          onClick={() => setPayMethod("checkout")}
          className="relative p-4 rounded-2xl text-left transition-all active:scale-95"
        >
          <p className="text-xs font-extrabold text-amber-900">Card / USSD</p>
        </button>
      </div>

      <AnimatePresence>
        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 mt-3"
          >
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs text-red-500">{checkoutError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {payMethod === "checkout" && !safeHavenReady && (
        <div className="flex items-center gap-1.5 mt-3">
          <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
          <p className="text-[10px] text-amber-400">
            Loading payment widget…
          </p>
        </div>
      )}
    </div>

    {/* How it works */}
    <div
      className="bg-white rounded-3xl p-5 shadow-sm"
      style={{ border: "1.5px solid rgba(251,191,36,0.2)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">
        {payMethod === "checkout"
          ? "How Card / USSD Works"
          : "How It Works"}
      </p>

      {(
        payMethod === "transfer"
          ? [
              { n: "1", text: "Enter the amount you want to add" },
              { n: "2", text: "Tap Generate to get a one-time bank account" },
              {
                n: "3",
                text: "Transfer the exact amount before it expires",
              },
              {
                n: "4",
                text: "Your wallet is credited instantly",
              },
            ]
          : [
              { n: "1", text: "Enter the amount you want to add" },
              {
                n: "2",
                text: "Tap Pay to open the SafeHaven checkout",
              },
              {
                n: "3",
                text: "Pay with card, bank transfer, or USSD",
              },
              {
                n: "4",
                text: "Your wallet is credited instantly on success",
              },
            ]
      ).map(({ n, text }) => (
        <div
          key={n}
          className="flex items-start gap-3 mb-2.5 last:mb-0"
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white bg-amber-500">
            {n}
          </div>
          <p className="text-xs text-amber-700">{text}</p>
        </div>
      ))}
    </div>

    {/* Loading */}
    <AnimatePresence>
      {isLoading && (
        <motion.div className="bg-white rounded-3xl p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p>Generating your account…</p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
)}

            {/* ════ TRANSFER ACCOUNT DETAILS VIEW ════ */}
            {showingTransferDetails && (
              <motion.div
                key="transfer-details"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                {/* Countdown card */}
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

                {/* Bank details card */}
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
                    <DetailRow icon={Building2} label="Bank Name" value={getBankName(accountDetails.bankCode)} copyKey="bank" onCopy={copy} copiedKey={copiedKey} />
                    <DetailRow icon={Hash} label="Account Number" value={accountDetails.accountNumber} copyKey="accnum" onCopy={copy} copiedKey={copiedKey} accent="linear-gradient(135deg,#ede9fe,#ddd6fe)" />
                    <DetailRow icon={User} label="Account Name" value={accountDetails.accountName} copyKey="accname" onCopy={copy} copiedKey={copiedKey} accent="linear-gradient(135deg,#d1fae5,#a7f3d0)" />
                    <DetailRow icon={Banknote} label="Exact Amount" value={`₦${fmt(accountDetails.amount)}`} copyKey="amount" onCopy={copy} copiedKey={copiedKey} />
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
                        background: copiedKey === "all" ? "linear-gradient(135deg,#d1fae5,#a7f3d0)" : "#fef3c7",
                        color: copiedKey === "all" ? "#065f46" : "#92400e",
                      }}
                    >
                      {copiedKey === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedKey === "all" ? "Copied all details!" : "Copy All Details"}
                    </button>
                  </div>
                </div>

                {/* Warning strip */}
                <div
                  className="rounded-2xl px-4 py-3 flex items-start gap-3"
                  style={{ background: "#fffbeb", border: "1px solid rgba(251,191,36,0.3)" }}
                >
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Transfer the <span className="font-bold">exact amount</span> shown. Sending a different amount may delay crediting. This account is single-use and expires once the timer runs out.
                  </p>
                </div>

                {/* Security strip */}
                <div className="flex items-center gap-2 px-1">
                  <Shield className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] text-amber-400">
                    Secured by 256-bit encryption · Reference: {accountDetails.reference}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ════ CHECKOUT RESULT VIEW ════ */}
            {showingCheckoutResult && (
              <motion.div
                key="checkout-result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                {checkoutState === "success" && (
                  <div
                    className="bg-white rounded-3xl p-6 shadow-sm text-center"
                    style={{ border: "1.5px solid rgba(167,243,208,0.6)" }}
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}
                    >
                      <BadgeCheck className="h-8 w-8 text-emerald-600" />
                    </motion.div>
                    <p className="text-lg font-extrabold text-amber-900 mb-1">Payment Successful!</p>
                    <p className="text-sm text-amber-600 mb-4">₦{fmt(numericAmount)} has been added to your wallet</p>
                    <div
                      className="rounded-2xl px-4 py-3 text-left"
                      style={{ background: "#f0fdf4", border: "1px solid rgba(167,243,208,0.4)" }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Reference</p>
                      <p className="text-xs font-mono text-emerald-800">{checkoutRef}</p>
                    </div>
                    <div
                      className="mt-3 rounded-2xl px-4 py-3 text-left flex items-start gap-2"
                      style={{ background: "#fffbeb", border: "1px solid rgba(251,191,36,0.2)" }}
                    >
                      <Shield className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-600 leading-relaxed">
                        Transaction is being verified server-side. Your balance will reflect shortly.
                      </p>
                    </div>
                  </div>
                )}

                {checkoutState === "failed" && (
                  <div
                    className="bg-white rounded-3xl p-6 shadow-sm text-center"
                    style={{ border: "1.5px solid #fca5a5" }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "#fee2e2" }}
                    >
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-lg font-extrabold text-amber-900 mb-1">Payment Failed</p>
                    <p className="text-sm text-red-500 mb-4">{checkoutError || "The payment could not be completed."}</p>
                    <p className="text-xs text-amber-500">You can try again or use bank transfer instead.</p>
                  </div>
                )}

                {checkoutState === "closed" && (
                  <div
                    className="bg-white rounded-3xl p-6 shadow-sm text-center"
                    style={{ border: "1.5px solid rgba(251,191,36,0.3)" }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "#fef3c7" }}
                    >
                      <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                    <p className="text-lg font-extrabold text-amber-900 mb-1">Payment Cancelled</p>
                    <p className="text-sm text-amber-600 mb-4">You closed the payment window. No charge was made.</p>
                    <p className="text-xs text-amber-400">Tap below to try again.</p>
                  </div>
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
            {/* Back / reset button */}
            <button
              onClick={() => (showingTransferDetails || showingCheckoutResult) ? handleReset() : router.back()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#fef3c7", color: "#92400e", minWidth: 56 }}
            >
              <ArrowLeft className="h-4 w-4" />
              {(showingTransferDetails || showingCheckoutResult) ? <span>New</span> : null}
            </button>

            {/* ── Transfer: entry CTA ── */}
            {showingEntry && payMethod === "transfer" && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={numericAmount < 1000 || isLoading}
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
                    : <><Zap className="h-4 w-4" /> Generate Account</>
                  }
                </span>
              </motion.button>
            )}

            {/* ── Checkout: entry CTA ── */}
            {showingEntry && payMethod === "checkout" && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckout}
                disabled={numericAmount < 1000 || !safeHavenReady}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)" }}
              >
                {!safeHavenReady && (
                  <motion.div
                    className="absolute inset-0 -skew-x-12 pointer-events-none"
                    style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)" }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "220%" }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {!safeHavenReady
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
                    : <><CreditCard className="h-4 w-4" /> Pay ₦{fmt(numericAmount)}</>
                  }
                </span>
              </motion.button>
            )}

            {/* ── Transfer: expired → regenerate ── */}
            {showingTransferDetails && expired && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)" }}
              >
                <RefreshCw className="h-4 w-4" />
                Generate New Account
              </motion.button>
            )}

            {/* ── Transfer: active → waiting indicator ── */}
            {showingTransferDetails && !expired && (
              <div
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-center flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", color: "#065f46" }}
              >
                <BadgeCheck className="h-4 w-4" />
                Waiting for Transfer…
              </div>
            )}

            {/* ── Checkout result: retry / go home ── */}
            {showingCheckoutResult && checkoutState !== "success" && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCheckoutState("idle");
                  setCheckoutError("");
                  setCheckoutRef(null);
                  // Stay on entry view, let user try again
                }}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)" }}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </motion.button>
            )}

            {showingCheckoutResult && checkoutState === "success" && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.back()}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
              >
                <ArrowRight className="h-4 w-4" />
                Back to Wallet
              </motion.button>
            )}
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default FundWalletPage;
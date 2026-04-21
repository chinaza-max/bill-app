"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet,
  ShieldCheck,
  User,
  CreditCard,
} from "lucide-react";

const MIN_AMOUNT = 1000;

// ── Quick-pick presets ────────────────────────────────────────────────────────
const PRESETS = [1000, 2000, 5000, 10000, 20000];

// ── Format helpers ────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString("en-NG");
const raw = (s) => Number(String(s).replace(/[^\d]/g, "")) || 0;

// ── Parse wallet balance ──────────────────────────────────────────────────────
const parseWalletBalance = (rawBalance) => {
  try {
    if (rawBalance === null || rawBalance === undefined) return 0;
    if (typeof rawBalance === "number") return rawBalance;
    if (typeof rawBalance === "string") {
      try {
        const parsed = JSON.parse(rawBalance);
        return parsed?.current ?? parsed?.previous ?? 0;
      } catch {
        return parseFloat(rawBalance) || 0;
      }
    }
    if (typeof rawBalance === "object") {
      return rawBalance?.current ?? rawBalance?.previous ?? 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

// ── Mask account number: show first 3 and last 3 ─────────────────────────────
const maskAccount = (acc) => {
  if (!acc || acc.length < 6) return acc;
  return `${acc.slice(0, 3)}****${acc.slice(-3)}`;
};

const WithdrawPage = () => {
  const router = useRouter();
  const accessToken = useSelector((s) => s.user.accessToken);

  const reduxUser = useSelector((s) => s.user);

  const path1 = reduxUser?.user?.walletBalance;
  const path2 = reduxUser?.user?.user?.walletBalance;
  const path3 = reduxUser?.walletBalance;

  useEffect(() => {
    console.log("=== WALLET DEBUG ===");
    console.log("Full state.user:", JSON.stringify(reduxUser, null, 2));
    console.log("path1 (state.user.user.walletBalance):", path1);
    console.log("path2 (state.user.user.user.walletBalance):", path2);
    console.log("path3 (state.user.walletBalance):", path3);
    console.log("===================");
  }, [reduxUser]);

  const rawWalletBalance = path1 ?? path2 ?? path3;
  const walletBalance = parseWalletBalance(rawWalletBalance);

  // ── State ─────────────────────────────────────────────────────────────────
  const [bankDetails, setBankDetails] = useState(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError]     = useState("");

  const [amountStr, setAmountStr]     = useState("");
  const [amountError, setAmountError] = useState("");

  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess]         = useState(false);

  // ── Fetch bank details ────────────────────────────────────────────────────
  const fetchBankDetails = useCallback(async () => {
    setBankLoading(true);
    setBankError("");
    try {
      const q = new URLSearchParams({ apiType: "bank-details", token: accessToken || "" }).toString();
      const res = await fetch(`/api/user?${q}`, {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();

      // ── API data is nested at data.data ──
      // Response shape: { data: { hasBankDetails, settlementAccount, bankCode, bankName, accountName } }
      const payload = json?.data?.data ?? json?.data ?? json;

      if (!payload?.hasBankDetails) {
        localStorage.setItem("pendingWithdrawalRedirect", "true");
        router.replace("/userProfile/merchantProfile/merchantHome/settings/settingUpAccount");
        return;
      }

      // payload now contains: hasBankDetails, settlementAccount, bankCode, bankName, accountName
      setBankDetails(payload);
    } catch (e) {
      setBankError("Could not load bank details. Please try again.");
    } finally {
      setBankLoading(false);
    }
  }, [accessToken, router]);

  useEffect(() => { fetchBankDetails(); }, [fetchBankDetails]);

  // ── Amount input handler ──────────────────────────────────────────────────
  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setAmountStr(digits ? fmt(digits) : "");
    setAmountError("");
    setSubmitError("");
  };

  const handlePreset = (val) => {
    setAmountStr(fmt(val));
    setAmountError("");
    setSubmitError("");
  };

  const numericAmount = raw(amountStr);

  const validate = () => {
    if (!numericAmount)                { setAmountError("Please enter an amount."); return false; }
    if (numericAmount < MIN_AMOUNT)    { setAmountError(`Minimum withdrawal is ₦${fmt(MIN_AMOUNT)}.`); return false; }
    if (numericAmount > walletBalance) { setAmountError("Amount exceeds your wallet balance."); return false; }
    return true;
  };

  // ── Submit withdrawal ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          apiType: "withdraw",
          token: accessToken,
          amount: numericAmount,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      setSuccess(true);
    } catch (e) {
      setSubmitError(e.message || "Withdrawal failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col h-screen bg-amber-50 items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center text-center"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
            style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)" }}
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-amber-900 mb-2">Withdrawal Initiated</h2>
          <p className="text-amber-700 text-sm mb-1">
            <span className="font-bold text-lg">₦{fmt(numericAmount)}</span>
          </p>
          {/* accountName on success screen */}
          <p className="text-amber-800 text-sm font-bold mb-0.5">{bankDetails?.accountName}</p>
          <p className="text-amber-600 text-xs mb-1">
            {bankDetails?.bankName} — {bankDetails?.settlementAccount}
          </p>
          <p className="text-gray-400 text-xs mb-8">
            Funds are typically received within minutes.
          </p>
          <button
            onClick={() => router.replace("/home")}
            className="px-8 py-3 rounded-2xl text-sm font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)" }}
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-amber-50">

      {/* ── Header ── */}
      <div
        className="px-4 pt-10 pb-5"
        style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
          <h1 className="text-white font-extrabold text-xl tracking-tight">Withdraw Funds</h1>
        </div>

        {/* Balance pill */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl w-fit"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <Wallet className="h-4 w-4 text-amber-200" />
          <p className="text-xs text-amber-100">Available balance</p>
          <p className="text-sm font-extrabold text-white">
            {walletBalance > 0 ? `₦${fmt(walletBalance)}` : "—"}
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-auto px-4 py-5 space-y-4">

        {/* ── Bank details card ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2 px-1">
            Withdrawal Account
          </p>

          {bankLoading ? (
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              <p className="text-sm text-amber-700">Loading bank details...</p>
            </div>
          ) : bankError ? (
            <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 flex-1">{bankError}</p>
              <button onClick={fetchBankDetails} className="text-xs font-bold text-amber-600 underline">
                Retry
              </button>
            </div>
          ) : bankDetails ? (
            /* ── Verified bank card: bankName + accountName + settlementAccount ── */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
              style={{ border: "1.5px solid rgba(251,191,36,0.3)" }}
            >
              {/* Top strip — bank name + change button */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)" }}
                >
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-amber-900 truncate">{bankDetails.bankName}</p>
                  <p className="text-[11px] text-amber-500 font-mono tracking-widest">
                    {maskAccount(bankDetails.settlementAccount)}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/userProfile/merchantProfile/merchantHome/settings/settingUpAccount")}
                  className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-sm"
                >
                  Change <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Thin divider */}
              <div className="h-px mx-4" style={{ background: "rgba(251,191,36,0.2)" }} />

              {/* Bottom section — account name row + account number row */}
              <div className="px-4 py-3 space-y-3">

                {/* Account Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}
                  >
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                      Account Name
                    </p>
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {bankDetails.accountName}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                </div>

                {/* Account Number */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                  >
                    <CreditCard className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                      Account Number
                    </p>
                    <p className="text-sm font-bold text-gray-800 font-mono tracking-widest">
                      {bankDetails.settlementAccount}
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            /* ── No bank details yet ── */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
              style={{ border: "1.5px solid rgba(251,191,36,0.25)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                >
                  <Building2 className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">No bank account linked</p>
                  <p className="text-xs text-amber-500">Add a bank account to withdraw funds</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/userProfile/merchantProfile/merchantHome/settings/settingUpAccount")}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)" }}
              >
                <Building2 className="h-3.5 w-3.5" />
                Set Up Withdrawal Account
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Amount input ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2 px-1">
            Amount
          </p>
          <div
            className="bg-white rounded-2xl px-4 pt-4 pb-3 shadow-sm"
            style={{ border: amountError ? "1.5px solid #fca5a5" : "1.5px solid rgba(251,191,36,0.25)" }}
          >
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-black text-amber-900">₦</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountStr}
                onChange={handleAmountChange}
                className="flex-1 text-3xl font-extrabold bg-transparent outline-none text-amber-900 placeholder-amber-200 w-full"
                style={{ letterSpacing: "-0.5px" }}
              />
            </div>

            <p className="text-[10px] text-amber-400 mb-3">
              Minimum withdrawal:{" "}
              <span className="font-bold text-amber-600">₦{fmt(MIN_AMOUNT)}</span>
              {walletBalance > 0 && (
                <span className="ml-2 text-amber-400">
                  · Max: <span className="font-bold text-amber-600">₦{fmt(walletBalance)}</span>
                </span>
              )}
            </p>

            {/* Quick-pick presets */}
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => {
                const overBalance = walletBalance > 0 && p > walletBalance;
                return (
                  <button
                    key={p}
                    onClick={() => !overBalance && handlePreset(p)}
                    disabled={overBalance}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={
                      numericAmount === p
                        ? { background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }
                        : { background: "#fef3c7", color: "#92400e" }
                    }
                  >
                    ₦{p >= 1000 ? `${p / 1000}k` : p}
                  </button>
                );
              })}

              {walletBalance > 0 && (
                <button
                  onClick={() => handlePreset(walletBalance)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={
                    numericAmount === walletBalance
                      ? { background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }
                      : { background: "#fef3c7", color: "#92400e" }
                  }
                >
                  All
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {amountError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 mt-2 px-1"
              >
                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-500">{amountError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Summary ── */}
        <AnimatePresence>
          {numericAmount >= MIN_AMOUNT && numericAmount <= walletBalance && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl px-4 py-3 shadow-sm space-y-2"
              style={{ border: "1.5px solid rgba(251,191,36,0.2)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">You withdraw</span>
                <span className="font-bold text-amber-900">₦{fmt(numericAmount)}</span>
              </div>
              {/* Account name in summary */}
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Account name</span>
                <span className="font-semibold text-amber-800 text-xs">{bankDetails?.accountName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">To account</span>
                <span className="font-semibold text-amber-800 text-xs font-mono">{bankDetails?.settlementAccount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Remaining balance</span>
                <span className="font-bold text-amber-900">₦{fmt(walletBalance - numericAmount)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security note */}
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-amber-400">
            Secured &amp; encrypted. Funds typically arrive within minutes.
          </p>
        </div>

        {/* Submit error */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
            >
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{submitError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="px-4 pb-8 pt-3 bg-amber-50">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={submitting || bankLoading || !!bankError || !bankDetails}
          className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)" }}
        >
          {!submitting && (
            <motion.div
              className="absolute inset-0 -skew-x-12 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)" }}
              initial={{ x: "-100%" }}
              animate={{ x: "220%" }}
              transition={{ duration: 1.8, delay: 0.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Withdraw${numericAmount >= MIN_AMOUNT ? ` ₦${fmt(numericAmount)}` : ""}`
            )}
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default WithdrawPage;
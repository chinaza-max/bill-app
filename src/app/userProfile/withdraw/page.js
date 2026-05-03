"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Mail,
} from "lucide-react";

const MIN_AMOUNT = 1000;
const PRESETS = [1000, 2000, 5000, 10000, 20000];

const fmt = (n) => Number(n).toLocaleString("en-NG");
const raw = (s) => Number(String(s).replace(/[^\d]/g, "")) || 0;

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

const maskAccount = (acc) => {
  if (!acc || acc.length < 6) return acc;
  return `${acc.slice(0, 3)}****${acc.slice(-3)}`;
};

export default function WithdrawPage() {
  const router = useRouter();
  const accessToken = useSelector((s) => s.user.accessToken);
  const reduxUser = useSelector((s) => s.user);

  const path1 = reduxUser?.user?.walletBalance;
  const path2 = reduxUser?.user?.user?.walletBalance;
  const path3 = reduxUser?.walletBalance;
  const rawWalletBalance = path1 ?? path2 ?? path3;
  const walletBalance = parseWalletBalance(rawWalletBalance);

  const [step, setStep] = useState("amount");

  // bank
  const [bankDetails, setBankDetails] = useState(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState("");

  // amount step
  const [amountStr, setAmountStr] = useState("");
  const [amountError, setAmountError] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState("");

  // otp step
  const [csrfToken, setCsrfToken] = useState("");
  const [withdrawalToken, setWithdrawalToken] = useState("");
  const [plainToken, setPlainToken] = useState("");
  const [maskedDestination, setMaskedDestination] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // resend
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendRef = useRef(null);

  const numericAmount = raw(amountStr);

  // ── Fetch bank details ────────────────────────────────────────────────────
  const fetchBankDetails = useCallback(async () => {
    setBankLoading(true);
    setBankError("");
    try {
      const q = new URLSearchParams({
        apiType: "bank-details",
        token: accessToken || "",
      }).toString();
      const res = await fetch(`/api/user?${q}`, {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const payload = json?.data?.data ?? json?.data ?? json;
      if (!payload?.hasBankDetails) {
        localStorage.setItem("pendingWithdrawalRedirect", "true");
        router.replace(
          "/userProfile/merchantProfile/merchantHome/settings/settingUpAccount"
        );
        return;
      }
      setBankDetails(payload);
    } catch {
      setBankError("Could not load bank details. Please try again.");
    } finally {
      setBankLoading(false);
    }
  }, [accessToken, router]);

  useEffect(() => {
    fetchBankDetails();
  }, [fetchBankDetails]);

  // ── Resend cooldown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    resendRef.current = setInterval(
      () => setResendCooldown((c) => (c > 0 ? c - 1 : 0)),
      1000
    );
    return () => clearInterval(resendRef.current);
  }, [resendCooldown]);

  // ── Amount helpers ────────────────────────────────────────────────────────
  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    const num = parseInt(digits) || 0;
    setAmountStr(num ? fmt(num) : "");
    setAmountError("");
    setInitiateError("");
  };

  const handlePreset = (val) => {
    setAmountStr(fmt(val));
    setAmountError("");
    setInitiateError("");
  };

  const validateAmount = () => {
    if (!numericAmount) {
      setAmountError("Please enter an amount.");
      return false;
    }
    if (numericAmount < MIN_AMOUNT) {
      setAmountError(`Minimum withdrawal is ₦${fmt(MIN_AMOUNT)}.`);
      return false;
    }
    if (numericAmount > walletBalance) {
      setAmountError("Amount exceeds your available balance.");
      return false;
    }
    return true;
  };

  const storeTokensFromResponse = (json) => {
    const d = json?.data?.data ?? json?.data ?? json;
    setCsrfToken(d?.csrfToken ?? "");
    setWithdrawalToken(d?.withdrawalToken ?? "");
    setPlainToken(d?.token ?? "");
    setMaskedDestination(d?.destination ?? null);
  };

  // ── Initiate withdrawal ───────────────────────────────────────────────────
  const handleInitiate = async () => {
    if (!validateAmount()) return;
    setInitiating(true);
    setInitiateError("");
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          apiType: "initiateWithdrawal",
          accessToken,
          amount: numericAmount,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.details || json?.message || `Error ${res.status}`);
      storeTokensFromResponse(json);
      setResendCooldown(60);
      setOtpValue("");
      setOtpError("");
      setVerifyError("");
      setStep("otp");
    } catch (e) {
      setInitiateError(e.message || "Could not initiate withdrawal. Try again.");
    } finally {
      setInitiating(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otpValue.trim().length !== 6) {
      setOtpError("Enter the 6-digit code sent to your email.");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    setOtpError("");
    try {
      const verifyPayload = {
        apiType: "verifyWithdrawalOtp",
        accessToken,
        otp: Number(otpValue.trim()),
      };
      if (csrfToken) verifyPayload.csrfToken = csrfToken;
      if (withdrawalToken) verifyPayload.withdrawalToken = withdrawalToken;
      if (plainToken) verifyPayload.token = plainToken;

      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(verifyPayload),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.details || json?.message || `Error ${res.status}`);
      setStep("success");
    } catch (e) {
      setVerifyError(e.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setVerifyError("");
    setOtpError("");
    setOtpValue("");
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          apiType: "initiateWithdrawal",
          accessToken,
          amount: numericAmount,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.details || json?.message || `Error ${res.status}`);
      storeTokensFromResponse(json);
      setResendCooldown(60);
    } catch (e) {
      setVerifyError(e.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SUCCESS
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "success") {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="flex flex-col items-center text-center w-full max-w-xs"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
            style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}
          >
            <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.2} />
          </div>

          <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Withdrawal Initiated
          </p>
          <p
            className="text-[46px] font-black tracking-tight text-gray-900 leading-none mb-6"
          >
            ₦{fmt(numericAmount)}
          </p>

          <div
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-8"
            style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)" }}
            >
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-gray-900">
                {bankDetails?.accountName}
              </p>
              <p className="text-[13px] text-gray-400">
                {bankDetails?.bankName} · {maskAccount(bankDetails?.settlementAccount)}
              </p>
            </div>
          </div>

          <p className="text-[13px] text-gray-400 mb-8">
            Funds typically arrive within minutes.
          </p>

          <button
            onClick={() => router.replace("/home")}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)" }}
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OTP
  // ══════════════════════════════════════════════════════════════════════════
  if (step === "otp") {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* header */}
        <div
          className="px-4 pt-12 pb-5"
          style={{
            background:
              "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setStep("amount");
                setOtpValue("");
                setOtpError("");
                setVerifyError("");
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <h1 className="text-white font-extrabold text-xl tracking-tight">
              Verify Withdrawal
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-7 space-y-5">
          {/* hero */}
          <div className="flex flex-col items-center text-center pb-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#fef3c7" }}
            >
              <Mail
                className="h-6 w-6"
                style={{ color: "#d97706" }}
                strokeWidth={1.6}
              />
            </div>
            <p className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-1">
              Check your email
            </p>
            <p className="text-[14px] text-gray-400 leading-relaxed max-w-[260px]">
              Enter the 6-digit code to confirm your withdrawal of{" "}
              <span className="font-bold text-gray-700">
                ₦{fmt(numericAmount)}
              </span>
            </p>
          </div>

          {/* destination row */}
          {maskedDestination && (
            <div
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)" }}
              >
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-gray-900">
                  {maskedDestination.accountName}
                </p>
                <p className="text-[13px] text-gray-400">
                  {maskedDestination.bankName} · {maskedDestination.accountNumber}
                </p>
              </div>
            </div>
          )}

          {/* OTP input */}
          <div
            className="rounded-2xl px-5 py-5"
            style={{
              background: "#f9fafb",
              border:
                otpError || verifyError
                  ? "1.5px solid #fca5a5"
                  : "1.5px solid #e5e7eb",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              One-Time Password
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="——————"
              maxLength={6}
              value={otpValue}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpValue(d);
                setOtpError("");
                setVerifyError("");
              }}
              autoFocus
              className="w-full text-center bg-transparent outline-none"
              style={{
                fontSize: 40,
                fontWeight: 300,
                letterSpacing: 14,
                color: "#111",
                caretColor: "#d97706",
              }}
            />
            <div
              className="mt-3 h-[1.5px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #d97706, transparent)",
              }}
            />
          </div>

          {/* inline error — no modal */}
          <AnimatePresence>
            {(otpError || verifyError) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 rounded-2xl px-4 py-3"
                style={{ background: "#fef2f2" }}
              >
                <AlertCircle
                  className="h-4 w-4 flex-shrink-0 mt-0.5"
                  style={{ color: "#ef4444" }}
                />
                <p className="text-[13px]" style={{ color: "#dc2626" }}>
                  {otpError || verifyError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* resend */}
          <div className="flex items-center justify-center gap-2">
            <p className="text-[14px] text-gray-400">Did not receive it?</p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-[14px] font-semibold disabled:opacity-40"
              style={{ color: "#d97706" }}
            >
              {resending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Sending…
                </span>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                "Resend OTP"
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="h-3 w-3 text-gray-300" />
            <p className="text-[11px] text-gray-300">
              Never share this code with anyone.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-10 pt-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleVerifyOtp}
            disabled={verifying || otpValue.length !== 6}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
            style={{
              background:
                "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)",
            }}
          >
            {verifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" /> Confirm Withdrawal
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AMOUNT
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{
          background:
            "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)",
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </button>
          <h1 className="text-white font-extrabold text-xl tracking-tight">
            Withdraw Funds
          </h1>
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Wallet className="h-4 w-4 text-amber-200" />
          <p className="text-xs text-amber-100">Available</p>
          <p className="text-sm font-extrabold text-white">
            {walletBalance > 0 ? `₦${fmt(walletBalance)}` : "—"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-6 space-y-5">
        {/* bank card */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
            Withdrawal Account
          </p>

          {bankLoading ? (
            <div
              className="flex items-center gap-3 px-4 py-4 rounded-2xl"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading…</p>
            </div>
          ) : bankError ? (
            <div
              className="flex items-center gap-3 px-4 py-4 rounded-2xl"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-500 flex-1">{bankError}</p>
              <button
                onClick={fetchBankDetails}
                className="text-xs font-bold text-amber-600"
              >
                Retry
              </button>
            </div>
          ) : bankDetails ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-4 rounded-2xl"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)" }}
              >
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-gray-900 truncate">
                  {bankDetails.bankName}
                </p>
                <p className="text-[13px] text-gray-400 font-mono tracking-wider">
                  {maskAccount(bankDetails.settlementAccount)}
                </p>
              </div>
              <button
                onClick={() =>
                  router.push(
                    "/userProfile/merchantProfile/merchantHome/settings/settingUpAccount"
                  )
                }
                className="flex items-center gap-0.5 text-[12px] font-semibold"
                style={{ color: "#d97706" }}
              >
                Change <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ) : (
            <div
              className="flex items-center gap-3 px-4 py-4 rounded-2xl"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#fef3c7" }}
              >
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700">
                  No bank account linked
                </p>
                <p className="text-xs text-gray-400">Add one to withdraw funds</p>
              </div>
              <button
                onClick={() =>
                  router.push(
                    "/userProfile/merchantProfile/merchantHome/settings/settingUpAccount"
                  )
                }
                className="text-[12px] font-semibold flex items-center gap-0.5"
                style={{ color: "#d97706" }}
              >
                Set up <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* amount input */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
            Amount
          </p>
          <div
            className="rounded-2xl px-5 pt-5 pb-4"
            style={{
              background: "#f9fafb",
              border: amountError
                ? "1.5px solid #fca5a5"
                : "1.5px solid #e5e7eb",
            }}
          >
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-2xl font-black text-gray-300">₦</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountStr}
                onChange={handleAmountChange}
                className="flex-1 text-4xl font-extrabold bg-transparent outline-none text-gray-900 placeholder-gray-200 w-full"
                style={{ letterSpacing: "-1px" }}
              />
            </div>

            <p className="text-[11px] text-gray-400 mb-4">
              Min{" "}
              <span className="font-semibold text-gray-600">
                ₦{fmt(MIN_AMOUNT)}
              </span>
              {walletBalance > 0 && (
                <span>
                  {" "}
                  · Max{" "}
                  <span className="font-semibold text-gray-600">
                    ₦{fmt(walletBalance)}
                  </span>
                </span>
              )}
            </p>

            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => {
                const over = walletBalance > 0 && p > walletBalance;
                return (
                  <button
                    key={p}
                    onClick={() => !over && handlePreset(p)}
                    disabled={over}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={
                      numericAmount === p
                        ? {
                            background:
                              "linear-gradient(135deg, #92400e, #f59e0b)",
                            color: "#fff",
                          }
                        : {
                            background: "#fff",
                            color: "#92400e",
                            border: "1px solid #e5e7eb",
                          }
                    }
                  >
                    ₦{p >= 1000 ? `${p / 1000}k` : p}
                  </button>
                );
              })}
              {walletBalance > 0 && (
                <button
                  onClick={() => handlePreset(walletBalance)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={
                    numericAmount === walletBalance
                      ? {
                          background:
                            "linear-gradient(135deg, #92400e, #f59e0b)",
                          color: "#fff",
                        }
                      : {
                          background: "#fff",
                          color: "#92400e",
                          border: "1px solid #e5e7eb",
                        }
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
                <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-500">{amountError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* summary */}
        <AnimatePresence>
          {numericAmount >= MIN_AMOUNT && numericAmount <= walletBalance && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              {[
                {
                  label: "You withdraw",
                  value: `₦${fmt(numericAmount)}`,
                  bold: true,
                },
                { label: "To", value: bankDetails?.accountName ?? "—" },
                {
                  label: "Remaining balance",
                  value: `₦${fmt(walletBalance - numericAmount)}`,
                  bold: true,
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center px-4 py-3"
                  style={
                    i < arr.length - 1 ? { borderBottom: "1px solid #e5e7eb" } : {}
                  }
                >
                  <span className="text-[13px] text-gray-400">{row.label}</span>
                  <span
                    className="text-[13px] text-gray-900"
                    style={{ fontWeight: row.bold ? 700 : 500 }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* initiate error — inline only, no modal */}
        <AnimatePresence>
          {initiateError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-2xl px-4 py-3"
              style={{ background: "#fef2f2" }}
            >
              <AlertCircle
                className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5"
              />
              <p className="text-[13px] text-red-500">{initiateError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 justify-center">
          <ShieldCheck className="h-3 w-3 text-gray-300" />
          <p className="text-[11px] text-gray-300">
            Secured &amp; encrypted. Funds typically arrive within minutes.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10 pt-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleInitiate}
          disabled={
            initiating ||
            bankLoading ||
            !!bankError ||
            !bankDetails ||
            numericAmount < MIN_AMOUNT ||
            numericAmount > walletBalance
          }
          className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:
              "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)",
          }}
        >
          {!initiating && (
            <motion.div
              className="absolute inset-0 -skew-x-12 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "220%" }}
              transition={{
                duration: 1.8,
                delay: 0.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 4,
              }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {initiating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Sending OTP…
              </>
            ) : (
              `Withdraw${numericAmount >= MIN_AMOUNT ? ` ₦${fmt(numericAmount)}` : ""}`
            )}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
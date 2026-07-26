"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  ChevronRight,
  Star,
  Clock,
  MapPin,
  Zap,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Banknote,
  Info,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/app/component/protect";

// ─── Denomination Options ──────────────────────────────────────────────────────
const DENOMINATIONS = [
  { value: 5,    label: "₦5" },
  { value: 10,   label: "₦10" },
  { value: 20,   label: "₦20" },
  { value: 50,   label: "₦50" },
  { value: 100,  label: "₦100" },
  { value: 200,  label: "₦200" },
  { value: 500,  label: "₦500" },
  { value: 1000, label: "₦1,000" },
];

const fmt = (n) => Number(n || 0).toLocaleString("en-NG");

// ─── Availability Badge ────────────────────────────────────────────────────────
const AvailBadge = ({ status }) => {
  const isAvail = status === "Available";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 99,
        background: isAvail ? "rgba(22,163,74,0.12)" : "rgba(245,158,11,0.15)",
        color: isAvail ? "#16a34a" : "#b45309",
        border: `1px solid ${isAvail ? "rgba(22,163,74,0.25)" : "rgba(245,158,11,0.3)"}`,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
};

// ─── Merchant Card ─────────────────────────────────────────────────────────────
const MerchantCard = ({ merchant, onSelect, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      onClick={() => onSelect(merchant)}
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: "16px",
        marginBottom: 12,
        boxShadow: "0 2px 14px rgba(0,0,0,0.07)",
        border: "1px solid rgba(245,158,11,0.18)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #92400e, #d97706, #f59e0b)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, color: "#fff",
          boxShadow: "0 2px 8px rgba(180,83,9,0.3)",
        }}>
          {(merchant.displayName || "M")[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#78350f", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {merchant.displayName}
            </p>
            <AvailBadge status={merchant.availability} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Rating */}
            <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, color: "#a16207" }}>
              <Star style={{ width: 11, height: 11, fill: "#f59e0b", color: "#f59e0b" }} />
              {Number(merchant.rating || 0).toFixed(1)}
            </span>
            {/* Distance */}
            <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, color: "#a16207" }}>
              <MapPin style={{ width: 11, height: 11 }} />
              {merchant.distanceFormatted || "—"}
            </span>
            {/* ETA */}
            <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, color: "#a16207" }}>
              <Clock style={{ width: 11, height: 11 }} />
              {merchant.estimatedDeliveryTime || "—"}
            </span>
          </div>
        </div>

        <ChevronRight style={{ width: 18, height: 18, color: "#d97706", flexShrink: 0 }} />
      </div>

      {/* Charges row */}
      <div style={{
        marginTop: 12,
        display: "flex",
        gap: 6,
        background: "rgba(251,191,36,0.07)",
        borderRadius: 10,
        padding: "10px 8px",
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 9, color: "#a16207", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Service Fee</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#92400e" }}>₦{fmt(merchant.merchantServiceCharge)}</p>
        </div>
        <div style={{ width: 1, background: "rgba(245,158,11,0.25)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 9, color: "#a16207", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Transport Fee</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#92400e" }}>₦{fmt(merchant.estimatedTransportationFee)}</p>
        </div>
        {Number(merchant.companyTotalCharge || 0) > 0 && (
          <>
            <div style={{ width: 1, background: "rgba(245,158,11,0.25)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 9, color: "#a16207", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Platform Fee</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#92400e" }}>₦{fmt(merchant.companyTotalCharge)}</p>
            </div>
          </>
        )}
        <div style={{ width: 1, background: "rgba(245,158,11,0.25)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 9, color: "#a16207", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Payable</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#92400e" }}>₦{fmt(merchant.estimatedTotalPayableAmount)}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Confirm Sheet ─────────────────────────────────────────────────────────────
const ConfirmSheet = ({ merchant, amount, denomination, denominationId, accessToken, onClose, onSuccess, onErrorModal }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    // Guard: denominationId is required by the backend
    const resolvedDenomId = denominationId || merchant.denominationId;
    if (!resolvedDenomId) {
      const msg = "Please go back and select a denomination note size before confirming.";
      setError(msg);
      if (onErrorModal) onErrorModal(msg);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          accessToken,
          apiType: "swCreateRequest",
          merchantId: merchant.merchantId || merchant.id,
          amount: Number(amount),
          denominationId: resolvedDenomId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg = (json?.message && json?.message !== "Invalid request")
          ? json.message
          : (json?.details || json?.message || "Failed to create request");
        throw new Error(errMsg);
      }
      onSuccess(json);
    } catch (e) {
      const msg = e.message || "Something went wrong. Please try again.";
      setError(msg);
      if (onErrorModal) onErrorModal(msg);
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    { label: "Amount",             value: `₦${fmt(amount)}` },
    { label: "Denomination",       value: `₦${fmt(denomination)} notes` },
    { label: "Merchant",           value: merchant.displayName },
    { label: "Service Charge",     value: `₦${fmt(merchant.merchantServiceCharge)}` },
    { label: "Transport Fee",      value: `₦${fmt(merchant.estimatedTransportationFee)}` },
    ...(merchant.companyTotalCharge ? [{ label: "Platform Fee", value: `₦${fmt(merchant.companyTotalCharge)}` }] : []),
    { label: "Estimated Delivery", value: merchant.estimatedDeliveryTime || "—" },
    { label: "Total Payable",      value: `₦${fmt(merchant.estimatedTotalPayableAmount)}`, bold: true },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "flex-end",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        style={{
          width: "100%", maxWidth: 480, margin: "0 auto",
          background: "#fff", borderRadius: "24px 24px 0 0", overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
        </div>

        <div style={{ padding: "8px 20px 24px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#78350f", margin: 0 }}>Confirm Request</p>
            <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X style={{ width: 16, height: 16, color: "#6b7280" }} />
            </button>
          </div>

          {/* Summary rows */}
          <div style={{ background: "rgba(251,191,36,0.07)", borderRadius: 14, padding: "4px 0", marginBottom: 16 }}>
            {rows.map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < rows.length - 1 ? "1px solid rgba(245,158,11,0.15)" : "none" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#a16207" }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: row.bold ? 800 : 600, color: row.bold ? "#78350f" : "#78350f" }}>{row.value}</p>
              </div>
            ))}
          </div>

          {/* Notice */}
          <div style={{ display: "flex", gap: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 20 }}>
            <Info style={{ width: 14, height: 14, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
              Your wallet will be debited immediately. If the merchant doesn&apos;t respond in time, you&apos;ll be automatically refunded.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: "flex", gap: 8, background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
              <AlertCircle style={{ width: 14, height: 14, color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#dc2626", lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 14,
              background: loading ? "#d1d5db" : "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)",
              border: "none", fontSize: 16, fontWeight: 700, color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : "0 4px 16px rgba(146,64,14,0.30)",
            }}
          >
            {loading ? <><RefreshCw style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Processing…</> : <><Zap style={{ width: 18, height: 18 }} /> Confirm & Request</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Interactive Human-Requirement Error Modal ──────────────────────────────
const ErrorModal = ({ message, onClose, onDeposit }) => {
  if (!message) return null;

  const isBalanceError =
    message.toLowerCase().includes("balance") ||
    message.toLowerCase().includes("insufficient") ||
    message.toLowerCase().includes("need ₦");

  const isDisabledError = message.toLowerCase().includes("disabled");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 20 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        style={{
          width: "100%",
          maxWidth: 390,
          background: "#ffffff",
          borderRadius: 24,
          padding: "28px 24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: isBalanceError
              ? "linear-gradient(90deg, #dc2626, #ef4444, #f59e0b)"
              : "linear-gradient(90deg, #b45309, #d97706, #f59e0b)",
          }}
        />

        {/* Icon Circle */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: isBalanceError ? "rgba(220, 38, 38, 0.08)" : "rgba(245, 158, 11, 0.12)",
            border: `2px solid ${isBalanceError ? "rgba(220, 38, 38, 0.25)" : "rgba(245, 158, 11, 0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          {isBalanceError ? (
            <Wallet style={{ width: 34, height: 34, color: "#dc2626" }} />
          ) : (
            <AlertCircle style={{ width: 34, height: 34, color: "#d97706" }} />
          )}
        </div>

        {/* Header Title */}
        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: isBalanceError ? "#991b1b" : "#78350f",
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
          }}
        >
          {isBalanceError
            ? "Insufficient Wallet Balance"
            : isDisabledError
            ? "Service Unavailable"
            : "Request Unable to Complete"}
        </h3>

        {/* Formatted Message */}
        <div
          style={{
            background: isBalanceError ? "rgba(254, 242, 242, 0.7)" : "rgba(254, 243, 199, 0.4)",
            border: `1px solid ${isBalanceError ? "rgba(252, 165, 165, 0.5)" : "rgba(253, 230, 138, 0.6)"}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 22,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: isBalanceError ? "#7f1d1d" : "#92400e",
              lineHeight: 1.55,
            }}
          >
            {message}
          </p>
        </div>

        {/* Human-Interaction Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isBalanceError && onDeposit && (
            <button
              onClick={() => {
                onClose();
                onDeposit();
              }}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                border: "none",
                fontSize: 15,
                fontWeight: 700,
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)",
              }}
            >
              Deposit / Fund Wallet
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 14,
              background: isBalanceError
                ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                : "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)",
              border: "none",
              fontSize: 15,
              fontWeight: 700,
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            {isBalanceError ? "I Understand — Close" : "Understand & Close"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Success View ──────────────────────────────────────────────────────────────
const SuccessView = ({ onDone }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center" }}>
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(22,163,74,0.1)", border: "2px solid rgba(22,163,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <CheckCircle2 style={{ width: 40, height: 40, color: "#16a34a" }} />
      </div>
    </motion.div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: "0 0 8px" }}>Request Sent!</h2>
    <p style={{ fontSize: 14, color: "#a16207", lineHeight: 1.6, margin: "0 0 32px" }}>
      Your special withdrawal request has been sent to the merchant. You&apos;ll be notified once they accept.
    </p>
    <button onClick={onDone} style={{ padding: "14px 40px", borderRadius: 14, background: "linear-gradient(135deg, #92400e 0%, #d97706 100%)", border: "none", fontSize: 16, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
      Back to Home
    </button>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SpecialWithdrawalPage() {
  const router = useRouter();
  const accessToken = useSelector((s) => s.user.accessToken);

  const [step, setStep] = useState("input"); // "input" | "results" | "success"
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [selectedDenom, setSelectedDenom] = useState(null);
  const [denominations, setDenominations] = useState(DENOMINATIONS);

  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [fetchError, setFetchError] = useState("");

  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [denomId, setDenomId] = useState(null);

  const [errorModalMsg, setErrorModalMsg] = useState("");

  // Fetch live denominations from backend
  useEffect(() => {
    if (!accessToken) return;
    const fetchDenoms = async () => {
      try {
        const q = new URLSearchParams({ token: accessToken, apiType: "swDenominations" }).toString();
        const res = await fetch(`/api/user?${q}`);
        if (!res.ok) return;
        const json = await res.json();
        // data.data is expected to be the denomination array directly.
        const payload = json?.data?.data;
        const list = Array.isArray(payload) ? payload : (payload?.denominations ?? []);
        if (list.length > 0) {
          setDenominations(list.map((d) => ({ id: d.id, value: d.value, label: `₦${fmt(d.value)}` })));
        }
      } catch { /* fallback to static list */ }
    };
    fetchDenoms();
  }, [accessToken]);

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setAmount(raw);
    setAmountError("");
  };

  const handleSearch = useCallback(async () => {
    const amt = Number(amount);
    if (!amt || amt < 500) { setAmountError("Minimum amount is ₦500."); return; }
    if (!selectedDenom) { setAmountError("Please select a denomination."); return; }
    setAmountError("");
    setLoading(true);
    setFetchError("");
    try {
      // Get user location
      const position = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      ).catch(() => null);

      const lat = position?.coords?.latitude;
      const lng = position?.coords?.longitude;

      const params = new URLSearchParams({
        token: accessToken,
        apiType: "swDiscoverMerchants",
        amount: amt,
        denominationValue: selectedDenom.value,
      });
      if (selectedDenom.id) params.set("denominationId", selectedDenom.id);
      if (lat) params.set("deliveryLat", lat);
      if (lng) params.set("deliveryLng", lng);

      const res = await fetch(`/api/user?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        const msg = (json?.message && json?.message !== "Invalid request")
          ? json.message
          : (json?.details || json?.message || "Failed to find merchants");
        throw new Error(msg);
      }

      // Actual shape: json.data.data is the merchant array directly, e.g.
      // { data: { status, message, data: [ { merchantId, displayName, ... } ] } }
      // Some variants may instead nest it under a "merchants" key, so support both.
      const payload = json?.data?.data;
      const list = Array.isArray(payload) ? payload : (payload?.merchants ?? []);
      setMerchants(list);
      setDenomId(selectedDenom.id || null);
      setStep("results");
    } catch (e) {
      const msg = e.message || "Could not fetch merchants. Please try again.";
      setFetchError(msg);
      setErrorModalMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [amount, selectedDenom, accessToken]);

  const handleSelectMerchant = (m) => {
    setSelectedMerchant(m);
    setShowConfirm(true);
  };

  if (step === "success") {
    return (
      <ProtectedRoute>
        <div style={{ minHeight: "100vh", background: "#fffbeb", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "linear-gradient(135deg, #92400e 0%, #d97706 100%)", padding: "14px 16px 12px", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/home")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ArrowLeft style={{ width: 17, height: 17, color: "#fff" }} />
            </button>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Special Withdrawal</p>
          </div>
          <SuccessView onDone={() => router.push("/home")} />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div style={{ minHeight: "100vh", background: "#fffbeb", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 60%, #d97706 100%)", padding: step === "input" ? "14px 16px 14px" : "14px 16px", position: "relative", overflow: "hidden" }}>
          {/* Decorative radial */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -16, left: 50, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: step === "input" ? 10 : 0, position: "relative", zIndex: 1 }}>
            <button onClick={() => step === "results" ? setStep("input") : router.back()} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <ArrowLeft style={{ width: 17, height: 17, color: "#fff" }} />
            </button>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Special Withdrawal</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Choose your denomination & find a merchant</p>
            </div>
          </div>

          {/* Hero — only on input step, compact */}
          {step === "input" && (
            <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Image
                  src="/bundle.png"
                  alt="Money stack"
                  width={100}
                  height={82}
                  style={{ objectFit: "contain", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.2))" }}
                  priority
                />
              </motion.div>
            </div>
          )}
        </div>

        {/* ── Input Step ── */}
        {step === "input" && (
          <div style={{ flex: 1, padding: "18px 16px", overflowY: "auto" }}>

            {/* Amount Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#78350f", marginBottom: 6, letterSpacing: "0.02em" }}>
                Withdrawal Amount
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 19, fontWeight: 700, color: "#b45309" }}>₦</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={handleAmountChange}
                  style={{
                    width: "100%", padding: "13px 14px 13px 34px",
                    borderRadius: 14, border: `2px solid ${amountError ? "#dc2626" : "rgba(245,158,11,0.35)"}`,
                    fontSize: 21, fontWeight: 800, color: "#78350f",
                    background: "#fff", outline: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {amount && !amountError && (
                <p style={{ margin: "5px 0 0", fontSize: 12, color: "#a16207" }}>
                  ₦{fmt(amount)} requested
                </p>
              )}
              {amountError && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 5 }}>
                  <AlertCircle style={{ width: 13, height: 13, color: "#dc2626" }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{amountError}</p>
                </div>
              )}
            </div>

            {/* Denomination Picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#78350f", marginBottom: 8, letterSpacing: "0.02em" }}>
                Select Denomination
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {denominations.map((d) => {
                  const active = selectedDenom?.value === d.value;
                  return (
                    <motion.button
                      key={d.value}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => { setSelectedDenom(d); setAmountError(""); }}
                      style={{
                        padding: "9px 16px",
                        borderRadius: 99,
                        border: active ? "2px solid #d97706" : "2px solid rgba(245,158,11,0.3)",
                        background: active ? "linear-gradient(135deg, #92400e 0%, #d97706 100%)" : "#fff",
                        color: active ? "#fff" : "#92400e",
                        fontSize: 13, fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: active ? "0 3px 12px rgba(146,64,14,0.3)" : "none",
                        transition: "all 0.18s ease",
                      }}
                    >
                      {d.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Info box */}
            <div style={{ display: "flex", gap: 10, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: 12, padding: "10px 12px", marginBottom: 20 }}>
              <Banknote style={{ width: 15, height: 15, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.55 }}>
                Special Withdrawal lets you request <strong>specific denominations</strong> of cash from a merchant near you. Each merchant sets their own service charge per denomination.
              </p>
            </div>

            {/* Fetch error */}
            {fetchError && (
              <div style={{ display: "flex", gap: 8, background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                <AlertCircle style={{ width: 14, height: 14, color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#dc2626", lineHeight: 1.5 }}>{fetchError}</p>
              </div>
            )}

            {/* Search button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSearch}
              disabled={loading}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 16,
                background: loading ? "#d1d5db" : "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)",
                border: "none", fontSize: 16, fontWeight: 700, color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: loading ? "none" : "0 6px 20px rgba(146,64,14,0.35)",
              }}
            >
              {loading
                ? <><RefreshCw style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} /> Finding Merchants…</>
                : <><Search style={{ width: 20, height: 20 }} /> Find Merchants</>
              }
            </motion.button>
          </div>
        )}

        {/* ── Results Step ── */}
        {step === "results" && (
          <div style={{ flex: 1, padding: "16px 16px", overflowY: "auto" }}>
            {/* Summary pill */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ padding: "6px 14px", borderRadius: 99, background: "rgba(146,64,14,0.09)", fontSize: 13, fontWeight: 700, color: "#78350f" }}>
                ₦{fmt(amount)}
              </span>
              <span style={{ padding: "6px 14px", borderRadius: 99, background: "rgba(245,158,11,0.13)", fontSize: 13, fontWeight: 700, color: "#b45309" }}>
                {selectedDenom?.label} notes
              </span>
              <button onClick={() => setStep("input")} style={{ padding: "6px 14px", borderRadius: 99, background: "#f3f4f6", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", fontWeight: 600 }}>
                Change
              </button>
            </div>

            {merchants.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", textAlign: "center" }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Search style={{ width: 30, height: 30, color: "#d97706" }} />
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#78350f", margin: "0 0 6px" }}>No Merchants Found</p>
                <p style={{ fontSize: 13, color: "#a16207", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 260 }}>
                  No merchants currently support this denomination and amount in your area.
                </p>
                <button onClick={() => setStep("input")} style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, #92400e, #d97706)", border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                  Try Different Options
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#a16207", marginBottom: 14 }}>
                  {merchants.length} merchant{merchants.length !== 1 ? "s" : ""} available — sorted by best match
                </p>
                {merchants.map((m, i) => (
                  <MerchantCard
                    key={m.merchantId || m.id || i}
                    merchant={m}
                    onSelect={handleSelectMerchant}
                    index={i}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Confirm Sheet ── */}
        <AnimatePresence>
          {showConfirm && selectedMerchant && (
            <ConfirmSheet
              merchant={selectedMerchant}
              amount={amount}
              denomination={selectedDenom?.value}
              denominationId={selectedMerchant?.denominationId || denomId || selectedDenom?.id}
              accessToken={accessToken}
              onClose={() => setShowConfirm(false)}
              onSuccess={() => { setShowConfirm(false); setStep("success"); }}
              onErrorModal={(msg) => setErrorModalMsg(msg)}
            />
          )}
        </AnimatePresence>

        {/* ── Error Modal (Requires Human Interaction) ── */}
        <AnimatePresence>
          {errorModalMsg && (
            <ErrorModal
              message={errorModalMsg}
              onClose={() => setErrorModalMsg("")}
              onDeposit={() => router.push("/p2p/transfer")}
            />
          )}
        </AnimatePresence>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          input[type=number]::-webkit-outer-spin-button,
          input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
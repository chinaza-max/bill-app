"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Save,
  Toggle,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Banknote,
  ChevronDown,
  ChevronUp,
  Info,

} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/app/component/protect";

const fmt = (n) => Number(n || 0).toLocaleString("en-NG");

const DENOMINATION_LABELS = {
  5: "₦5", 10: "₦10", 20: "₦20", 50: "₦50",
  100: "₦100", 200: "₦200", 500: "₦500", 1000: "₦1,000",
};

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
const ToggleSwitch = ({ enabled, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    style={{
      position: "relative",
      width: 52,
      height: 28,
      borderRadius: 99,
      background: enabled ? "linear-gradient(135deg, #92400e 0%, #d97706 100%)" : "#e5e7eb",
      border: "none",
      cursor: "pointer",
      transition: "background 0.22s ease",
      flexShrink: 0,
    }}
  >
    <motion.div
      animate={{ x: enabled ? 26 : 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "absolute",
        top: 3,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    />
  </button>
);

// ─── Section Card ──────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, collapsible = false, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#fff", borderRadius: 18, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid rgba(245,158,11,0.15)" }}>
      <button
        type="button"
        onClick={() => collapsible && setOpen((p) => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", background: "none", border: "none", cursor: collapsible ? "pointer" : "default",
          borderBottom: open ? "1px solid rgba(245,158,11,0.12)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #92400e, #d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon style={{ width: 16, height: 16, color: "#fff" }} />
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#78350f" }}>{title}</p>
        </div>
        {collapsible && (open ? <ChevronUp style={{ width: 18, height: 18, color: "#d97706" }} /> : <ChevronDown style={{ width: 18, height: 18, color: "#d97706" }} />)}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <div style={{ padding: "16px 18px" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Input Field ───────────────────────────────────────────────────────────────
const InputField = ({ label, prefix, suffix, value, onChange, type = "number", placeholder = "0", hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6, letterSpacing: "0.03em", textTransform: "uppercase" }}>
      {label}
    </label>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && <span style={{ position: "absolute", left: 13, fontSize: 15, fontWeight: 700, color: "#b45309", pointerEvents: "none" }}>{prefix}</span>}
      <input
        type={type}
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%", padding: `13px ${suffix ? "42px" : "13px"} 13px ${prefix ? "28px" : "13px"}`,
          borderRadius: 12, border: "2px solid rgba(245,158,11,0.3)",
          fontSize: 16, fontWeight: 700, color: "#78350f",
          background: "#fffbeb", outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { e.target.style.borderColor = "#d97706"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(245,158,11,0.3)"; }}
      />
      {suffix && <span style={{ position: "absolute", right: 13, fontSize: 14, fontWeight: 600, color: "#a16207", pointerEvents: "none" }}>{suffix}</span>}
    </div>
    {hint && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#a16207" }}>{hint}</p>}
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MerchantSWSettingsPage() {
  const router = useRouter();
  const accessToken = useSelector((s) => s.user.accessToken);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCharges, setSavingCharges] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success"|"error", message }

  // ── Profile State
  const [swEnabled, setSwEnabled] = useState(false);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [profileError, setProfileError] = useState("");

  // ── Denomination Charges State
  const [denominations, setDenominations] = useState([]);
  const [charges, setCharges] = useState({});     // { denomId: chargeNaira }
  const [enabledDenoms, setEnabledDenoms] = useState({}); // { denomId: boolean }

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Fetch SW Profile ───────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ token: accessToken, apiType: "getMerchantSWProfile" }).toString();
      const res = await fetch(`/api/user?${q}`);
      const json = await res.json();

      // Actual response shape:
      // json.data.data = { profile: { isEnabled, minWithdrawalAmount, maxWithdrawalAmount, ... }, charges: [] }
      const profile = json?.data?.data?.profile ?? {};

      setSwEnabled(profile.isEnabled ?? false);
      setMinAmount(profile.minWithdrawalAmount ?? "");
      setMaxAmount(profile.maxWithdrawalAmount ?? "");
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, [accessToken]);

  // ── Fetch Denominations & Charges ─────────────────────────────────────────
  const fetchDenomAndCharges = useCallback(async () => {
    if (!accessToken) return;
    try {
      // Fetch available denominations
      const q1 = new URLSearchParams({ token: accessToken, apiType: "swDenominations" }).toString();
      const r1 = await fetch(`/api/user?${q1}`);
      const j1 = await r1.json();
      // Be defensive: some endpoints nest under a named key (e.g. { denominations: [...] }),
      // others return the array directly at data.data. Try both.
      const denomPayload = j1?.data?.data;
      const denomList = Array.isArray(denomPayload)
        ? denomPayload
        : (denomPayload?.denominations ?? []);
      setDenominations(denomList);

      // Fetch merchant charges
      const q2 = new URLSearchParams({ token: accessToken, apiType: "getMerchantSWCharges" }).toString();
      const r2 = await fetch(`/api/user?${q2}`);
      const j2 = await r2.json();
      // Same defensive handling — the profile endpoint nests charges under
      // data.data.charges, so charges here likely follow the same convention.
      const chargePayload = j2?.data?.data;
      const chargeList = Array.isArray(chargePayload)
        ? chargePayload
        : (chargePayload?.charges ?? []);

      const chargesMap = {};
      const enabledMap = {};
      denomList.forEach((d) => {
        const existing = chargeList.find((c) => c.denominationId === d.id || c.denominationValue === d.value);
        chargesMap[d.id] = existing?.charge ?? "";
        enabledMap[d.id] = !!existing;
      });
      setCharges(chargesMap);
      setEnabledDenoms(enabledMap);
    } catch { /* ignore */ }
  }, [accessToken]);

  useEffect(() => {
    fetchProfile();
    fetchDenomAndCharges();
  }, [fetchProfile, fetchDenomAndCharges]);

  // ── Save Profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setProfileError("");
    const min = Number(minAmount);
    const max = Number(maxAmount);
    if (!min || min < 100) { setProfileError("Minimum amount must be at least ₦100."); return; }
    if (!max || max <= min) { setProfileError("Maximum amount must be greater than minimum."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          accessToken, apiType: "saveMerchantSWProfile",
          isEnabled: swEnabled,
          minWithdrawalAmount: min,
          maxWithdrawalAmount: max,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.details || "Failed to save");
      showToast("success", "SW profile saved successfully!");
    } catch (e) {
      showToast("error", e.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Save Denomination Charges ──────────────────────────────────────────────
  const handleSaveCharges = async () => {
    const payload = denominations
      .filter((d) => enabledDenoms[d.id])
      .map((d) => ({
        denominationId: d.id,
       // denominationValue: d.value,
        charge: Number(charges[d.id] || 0),
      }));

    if (payload.length === 0) {
      showToast("error", "Enable at least one denomination to save charges.");
      return;
    }

    const invalid = payload.find((p) => !p.charge || p.charge <= 0);
    if (invalid) {
      showToast("error", "All enabled denominations must have a service charge greater than ₦0.");
      return;
    }

    setSavingCharges(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ accessToken, apiType: "saveDenominationCharges", charges: payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.details || "Failed to save");
      showToast("success", "Denomination charges saved!");
    } catch (e) {
      showToast("error", e.message || "Failed to save charges.");
    } finally {
      setSavingCharges(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={{ minHeight: "100vh", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RefreshCw style={{ width: 32, height: 32, color: "#d97706", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div style={{ minHeight: "100vh", background: "#fffbeb", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #92400e 0%, #b45309 60%, #d97706 100%)",
          padding: "20px 16px 20px",
          display: "flex", alignItems: "center", gap: 12,
          position: "sticky", top: 0, zIndex: 20,
        }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ArrowLeft style={{ width: 18, height: 18, color: "#fff" }} />
          </button>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>Special Withdrawal</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Merchant Settings</p>
          </div>
        </div>

        {/* ── Toast ── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              style={{
                position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
                zIndex: 100, maxWidth: 360, width: "calc(100% - 32px)",
                background: toast.type === "success" ? "#16a34a" : "#dc2626",
                color: "#fff", borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
              }}
            >
              {toast.type === "success"
                ? <CheckCircle2 style={{ width: 18, height: 18, flexShrink: 0 }} />
                : <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
              }
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ padding: "20px 16px", paddingBottom: 40 }}>

          {/* ── Enable/Disable Card ── */}
          <Section title="Enable Special Withdrawal" icon={Banknote}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#78350f" }}>
                  {swEnabled ? "Active" : "Inactive"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a16207", lineHeight: 1.5 }}>
                  {swEnabled ? "You're visible to customers requesting specific denominations." : "Toggle on to start receiving special withdrawal requests."}
                </p>
              </div>
              <ToggleSwitch enabled={swEnabled} onToggle={() => setSwEnabled((p) => !p)} />
            </div>

            <div style={{ display: "flex", gap: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 20 }}>
              <Info style={{ width: 13, height: 13, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
                When disabled, you won&apos;t appear in the merchant discovery list for customers.
              </p>
            </div>

            {/* Min / Max Limits */}
            <InputField
              label="Minimum Withdrawal Amount"
              prefix="₦"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value.replace(/[^0-9]/g, ""))}
              hint="Minimum request amount you'll accept (e.g. 500)"
            />
            <InputField
              label="Maximum Withdrawal Amount"
              prefix="₦"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value.replace(/[^0-9]/g, ""))}
              hint="Maximum request amount you can handle (e.g. 50000)"
            />

            {profileError && (
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 12 }}>
                <AlertCircle style={{ width: 13, height: 13, color: "#dc2626" }} />
                <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{profileError}</p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 13,
                background: saving ? "#d1d5db" : "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
                border: "none", fontSize: 15, fontWeight: 700, color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: saving ? "none" : "0 4px 14px rgba(146,64,14,0.30)",
              }}
            >
              {saving ? <><RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Saving…</> : <><Save style={{ width: 16, height: 16 }} /> Save Profile</>}
            </motion.button>
          </Section>

          {/* ── Denomination Charges ── */}
          <Section title="Denomination Charges" icon={Banknote} collapsible defaultOpen>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#a16207", lineHeight: 1.6 }}>
              Enable each denomination you can provide and set your flat service charge (₦) for it. Customers see the exact naira amount before choosing you.
            </p>

            {denominations.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a16207", textAlign: "center", padding: "20px 0" }}>No denominations available yet.</p>
            ) : (
              denominations.map((d) => {
                const isEnabled = enabledDenoms[d.id] ?? false;
                return (
                  <div key={d.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(245,158,11,0.12)",
                  }}>
                    {/* Denom Label */}
                    <div style={{
                      width: 56, height: 30, borderRadius: 8, flexShrink: 0,
                      background: isEnabled ? "linear-gradient(135deg, #92400e, #d97706)" : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: isEnabled ? "#fff" : "#9ca3af",
                      transition: "all 0.2s ease",
                    }}>
                      {DENOMINATION_LABELS[d.value] || `₦${fmt(d.value)}`}
                    </div>

                    {/* Charge Input */}
                    <div style={{ flex: 1, position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: isEnabled ? "#b45309" : "#d1d5db", fontWeight: 700, pointerEvents: "none" }}>₦</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g. 50"
                        value={charges[d.id] ?? ""}
                        disabled={!isEnabled}
                        onChange={(e) => setCharges((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        style={{
                          width: "100%", padding: "9px 11px 9px 24px",
                          borderRadius: 10, border: "2px solid",
                          borderColor: isEnabled ? "rgba(245,158,11,0.35)" : "rgba(0,0,0,0.08)",
                          fontSize: 14, fontWeight: 700, color: "#78350f",
                          background: isEnabled ? "#fffbeb" : "#f9fafb",
                          outline: "none", boxSizing: "border-box",
                          cursor: isEnabled ? "text" : "not-allowed",
                        }}
                      />
                    </div>

                    {/* Toggle */}
                    <ToggleSwitch
                      enabled={isEnabled}
                      onToggle={() => setEnabledDenoms((prev) => ({ ...prev, [d.id]: !prev[d.id] }))}
                    />
                  </div>
                );
              })
            )}

            {denominations.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSaveCharges}
                disabled={savingCharges}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 13, marginTop: 18,
                  background: savingCharges ? "#d1d5db" : "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
                  border: "none", fontSize: 15, fontWeight: 700, color: "#fff",
                  cursor: savingCharges ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: savingCharges ? "none" : "0 4px 14px rgba(146,64,14,0.30)",
                }}
              >
                {savingCharges ? <><RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Saving…</> : <><Save style={{ width: 16, height: 16 }} /> Save Charges</>}
              </motion.button>
            )}
          </Section>
        </div>

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
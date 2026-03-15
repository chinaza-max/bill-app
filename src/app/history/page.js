"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";

import {
  ArrowLeft, Calendar, Copy, Check, Search,
  PackageX, Receipt, RefreshCcw, Flag,
  ArrowUpRight, ArrowDownLeft, X, Share2,
  CheckCircle2, Clock, XCircle, ShoppingBag, Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import useRequest from "@/hooks/useRequest";
import { useSelector } from "react-redux";

/* ══════════════════════════════════════════════════
   DESIGN TOKENS  — blends with home page
   Home uses: bg-amber-50, from-amber-600 to-amber-500,
              white cards, text-amber-900, text-amber-600
   We mirror those exactly and extend with a slightly
   richer dark-gold for accents so the sheet feels premium
   without being a jarring dark mode.
══════════════════════════════════════════════════ */
const C = {
  // Page & surfaces  — matches bg-amber-50 of home
  pageBg:    "#FFFBF0",   // amber-50
  cardBg:    "#FFFFFF",   // white cards, same as home tx cards
  surface:   "#FEF3C7",   // amber-100 — elevated / inner areas
  surfaceHi: "#FDE68A",   // amber-200 — borders, dividers

  // Header gradient — matches home's from-amber-600 to-amber-500
  headerFrom: "#D97706",  // amber-600
  headerTo:   "#F59E0B",  // amber-500

  // Gold accent (slightly deeper for sheet CTA)
  gold:       "#B45309",  // amber-700 — primary buttons
  goldLight:  "#D97706",  // amber-600
  goldText:   "#92400E",  // amber-800 — headings on light bg

  // Status colours
  green:      "#16A34A",  // green-600
  greenLight: "#22C55E",  // green-500
  greenTint:  "#DCFCE7",  // green-100

  red:        "#DC2626",  // red-600
  redLight:   "#EF4444",  // red-500
  redTint:    "#FEE2E2",  // red-100

  // Typography
  textMain:   "#78350F",  // amber-900
  textSub:    "#B45309",  // amber-700
  textMuted:  "#D97706",  // amber-600
  textLight:  "#F59E0B",  // amber-500

  // Borders
  border:     "#FDE68A",  // amber-200
  borderMid:  "#FCD34D",  // amber-300
};

/* ── helpers ── */
const statusMeta = (s) => {
  switch (s?.toLowerCase()) {
    case "completed": case "successful":
      return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Successful",
               tc: C.green, bg: C.greenTint, dot: "bg-green-500", border: "#16A34A44" };
    case "cancelled": case "rejected": case "failed":
      return { icon: <XCircle className="w-3.5 h-3.5" />, label: "Failed",
               tc: C.red, bg: C.redTint, dot: "bg-red-500", border: "#DC262644" };
    default:
      return { icon: <Clock className="w-3.5 h-3.5" />, label: "Pending",
               tc: C.goldText, bg: C.surface, dot: "bg-amber-400", border: "#D9770644" };
  }
};

const fmt = (n) => Number(n).toLocaleString("en-NG");

/* ── backdrop ── */
const Backdrop = ({ onClose }) => (
  <motion.div key="bd"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-40"
    style={{ background: "rgba(120,53,15,0.35)", backdropFilter: "blur(3px)" }}
    onClick={onClose}
  />
);

/* ── detail row ── */
const DRow = ({ label, value, mono, children }) => (
  <div className="flex items-center justify-between px-4 py-3.5"
    style={{ borderBottom: `1px solid ${C.border}` }}>
    <span className="text-xs font-semibold tracking-wide uppercase"
      style={{ color: C.textMuted }}>{label}</span>
    {children ?? (
      <span className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}
        style={{ color: C.textMain }}>{value}</span>
    )}
  </div>
);

/* ── gold CTA button ── */
const GoldBtn = ({ onClick, children, className = "" }) => (
  <button onClick={onClick}
    className={`py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[.97] text-white ${className}`}
    style={{
      background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`,
      boxShadow: `0 6px 20px ${C.gold}44`,
    }}>
    {children}
  </button>
);

/* ══════════════════════════════════════════════════
   TRANSACTION BOTTOM SHEET
══════════════════════════════════════════════════ */
const TransactionSheet = ({ tx, onClose }) => {
  const [copied, setCopied] = useState(false);
  const sm   = statusMeta(tx.paymentStatus);
  const isIn = tx.type === "incoming";

  const copy = (v) => { navigator.clipboard.writeText(v); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const share = async () => {
    const text = `Transaction Receipt\n\nTitle: ${tx.title}\nAmount: ₦${fmt(tx.amount)}\nType: ${tx.type}\nStatus: ${tx.paymentStatus}\nDate: ${format(new Date(tx.timestamp), "dd MMM yyyy, HH:mm")}\nRef: ${tx.id}`;
    if (navigator.share) await navigator.share({ title: "Transaction Receipt", text });
    else copy(text);
  };

  return (
    <motion.div key="txs"
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] overflow-hidden"
      style={{
        maxHeight: "90vh", overflowY: "auto",
        background: C.cardBg,
        borderTop: `3px solid ${C.goldLight}`,
        boxShadow: "0 -8px 40px rgba(120,53,15,0.18)",
      }}>

      {/* pill */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ background: C.borderMid }} />
      </div>

      {/* header */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="font-black text-base" style={{ color: C.textMain }}>Transaction Details</span>
        <button onClick={onClose} className="p-2 rounded-full transition"
          style={{ background: C.surface, color: C.textSub }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* hero card */}
      <div className="mx-4 mb-4 rounded-2xl p-5 flex flex-col items-center text-center"
        style={{
          background: `linear-gradient(135deg, ${C.headerFrom}, ${C.headerTo})`,
          boxShadow: `0 4px 20px ${C.gold}33`,
        }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "2px solid rgba(255,255,255,0.4)",
          }}>
          {isIn
            ? <ArrowDownLeft className="w-7 h-7 text-white" />
            : <ArrowUpRight  className="w-7 h-7 text-white" />}
        </div>
        <p className="text-xs font-medium mb-1 text-white/75">
          {isIn ? "Transfer Received!" : "Transfer Sent!"}
        </p>
        <p className="text-3xl font-black tracking-tight text-white">
          {isIn ? "+" : "−"}₦{fmt(tx.amount)}
        </p>
        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.25)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)" }}>
          {sm.icon} {sm.label}
        </div>
      </div>

      {/* detail rows */}
      <div className="mx-4 rounded-2xl overflow-hidden mb-4"
        style={{ border: `1px solid ${C.border}`, background: C.cardBg }}>
        <DRow label="Title" value={tx.title} />
        <DRow label="Type"  value={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} />
        <DRow label="Date"  value={format(new Date(tx.timestamp), "dd MMM yyyy")} />
        <DRow label="Time"  value={format(new Date(tx.timestamp), "HH:mm")} />
        <DRow label="Ref Number">
          <button onClick={() => copy(tx.id)}
            className="flex items-center gap-1.5 text-sm font-mono font-semibold"
            style={{ color: C.gold }}>
            <span className="truncate max-w-[150px]">{tx.id}</span>
            {copied
              ? <Check  className="w-3.5 h-3.5 shrink-0 text-green-500" />
              : <Copy   className="w-3.5 h-3.5 shrink-0" style={{ color: C.borderMid }} />}
          </button>
        </DRow>
      </div>

      <p className="text-center text-xs px-8 mb-5" style={{ color: C.textMuted }}>
        Need help with this transaction?{" "}
        <span className="underline underline-offset-2 font-semibold" style={{ color: C.gold }}>
          Contact Support
        </span>
      </p>

      <div className="px-4 pb-8">
        <GoldBtn onClick={share} className="w-full">
          <Share2 className="w-5 h-5" /> Share Receipt
        </GoldBtn>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════
   ORDER BOTTOM SHEET
══════════════════════════════════════════════════ */
const OrderSheet = ({ order, onClose }) => {
  const [copied, setCopied] = useState(false);
  const osm = statusMeta(order.orderStatus);
  const psm = statusMeta(order.paymentStatus);

  const copy = (v) => { navigator.clipboard.writeText(v); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const share = async () => {
    const text = `Order Receipt\n\nMerchant: ${order.merchantName}\nOrder Amount: ₦${fmt(order.orderAmount)}\nTotal Paid: ₦${fmt(order.amount)}\nOrder Status: ${order.orderStatus}\nPayment Status: ${order.paymentStatus}\nDate: ${format(new Date(order.timestamp), "dd MMM yyyy, HH:mm")}\nRef: ${order.transactionId}`;
    if (navigator.share) await navigator.share({ title: "Order Receipt", text });
    else copy(text);
  };

  return (
    <motion.div key="os"
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] overflow-hidden"
      style={{
        maxHeight: "90vh", overflowY: "auto",
        background: C.cardBg,
        borderTop: `3px solid ${C.goldLight}`,
        boxShadow: "0 -8px 40px rgba(120,53,15,0.18)",
      }}>

      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ background: C.borderMid }} />
      </div>
      <div className="flex items-center justify-between px-5 py-3">
        <span className="font-black text-base" style={{ color: C.textMain }}>Order Details</span>
        <button onClick={onClose} className="p-2 rounded-full" style={{ background: C.surface, color: C.textSub }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* merchant hero */}
      <div className="mx-4 mb-4 rounded-2xl p-5 flex flex-col items-center text-center"
        style={{
          background: `linear-gradient(135deg, ${C.headerFrom}, ${C.headerTo})`,
          boxShadow: `0 4px 20px ${C.gold}33`,
        }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-2xl font-black overflow-hidden text-white"
          style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}>
          {order.merchantImage
            ? <img src={order.merchantImage} alt="" className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }} />
            : order.merchantName.charAt(0).toUpperCase()}
        </div>
        <p className="font-black text-lg text-white">{order.merchantName}</p>
        <p className="text-xs mt-0.5 text-white/60">Order #{order.orderId}</p>
        <p className="text-3xl font-black tracking-tight mt-2 text-white">₦{fmt(order.amount)}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {[{ label: `Order: ${order.orderStatus}`, m: osm }, { label: `Payment: ${order.paymentStatus}`, m: psm }].map(({ label, m }) => (
            <div key={label} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.22)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
              {m.icon} {label}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden mb-4"
        style={{ border: `1px solid ${C.border}`, background: C.cardBg }}>
        <DRow label="Order Amount" value={`₦${fmt(order.orderAmount)}`} />
        <DRow label="Total Paid"   value={`₦${fmt(order.amount)}`} />
        <DRow label="Date"         value={format(new Date(order.timestamp), "dd MMM yyyy")} />
        <DRow label="Time"         value={format(new Date(order.timestamp), "HH:mm")} />
        <DRow label="Ref Number">
          <button onClick={() => copy(order.transactionId)}
            className="flex items-center gap-1.5 text-sm font-mono font-semibold"
            style={{ color: C.gold }}>
            <span className="truncate max-w-[150px]">{order.transactionId}</span>
            {copied
              ? <Check className="w-3.5 h-3.5 shrink-0 text-green-500" />
              : <Copy  className="w-3.5 h-3.5 shrink-0" style={{ color: C.borderMid }} />}
          </button>
        </DRow>
      </div>

      <p className="text-center text-xs px-8 mb-5" style={{ color: C.textMuted }}>
        Need help with this order?{" "}
        <span className="underline underline-offset-2 font-semibold" style={{ color: C.gold }}>Contact Support</span>
      </p>

      <div className="px-4 pb-8 flex gap-3">
        <button
          className="flex-1 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition"
          style={{ background: C.redTint, color: C.red, border: `1px solid ${C.red}33` }}>
          <Flag className="w-4 h-4" /> Report
        </button>
        <GoldBtn onClick={share} className="flex-[2]">
          <Share2 className="w-4 h-4" /> Share Receipt
        </GoldBtn>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════
   TX CARD  — matches home's "bg-white p-4 rounded-lg shadow-sm"
══════════════════════════════════════════════════ */
const TxCard = ({ tx, onClick, delay = 0 }) => {
  const sm   = statusMeta(tx.paymentStatus);
  const isIn = tx.type === "incoming";

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2.5 text-left bg-white shadow-sm transition-all duration-150"
      style={{ border: `1px solid ${C.border}` }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.borderMid}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      {/* icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isIn ? C.greenTint : C.surface }}>
        {isIn
          ? <ArrowDownLeft className="w-5 h-5" style={{ color: C.green }} />
          : <ArrowUpRight  className="w-5 h-5" style={{ color: C.goldText }} />}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: C.textMain }}>{tx.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm.dot}`} />
          <span className="text-xs" style={{ color: C.textSub }}>{sm.label}</span>
          <span className="text-xs" style={{ color: C.textMuted }}>·</span>
          <span className="text-xs" style={{ color: C.textMuted }}>{format(new Date(tx.timestamp), "dd MMM")}</span>
        </div>
      </div>

      {/* amount */}
      <p className="text-sm font-black shrink-0"
        style={{ color: isIn ? C.green : C.textMain }}>
        {isIn ? "+" : "−"}₦{fmt(tx.amount)}
      </p>
    </motion.button>
  );
};

/* ══════════════════════════════════════════════════
   ORDER CARD
══════════════════════════════════════════════════ */
const OrderCardItem = ({ order, onClick, delay = 0 }) => {
  const sm = statusMeta(order.paymentStatus);

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2.5 text-left bg-white shadow-sm transition-all duration-150"
      style={{ border: `1px solid ${C.border}` }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.borderMid}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-base font-black overflow-hidden"
        style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textMain }}>
        {order.merchantImage
          ? <img src={order.merchantImage} alt="" className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }} />
          : order.merchantName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: C.textMain }}>{order.merchantName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm.dot}`} />
          <span className="text-xs capitalize" style={{ color: C.textSub }}>{order.orderStatus}</span>
          <span className="text-xs" style={{ color: C.textMuted }}>·</span>
          <span className="text-xs" style={{ color: C.textMuted }}>{format(new Date(order.timestamp), "dd MMM")}</span>
        </div>
      </div>

      <p className="text-sm font-black shrink-0" style={{ color: C.textMain }}>₦{fmt(order.amount)}</p>
    </motion.button>
  );
};

/* ══════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════ */
const EmptyState = ({ type, onAction }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {type === "orders"
        ? <PackageX className="w-9 h-9" style={{ color: C.goldLight }} />
        : <Receipt  className="w-9 h-9" style={{ color: C.goldLight }} />}
    </div>
    <h3 className="font-black text-lg mb-2" style={{ color: C.textMain }}>
      {type === "orders" ? "No Orders Yet" : "No Transactions Yet"}
    </h3>
    <p className="text-sm leading-relaxed mb-7 max-w-xs" style={{ color: C.textSub }}>
      {type === "orders"
        ? "Place your first order and it'll appear right here."
        : "Your transaction history will show up once you make a move."}
    </p>
    <GoldBtn onClick={onAction} className="px-8">
      {type === "orders" ? "Place an Order" : "Make a Transaction"}
    </GoldBtn>
  </div>
);

/* ══════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════ */
const HistoryPage = () => {
  const router = useRouter();
  const [activeTab,      setActiveTab]      = useState("transactions");
  const [currentPage,    setCurrentPage]    = useState(1);
  const [dateRange,      setDateRange]      = useState({ start: "", end: "" });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [selectedTx,     setSelectedTx]     = useState(null);
  const [selectedOrder,  setSelectedOrder]  = useState(null);
  const itemsPerPage = 15;
  const accessToken = useSelector((s) => s.user.accessToken);

  const { data: TransactionResponse, loading: loadingTx,    request: getAllTransaction } = useRequest();
  const { data: OrderResponse,       loading: loadingOrder, request: getAllOrder }        = useRequest();

  useEffect(() => {
    if (accessToken) {
      getAllOrder(`/api/user?${new URLSearchParams({ token: accessToken, apiType: "getTransactionHistoryOrder" })}`);
      getAllTransaction(`/api/user?${new URLSearchParams({ token: accessToken, apiType: "getGeneralTransaction" })}`);
    }
  }, [accessToken]);

  const processOrderData = (d) => {
    if (!Array.isArray(d)) return [];
    return d.map((i) => ({
      id:            i.id,
      transactionId: `TXN${i.id}`,
      merchantName:  i.merchantDetails?.name || "Unknown Merchant",
      merchantImage: i.merchantDetails?.imageUrl || null,
      amount:        i.amount || 0,
      orderAmount:   i.orderDetails?.amountOrder || 0,
      orderStatus:   i.orderDetails?.orderStatus || "pending",
      paymentStatus: i.paymentStatus || "pending",
      timestamp:     i.createdAt || new Date().toISOString(),
      orderId:       i.orderDetails?.id || null,
    }));
  };

  const processTransactionData = (d) => {
    if (!Array.isArray(d)) return [];
    return d.map((i) => ({
      id:            i.id,
      transactionId: `TXN${i.id}`,
      title:         i.title || "Transaction",
      initials:      i.initials || "TX",
      amount:        parseFloat(i.amount?.replace(/[₦,\s]/g, "") || "0"),
      type:          i.type || "general",
      paymentStatus: i.paymentStatus || "pending",
      timestamp:     i.date ? `${i.date}T00:00:00Z` : new Date().toISOString(),
    }));
  };

  const orders       = processOrderData(OrderResponse?.data?.data || []);
  const transactions = processTransactionData(TransactionResponse?.data?.data || []);

  const getFiltered = () => {
    const items = activeTab === "orders" ? orders : transactions;
    return items.filter((item) => {
      const q = searchTerm.toLowerCase();
      const match = !q || (activeTab === "orders"
        ? item.merchantName.toLowerCase().includes(q) || item.transactionId.toLowerCase().includes(q)
        : item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
      const d = new Date(item.timestamp);
      const s = dateRange.start ? new Date(dateRange.start) : null;
      const e = dateRange.end   ? new Date(dateRange.end)   : null;
      return match && (!s || d >= s) && (!e || d <= e);
    });
  };

  const filtered   = getFiltered();
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged      = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const sheetOpen  = selectedTx !== null || selectedOrder !== null;

  /* loading */
  if (loadingTx || loadingOrder) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen" style={{ background: C.pageBg }}>
          <div className="text-center p-8 rounded-3xl bg-white shadow-md">
            <RefreshCcw className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: C.goldLight }} />
            <p className="font-medium" style={{ color: C.textSub }}>Loading your history…</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {/* page bg = amber-50, same as home */}
      <div className="flex flex-col h-screen" style={{ background: C.pageBg }}>

        {/* ══ FIXED HEADER — mirrors home's from-amber-600 to-amber-500 ══ */}
        <div className="fixed top-0 left-0 right-0 z-20 shadow-md"
          style={{ background: `linear-gradient(to right, ${C.headerFrom}, ${C.headerTo})` }}>

          {/* title row */}
          <div className="flex items-center gap-3 px-4 pt-5 pb-2">
            <button onClick={() => router.back()}
              className="p-2 rounded-xl transition"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-black text-xl flex-1 tracking-tight text-white">History</h1>
            <div className="px-3 py-1 rounded-xl text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              {activeTab === "transactions" ? transactions.length : orders.length} records
            </div>
          </div>

          {/* tabs — white active tab matches home pattern */}
          <div className="flex px-4 gap-2 pb-1">
            {[
              { key: "transactions", icon: <Wallet      className="w-3.5 h-3.5" />, count: transactions.length },
              { key: "orders",       icon: <ShoppingBag className="w-3.5 h-3.5" />, count: orders.length },
            ].map(({ key, icon, count }) => {
              const active = activeTab === key;
              return (
                <button key={key}
                  onClick={() => { setActiveTab(key); setCurrentPage(1); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-t-xl text-sm font-bold capitalize transition-all duration-200"
                  style={active
                    ? { background: C.cardBg, color: C.goldText, boxShadow: "0 -2px 8px rgba(0,0,0,0.08)" }
                    : { color: "rgba(255,255,255,0.75)" }
                  }>
                  {icon} {key}
                  <span className="text-xs rounded-full px-1.5 py-0.5 font-semibold"
                    style={active
                      ? { background: C.surface, color: C.textSub }
                      : { background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ SEARCH BAR — below header, white bg ══ */}
        <div className="fixed z-10 left-0 right-0 bg-white px-4 py-3 shadow-sm"
          style={{ top: 112, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textMuted }} />
              <input type="text" placeholder={`Search ${activeTab}…`}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl outline-none transition"
                style={{
                  background: C.surface,
                  border: `2px solid ${searchTerm ? C.borderMid : C.border}`,
                  color: C.textMain,
                }} />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: C.textMuted }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2.5 rounded-xl transition"
              style={{
                background: (dateRange.start || dateRange.end) ? C.surface : C.pageBg,
                border: `2px solid ${(dateRange.start || dateRange.end) ? C.borderMid : C.border}`,
                color: C.textSub,
              }}>
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          {/* date picker */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-4 right-4 rounded-2xl p-4 mt-1 z-30 bg-white shadow-xl"
                style={{ border: `1px solid ${C.border}` }}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[["start","From"],["end","To"]].map(([k, lbl]) => (
                    <div key={k}>
                      <label className="text-xs font-semibold mb-1 block uppercase tracking-wide"
                        style={{ color: C.textMuted }}>{lbl}</label>
                      <input type="date" value={dateRange[k]}
                        onChange={(e) => setDateRange({ ...dateRange, [k]: e.target.value })}
                        className="w-full p-2.5 text-sm rounded-xl outline-none"
                        style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textMain }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setDateRange({ start: "", end: "" }); setCurrentPage(1); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
                    style={{ background: C.surface, color: C.textSub }}>
                    Clear
                  </button>
                  <button onClick={() => { setShowDatePicker(false); setCurrentPage(1); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition"
                    style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` }}>
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* active filter pills */}
          {(searchTerm || dateRange.start || dateRange.end) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {searchTerm && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: C.surface, color: C.textSub, border: `1px solid ${C.border}` }}>
                  {searchTerm} <button onClick={() => setSearchTerm("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(dateRange.start || dateRange.end) && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: C.surface, color: C.textSub, border: `1px solid ${C.border}` }}>
                  {dateRange.start || "…"} → {dateRange.end || "…"}
                  <button onClick={() => setDateRange({ start: "", end: "" })}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-xs mt-1.5" style={{ color: C.textMuted }}>
              Showing {filtered.length} {activeTab}
            </p>
          )}
        </div>

        {/* ══ SCROLLABLE LIST ══ */}
        <div className="flex-1 overflow-auto pt-[200px] px-4 pb-8">
          {activeTab === "transactions" ? (
            transactions.length === 0
              ? <EmptyState type="transactions" onAction={() => router.push("/")} />
              : paged.length === 0
                ? <div className="text-center py-16 text-sm" style={{ color: C.textSub }}>
                    No results.{" "}
                    <button onClick={() => { setSearchTerm(""); setDateRange({ start: "", end: "" }); }}
                      className="underline font-semibold" style={{ color: C.gold }}>
                      Clear filters
                    </button>
                  </div>
                : paged.map((tx, i) => (
                    <TxCard key={tx.id} tx={tx} delay={i * 0.025} onClick={() => setSelectedTx(tx)} />
                  ))
          ) : (
            orders.length === 0
              ? <EmptyState type="orders" onAction={() => router.push("/")} />
              : paged.length === 0
                ? <div className="text-center py-16 text-sm" style={{ color: C.textSub }}>
                    No results.{" "}
                    <button onClick={() => { setSearchTerm(""); setDateRange({ start: "", end: "" }); }}
                      className="underline font-semibold" style={{ color: C.gold }}>
                      Clear filters
                    </button>
                  </div>
                : paged.map((order, i) => (
                    <OrderCardItem key={order.id} order={order} delay={i * 0.025} onClick={() => setSelectedOrder(order)} />
                  ))
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 bg-white shadow-sm"
                style={{ color: C.textSub, border: `1px solid ${C.border}` }}>
                Prev
              </button>
              <span className="text-sm font-semibold" style={{ color: C.textSub }}>
                {currentPage} / {totalPages}
              </span>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 shadow-md"
                style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` }}>
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══ SHEETS ══ */}
      <AnimatePresence>
        {sheetOpen && <Backdrop onClose={() => { setSelectedTx(null); setSelectedOrder(null); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedTx    && <TransactionSheet tx={selectedTx}     onClose={() => setSelectedTx(null)}    />}
        {selectedOrder && <OrderSheet order={selectedOrder}     onClose={() => setSelectedOrder(null)} />}
      </AnimatePresence>
    </ProtectedRoute>
  );
};

export default HistoryPage;
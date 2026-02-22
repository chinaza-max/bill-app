"use client";

import { LocationStatusIndicator, LocationStatusBadge } from '../component/LocationStatusIndicator';

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Bell,
  ChevronDown,
  ShoppingBag,
  Loader2,
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
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

// ─── Transaction fetcher ───────────────────────────────────────────────────────
const fetchTransaction = async (accessToken) => {
  if (!accessToken) throw new Error("No access token provided");
  const queryParams = new URLSearchParams({
    limit: 3, offset: 0, token: accessToken, apiType: "getGeneralTransaction",
  }).toString();
  const response = await fetch(`/api/user?${queryParams}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Error: ${response.status}`);
  }
  return response.json();
};

// ─── Loading / Error helpers ──────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-6 px-4">
    <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
    <p className="mt-2 text-amber-600 text-sm">Loading transactions...</p>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-6 px-4 bg-red-50 rounded-lg">
    <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to load transactions</h3>
    <p className="text-red-600 text-center text-sm mb-4">{message}</p>
    <button className="px-6 py-2 bg-amber-500 text-white rounded-full font-medium text-sm" onClick={() => window.location.reload()}>
      Try Again
    </button>
  </div>
);

// ─── Live Activity Ticker ─────────────────────────────────────────────────────
const FIRST_NAMES = ["Amina","Chukwudi","Fatima","Emeka","Ngozi","Tunde","Aisha","Kelechi","Blessing","Usman","Adaeze","Seun","Halima","Tobi","Chisom","Musa","Yetunde","Ifeanyi","Zainab","Babatunde","Chiamaka","Abdullahi","Sola","Chinyere","Ahmed","Folake","Obinna","Rukayat","Gbenga","Nneka"];
const LAST_NAMES  = ["Okafor","Adeyemi","Ibrahim","Nwosu","Bello","Eze","Lawal","Obi","Yusuf","Adeleke","Nwachukwu","Suleiman","Okonkwo","Abubakar","Dike","Omotayo","Garba","Onuoha","Aliyu","Fashola"];

// 4 action types — placed, completed, order_completed (amber), cancelled
const ACTIONS = [
  { type: "placed",          label: "just placed an order of",    icon: Clock,        color: "#f59e0b" },
  { type: "completed",       label: "just completed an order of", icon: CheckCircle2, color: "#16a34a" },
  { type: "order_completed", label: "order has been completed —", icon: CheckCircle2, color: "#d97706" },
  { type: "cancelled",       label: "cancelled an order of",      icon: XCircle,      color: "#dc2626" },
];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomName = () =>
  `${FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)][0]}.`;

// Generates amounts in steps of ₦100 between ₦1,000 and ₦20,000 — hard capped
const randomAmount = () => {
  const raw = randomBetween(10, 200) * 100;          // 1,000 – 20,000
  const capped = Math.min(raw, 20000);               // hard cap at ₦20,000
  return `₦${capped.toLocaleString("en-NG")}`;
};

const randomAction = () => ACTIONS[randomBetween(0, ACTIONS.length - 1)];

const generateFeed = (count = 20) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    name: randomName(),
    amount: randomAmount(),
    action: randomAction(),
  }));

const LiveActivityTicker = () => {
  const [feed, setFeed] = useState(() => generateFeed(20));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % feed.length;
          if (next === 0) setFeed(generateFeed(20)); // regenerate on full loop
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
      style={{
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.22)",
      }}
    >
      {/* Pulsing dot — color matches action type */}
      <span className="relative flex-shrink-0">
        <span
          className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60"
          style={{ background: item.action.color }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: item.action.color }}
        />
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

      {/* LIVE badge */}
      <span
        className="ml-auto flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
        style={{ background: "rgba(220,38,38,0.12)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)" }}
      >
        LIVE
      </span>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const MobileApp = () => {
  const [userType, setUserType]                               = useState("Client");
  const [activeTab, setActiveTab]                             = useState("home");
  const [fullName, setFullName]                               = useState("");
  const [imageUrl, setImageUrl]                               = useState("");
  const [isDropdownOpen, setIsDropdownOpen]                   = useState(false);
  const [walletBalance, setWalletBalance]                     = useState(0);
  const [isBalanceVisible, setIsBalanceVisible]               = useState(false);
  const [showPulseAnimation, setShowPulseAnimation]           = useState(false);
  const [hasInteractedWithSwitch, setHasInteractedWithSwitch] = useState(false);

  const { token } = useNotifications();
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

  const { data: transactionData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => fetchTransaction(accessToken),
    enabled: !!accessToken,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const [notifications] = useState([
    { id: 1, message: "New transaction received", read: false },
    { id: 2, message: "Promotion available",      read: false },
    { id: 3, message: "Account update",           read: true  },
  ]);

  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasInteractedWithSwitch(localStorage.getItem("hasInteractedWithSwitch") === "true");
    }
    (async () => { await getCurrentLocation(); })();
  }, []);

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

  useEffect(() => {
    if (order) setNumberOfOrder(order.data?.data?.length);
  }, [order]);

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

  const recentTransactions = useMemo(() => {
    if (!transactionData?.data?.data) return [];
    return transactionData.data.data.map((t) => ({
      id: t.id || Math.random().toString(),
      title: t.title || "Transaction",
      initials: t.initials || (t.title ? t.title.substring(0, 2).toUpperCase() : "TX"),
      date: t.date || new Date(t.createdAt).toLocaleDateString(),
      type: t.type || "outgoing",
      amount: t.amount || "0.00 ₦",
      paymentStatus: t.paymentStatus || "pending",
    }));
  }, [transactionData]);

  useEffect(() => {
    if (error) getErrorMessage(error, router, "", isAuthenticated);
  }, [error, router, isAuthenticated]);

  useEffect(() => {
    if (data2?.user?.user) {
      try {
        const user = data2.user.user;
        setImageUrl(user.imageUrl);
        setFullName(`${user.firstName} ${user.lastName}`);
        let walletData = { current: 0, previous: 0 };
        const raw = user.walletBalance;
        if (typeof raw === "string") walletData = JSON.parse(raw);
        else if (typeof raw === "object" && raw !== null) walletData = raw;
        setWalletBalance(walletData?.current ?? walletData?.previous ?? 0);
      } catch { setWalletBalance(0); }
    }
  }, [data2.user]);

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

  const renderTransactionsSection = () => {
    if (isLoading) return <LoadingSpinner />;
    if (isError)   return <ErrorDisplay message={error?.message || "Failed to load transactions"} />;
    if (recentTransactions.length === 0) return <EmptyTransactionState />;

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

        <div className="flex justify-center mt-4">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-1 text-amber-600 text-sm"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <img
                  onClick={() => handleTabChange("userProfile")}
                  src={imageUrl || "/default-avatar.png"}
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full cursor-pointer"
                  onError={(e) => { e.target.onerror = null; e.target.src = "/default-avatar.png"; }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-sm">Welcome</p>
                  <p className="font-semibold">{fullName || "User"}</p>
                </div>
                <LocationStatusBadge status={locationStatus} size="sm" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 cursor-pointer" onClick={() => router.push("/home/notification")} />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => { setIsDropdownOpen(!isDropdownOpen); handleSwitchInteraction(); }}
                  className="flex items-center space-x-1 text-white hover:bg-amber-600 px-3 py-1.5 rounded relative overflow-hidden"
                >
                  <AttentionAnimation isVisible={showPulseAnimation} duration={2} />
                  <span className="relative z-10">{userType}</span>
                  <ChevronDown className="h-4 w-4 relative z-10" />
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
                        onClick={() => { setUserType("Merchant"); setIsDropdownOpen(false); handleSwitchInteraction(); moveToMerchant(); }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 w-full text-left"
                      >
                        Merchant
                      </button>
                      <button
                        onClick={() => { setUserType("Client"); setIsDropdownOpen(false); handleSwitchInteraction(); }}
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

          <div className="mt-3">
            <LocationStatusIndicator status={locationStatus} accuracy={currentAccuracy} lastUpdate={lastLocationUpdate} />
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-auto">

          {/* Wallet Balance Card */}
          <WalletBalanceCard
            balance={walletBalance}
            isVisible={isBalanceVisible}
            onToggleVisibility={toggleBalanceVisibility}
          />

          {/* ── Place New Order — gold CTA ── */}
          <div className="px-4 pb-3 pt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTabChange("p2p")}
              className="w-full relative overflow-hidden rounded-2xl shadow-md"
              style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 75%, #f59e0b 100%)" }}
            >
              {/* shimmer sweep */}
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

          {/* ── Live Activity Ticker ── */}
          <LiveActivityTicker />

          {/* ── Transactions ── */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-amber-900">Recent Transactions</h2>
              {!isLoading && !isError && recentTransactions.length > 0 && (
                <button onClick={() => router.push("/history")} className="text-sm text-amber-600 hover:text-amber-700">
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

        <BottomNav handleTabChangeP={handleTabChange} activeTabP={activeTab} pendingP={numberOfOrder} />
      </div>
    </ProtectedRoute>
  );
};

export default MobileApp;
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  ChevronDown,
  Home,
  Settings,
  ShoppingBag,
  Eye,
  EyeOff,
  Package2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  X,
  ArrowRight,
  Megaphone,
  MapPin,
  User,
  DollarSign,
  ChevronRight,
  Phone,
  Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import useRequest from "@/hooks/useRequest";
import Image from "next/image";

// ─── Haversine distance (returns metres) ─────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (metres) => {
  if (metres == null) return null;
  if (metres < 1000) return `${Math.round(metres)} m away`;
  return `${(metres / 1000).toFixed(1)} km away`;
};

// ─── Pending Order Modal ──────────────────────────────────────────────────────

const PendingOrderModal = ({
  order,
  onAccept,
  onReject,
  onDismiss,
  queueCount,
  merchantCoords,
}) => {
  const [isActioning, setIsActioning] = useState(false);

  const handleAccept = async () => {
    setIsActioning(true);
    await onAccept(order);
    setIsActioning(false);
  };

  const handleReject = async () => {
    setIsActioning(true);
    await onReject(order);
    setIsActioning(false);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount ?? 0);

  const customerName = order?.client?.name ?? "Customer";
  const clientImage = order?.client?.image ?? null;
  const totalAmount = order?.totalAmount ?? order?.amount;
  const orderAmount = order?.amountOrder ?? order?.amount;
  const phone = order?.client?.tel;
  const note = order?.note && order.note !== "0" ? order.note : null;
  const orderId = order?.orderId ?? order?.id ?? "—";

  const clientCoords = order?.client?.coordinates;
  let distanceText = null;
  if (
    merchantCoords?.lat != null &&
    merchantCoords?.lng != null &&
    clientCoords?.lat != null &&
    clientCoords?.lng != null
  ) {
    const metres = haversineDistance(
      parseFloat(merchantCoords.lat),
      parseFloat(merchantCoords.lng),
      parseFloat(clientCoords.lat),
      parseFloat(clientCoords.lng)
    );
    distanceText = formatDistance(metres);
  }

  return (
    <AnimatePresence>
      {/* Backdrop — clicking it dismisses without accepting/rejecting */}
      <motion.div
        key="pending-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      >
        {/* Sheet — stop clicks propagating to backdrop */}
        <motion.div
          key="pending-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="relative w-full max-w-lg bg-white rounded-t-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <h2 className="text-base font-semibold text-gray-900">
                New Order Request
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {queueCount > 1 && (
                <span className="text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2.5 py-0.5">
                  {queueCount - 1} more waiting
                </span>
              )}
              {/* Close / dismiss button */}
              <button
                onClick={onDismiss}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="px-5 py-4 space-y-3">
            {/* Customer row with avatar */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {clientImage ? (
                  <Image
                    src={clientImage}
                    alt={customerName}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-none mb-0.5">
                  Customer
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {customerName}
                </p>
              </div>
            </div>

            {/* Phone */}
            {phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 leading-none mb-0.5">
                    Phone
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    0{phone}
                  </p>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-none mb-0.5">
                  Total Amount
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(totalAmount)}
                </p>
                {orderAmount && orderAmount !== totalAmount && (
                  <p className="text-xs text-gray-400 leading-none mt-0.5">
                    Order: {formatCurrency(orderAmount)} + fee
                  </p>
                )}
              </div>
            </div>

            {/* Distance */}
            {distanceText && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 leading-none mb-0.5">
                    Distance
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {distanceText}
                  </p>
                </div>
              </div>
            )}

            {/* Note */}
            {note && (
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Note</p>
                <p className="text-sm text-gray-700 leading-relaxed">{note}</p>
              </div>
            )}

            {/* Order ID */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Order ID</span>
              <span className="font-mono">{orderId}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-6 pt-2 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={isActioning}
              onClick={handleReject}
              className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors hover:bg-red-100"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={isActioning}
              onClick={handleAccept}
              className="flex-2 flex-[2] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 disabled:opacity-50"
            >
              {isActioning ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Accept
                  {queueCount > 1 && (
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  )}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Ads Setup Dialog ────────────────────────────────────────────────────────

const AdsSetupDialog = ({ onClose, onSetupAds, pricingImage }) => {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
        onClick={onClose}
      >
        <motion.div
          key="dialog"
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-48 w-full bg-gradient-to-br from-emerald-500 to-emerald-700 overflow-hidden">
            {pricingImage ? (
              <Image
                src={pricingImage}
                alt="Ads pricing tiers"
                fill
                className="object-cover opacity-90"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-3">
                  {["Starter", "Growth", "Enterprise"].map((tier, i) => (
                    <motion.div
                      key={tier}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 * i }}
                      className={`rounded-xl px-3 py-4 flex flex-col items-center gap-1 shadow-lg ${
                        i === 1
                          ? "bg-cyan-400 text-white scale-110"
                          : "bg-white/20 text-white/90"
                      }`}
                    >
                      <span className="text-lg">
                        {i === 0 ? "🪙" : i === 1 ? "💳" : "👜"}
                      </span>
                      <span className="text-[10px] font-bold tracking-wide">
                        {tier.toUpperCase()}
                      </span>
                      <div className="w-10 h-1.5 rounded bg-white/40 mt-1" />
                      <div className="w-10 h-1.5 rounded bg-white/40" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-white/70 text-xs mt-2 font-medium tracking-widest uppercase">
                  Choose your plan
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-xs font-semibold tracking-wide">
                Pricing
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Set Up Your Ads
              </h2>
            </div>

            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Ads let customers discover you by showing how much you charge for
              cash delivery. Without an active ad, you are invisible to new
              clients.
            </p>

            <ul className="space-y-2 mb-5">
              {[
                "Set your delivery rate & availability",
                "Appear in customer search results",
                "Grow your merchant income",
              ].map((point, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Maybe later
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSetupAds}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200"
              >
                Set Up Now
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MerchantApp = () => {
  const {
    data: orderStats,
    loading: loadingStats,
    request: getOrderStatistic,
  } = useRequest();

  const { request: checkMerchantAds } = useRequest();
  const { request: getPendingOrders } = useRequest();
  const { request: orderAction } = useRequest();

  const [isBalanceVisible, setIsBalanceVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("isBalanceVisible");
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState("home");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userType, setUserType] = useState("Merchant");
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New transaction received", read: false },
    { id: 2, message: "Promotion available", read: false },
    { id: 3, message: "Account update", read: true },
  ]);

  const [showAdsSetupDialog, setShowAdsSetupDialog] = useState(false);
  const [pendingOrdersQueue, setPendingOrdersQueue] = useState([]);

  // ── Tracks which index in the queue is currently shown (null = all hidden) ─
  const [visibleIndex, setVisibleIndex] = useState(null);

  const [merchantCoords, setMerchantCoords] = useState(null);

  const router = useRouter();
  const intervalRef = useRef(null);
  const myUserData = useSelector((state) => state.user.user);
  const accessToken = useSelector((state) => state.user.accessToken);

  const defaultMerchantData = {
    Balance: 0,
    EscrowBalance: 0,
    CompletedCount: 0,
    PendingCount: 0,
    CancellCount: 0,
    InProgressCount: 0,
  };

  const [merchantData, setMerchantData] = useState(defaultMerchantData);

  // ── When queue gets new orders, show first one if nothing is visible ───────
  useEffect(() => {
    if (pendingOrdersQueue.length > 0 && visibleIndex === null) {
      setVisibleIndex(0);
    }
    if (pendingOrdersQueue.length === 0) {
      setVisibleIndex(null);
    }
  }, [pendingOrdersQueue, visibleIndex]);

  // ── GPS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setMerchantCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => console.warn("Geolocation unavailable:", err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Fetch order statistics ────────────────────────────────────────────────
  const fetchOrderStatistics = useCallback(async () => {
    if (accessToken) {
      try {
        const queryParams = new URLSearchParams({
          token: accessToken,
          apiType: "getOrderStatistic",
        }).toString();
        const result = await getOrderStatistic("/api/user?" + queryParams);
        const data = result?.data?.data;
        if (data) {
          setMerchantData({ ...data, InProgressCount: data.InProgressCount || 0 });
        }
      } catch (error) {
        console.error("Error fetching order statistics:", error);
      }
    }
  }, [accessToken, getOrderStatistic]);

  // ── Check merchant ads ────────────────────────────────────────────────────
  const fetchHasMerchantAds = useCallback(async () => {
    if (accessToken) {
      try {
        const queryParams = new URLSearchParams({
          token: accessToken,
          apiType: "hasMerchantAds",
        }).toString();
        const result = await checkMerchantAds("/api/user?" + queryParams);
        const hasAds = result?.data?.data ?? result?.data ?? true;
        if (!hasAds) setShowAdsSetupDialog(true);
      } catch (error) {
        console.error("Error checking merchant ads:", error);
      }
    }
  }, [accessToken, checkMerchantAds]);

  // ── Fetch pending orders ──────────────────────────────────────────────────
  const fetchPendingOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const queryParams = new URLSearchParams({
        token: accessToken,
        apiType: "pendingOrder",
      }).toString();
      const result = await getPendingOrders("/api/user?" + queryParams);
      const payload = result?.data?.data ?? result?.data;
      const orders = payload?.orders ?? (Array.isArray(payload) ? payload : []);
      const orderArray = Array.isArray(orders) ? orders : [orders].filter(Boolean);
      if (orderArray.length > 0) {
        setPendingOrdersQueue(orderArray);
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    }
  }, [accessToken, getPendingOrders]);

  // ── Dismiss: hide current modal without any API call ─────────────────────
  // If there are more in queue, show the next one. Otherwise close everything.
  const handleDismiss = useCallback(() => {
    setPendingOrdersQueue((prev) => {
      const next = prev.slice(1);
      if (next.length > 0) {
        setVisibleIndex(0);
      } else {
        setVisibleIndex(null);
      }
      return next;
    });
  }, []);

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAcceptOrder = useCallback(
    async (order) => {
      const orderId = order?.id ?? order?.orderId;
      try {
        await orderAction("/api/user", "POST", {
          apiType: "orderAcceptOrCancel",
          accessToken,
          orderId,
          type: "accept",
        });
      } catch (error) {
        console.error("Error accepting order:", error);
      } finally {
        setPendingOrdersQueue((prev) => {
          const next = prev.slice(1);
          setVisibleIndex(next.length > 0 ? 0 : null);
          return next;
        });
        fetchOrderStatistics();
      }
    },
    [accessToken, orderAction, fetchOrderStatistics]
  );

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleRejectOrder = useCallback(
    async (order) => {
      const orderId = order?.id ?? order?.orderId;
      try {
        await orderAction("/api/user", "POST", {
          apiType: "orderAcceptOrCancel",
          accessToken,
          orderId,
          type: "reject",
        });
      } catch (error) {
        console.error("Error rejecting order:", error);
      } finally {
        setPendingOrdersQueue((prev) => {
          const next = prev.slice(1);
          setVisibleIndex(next.length > 0 ? 0 : null);
          return next;
        });
        fetchOrderStatistics();
      }
    },
    [accessToken, orderAction, fetchOrderStatistics]
  );

  useEffect(() => {
    fetchOrderStatistics();
    fetchHasMerchantAds();
    fetchPendingOrders();
  }, [fetchOrderStatistics, fetchHasMerchantAds, fetchPendingOrders]);

  // ── Carousel ──────────────────────────────────────────────────────────────
  const minSwipeDistance = 50;

  const balanceItems = [
    {
      id: 1,
      title: "Available Balance",
      amount: merchantData.Balance,
      color: "from-green-400 to-green-600",
    },
    {
      id: 2,
      title: "Escrow Balance",
      amount: merchantData.EscrowBalance,
      color: "from-green-500 to-green-700",
    },
  ];

  const toggleBalanceVisibility = () => {
    const newState = !isBalanceVisible;
    setIsBalanceVisible(newState);
    localStorage.setItem("isBalanceVisible", JSON.stringify(newState));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextSlide();
    if (distance < -minSwipeDistance) prevSlide();
  };

  const startInterval = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % balanceItems.length);
      }, 6000);
    }
  }, [balanceItems.length]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const nextSlide = useCallback(
    () => setCurrentSlide((prev) => (prev + 1) % balanceItems.length),
    [balanceItems.length]
  );
  const prevSlide = useCallback(
    () =>
      setCurrentSlide(
        (prev) => (prev - 1 + balanceItems.length) % balanceItems.length
      ),
    [balanceItems.length]
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };
  const handleNavigation = (tab) => router.push(`/${tab}`);
  const handleOrderCardClick = (orderType) => {
    localStorage.setItem("selectedOrderTab", orderType);
    router.push("/orders/merchantOrders");
  };

  const handleSetupAds = () => {
    setShowAdsSetupDialog(false);
    handleTabChange("userProfile/merchantProfile/merchantHome/createAds");
  };

  useEffect(() => {
    localStorage.setItem("who", "merchant");
    startInterval();
    return () => stopInterval();
  }, [startInterval, stopInterval]);

  useEffect(() => {
    router.prefetch("userProfile/merchantProfile/merchantHome/createAds");
    router.prefetch("userProfile/merchantProfile/merchantHome/viewAds");
    router.prefetch("userProfile/merchantProfile/merchantHome/settings");
    router.prefetch("home/notification");
    router.prefetch("home/orders");
    router.prefetch("home/ads");
    router.prefetch("orders");
    router.prefetch("orders/merchantOrders");
  }, [router]);

  const formatGoogleDriveImage = (url) => {
    if (!url) return "/avatar.jpg";
    if (url.includes("uc?export=view&id=")) return url;
    const match = url.match(/\/d\/(.*?)\//);
    if (match && match[1])
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return url;
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className={`h-8 w-8 ${color} mb-2`} />
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      <span className="text-sm text-gray-600">{title}</span>
    </motion.div>
  );

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader className="h-8 w-8 text-emerald-500" />
      </motion.div>
      <span className="ml-2 text-emerald-700 font-medium">Loading stats...</span>
    </div>
  );

  // The order currently on screen (null when dismissed)
  const visibleOrder =
    visibleIndex !== null ? pendingOrdersQueue[visibleIndex] ?? null : null;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-emerald-50">
        {/* ── Pending Order Modal ── */}
        <AnimatePresence mode="wait">
          {visibleOrder && (
            <PendingOrderModal
              key={visibleOrder?.orderId ?? visibleOrder?.id ?? 0}
              order={visibleOrder}
              queueCount={pendingOrdersQueue.length}
              onAccept={handleAcceptOrder}
              onReject={handleRejectOrder}
              onDismiss={handleDismiss}
              merchantCoords={merchantCoords}
            />
          )}
        </AnimatePresence>

        {/* ── Ads Setup Dialog ── */}
        {showAdsSetupDialog && (
          <AdsSetupDialog
            onClose={() => setShowAdsSetupDialog(false)}
            onSetupAds={handleSetupAds}
            pricingImage="/pricing.jpg"
          />
        )}

        {/* ── Top Navigation ── */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Image
                  onClick={() => handleTabChange("userProfile")}
                  src={formatGoogleDriveImage(
                    myUserData?.user?.MerchantProfile?.imageUrl
                  )}
                  alt="avatar"
                  width={100}
                  height={100}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <p className="text-sm">Welcome back,</p>
                <p className="font-semibold">
                  {myUserData
                    ? myUserData?.user?.MerchantProfile.displayName
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell
                  className="h-6 w-6 cursor-pointer"
                  onClick={() => router.push("/home/notification")}
                />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 text-white hover:bg-emerald-600/80 px-2 py-1 rounded"
                >
                  <span>{userType}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setUserType("Merchant");
                        setIsDropdownOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 w-full text-left"
                    >
                      Merchant
                    </button>
                    <button
                      onClick={() => {
                        setUserType("Client");
                        handleNavigation("home");
                        setIsDropdownOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 w-full text-left"
                    >
                      Client
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-auto">
          {/* Balance Carousel */}
          <div className="relative p-4">
            <div
              className="relative overflow-hidden rounded-lg"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={`slide-${currentSlide}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-gradient-to-r ${balanceItems[currentSlide].color} rounded-lg p-6 shadow-lg relative`}
                  style={{ height: "160px" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {balanceItems[currentSlide].title}
                      </h4>
                      <p className="text-2xl font-bold text-white mt-2">
                        {isBalanceVisible
                          ? formatCurrency(balanceItems[currentSlide].amount)
                          : "••••••"}
                      </p>
                    </div>
                    <button
                      onClick={toggleBalanceVisibility}
                      className="p-2 rounded-full bg-white/20"
                    >
                      {isBalanceVisible ? (
                        <EyeOff className="h-6 w-6 text-white" />
                      ) : (
                        <Eye className="h-6 w-6 text-white" />
                      )}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {balanceItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? "bg-white w-4" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {loadingStats && <LoadingSpinner />}

          {/* Order Statistics Grid */}
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3 text-emerald-900">
              Order Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Completed"
                value={loadingStats ? "..." : merchantData.CompletedCount}
                icon={CheckCircle}
                color="text-emerald-500"
                onClick={() => handleOrderCardClick("completed")}
              />
              <StatCard
                title="In Progress"
                value={loadingStats ? "..." : merchantData.InProgressCount || 0}
                icon={AlertCircle}
                color="text-blue-500"
                onClick={() => handleOrderCardClick("inProgress")}
              />
              <StatCard
                title="Pending"
                value={loadingStats ? "..." : merchantData.PendingCount}
                icon={Clock}
                color="text-yellow-500"
                onClick={() => handleOrderCardClick("pending")}
              />
              <StatCard
                title="Cancelled"
                value={loadingStats ? "..." : merchantData.CancellCount}
                icon={XCircle}
                color="text-red-500"
                onClick={() => handleOrderCardClick("cancelled")}
              />
            </div>

            {/* Create Ad Button */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl py-3 px-6 shadow-lg flex items-center justify-center space-x-2 relative overflow-hidden group"
                onClick={() =>
                  handleTabChange(
                    "userProfile/merchantProfile/merchantHome/createAds"
                  )
                }
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Package2 className="h-6 w-6" />
                <span className="text-lg font-semibold relative z-10">
                  Create New Ad
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* ── Bottom Navigation ── */}
        <div className="bg-white border-t border-emerald-200">
          <div className="flex justify-around py-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabChange("home")}
              className={`flex flex-col items-center p-2 ${
                activeTab === "home" ? "text-emerald-600" : "text-emerald-400"
              }`}
            >
              <Home className="h-6 w-6" />
              <span className="text-xs mt-1">Home</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabChange("orders")}
              className={`flex flex-col items-center p-2 relative ${
                activeTab === "orders" ? "text-emerald-600" : "text-emerald-400"
              }`}
            >
              <div className="relative">
                <ShoppingBag className="h-6 w-6" />
                {merchantData.PendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                    {merchantData.PendingCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Orders</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                handleTabChange(
                  "userProfile/merchantProfile/merchantHome/settings"
                )
              }
              className={`flex flex-col items-center p-2 ${
                activeTab === "history" ? "text-emerald-600" : "text-emerald-400"
              }`}
            >
              <Settings className="h-6 w-6" />
              <span className="text-xs mt-1">Settings</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                router.push("/userProfile/merchantProfile/merchantHome/viewAds")
              }
              className={`flex flex-col items-center p-2 ${
                activeTab === "p2p" ? "text-emerald-600" : "text-emerald-400"
              }`}
            >
              <Package2 className="h-6 w-6" />
              <span className="text-xs mt-1">View Ads</span>
            </motion.button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MerchantApp;
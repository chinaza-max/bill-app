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
  Users,
  Loader,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import useRequest from "@/hooks/useRequest";
import Image from "next/image";

const MerchantApp = () => {
  const {
    data: orderStats,
    loading: loadingStats,
    request: getOrderStatistic,
  } = useRequest();

  // Initialize isBalanceVisible from localStorage or default to false
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
  const router = useRouter();
  const intervalRef = useRef(null);
  const myUserData = useSelector((state) => state.user.user);
  const accessToken = useSelector((state) => state.user.accessToken);

  // Default merchant data (fallback when API data is not available)
  const defaultMerchantData = {
    Balance: 0,
    EscrowBalance: 0,
    CompletedCount: 0,
    PendingCount: 0,
    CancellCount: 0,
    InProgressCount: 0,
  };

  const [merchantData, setMerchantData] = useState(defaultMerchantData);

  // Memoize the fetchOrderStatistics function to prevent unnecessary re-renders
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
          let updatedMerchantData = {
            ...data,
            InProgressCount: data.InProgressCount || 0,
          };
          setMerchantData(updatedMerchantData);
        }
      } catch (error) {
        console.error("Error fetching order statistics:", error);
      }
    }
  }, [accessToken, getOrderStatistic]);

  // Use useEffect to trigger the API call when accessToken becomes available
  useEffect(() => {
    fetchOrderStatistics();
  }, [fetchOrderStatistics]);

  // Minimum swipe distance (in px)
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // Carousel control functions - memoized to prevent recreating on every render
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

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % balanceItems.length);
  }, [balanceItems.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prev) => (prev - 1 + balanceItems.length) % balanceItems.length
    );
  }, [balanceItems.length]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };

  const handleNavigation = (tab) => {
    router.push(`/${tab}`);
  };

  // Handle order card clicks
  const handleOrderCardClick = (orderType) => {
    // Store the selected order type in localStorage
    console.log("Selected order type:", orderType);
    console.log("Selected order type:", orderType);
    console.log("Selected order type:", orderType);

    localStorage.setItem("selectedOrderTab", orderType);
    router.push("/orders/merchantOrders");
  };

  useEffect(() => {
    localStorage.setItem("who", "merchant");
    startInterval();
    return () => stopInterval();
  }, [startInterval, stopInterval]);

  useEffect(() => {
    console.log("User data updated:", myUserData);
  }, [myUserData]);

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
      <span className="ml-2 text-emerald-700 font-medium">
        Loading stats...
      </span>
    </div>
  );

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

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-emerald-50">
        {/* Top Navigation */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Image
                  onClick={() => handleTabChange("userProfile")}
                  src={
                    myUserData
                      ? myUserData?.user?.MerchantProfile.imageUrl
                      : "../../avatar.jpg"
                  }
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
                  <span
                    className="absolute -top-2 -right-2 bg-red-500 text-white 
                             rounded-full text-xs w-5 h-5 flex items-center 
                             justify-center"
                  >
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

        {/* Main Content */}
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

          {/* Loading Indicator */}
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

        {/* Bottom Navigation */}
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
                activeTab === "history"
                  ? "text-emerald-600"
                  : "text-emerald-400"
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

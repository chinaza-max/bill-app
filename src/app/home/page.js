"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Bell,
  ChevronDown,
  Home,
  History,
  Users,
  ShoppingBag,
  Package2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useAnimation,
} from "framer-motion";
import ProtectedRoute from "@/app/component/protect";
import WalletBalanceCard from "@/app/component/walletBalanceCard";
import EnhancedCarousel from "@/app/component/enhancedCarousel";

import { useRouter, usePathname } from "next/navigation";
import BottomNav from "../component/bottomNav";
import { useSelector } from "react-redux";
import useVisibility from "../component/useVisibility";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import getErrorMessage from "@/app/component/error";

// Enhanced transaction fetcher with better error handling
const fetchTransaction = async (accessToken) => {
  if (!accessToken) {
    throw new Error("No access token provided");
  }

  try {
    const queryParams = new URLSearchParams({
      limit: 3,
      offset: 0,
      token: accessToken,
      apiType: "getGeneralTransaction",
    }).toString();

    const response = await fetch(`/api/user?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `Error fetching transactions: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Transaction fetch error:", error);
    throw error;
  }
};

// Set display name for React memo component
//EnhancedCarousel.displayName = "EnhancedCarousel";

// Loading spinner component for better UX
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-6 px-4">
    <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
    <p className="mt-2 text-amber-600 text-sm">Loading transactions...</p>
  </div>
);

// Error display component
const ErrorDisplay = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-6 px-4 bg-red-50 rounded-lg">
    <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-red-700 mb-2">
      Unable to load transactions
    </h3>
    <p className="text-red-600 text-center text-sm mb-4">{message}</p>
    <button
      className="px-6 py-2 bg-amber-500 text-white rounded-full font-medium text-sm"
      onClick={() => window.location.reload()}
    >
      Try Again
    </button>
  </div>
);

// Improved Attention Animation Component with Pulsing Highlight Effect
const AttentionAnimation = ({ isVisible, duration = 2 }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded bg-green-400 opacity-0 z-0"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{
        scale: [0.85, 1.05, 0.95, 1.02, 1],
        opacity: [0, 0.3, 0.2, 0.1, 0],
      }}
      transition={{
        duration: duration,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: "easeInOut",
        repeat: 1,
      }}
    />
  );
};

// Improved Payment Status Badge Component
const PaymentStatusBadge = ({ status }) => {
  const statusStyles = {
    successful: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };

  const iconStyles = {
    successful: "text-green-500",
    pending: "text-yellow-500",
    failed: "text-red-500",
  };

  const statusIcons = {
    successful: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    pending: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    failed: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      <span className={`mr-1 ${iconStyles[status] || iconStyles.pending}`}>
        {statusIcons[status] || statusIcons.pending}
      </span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MobileApp = () => {
  const [userType, setUserType] = useState("Client");
  const [activeTab, setActiveTab] = useState("home");
  const [fullName, setFullName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [showPulseAnimation, setShowPulseAnimation] = useState(false);
  const [hasInteractedWithSwitch, setHasInteractedWithSwitch] = useState(false);

  const data2 = useSelector((state) => state.user);
  const accessToken = useSelector((state) => state.user.accessToken);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const myUserData = useSelector((state) => state.user.user);
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);
  const pulseTimerRef = useRef(null);

  useVisibility();

  // Enhanced query with proper error handling and retry logic
  const {
    data: transactionData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => fetchTransaction(accessToken),
    enabled: !!accessToken, // Only run when accessToken is available
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 300000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const [notifications, setNotifications] = useState([
    { id: 1, message: "New transaction received", read: false },
    { id: 2, message: "Promotion available", read: false },
    { id: 3, message: "Account update", read: true },
  ]);

  const router = useRouter();
  const pathname = usePathname();

  // Load user interaction state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasInteracted = localStorage.getItem("hasInteractedWithSwitch");
      setHasInteractedWithSwitch(hasInteracted === "true");
    }
  }, []);

  // Function to handle switch interaction
  const handleSwitchInteraction = () => {
    setHasInteractedWithSwitch(true);
    localStorage.setItem("hasInteractedWithSwitch", "true");

    // Hide the animation when user interacts
    setShowPulseAnimation(false);

    // Clear existing timer
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
    }
  };

  // Set up pulse animation timer
  const setupPulseTimer = () => {
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
    }

    // Only show animation if user hasn't interacted with switch
    if (!hasInteractedWithSwitch) {
      setShowPulseAnimation(true);

      // Hide the animation after 3 seconds
      setTimeout(() => {
        setShowPulseAnimation(false);
      }, 3000);
    }

    // Set next timer for 5 minutes (300000 ms)
    pulseTimerRef.current = setTimeout(() => {
      setupPulseTimer();
    }, 300000);
  };

  // Toggle wallet balance visibility
  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  // Extract transactions from data with better error handling
  const recentTransactions = useMemo(() => {
    if (!transactionData?.data?.data) return [];

    // Map API data to our display format
    return transactionData.data.data.map((transaction) => ({
      id: transaction.id || Math.random().toString(),
      title: transaction.title || "Transaction",
      initials:
        transaction.initials ||
        (transaction.title
          ? transaction.title.substring(0, 2).toUpperCase()
          : "TX"),
      date:
        transaction.date ||
        new Date(transaction.createdAt).toLocaleDateString(),
      type: transaction.type || "outgoing",
      amount: transaction.amount || "0.00 ₦",
      paymentStatus: transaction.paymentStatus || "pending", // Add payment status
    }));
  }, [transactionData]);

  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      getErrorMessage(error, router, "", isAuthenticated);
    }
  }, [error, router, isAuthenticated]);

  useEffect(() => {
    if (data2?.user?.user) {
      try {
        setImageUrl(data2.user.user.imageUrl);
        setFullName(data2.user.user.firstName + " " + data2.user.user.lastName);

        // Extract wallet balance
        if (data2.user.user.walletBalance) {
          const walletData = JSON.parse(data2.user.user.walletBalance);
          // Use current balance if available, otherwise use previous
          setWalletBalance(walletData?.current || walletData?.previous || 0);
        }
      } catch (e) {
        console.error("Error parsing wallet balance", e);
      }
    }
  }, [data2.user]);

  useEffect(() => {
    if (typeof window !== "undefined" && pathname) {
      localStorage.setItem("pathname", pathname);
    }

    // Set localStorage "who" here once to prevent re-renders
    localStorage.setItem("who", "client");

    // Setup initial pulse animation timer
    setupPulseTimer();

    // Cleanup function
    return () => {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, [pathname, hasInteractedWithSwitch]);

  // Enhanced carousel data - memoized to prevent re-renders
  const carouselItems = useMemo(
    () => [
      {
        id: 1,
        title: "Special Offer",
        description: "50% off on first transaction",
        image: "test3.png",
        color: "from-amber-400 to-amber-600",
      },
      {
        id: 2,
        title: "New Feature",
        description: "Instant P2P transfers",
        image: "test.png",
        color: "from-amber-500 to-amber-700",
      },
      {
        id: 3,
        title: "Weekend Promotion",
        description: "Earn 2x points this weekend",
        image: "test2.png",
        color: "from-amber-300 to-amber-500",
      },
      {
        id: 4,
        title: "Weekend Promotion",
        description: "Earn 2x points this weekend",
        image: "test2.png",
        color: "from-amber-300 to-amber-500",
      },
    ],
    []
  );

  const EmptyTransactionState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-3 px-4 bg-white rounded-lg shadow-sm"
    >
      <div className="w-16 h-16 mb-4 bg-amber-100 rounded-full flex items-center justify-center">
        <Package2 className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-amber-900 mb-2">
        No Transactions Yet
      </h3>
      <p className="text-amber-600 text-center text-sm mb-6">
        Start your journey by making your first transaction. It is quick and
        easy!
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          handleTabChange("userProfile/fundwallet");
        }}
        className="px-6 py-2 bg-amber-100 text-amber-600 rounded-full font-medium text-sm"
      >
        Fund wallet for easy ordering
      </motion.button>
    </motion.div>
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };

  const moveToMerchant = (path) => {
    if (myUserData?.user?.isNinVerified === false) {
      router.push(`/userProfile/merchantProfile`);
    } else if (myUserData?.user?.isDisplayNameMerchantSet === false) {
      router.push(`/userProfile/merchantProfile/merchantProfile2`);
    } else if (myUserData?.user?.isFaceVerified === false) {
      router.push(`/userProfile/merchantProfile/merchantProfile3`);
    } else if (
      myUserData?.user?.MerchantProfile?.accountStatus === "processing"
    ) {
      router.push(`/userProfile/merchantProfile/merchantProfile4`);
    } else if (
      myUserData?.user?.MerchantProfile?.accountStatus === "rejected"
    ) {
      router.push(`/userProfile/merchantProfile/merchantProfile5`);
    } else if (
      myUserData?.user?.MerchantProfile?.accountStatus === "suspended"
    ) {
      router.push(`/userProfile/merchantProfile/merchantProfile6`);
    } else if (myUserData?.user?.merchantActivated === true) {
      router.push(`/userProfile/merchantProfile/merchantHome`);
    } else {
      router.push(`/userProfile/merchantProfile/merchantHome`);
    }
  };

  useEffect(() => {
    // Prefetch routes for better performance
    router.prefetch("userProfile/merchantProfile/merchantHome");
    router.prefetch("userProfile/merchantProfile");
    router.prefetch("userProfile/merchantProfile/merchantProfile2");
    router.prefetch("userProfile/merchantProfile/merchantProfile3");
    router.prefetch("userProfile/merchantProfile/merchantProfile4");
    router.prefetch("userProfile/merchantProfile/merchantProfile5");
    router.prefetch("userProfile/merchantProfile/merchantProfile6");
    router.prefetch("userProfile/fundwallet");
    router.prefetch("history");
    router.prefetch("p2p");
  }, [router]);

  // Function to manually refresh transactions
  const handleRefreshTransactions = () => {
    refetch();
  };

  // Render transactions section based on loading/error state
  const renderTransactionsSection = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (isError) {
      return (
        <ErrorDisplay
          message={error?.message || "Failed to load transactions"}
        />
      );
    }

    if (recentTransactions.length === 0) {
      return <EmptyTransactionState />;
    }

    return (
      <div className="space-y-3">
        {recentTransactions.map((transaction) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium">
                  {transaction.initials}
                </div>
                <div>
                  <p className="font-medium text-amber-900">
                    {transaction.title}
                  </p>
                  <p className="text-xs text-amber-600">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p
                  className={`font-semibold ${
                    transaction.type === "incoming"
                      ? "text-green-600"
                      : "text-amber-700"
                  }`}
                >
                  {transaction.type === "incoming" ? "+" : "-"}
                  {transaction.amount}
                </p>
                <div className="mt-1">
                  <PaymentStatusBadge status={transaction.paymentStatus} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Manual refresh button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleRefreshTransactions}
            className="flex items-center space-x-1 text-amber-600 text-sm"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
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
        {/* Top Navigation */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                <img
                  onClick={() => {
                    handleTabChange("userProfile");
                  }}
                  src={imageUrl || "/default-avatar.png"} // Fallback image
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/default-avatar.png";
                  }}
                />
              </div>
              <div>
                <p className="text-sm">Welcome</p>
                <p className="font-semibold">{fullName || "User"}</p>
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    handleSwitchInteraction();
                  }}
                  className="flex items-center space-x-1 text-white hover:bg-amber-600 px-3 py-1.5 rounded relative overflow-hidden"
                >
                  {/* Pulse animation effect */}
                  <AttentionAnimation
                    isVisible={showPulseAnimation}
                    duration={2}
                  />

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
                        onClick={() => {
                          setUserType("Merchant");
                          setIsDropdownOpen(false);
                          handleSwitchInteraction();
                          moveToMerchant(
                            "userProfile/merchantProfile/merchantHome"
                          );
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 w-full text-left"
                      >
                        Merchant
                      </button>
                      <button
                        onClick={() => {
                          setUserType("Client");
                          setIsDropdownOpen(false);
                          handleSwitchInteraction();
                        }}
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
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Wallet Balance Card */}
          <div className="px-4 pt-4">
            <WalletBalanceCard
              balance={walletBalance}
              isVisible={isBalanceVisible}
              onToggleVisibility={toggleBalanceVisibility}
            />
          </div>

          {/* Enhanced Carousel */}
          <div className="relative px-4 mb-4">
            <EnhancedCarousel items={carouselItems} />
          </div>

          {/* Transactions */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-amber-900">
                Recent Transactions
              </h2>
              {!isLoading && !isError && recentTransactions.length > 0 && (
                <button
                  onClick={() => router.push("/history")}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  View All
                </button>
              )}
            </div>

            {renderTransactionsSection()}

            {/* Order Button */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-2 px-6 shadow-lg flex items-center justify-center space-x-2 relative overflow-hidden group"
                onClick={() => {
                  handleTabChange("p2p");
                }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <ShoppingBag className="h-6 w-6" />
                <span className="text-lg font-semibold relative z-10">
                  Place New Order
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav handleTabChangeP={handleTabChange} activeTabP={activeTab} />
      </div>
    </ProtectedRoute>
  );
};

export default MobileApp;

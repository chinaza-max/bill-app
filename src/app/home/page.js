"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  ChevronDown,
  Home,
  History,
  Users,
  ShoppingBag,
  Package2,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useAnimation,
} from "framer-motion";
import ProtectedRoute from "../component/protect";

import { useRouter, usePathname } from "next/navigation";
import BottomNav from "../component/bottomNav";
import { useSelector } from "react-redux";
import useVisibility from "../component/useVisibility";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import getErrorMessage from "@/app/component/error";

const fetchTransaction = async (accessToken) => {
  const queryParams = new URLSearchParams({
    limit: 5,
    token: accessToken,
    apiType: "getTransactionHistory",
  }).toString();
  const response = await fetch(`/api/user?${queryParams}`);

  if (!response.ok) throw new Error("Error fetching items");
  return response.json();
};

const EnhancedCarousel = ({ items }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef(null);
  const controls = useAnimation();

  const startInterval = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 3000);
    }
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const nextSlide = () => {
    //setCurrentSlide((currentSlide + 1) % items.length);
    setCurrentSlide((prevSlide) => {
      const newSlide = (prevSlide + 1) % items.length;
      //console.log(`Previous Slide: ${prevSlide}, New Slide: ${newSlide}`);
      return newSlide;
    });
  };

  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;

    // Determine swipe direction based on drag offset and velocity
    if (offset.x < -100 || (velocity.x < -500 && offset.x < 0)) {
      nextSlide();
    } else if (offset.x > 100 || (velocity.x > 500 && offset.x > 0)) {
      setCurrentSlide((currentSlide - 1 + items.length) % items.length);
    }

    // Reset position
    controls.start({ x: 0, transition: { duration: 0.3 } });
  };

  useEffect(() => {
    localStorage.setItem("who", "client");

    startInterval();
    return () => stopInterval();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x: useMotionValue(0) }}
        className="touch-none"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg p-6 shadow-lg relative"
            style={{
              padding: "9px",
              height: "160px",
            }}
          >
            <div
              className="absolute inset-0 bg-center bg-no-repeat bg-contain"
              style={{
                backgroundImage: `url(${items[currentSlide].image})`,
                opacity: 0.3,
                height: "160px",
              }}
            />
            <h4 className="text-lg font-semibold text-white">
              {items[currentSlide].title}
            </h4>
            <p className="text-white/90" style={{ fontSize: "12px" }}>
              {items[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div
          style={{ bottom: "5px" }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2"
        >
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-4" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const MobileApp = () => {
  const [userType, setUserType] = useState("Client");
  const [activeTab, setActiveTab] = useState("home");
  const [fullName, setFullName] = useState();
  const [imageUrl, setImageUrl] = useState();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const data2 = useSelector((state) => state.user);

  const accessToken = useSelector((state) => state.user.accessToken);
  const { data, isLoading, error } = useQuery({
    queryKey: ["items"], // This is now a key in the query object
    queryFn: () => fetchTransaction(accessToken), // Function to fetch data
  });

  useEffect(() => {
    getErrorMessage(error, router);
  }, [error]);

  useEffect(() => {
    if (data2?.user?.user) {
      setImageUrl(data2.user.user.imageUrl);
      setFullName(data2.user.user.firstName + " " + data2.user.user.lastName);
    } else {
      const user = localStorage.getItem("user");
      const userObj = JSON.parse(user);
      console.log(userObj);
      setImageUrl(userObj.imageUrl);
      setFullName(userObj.firstName + " " + userObj.lastName);
    }
  }, [data2.user]);

  useVisibility();

  const [notifications, setNotifications] = useState([
    { id: 1, message: "New transaction received", read: false },
    { id: 2, message: "Promotion available", read: false },
    { id: 3, message: "Account update", read: true },
  ]);
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    console.log("Pathname: ", pathname);
    if (pathname === "/home") {
    }
    if (typeof window !== "undefined") {
      // Ensure localStorage is only used in the browser
      console.log("Pathname: ", pathname);
      if (pathname) {
        localStorage.setItem("pathname", pathname);
      }
    }
  }, []);

  const recentTransactions = [];

  /*
  const recentTransactions = [
    {
      id: 1,
      title: "Received Payment",
      initials: "RP",
      date: "2024-11-05",
      type: "incoming",
      amount: "5000.00 ₦",
    },
    {
      id: 2,
      title: "Sent Payment",
      initials: "SP",
      date: "2024-11-04",
      type: "outgoing",
      amount: "2000.00 ₦",
    },
    {
      id: 3,
      title: "Purchase at Store",
      initials: "PS",
      date: "2024-11-03",
      type: "outgoing",
      amount: "3500.00 ₦",
    },
  ];*/

  // Enhanced carousel data
  const carouselItems = [
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
  ];

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

      <div className="transaction-container p-4 rounded-md shadow-sm">
        {isLoading ? (
          "Loading transaction....."
        ) : (
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            No Transactions Yet
          </h3>
        )}
      </div>
      <p className="text-amber-600 text-center text-sm mb-6">
        Start your journey by making your first transaction. It is quick and
        easy!
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          handleTabChange("p2p");
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
    const user = localStorage.getItem("user");
    const userObj = JSON.parse(user);
    console.log(userObj);
    if (userObj.merchantActivated === true) {
      router.push(`/${path}`);
    } else {
      router.push(`/userProfile/merchantProfile`);
    }
  };

  useEffect(() => {
    router.prefetch("userProfile/merchantProfile/merchantHome");
    router.prefetch("userProfile/merchantProfile");
  }, [router]);

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
                  src={imageUrl}
                  alt={"avatar"}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <p className="text-sm">...</p>
                <p className="font-semibold">{fullName}</p>
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
                  className="flex items-center space-x-1 text-white hover:bg-amber-600 px-2 py-1 rounded"
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
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 w-full text-left"
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
          {/* Enhanced Carousel */}
          <div className="relative p-4">
            <EnhancedCarousel items={carouselItems} />
          </div>

          {/* Transactions */}
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3 text-amber-900">
              Recent Transactions
            </h2>
            {recentTransactions.length === 0 ? (
              <EmptyTransactionState />
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium">
                          {transaction.initials}
                        </div>
                        <div>
                          <p className="font-medium text-amber-900">
                            {transaction.title}
                          </p>
                          <p className="text-sm text-amber-600">
                            {transaction.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

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

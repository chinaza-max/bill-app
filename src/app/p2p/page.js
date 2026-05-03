"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../component/bottomNav";
import ProtectedRoute from "@/app/component/protect";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import getErrorMessage from "@/app/component/error";
import { useLocationService } from "@/hooks/locationService";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Circle,
  Check,
  MapPin,
  AlertTriangle,
  Frown,
  Send,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fetchMerchant = async (accessToken, router) => {
  if (!accessToken) return { data: [] };

  const queryParams = new URLSearchParams({
    token: accessToken,
    apiType: "getMatchMerchant",
  }).toString();

  try {
    const response = await fetch(`/api/user?${queryParams}`);
    if (!response.ok) {
      const errorResponse = await response.json();
      getErrorMessage(errorResponse, router, "");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching merchants:", error);
    throw error;
  }
};

const P2PPage = () => {
  const [activeTab, setActiveTab] = useState("p2p");
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaint, setComplaint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [dataDisplayed, setDataDisplayed] = useState(false);
  const [filters, setFilters] = useState({
    accuracy: "",
    distance: "",
    amount: "",
    preference: "",
  });
  const [openFilter, setOpenFilter] = useState("");
  const [showOfferDetails, setShowOfferDetails] = useState(null);

  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);
  const userId = useSelector((state) => state.user.userId);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  const { isLocationEnabled, locationPermission, LocationPrompt } =
    useLocationService();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };

  const filterOptions = {
    accuracy: [
      { label: "Any", value: "" },
      { label: "90% and above", value: "90" },
      { label: "95% and above", value: "95" },
      { label: "98% and above", value: "98" },
    ],
    distance: [
      { label: "Any", value: "" },
      { label: "Within 1km", value: "1" },
      { label: "Within 5km", value: "5" },
      { label: "Within 10km", value: "10" },
    ],
    amount: [
      { label: "Any", value: "" },
      { label: "₦1,000 - ₦5,000", value: "1-5" },
      { label: "₦5,001 - ₦10,000", value: "5-10" },
    ],
    preference: [
      { label: "Any", value: "" },
      { label: "Fastest", value: "fastest" },
      { label: "Lowest Charge", value: "lowest-charge" },
      { label: "Highest Accuracy", value: "highest-accuracy" },
    ],
  };

  const handleFilterClick = (filterName) => {
    setOpenFilter(openFilter === filterName ? "" : filterName);
  };

  const handleFilterSelect = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setOpenFilter("");
  };

  const handleOfferDetailsToggle = (offer) => {
    setShowOfferDetails(showOfferDetails === offer.id ? null : offer.id);
  };

  const handleTransferClick = (merchantId, merchantName) => {
    try {
      localStorage.setItem("selectedMerchantId", merchantId);
      localStorage.setItem("selectedMerchantName", merchantName || "Unknown Merchant");
      handleTabChange("p2p/transfer");
    } catch (error) {
      console.error("Failed to store merchant ID:", error);
      handleTabChange("p2p/transfer");
    }
  };

  // Stable handlers with useCallback so the textarea never loses focus / remounts
  const handleComplaintChange = useCallback((e) => {
    setComplaint(e.target.value);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!isSubmitting) {
      setShowComplaintForm(false);
      setComplaint("");
      setComplaintSubmitted(false);
    }
  }, [isSubmitting]);

  const handleComplaintSubmit = useCallback(async () => {
    if (!complaint.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          apiType: "complaintType",
          userId,
          title: "No merchant available",
          message: complaint,
          complaintType: "service",
        }),
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setComplaintSubmitted(true);
      setComplaint("");
      setTimeout(() => {
        setShowComplaintForm(false);
        setComplaintSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to submit complaint:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [complaint, accessToken, userId]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["merchants", accessToken],
    queryFn: () => fetchMerchant(accessToken, router),
    enabled: !!accessToken && !!isAuthenticated,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 60000,
    cacheTime: 300000,
    onSuccess: () => setDataDisplayed(true),
    onError: () => setDataDisplayed(false),
  });

  useEffect(() => {
    if (data && !dataDisplayed && !isLoading) setDataDisplayed(true);
  }, [data, dataDisplayed, isLoading]);

  const filteredOffers = React.useMemo(() => {
    if (!data?.data?.data || !Array.isArray(data.data.data)) return [];

    return data.data.data.filter((offer) => {
      if (!offer) return false;
      const { accuracy, distance, amount, preference } = filters;

      let minFilterAmount = 0;
      let maxFilterAmount = Infinity;
      if (amount) {
        const [min, max] = amount.split("-");
        minFilterAmount = parseFloat(min) * 1000;
        maxFilterAmount = parseFloat(max) * 1000;
      }

      const offerAccuracy = offer.accuracy ?? 0;
      const offerDistance = offer.distance ?? Infinity;
      const minAmount = offer.priceRanges?.minAmount ?? 0;
      const maxAmount = offer.priceRanges?.maxAmount ?? 0;

      return (
        (!accuracy || offerAccuracy >= parseFloat(accuracy)) &&
        (!distance || offerDistance <= parseFloat(distance)) &&
        (!amount || (minAmount <= maxFilterAmount && maxAmount >= minFilterAmount)) &&
        (!preference ||
          preference === "fastest" ||
          preference === "lowest-charge" ||
          preference === "highest-accuracy")
      );
    });
  }, [data, filters]);

  const tokenMissing = isAuthenticated && !accessToken;
  const hasMerchants =
    data?.data?.data && Array.isArray(data.data.data) && data.data.data.length > 0;

  const FilterDropdown = ({ name, label, options }) => (
    <div className="relative">
      <button
        onClick={() => handleFilterClick(name)}
        className={`w-full px-3 py-2 text-sm bg-white rounded-lg shadow-sm border ${
          openFilter === name ? "border-amber-500" : "border-amber-200"
        } flex items-center justify-between`}
      >
        <span className="text-amber-900">
          {filters[name]
            ? options.find((opt) => opt.value === filters[name])?.label
            : label}
        </span>
        {openFilter === name ? (
          <ChevronUp className="h-4 w-4 text-amber-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-500" />
        )}
      </button>
      <AnimatePresence>
        {openFilter === name && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-amber-100 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterSelect(name, option.value)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50 flex items-center justify-between"
              >
                <span className="text-amber-900">{option.label}</span>
                {filters[name] === option.value && (
                  <Check className="h-4 w-4 text-amber-500" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => handleTabChange("home")}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">P2P Trading</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-10 bg-amber-50 px-4 py-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <FilterDropdown name="accuracy" label="Accuracy %" options={filterOptions.accuracy} />
            <FilterDropdown name="distance" label="Distance (km)" options={filterOptions.distance} />
            <FilterDropdown name="amount" label="Amount Range" options={filterOptions.amount} />
            <FilterDropdown name="preference" label="Preference" options={filterOptions.preference} />
          </div>
        </div>

        {/* Offers List */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1.5, 1.2, 1], opacity: [0.8, 0.5, 0.2, 0.5, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-amber-200 rounded-full w-16 h-16"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1.2, 1.5, 1.8, 1.5, 1.2], opacity: [0.6, 0.3, 0.1, 0.3, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className="bg-amber-300 rounded-full w-20 h-20"
                  />
                </div>
                <div className="bg-amber-500 rounded-full p-4 mb-4 w-16 h-16 z-10 relative flex items-center justify-center">
                  <Search className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-amber-900 mb-2 mt-4">Searching for Merchants</h3>
              <p className="text-amber-600 mb-6 max-w-xs">Please wait while we find the best merchants for you...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-red-50 rounded-full p-4 mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-6 max-w-xs">We encountered an error while fetching merchants. Please try again.</p>
              <button onClick={refetch} className="bg-amber-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">
                Try Again
              </button>
            </div>
          ) : tokenMissing ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-red-50 rounded-full p-4 mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-2">Session expired</h3>
              <p className="text-red-600 mb-6 max-w-xs">Authentication token is missing. Please sign in again.</p>
              <button onClick={() => router.push("/login")} className="bg-amber-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">
                Sign In
              </button>
            </div>
          ) : !hasMerchants ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-amber-50 rounded-full p-4 mb-4">
                <Frown className="h-12 w-12 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium text-amber-900 mb-2">No P2P Merchants Found</h3>
              <p className="text-amber-600 mb-6 max-w-xs">
                We could not find any merchants matching your criteria. Try adjusting your filters or check back later.
              </p>
              <button
                onClick={() => setShowComplaintForm(true)}
                className="bg-amber-100 text-amber-700 font-medium py-2 px-5 rounded-lg hover:bg-amber-200 transition-colors"
              >
                File a Complaint
              </button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="bg-amber-50 p-6 rounded-lg text-center">
              <div className="bg-amber-50 rounded-full p-4 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                <Frown className="h-12 w-12 text-amber-500" />
              </div>
              <p className="text-amber-600 mb-4">No merchants found matching your filters.</p>
              <button
                onClick={() => setFilters({ accuracy: "", distance: "", amount: "", preference: "" })}
                className="bg-amber-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOffers.map((offer) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium overflow-hidden">
                          {offer.avatar ? (
                            <img
                              src={offer.avatar}
                              alt={offer.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23B45309' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <span>{offer.name?.charAt(0) || "?"}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {offer.online ? (
                            <Circle className="h-4 w-4 fill-green-500 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 fill-gray-300 text-gray-300" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-amber-900">
                            {offer.name || "Unknown Merchant"}
                          </h3>
                          {offer.badge && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full">
                              {offer.badge}
                            </span>
                          )}
                          {!offer.online && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                              Offline
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-amber-600">
                          <span>{offer.numberOfOrder || 0} orders</span>
                          <span>•</span>
                          <span>{(offer.accuracy || 0).toFixed(1)}% accuracy</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-1">
                      <div className="text-sm text-amber-600">Range</div>
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-amber-900">
                          ₦{(offer.priceRanges?.minAmount || 0).toLocaleString()} - ₦
                          {(offer.priceRanges?.maxAmount || 0).toLocaleString()}
                        </div>
                        <button
                          onClick={() => handleOfferDetailsToggle(offer)}
                          className="text-amber-600 hover:text-amber-900 transition-colors"
                        >
                          {showOfferDetails === offer.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-amber-600">
                      <MapPin className="h-5 w-5" />
                      <span>
                        {typeof offer.distance === "number"
                          ? `${offer.distance.toFixed(1)} m away`
                          : "Distance unavailable"}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showOfferDetails === offer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-3"
                      >
                        <div className="bg-white rounded-lg shadow-lg p-4">
                          <div className="font-semibold text-amber-900 mb-3">Offer Range Details</div>
                          <div className="bg-amber-50 rounded-lg p-4 space-y-3">
                            {offer.priceRanges?.pricePerThousand?.length > 0 ? (
                              [...offer.priceRanges.pricePerThousand]
                                .sort((a, b) => (a.amount || 0) - (b.amount || 0))
                                .map((range, index, arr) => {
                                  const current = range.amount || 0;
                                  const charge = range.charge || 0;
                                  const next = arr[index + 1]?.amount;
                                  const label =
                                    index === arr.length - 1
                                      ? `₦${current.toLocaleString()}+`
                                      : `₦${current.toLocaleString()} - ₦${(next - 1).toLocaleString()}`;
                                  return (
                                    <div key={index} className="border-b border-amber-100 pb-2 last:border-b-0">
                                      <div className="flex justify-between">
                                        <div>
                                          <div className="text-sm text-amber-600">Amount Range</div>
                                          <div className="font-medium text-amber-900">{label}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-amber-600">Charge</div>
                                          <div className="font-medium text-amber-900">₦{charge}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                            ) : (
                              <div className="text-amber-600">No price details available</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTransferClick(offer.id, offer.name)}
                    className="w-full rounded-lg py-2 px-4 font-medium transition-colors bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Transfer
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom Sheet Complaint Modal ── */}
        <AnimatePresence>
          {showComplaintForm && (
            <>
              {/* Backdrop */}
              <motion.div
                key="complaint-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/50"
                onClick={handleCloseModal}
              />

              {/* Sheet — slides up from bottom, never remounts while open */}
              <motion.div
                key="complaint-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-amber-200 rounded-full" />
                </div>

                <div className="px-5 pb-8 pt-3">
                  {complaintSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center py-6 text-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                        <Check className="h-7 w-7 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-amber-900 mb-1">Message sent!</h3>
                      <p className="text-amber-600 text-sm">We will look into this and get back to you.</p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-semibold text-amber-900">File a Complaint</h2>
                          <p className="text-xs text-amber-500 mt-0.5">No merchants available? Let us know.</p>
                        </div>
                        <button
                          onClick={handleCloseModal}
                          className="p-1.5 rounded-full bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/*
                        Textarea is a direct child of the stable sheet —
                        no wrapper component that could remount on state change.
                        handleComplaintChange is memoised with useCallback so it
                        never triggers a re-render of this node.
                      */}
                      <textarea
                        value={complaint}
                        onChange={handleComplaintChange}
                        placeholder="Describe your issue..."
                        rows={5}
                        className="w-full p-3 rounded-xl text-sm text-amber-900 placeholder-amber-300 bg-amber-50 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
                      />

                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          disabled={isSubmitting}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleComplaintSubmit}
                          disabled={isSubmitting || !complaint.trim()}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Sending…</span>
                            </>
                          ) : (
                            <>
                              <span>Send</span>
                              <Send className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <BottomNav handleTabChangeP={handleTabChange} activeTabP={activeTab} />
      </div>
    </ProtectedRoute>
  );
};

export default P2PPage;
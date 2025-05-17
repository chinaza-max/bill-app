"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import getErrorMessage from "@/app/component/error";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Wallet,
  ExternalLink,
  CreditCard,
  Copy,
  Store,
  ShoppingBag,
  Save,
} from "lucide-react";
import ProtectedRoute from "@/app/component/protect";

import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SettingsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useSelector((state) => state.user.accessToken);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const myUserData = useSelector((state) => state.user.user);

  const [activeSection, setActiveSection] = useState("");
  const [currentTier, setCurrentTier] = useState("tier1");
  const [deliveryDistance, setDeliveryDistance] = useState(10);
  const [isAvailable, setIsAvailable] = useState(true);
  const [hasWithdrawalAccount, setHasWithdrawalAccount] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check if user has bank details
  useEffect(() => {
    if (
      myUserData &&
      myUserData.user.bankName !== null &&
      myUserData.user.settlementAccount !== null
    ) {
      setHasWithdrawalAccount(true);

      setAccountDetails({
        bankName: myUserData.user.bankName || "",
        accountNumber: myUserData.user.settlementAccount || "",
        accountName: myUserData.user.firstName + " " + myUserData.user.lastName,
      });
    } else {
      setHasWithdrawalAccount(false);
    }
  }, [myUserData]);

  // Fetch merchant profile data
  const {
    data: merchantData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["merchantProfile", accessToken],
    queryFn: async () => {
      if (!accessToken) return null;

      const queryParams = new URLSearchParams({
        token: accessToken,
        apiType: "getMerchantProfile",
      }).toString();

      const response = await fetch(`/api/user?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch merchant profile");
      }
      return response.json();
    },
    enabled: !!accessToken && isAuthenticated,
  });

  // Set initial values from API data
  useEffect(() => {
    if (merchantData) {
      setDeliveryDistance(merchantData.data.data.deliveryRange || 10);
      setIsAvailable(merchantData.data.data.accountStatus === "active");
    }
  }, [merchantData]);

  // Mutation for updating merchant availability status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, token }) => {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: token,
          apiType: "updateMerchantProfileWithoutFile",
          accountStatus: status ? "active" : "notActive",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.log(data);
        //getErrorMessage(data, router, "", isAuthenticated);

        throw new Error("Failed to update merchant status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["merchantProfile"]);
    },
  });

  // Mutation for updating delivery distance
  const updateDistanceMutation = useMutation({
    mutationFn: async ({ distance, token }) => {
      setIsSaving(true);
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: token,
          apiType: "updateMerchantProfileWithoutFile",
          deliveryRange: distance,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update delivery distance");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["merchantProfile"]);
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
    },
  });

  useEffect(() => {}, [accessToken]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleGoBack = () => {
    router.push("/userProfile/merchantProfile/merchantHome");
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? "" : section);
  };

  const handleSetupWithdrawalAccount = () => {
    router.push(
      "/userProfile/merchantProfile/merchantHome/settings/settingUpAccount"
    );
  };

  const handleNavigateToWithdrawal = () => {
    router.push(
      "/userProfile/merchantProfile/merchantHome/settings/Withdrawal"
    );
  };

  const handleViewAds = () => {
    router.push("/userProfile/merchantProfile/merchantHome/viewAds");
  };

  const handleToggleAvailability = () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    updateStatusMutation.mutate({ status: newStatus, token: accessToken });
  };

  useEffect(() => {
    router.prefetch(
      "userProfile/merchantProfile/merchantHome/settings/Withdrawal"
    );
    router.prefetch(
      "userProfile/merchantProfile/merchantHome/settings/settingUpAccount"
    );
  }, [router]);

  const handleSaveDistance = () => {
    updateDistanceMutation.mutate({
      distance: deliveryDistance,
      token: accessToken,
    });
  };

  if (isLoading && !merchantData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-6 items-center justify-center">
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={handleGoBack}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Merchant Settings</h1>
          </div>
        </div>
        <div className="mt-16">Loading merchant profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-6">
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={handleGoBack}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Merchant Settings</h1>
          </div>
        </div>
        <div className="mt-16 px-4">
          <Alert className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load merchant profile. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50 pb-6">
        {/* Top Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={handleGoBack}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Merchant Settings</h1>
          </div>
        </div>

        {/* View Ads Button Section */}
        <div className="px-4 mt-16 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    My Advertisements
                  </h3>
                  <p className="text-sm text-gray-600">
                    View and manage your product listings
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleViewAds}
              className="w-full py-2 px-4 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>View My Ads</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Availability Toggle Section */}
        <div className="px-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Store
                  className={`h-5 w-5 ${
                    isAvailable ? "text-green-500" : "text-gray-400"
                  }`}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Merchant Availability
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isAvailable
                      ? "You are currently accepting orders"
                      : "You are not accepting orders"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleAvailability}
                disabled={updateStatusMutation.isLoading}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none"
                style={{
                  backgroundColor: isAvailable ? "#10B981" : "#D1D5DB",
                }}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    isAvailable ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div
              className={`mt-2 text-sm ${
                isAvailable ? "text-green-600" : "text-gray-500"
              }`}
            >
              {updateStatusMutation.isLoading
                ? "Updating your availability status..."
                : isAvailable
                ? "Customers can currently place orders with you"
                : "Customers cannot place orders with you while you are unavailable"}
            </div>
            {updateStatusMutation.isError && (
              <div className="mt-2 text-sm text-red-600">
                Failed to update availability. Please try again.
              </div>
            )}
          </div>
        </div>

        {/* Delivery Distance Section */}
        <div className="px-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-gray-900">
                  Delivery Range
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-3">
              <input
                type="number"
                value={deliveryDistance}
                onChange={(e) =>
                  setDeliveryDistance(parseFloat(e.target.value))
                }
                className="flex-1 px-3 py-2 border rounded-lg"
                min="1"
                max="50"
              />
              <span className="text-amber-600">km</span>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Maximum distance you are willing to travel for cash delivery
            </p>

            <button
              onClick={handleSaveDistance}
              disabled={updateDistanceMutation.isLoading}
              className={`w-full py-2 px-4 rounded-lg ${
                updateDistanceMutation.isLoading
                  ? "bg-amber-300 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600"
              } text-white font-medium transition-colors flex items-center justify-center space-x-2`}
            >
              {updateDistanceMutation.isLoading ? (
                <>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Distance</span>
                </>
              )}
            </button>

            {updateDistanceMutation.isError && (
              <div className="mt-2 text-sm text-red-600">
                Failed to update delivery distance. Please try again.
              </div>
            )}

            {updateDistanceMutation.isSuccess && (
              <div className="mt-2 text-sm text-green-600">
                Delivery distance updated successfully!
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Account Section */}
        <div className="px-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-gray-900">
                  Withdrawal Account
                </span>
              </div>
            </div>

            {!hasWithdrawalAccount ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Set up your withdrawal account to receive payments
                </p>
                <button
                  onClick={handleSetupWithdrawalAccount}
                  className="w-full py-2 px-4 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Set Up Withdrawal Account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Account Details */}
                <div className="space-y-3 bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-900">Bank Name</span>
                    <span className="font-medium text-amber-900">
                      {accountDetails.bankName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-900">
                      Account Number
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-amber-900">
                        {accountDetails.accountNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-900">Account Name</span>
                    <span className="font-medium text-amber-900">
                      {accountDetails.accountName}
                    </span>
                  </div>
                </div>

                {/* Status and Navigation */}
                <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-green-900">Account Connected</span>
                  </div>
                </div>

                <button
                  onClick={handleSetupWithdrawalAccount}
                  className="w-full py-2 px-4 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Change Withdrawal Account</span>
                </button>

                <button
                  onClick={handleNavigateToWithdrawal}
                  className="w-full py-2 px-4 rounded-lg bg-amber-100 text-amber-700 font-medium hover:bg-amber-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Wallet className="h-5 w-5" />
                  <span>Go to Withdrawals</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;

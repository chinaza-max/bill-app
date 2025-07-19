"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Building2,
  Wallet,
  Eye,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import useRequest from "@/hooks/useRequest"; // Import the custom hook

// Function to fetch merchant information
const fetchMerchantInformation = async (accessToken, router) => {
  if (!accessToken) {
    return { data: null };
  }

  const selectedMerchantId = localStorage.getItem("selectedMerchantId");
  if (!selectedMerchantId) {
    console.error("No selected merchant ID found");
    return { data: null };
  }

  try {
    const response = await fetch(`/api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId2: selectedMerchantId,
        accessToken: accessToken,
        apiType: "getMerchantInformation",
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Error response:", errorResponse);
      throw new Error(
        `Error fetching merchant information: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Merchant information received:", data);
    return data;
  } catch (error) {
    console.error("Error fetching merchant information:", error);
    throw error;
  }
};

// Function to fetch charge summary
const fetchChargeSummary = async (accessToken, amount, router) => {
  if (!accessToken) {
    return { data: null };
  }

  const selectedMerchantId = localStorage.getItem("selectedMerchantId");
  if (!selectedMerchantId) {
    console.error("No selected merchant ID found");
    return { data: null };
  }

  try {
    const response = await fetch(`/api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        apiType: "getChargeSummary",
        amount: Number(amount),
        userId2: selectedMerchantId,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Error response:", errorResponse);
      throw new Error(`Error fetching charge summary: ${response.status}`);
    }

    const data = await response.json();
    console.log("Charge summary received:", data);
    return data;
  } catch (error) {
    console.error("Error fetching charge summary:", error);
    throw error;
  }
};

// Function to make order payment
const makeOrderPayment = async (
  accessToken,
  userId,
  userId2,
  amount,
  amountOrder
) => {
  try {
    const response = await fetch(`/api/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken,
        apiType: "makeOrderPayment",
        userId,
        userId2,
        amount,
        amountOrder,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Error response:", errorResponse);
      return errorResponse;
    }

    const data = await response.json();
    console.log("Payment response:", data);
    return data;
  } catch (error) {
    console.error("Error making payment:", error);
    throw error;
  }
};

const TransferPage = () => {
  const [amount, setAmount] = useState("");
  const [transferType, setTransferType] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState("start");
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [chargeData, setChargeData] = useState(null);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);
  const contentRef = useRef(null);
  const sliderControls = useAnimation();
  const SLIDER_THRESHOLD = 0.5;
  const SLIDER_WIDTH = 300;
  const router = useRouter();

  // Initialize the custom hook
  const {
    data: accountData,
    error: accountError,
    loading: accountLoading,
    request: generateAccount,
    errorDetail: accountErrorDetail,
  } = useRequest();

  const accessToken = useSelector((state) => state.user.accessToken);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const myUserData = useSelector((state) => state.user.user);

  function safeParse(input) {
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch (e) {
        console.error("Failed to parse:", e);
        return {};
      }
    }

    console.log(input);
    return input || {};
  }
  // Extract wallet balance from myUserData
  useEffect(() => {
    if (myUserData?.user?.walletBalance) {
      try {
        const balanceData = safeParse(myUserData.user.walletBalance);

        setWalletBalance(balanceData.current || 0);
        console.log("Wallet balance extracted:", balanceData.current);
      } catch (error) {
        console.error("Error parsing wallet balance:", error);
        setWalletBalance(0);
      }
    }
  }, [myUserData]);

  useEffect(() => {
    router.prefetch("orders");
  });

  // Fetch merchant information
  const {
    data: merchantData,
    isLoading: isMerchantLoading,
    error: merchantError,
  } = useQuery({
    queryKey: ["merchantInformation", accessToken],
    queryFn: () => fetchMerchantInformation(accessToken, router),
    enabled:
      !!accessToken &&
      !!isAuthenticated &&
      !!localStorage.getItem("selectedMerchantId"),
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 60000,
    cacheTime: 300000,
  });

  const merchantInfo = merchantData?.data?.data || null;

  const range = merchantInfo
    ? {
        min: merchantInfo.minAmount || 1000,
        max: merchantInfo.maxAmount || 5000,
      }
    : { min: 0, max: 0 };

  const merchant = merchantInfo
    ? merchantInfo.displayName || "Unknown"
    : "Loading...";

  // Fetch charge summary when amount is valid
  const {
    data: chargeSummaryData,
    isLoading: isChargeSummaryLoading,
    refetch: refetchChargeSummary,
  } = useQuery({
    queryKey: ["chargeSummary", accessToken, amount],
    queryFn: () => fetchChargeSummary(accessToken, amount, router),
    enabled: false,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (chargeSummaryData?.data?.data) {
      console.log("Charge summary data received:", chargeSummaryData.data.data);
      setChargeData(chargeSummaryData.data.data);
    }
  }, [chargeSummaryData]);

  // Handle account generation response
  useEffect(() => {
    if (accountData?.data) {
      console.log(accountData?.data.data);
      setVirtualAccount(accountData.data.data);
      setIsGeneratingAccount(false);
    }
  }, [accountData]);

  // Handle account generation error
  useEffect(() => {
    if (accountError) {
      setIsGeneratingAccount(false);
      setPaymentError(accountErrorDetail || accountError);
    }
  }, [accountError, accountErrorDetail]);

  const isValidAmount = (value) => {
    const numValue = parseFloat(value);
    return numValue >= range.min && numValue <= range.max;
  };

  // Calculate the amount to pay based on transfer type
  const getAmountToPay = () => {
    if (!chargeData) return 0;

    if (transferType === "wallet") {
      // For wallet transfer: exclude gateway fee
      return chargeData.totalAmount - (chargeData.gatewayCharge || 0);
    } else {
      // For direct transfer: include all fees
      return chargeData.totalAmount;
    }
  };

  // Check if wallet has sufficient balance
  const hasSufficientBalance = () => {
    if (!chargeData || !walletBalance) return false;
    const amountNeeded = getAmountToPay();
    return walletBalance >= amountNeeded;
  };

  const handleTabChange = (tab) => {
    router.push(`/${tab}`);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
    setChargeData(null);
    setShowFeeBreakdown(false);
    setPaymentError(null);
    setVirtualAccount(null); // Reset virtual account when amount changes
  };

  // Fetch charge summary when amount is valid
  useEffect(() => {
    if (amount && isValidAmount(amount) && accessToken) {
      refetchChargeSummary();
    }
  }, [amount, accessToken, refetchChargeSummary]);

  const handleViewOrder = () => {
    router.push("/orders");
  };

  const handleCopyAccountNumber = async (accountNumber) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy account number:", err);
    }
  };

  // Generate virtual account for direct transfer
  const handleGenerateAccount = async () => {
    if (!accessToken || !amount || !chargeData) return;

    setIsGeneratingAccount(true);
    setPaymentError(null);

    const selectedMerchantId = localStorage.getItem("selectedMerchantId");

    try {
      await generateAccount("/api/user", "POST", {
        accessToken,
        apiType: "generateAccountVirtual",
        type: "order",
        userId2: selectedMerchantId,
        amount: getAmountToPay(),
      });
    } catch (error) {
      console.error("Error generating account:", error);
      setIsGeneratingAccount(false);
      setPaymentError("Failed to generate account. Please try again.");
    }
  };

  useEffect(() => {
    if (transferType && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [transferType]);

  const handleSliderDrag = (_, info) => {
    setIsDragging(true);
    sliderControls.set({ x: info.offset.x });
  };

  const handlePaymentProcess = async () => {
    if (transferType === "wallet" && chargeData) {
      if (!hasSufficientBalance()) {
        const amountNeeded = getAmountToPay();
        setPaymentError(
          `Insufficient wallet balance. You need ₦${amountNeeded.toLocaleString()} but only have ₦${walletBalance.toLocaleString()}`
        );
        return false;
      }

      setIsProcessingPayment(true);
      setPaymentError(null);

      try {
        const selectedMerchantId = localStorage.getItem("selectedMerchantId");
        const userId = myUserData?.user?.id || myUserData?.user?.userId;

        const paymentResponse = await makeOrderPayment(
          accessToken,
          userId,
          selectedMerchantId,
          getAmountToPay(), // Amount to deduct from wallet (excluding gateway fee)
          Number(amount) // Ordered amount
        );

        if (paymentResponse?.success || paymentResponse?.data) {
          console.log("Payment successful:", paymentResponse);
          return true;
        } else {
          setPaymentError(
            paymentResponse.details || "Payment failed. Please try again."
          );
          return false;
        }
      } catch (error) {
        console.error("Payment error:", error);
        setPaymentError("Payment failed. Please try again.");
        return false;
      } finally {
        setIsProcessingPayment(false);
      }
    }

    return true;
  };

  const handleDragEnd = async (_, info) => {
    setIsDragging(false);
    const progress = info.offset.x / SLIDER_WIDTH;

    if (progress >= SLIDER_THRESHOLD) {
      const paymentSuccess = await handlePaymentProcess();

      if (paymentSuccess) {
        sliderControls.start({
          x: SLIDER_WIDTH,
          transition: { duration: 0.2, ease: "easeOut" },
        });
        setSliderPosition("end");
        setShowSuccessModal(true);
      } else {
        sliderControls.start({
          x: 0,
          transition: { duration: 0.2, ease: "easeOut" },
        });
        setSliderPosition("start");
      }
    } else {
      sliderControls.start({
        x: 0,
        transition: { duration: 0.2, ease: "easeOut" },
      });
      setSliderPosition("start");
    }
  };

  useEffect(() => {
    sliderControls.start({ x: 0 });
    setSliderPosition("start");
  }, [transferType, sliderControls]);

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-amber-50">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3 z-10">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => handleTabChange("p2p")}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Transfer</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-6 pb-24 space-y-6 overflow-y-auto mt-14">
          {/* Loading State */}
          {isMerchantLoading && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-amber-600 text-center">
                Loading merchant information...
              </div>
            </div>
          )}

          {/* Error State */}
          {merchantError && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-red-600 text-center">
                Error loading merchant information. Please try again.
              </div>
            </div>
          )}

          {/* Wallet Balance Display */}
          {!isMerchantLoading && walletBalance > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-amber-600 mb-2">
                Your Wallet Balance
              </div>
              <div className="text-xl font-bold text-green-600">
                ₦{walletBalance.toLocaleString()}
              </div>
            </div>
          )}

          {/* Range Display */}
          {!isMerchantLoading && merchantInfo && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-amber-600 mb-2">Available Range</div>
              <div className="text-xl font-bold text-amber-900">
                ₦{range.min.toLocaleString()} - ₦{range.max.toLocaleString()}
              </div>
              <div className="text-sm text-amber-600 mt-2">
                Merchant: {merchant}
              </div>
            </div>
          )}

          {/* Amount Input */}
          {!isMerchantLoading && merchantInfo && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-amber-600 mb-2">Enter Amount</div>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount"
                className="w-full px-4 py-3 text-lg border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {amount && !isValidAmount(amount) && (
                <div className="mt-2 text-red-500 text-sm">
                  Amount must be between ₦{range.min.toLocaleString()} and ₦
                  {range.max.toLocaleString()}
                </div>
              )}
              {isChargeSummaryLoading && amount && isValidAmount(amount) && (
                <div className="mt-2 text-amber-600 text-sm">
                  Loading charge summary...
                </div>
              )}

              {/* Enhanced Charge Display with Transfer Type Awareness */}
              {chargeData && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-amber-800 text-base font-semibold">
                      {transferType === "wallet"
                        ? "Wallet deduction:"
                        : "You will pay:"}
                    </div>
                    <div className="text-amber-800 text-base font-semibold">
                      ₦{getAmountToPay().toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-amber-600">
                    <div>Amount:</div>
                    <div>₦{Number(amount).toLocaleString()}</div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-amber-600">
                    <div className="flex items-center">
                      <span>Service fee:</span>
                    </div>
                    <div>
                      ₦{chargeData.serviceCharge?.toLocaleString() || "0"}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-amber-600">
                    <div>Merchant fee:</div>
                    <div>
                      ₦{chargeData.merchantCharge?.toLocaleString() || "0"}
                    </div>
                  </div>

                  {transferType === "direct" && (
                    <div className="flex justify-between items-center text-sm text-amber-600">
                      <div>Gateway fee:</div>
                      <div>
                        ₦{chargeData.gatewayCharge?.toLocaleString() || "0"}
                      </div>
                    </div>
                  )}

                  {transferType === "wallet" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                      <div className="text-xs text-green-700 font-medium mb-1">
                        💡 Wallet Transfer Benefit
                      </div>
                      <div className="text-xs text-green-600">
                        Gateway fee (₦
                        {chargeData.gatewayCharge?.toLocaleString() || "0"}) is
                        waived for wallet transfers!
                      </div>
                    </div>
                  )}

                  <div className="pt-2 mt-1 border-t border-amber-100">
                    <div className="flex justify-between items-center text-xs text-green-600">
                      <div>Estimated delivery:</div>
                      <div>Instant</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transfer Type Selection */}
          {amount && isValidAmount(amount) && chargeData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-sm text-amber-600">Select Transfer Type</div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTransferType("direct")}
                  className={`p-4 rounded-lg border ${
                    transferType === "direct"
                      ? "border-amber-500 bg-amber-50"
                      : "border-amber-200 bg-white"
                  } flex flex-col items-center space-y-2`}
                >
                  <Building2 className="h-6 w-6 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">
                    Direct Transfer
                  </span>
                  <span className="text-xs text-amber-600 text-center">
                    Pay ₦{chargeData.totalAmount.toLocaleString()}
                  </span>
                </button>

                <button
                  onClick={() => setTransferType("wallet")}
                  className={`p-4 rounded-lg border ${
                    transferType === "wallet"
                      ? "border-amber-500 bg-amber-50"
                      : "border-amber-200 bg-white"
                  } flex flex-col items-center space-y-2 ${
                    !hasSufficientBalance() && chargeData ? "opacity-50" : ""
                  }`}
                  disabled={!hasSufficientBalance() && chargeData}
                >
                  <Wallet className="h-6 w-6 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">
                    Wallet Transfer
                  </span>
                  <span className="text-xs text-green-600 text-center">
                    Pay ₦{getAmountToPay().toLocaleString()} (Gateway fee
                    waived!)
                  </span>
                  {chargeData && !hasSufficientBalance() && (
                    <span className="text-xs text-red-500">
                      Insufficient balance
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Payment Error Display */}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 text-sm">{paymentError}</div>
            </div>
          )}

          {/* Transfer Details */}
          <div ref={contentRef}>
            {transferType === "direct" && merchantInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-4 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm text-amber-600">Account Details</div>
                  <button
                    onClick={handleGenerateAccount}
                    disabled={isGeneratingAccount}
                    className="flex items-center space-x-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingAccount ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Generate Account</span>
                      </>
                    )}
                  </button>
                </div>

                {virtualAccount && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-amber-600">
                          Bank Name:
                        </span>
                        <span className="ml-2 text-amber-900 font-medium">
                          {virtualAccount.bankName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm text-amber-600">
                            Account Number:
                          </span>
                          <span className="ml-2 text-amber-900 font-medium">
                            {virtualAccount.accountNumber || "N/A"}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleCopyAccountNumber(
                              virtualAccount.accountNumber
                            )
                          }
                          className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                          title="Copy account number"
                        >
                          <Copy className="h-4 w-4 text-amber-600" />
                        </button>
                      </div>
                      {showCopySuccess && (
                        <div className="text-green-600 text-sm">
                          Account number copied!
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-amber-600">
                          Account Name:
                        </span>
                        <span className="ml-2 text-amber-900 font-medium">
                          {virtualAccount.accountName || "N/A"}
                        </span>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-700 font-medium">
                          💡 Important: Transfer exactly ₦
                          {getAmountToPay().toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          This account is valid for 30 minutes. Any other amount
                          will be sent to wallet.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!virtualAccount && !isGeneratingAccount && (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-gray-600 text-sm">
                      Click Generate Account to get transfer details
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {transferType === "wallet" && chargeData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <Alert
                  className={`${
                    hasSufficientBalance()
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <Check
                    className={`h-5 w-5 ${
                      hasSufficientBalance() ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  <AlertDescription>
                    <div className="ml-2">
                      <span
                        className={`font-medium ${
                          hasSufficientBalance()
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {hasSufficientBalance()
                          ? "Wallet Balance Available"
                          : "Insufficient Wallet Balance"}
                      </span>
                      <div
                        className={`text-sm ${
                          hasSufficientBalance()
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Balance: ₦{walletBalance.toLocaleString()}
                      </div>
                      {!hasSufficientBalance() && (
                        <div className="text-red-600 text-sm">
                          Required: ₦{getAmountToPay().toLocaleString()}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>
        </div>

        {/* Enhanced Slider with Transaction Status */}
        {transferType && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            {sliderPosition === "end" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 font-medium">
                      Completed
                    </span>
                  </div>
                  <button
                    onClick={handleViewOrder}
                    className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Order</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-14 bg-amber-100 rounded-full relative">
                <motion.div
                  className={`absolute left-0 top-0 h-full aspect-square rounded-full bg-amber-500 flex items-center justify-center touch-none ${
                    isProcessingPayment
                      ? "cursor-wait"
                      : "cursor-grab active:cursor-grabbing"
                  }`}
                  drag={!isProcessingPayment ? "x" : false}
                  dragConstraints={{ left: 0, right: SLIDER_WIDTH }}
                  dragElastic={0.1}
                  dragMomentum={false}
                  animate={sliderControls}
                  onDrag={handleSliderDrag}
                  onDragEnd={handleDragEnd}
                  whileTap={{ scale: 1.1 }}
                >
                  {isProcessingPayment ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <ChevronRight className="h-6 w-6 text-white" />
                  )}
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-amber-600 font-medium pointer-events-none">
                  {isProcessingPayment
                    ? "Processing..."
                    : `Slide to ${
                        transferType === "direct" ? "confirm paid" : "transfer"
                      }`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && chargeData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-sm text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Transaction Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your {transferType === "wallet" ? "payment" : "transfer"} of ₦
                  {getAmountToPay()?.toLocaleString() || "0"} has been processed
                  successfully.
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-amber-500 text-white rounded-lg py-2 px-4 font-medium hover:bg-amber-600 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
};

export default TransferPage;

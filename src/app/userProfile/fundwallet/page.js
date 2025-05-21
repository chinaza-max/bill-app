"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Banknote,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import getErrorMessage from "@/app/component/error";

const FundWalletPage = () => {
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);
  const [amount, setAmount] = useState(1000);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountDetails, setAccountDetails] = useState(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [swipePosition, setSwipePosition] = useState(0);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // Local loading state

  useEffect(() => {
    let timer;
    if (accountDetails && countdown > 0 && !transferCompleted) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [accountDetails, countdown, transferCompleted]);

  // Generate virtual account mutation
  const generateAccountMutation = useMutation({
    mutationFn: async (fundAmount) => {
      if (!accessToken) {
        throw new Error("Access token not available");
      }

      const queryParams = new URLSearchParams({
        apiType: "generateAccountVirtual",
        token: accessToken,
      });

      const response = await fetch(`/api/user?${queryParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiType: "generateAccountVirtual",
          accessToken: accessToken,
          amount: fundAmount,
          type: "fundWallet",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate account");
      }

      return response.json();
    },
    onMutate: () => {
      // Set loading state immediately when mutation starts
      setIsGenerating(true);
    },
    onSuccess: (data) => {
      console.log("Account generated:", data);
      setAccountDetails({
        bankName: "kuda",
        accountNumber: "393939939393",
        accountName: "chinaza ogbonna",
        amount: amount,
        countDown: 60,
      });
      setCountdown(60);
      setErrorMessage(""); // Clear any previous errors
      setIsGenerating(false); // Reset loading state
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
      console.error("Error generating account:", getErrorMessage(error));
      setIsGenerating(false); // Reset loading state on error
    },
    onSettled: () => {
      // Ensure loading state is reset regardless of success or error
      setIsGenerating(false);
    },
  });

  const handleAmountChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setAmount(value);
    // Only show error message if amount is below 1000
    if (value < 1000) {
      setErrorMessage("Minimum amount to fund is ₦1,000");
    } else {
      setErrorMessage("");
    }
  };

  const handleGenerateAccount = () => {
    // Immediately disable button to prevent double clicks
    if (isGenerating || generateAccountMutation.isLoading) {
      return;
    }

    if (amount < 1000) {
      setErrorMessage("Minimum amount to fund is ₦1,000");
      return;
    }

    setErrorMessage(""); // Clear any previous errors
    setIsGenerating(true); // Set loading state immediately
    generateAccountMutation.mutate(amount);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwipe = (e) => {
    const containerWidth = e.currentTarget.offsetWidth;
    const maxPosition = containerWidth - 70; // 70 is approx width of the knob

    if (swipePosition >= maxPosition * 0.9) {
      setTransferCompleted(true);
      // Here you would typically make an API call to confirm the transfer
    } else {
      // Reset the swipe position when released
      setSwipePosition(0);
    }
  };

  const handleSwipeMove = (e) => {
    if (e.touches && e.touches[0]) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const touchX = e.touches[0].clientX - containerRect.left;
      const maxPosition = containerRect.width - 70; // 70 is approx width of the knob

      // Constrain position between 0 and max
      const newPosition = Math.min(Math.max(0, touchX), maxPosition);
      setSwipePosition(newPosition);
    }
  };

  const handleGoBack = () => {
    if (accountDetails) {
      setAccountDetails(null);
      setIsGenerating(false); // Reset loading state when going back
      setErrorMessage(""); // Clear any errors
    } else {
      router.back();
    }
  };

  // Check if we should show loading state
  const isLoading = isGenerating || generateAccountMutation.isLoading;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3 fixed w-full top-0 z-10">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => router.back()}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Fund My Wallet</h1>
          </div>
        </div>

        {/* Main Content - with padding for fixed header and footer */}
        <div className="flex-1 overflow-auto pt-16 pb-24 px-4">
          <div className="space-y-6">
            {!accountDetails ? (
              <>
                {/* Fund Wallet Section */}
                <div className="mb-2 text-md font-medium text-amber-800 mt-4">
                  Add Money to Your Wallet
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
                  {/* Amount Input Section */}
                  <div className="mb-4">
                    <div className="text-sm text-amber-600 mb-1">
                      Enter Amount (₦)
                    </div>
                    <div className="flex items-center">
                      <div className="relative w-full">
                        <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-500" />
                        <input
                          type="number"
                          value={amount}
                          onChange={handleAmountChange}
                          placeholder="Minimum ₦1,000"
                          disabled={isLoading}
                          className="w-full border border-amber-200 rounded-lg pl-10 pr-3 py-3 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-amber-50 disabled:text-amber-500 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {errorMessage && (
                      <div className="flex items-center space-x-1 mt-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 mt-2 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Minimum amount to fund is ₦1,000</span>
                    </div>
                  </div>

                  {/* Funding Note */}
                  <div className="bg-amber-50 rounded-lg p-3 mb-4">
                    <div className="text-sm text-amber-800">
                      Click on Generate Account to get bank account details for
                      making your payment.
                    </div>
                  </div>

                  {/* Loading State when generating account */}
                  {isLoading && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                      <div className="flex items-center justify-center space-x-3">
                        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        <div className="text-blue-700 font-medium">
                          Generating virtual account...
                        </div>
                      </div>
                      <div className="text-center text-blue-600 text-sm mt-2">
                        Please wait, this may take a few seconds
                      </div>
                      <div className="text-center text-blue-500 text-xs mt-1">
                        Do not refresh or close this page
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Account Details Section */}
                <div className="mb-2 text-md font-medium text-amber-800 mt-4">
                  Payment Details
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
                  {/* Countdown Timer */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center text-amber-700">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="font-medium">Time Remaining:</span>
                    </div>
                    <div className="text-lg font-bold text-amber-700">
                      {Math.floor(countdown / 60)}:
                      {countdown % 60 < 10
                        ? `0${countdown % 60}`
                        : countdown % 60}
                    </div>
                  </div>

                  <div className="text-sm text-amber-600 mb-4">
                    Transfer ₦{accountDetails.amount.toLocaleString()} to the
                    account below:
                  </div>

                  {/* Bank Name */}
                  <div className="mb-3">
                    <div className="text-sm text-amber-600 mb-1">Bank Name</div>
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-amber-900 capitalize">
                        {accountDetails.bankName}
                      </div>
                      <button
                        onClick={() => copyToClipboard(accountDetails.bankName)}
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="mb-3">
                    <div className="text-sm text-amber-600 mb-1">
                      Account Number
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-amber-900">
                        {accountDetails.accountNumber}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(accountDetails.accountNumber)
                        }
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Name */}
                  <div className="mb-3">
                    <div className="text-sm text-amber-600 mb-1">
                      Account Name
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-amber-900 capitalize">
                        {accountDetails.accountName}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(accountDetails.accountName)
                        }
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mb-4">
                    <div className="text-sm text-amber-600 mb-1">Amount</div>
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-amber-900">
                        ₦{accountDetails.amount.toLocaleString()}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(accountDetails.amount.toString())
                        }
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Swipe to Confirm Transfer */}
                  {!transferCompleted ? (
                    <div
                      className="bg-amber-100 rounded-lg p-1 mb-4 relative overflow-hidden"
                      onTouchMove={handleSwipeMove}
                      onTouchEnd={handleSwipe}
                    >
                      <div
                        className="absolute top-0 left-0 h-full bg-amber-300 rounded-lg transition-all duration-150"
                        style={{
                          width: `${
                            (swipePosition / (window.innerWidth - 70 - 32)) *
                            100
                          }%`,
                        }}
                      />
                      <div
                        className="absolute top-1 left-1 bg-amber-500 text-white p-2 rounded-lg flex items-center justify-center shadow-md transition-transform duration-150"
                        style={{
                          transform: `translateX(${swipePosition}px)`,
                          width: "60px",
                          height: "36px",
                        }}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </div>
                      <div className="text-center py-2 text-amber-800 font-medium relative z-10">
                        Swipe to confirm transfer
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-100 rounded-lg p-3 mb-4 text-center border border-green-200">
                      <div className="text-green-700 font-medium">
                        Transfer confirmation sent!
                      </div>
                    </div>
                  )}

                  {/* Payment Note */}
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-sm text-amber-800">
                      Your wallet will be credited immediately after your
                      payment is confirmed. You can copy any detail by clicking
                      the copy icon.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fixed Footer with Generate Account Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 p-4 shadow-lg">
          <div className="flex space-x-4">
            <button
              onClick={handleGoBack}
              disabled={isLoading && !accountDetails}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-amber-100 text-amber-700 rounded-lg font-medium transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{accountDetails ? "Enter New Amount" : "Go Back"}</span>
            </button>
            {!accountDetails && (
              <button
                onClick={handleGenerateAccount}
                disabled={amount < 1000 || isLoading}
                className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  amount >= 1000 && !isLoading
                    ? "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transform hover:scale-105 active:scale-95"
                    : "bg-amber-200 text-amber-500 cursor-not-allowed opacity-60"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate Account</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FundWalletPage;

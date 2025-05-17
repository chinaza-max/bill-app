"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  PlayCircle,
  HelpCircle,
  Eye,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Alert, AlertDescription } from "@/components/ui/alert";
import getErrorMessage from "@/app/component/error";

const CreateAdsPage = () => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [useDefaultSettings, setUseDefaultSettings] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCharge, setSelectedCharge] = useState("");
  const [customCharge, setCustomCharge] = useState("");
  const [adsList, setAdsList] = useState([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [maxAmountLimit, setMaxAmountLimit] = useState(20000); // Default value
  const [minAmountLimit, setMinAmountLimit] = useState(1000); // Default value
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [isCustomCharge, setIsCustomCharge] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState(""); // "min", "max", or "custom"

  const accessToken = useSelector((state) => state.user.accessToken);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  const router = useRouter();

  // Use React Query to fetch range limit data
  const { data: rangeData, isLoading } = useQuery({
    queryKey: ["rangeLimit", accessToken],
    queryFn: async () => {
      if (!accessToken) return null;

      const queryParams = new URLSearchParams({
        token: accessToken,
        apiType: "getMyRangeLimit",
      }).toString();

      try {
        // Adding apiType as query parameter for GET request
        const response = await fetch(`/api/user?${queryParams}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const responseBody = await response.json();

        setMaxAmountLimit(responseBody.data.data.maxAmount);
        setMinAmountLimit(responseBody.data.data.minAmount);
        return responseBody.data;
      } catch (error) {
        console.error("Error fetching range limits:", error);
        setErrorMessage(
          "Unable to fetch price range limits. Please try again later."
        );
        return null;
      }
    },
    onError: (error) => {
      console.error("Error fetching range limits:", error);
      getErrorMessage(error, router, "", isAuthenticated);
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ["getSettings", accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      const params = new URLSearchParams({
        token: accessToken,
        apiType: "getSettings",
      }).toString();

      try {
        const response = await fetch(`/api/user?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const body = await response.json();

        return body.data;
      } catch (error) {
        console.error("Error fetching settings:", error);
        getErrorMessage(error, router, "", isAuthenticated);

        setErrorMessage("Unable to fetch settings.");
        return null;
      }
    },
  });

  const { allAmounts, chargeRanges } = useMemo(() => {
    let breakPoint = settingsData?.data?.breakPoint || [];

    // Parse if breakPoint is a string
    try {
      breakPoint =
        typeof breakPoint === "string" ? JSON.parse(breakPoint) : breakPoint;
    } catch (err) {
      console.error("Invalid breakPoint format:", err);
      breakPoint = [];
    }

    // Safely map amounts
    const amounts = breakPoint.map((item) => ({
      value: item.amount,
      label: `₦${item.amount}`,
    }));

    // Build charges object with safe defaults
    const charges = breakPoint.reduce((acc, item) => {
      const chargeOptions = (item.prices || []).map((charge) => ({
        value: charge.toString(),
        label: `₦${charge}`,
      }));

      // Always add custom charge option
      chargeOptions.push({
        value: "custom",
        label: "Custom Charge",
      });

      acc[item.amount] = chargeOptions;
      return acc;
    }, {});

    // Add default "custom" key
    charges["custom"] = [100, 200, 300, 400, 500].map((val) => ({
      value: val.toString(),
      label: `₦${val}`,
    }));
    charges["custom"].push({ value: "custom", label: "Custom Charge" });

    return {
      allAmounts: amounts,
      chargeRanges: charges,
    };
  }, [settingsData]);

  // Get default sample data
  const getDefaultSampleData = useCallback(() => {
    return [
      { amount: "1000", charge: "100" },
      { amount: "5000", charge: "200" },
      { amount: "10000", charge: "320" },
      { amount: "15000", charge: "350" },
    ];
  }, []);

  // Get available amounts based on min and max price
  /*
  const getAvailableAmounts = useCallback(() => {
    if (!minPrice || !maxPrice) return [];

    // Get amounts from existing ads
    const existingAmounts = adsList.map((ad) => ({
      value: ad.amount,
      label: `₦${Number(ad.amount).toLocaleString()}`,
    }));

    // Get amounts from allAmounts that fall within the range
    const rangeAmounts = allAmounts.filter((amount) => {
      if (amount.value === "custom") return true; // Always include custom option
      const value = Number(amount.value);
      return value >= Number(minPrice) && value <= Number(maxPrice);
    });

    // Combine and deduplicate amounts
    const combinedAmounts = [...existingAmounts, ...rangeAmounts];
    const uniqueAmounts = Array.from(
      new Map(combinedAmounts.map((item) => [item.value, item])).values()
    );

    // Sort amounts numerically, keeping "custom" at the end
    return uniqueAmounts.sort((a, b) => {
      if (a.value === "custom") return 1;
      if (b.value === "custom") return -1;
      return Number(a.value) - Number(b.value);
    });
  }, [minPrice, maxPrice, adsList, allAmounts]);*/

  const getAvailableAmounts = useCallback(() => {
    if (!minPrice || !maxPrice) return [];

    // Get a set of amounts that are already used in non-default ads
    const usedAmounts = new Set(
      adsList.filter((ad) => !ad.isDefault).map((ad) => ad.amount)
    );

    // Get amounts from allAmounts that fall within the range AND are not already used
    const availableAmounts = allAmounts.filter((amount) => {
      if (amount.value === "custom") return true; // Always include custom option
      const value = Number(amount.value);
      return (
        value >= Number(minPrice) &&
        value <= Number(maxPrice) &&
        !usedAmounts.has(amount.value)
      );
    });

    // Sort amounts numerically, keeping "custom" at the end
    return availableAmounts.sort((a, b) => {
      if (a.value === "custom") return 1;
      if (b.value === "custom") return -1;
      return Number(a.value) - Number(b.value);
    });
  }, [minPrice, maxPrice, adsList, allAmounts]);

  const handleSubmitAds = useCallback(async () => {
    if (adsList.length === 0) {
      setErrorMessage("Please add at least one price setting");
      return;
    }

    // Format data for API
    const pricePerThousand = adsList.map((ad) => ({
      amount: Number(ad.amount),
      charge: Number(ad.charge),
    }));

    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          pricePerThousand,
          minAmount: Number(minPrice),
          maxAmount: Number(maxPrice),
          apiType: "createMerchantAds",
          accessToken: accessToken,
        }),
      });

      if (response.ok) {
        router.push("/userProfile/merchantProfile/merchantHome/viewAds");
      } else {
        const errorData = await response.json();
        setErrorMessage(
          errorData.message || "Error creating ads. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting ads:", error);
      setErrorMessage("Error creating ads. Please try again.");
    }
  }, [adsList, accessToken, router]);

  // Setup default ads when price range changes
  useEffect(() => {
    if (minPrice && maxPrice && useDefaultSettings) {
      const samples = getDefaultSampleData().filter(
        (sample) =>
          Number(sample.amount) >= Number(minPrice) &&
          Number(sample.amount) <= Number(maxPrice)
      );

      const timestamp = Date.now();
      const defaultAds = samples.map((sample, index) => ({
        id: `default-${sample.amount}-${timestamp}-${index}`,
        minPrice,
        maxPrice,
        amount: sample.amount,
        charge: sample.charge,
        useDefaultSettings: true,
        isDefault: true,
      }));
      setAdsList(defaultAds);
    }
  }, [minPrice, maxPrice, useDefaultSettings, getDefaultSampleData]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setErrorType("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Improved validation for min price
  const handleMinPriceChange = useCallback(
    (value) => {
      // Clear any existing errors
      setErrorMessage("");
      setErrorType("");

      // Handle empty input
      if (value === "") {
        setMinPrice("");
        return;
      }

      const numValue = Number(value);

      // Validate against min limit
      if (numValue < minAmountLimit) {
        setErrorMessage(
          `Minimum price cannot be less than ₦${minAmountLimit.toLocaleString()}`
        );
        setErrorType("min");
      }
      // Validate against max price if it exists
      else if (maxPrice && numValue > Number(maxPrice)) {
        setErrorMessage(
          `Minimum price cannot be greater than maximum price (₦${Number(
            maxPrice
          ).toLocaleString()})`
        );
        setErrorType("min");
      }
      // Validate against max limit
      else if (numValue > maxAmountLimit) {
        setErrorMessage(
          `You have exceeded the maximum limit of ₦${maxAmountLimit.toLocaleString()}`
        );
        setErrorType("min");
      }

      setMinPrice(value);
      setSelectedAmount("");
      setCustomAmount("");
      setSelectedCharge("");
      setCustomCharge("");
      setIsCustomAmount(false);
      setIsCustomCharge(false);
    },
    [minAmountLimit, maxAmountLimit, maxPrice]
  );

  // Improved validation for max price
  const handleMaxPriceChange = useCallback(
    (value) => {
      // Clear any existing errors
      setErrorMessage("");
      setErrorType("");

      // Handle empty input
      if (value === "") {
        setMaxPrice("");
        return;
      }

      const numValue = Number(value);

      // Validate against max limit
      if (numValue > maxAmountLimit) {
        setErrorMessage(
          `You have exceeded the maximum limit of ₦${maxAmountLimit.toLocaleString()}`
        );
        setErrorType("max");
      }
      // Validate against min price if it exists
      else if (minPrice && numValue < Number(minPrice)) {
        setErrorMessage(
          `Maximum price cannot be less than minimum price (₦${Number(
            minPrice
          ).toLocaleString()})`
        );
        setErrorType("max");
      }
      // Validate against min limit
      else if (numValue < minAmountLimit) {
        setErrorMessage(
          `Maximum price cannot be less than ₦${minAmountLimit.toLocaleString()}`
        );
        setErrorType("max");
      }

      setMaxPrice(value);
      setSelectedAmount("");
      setCustomAmount("");
      setSelectedCharge("");
      setCustomCharge("");
      setIsCustomAmount(false);
      setIsCustomCharge(false);
    },
    [minAmountLimit, maxAmountLimit, minPrice]
  );

  const handleAmountChange = useCallback((value) => {
    // Clear any existing errors
    setErrorMessage("");
    setErrorType("");

    if (value === "custom") {
      setIsCustomAmount(true);
      setSelectedAmount(value);
      setCustomAmount("");
      setSelectedCharge("");
      setCustomCharge("");
      setIsCustomCharge(false);
    } else {
      setSelectedAmount(value);
      setIsCustomAmount(false);
      setCustomAmount("");
      setSelectedCharge("");
      setCustomCharge("");
      setIsCustomCharge(false);
    }
  }, []);

  const handleChargeChange = useCallback((value) => {
    // Clear any existing errors
    setErrorMessage("");
    setErrorType("");

    if (value === "custom") {
      setIsCustomCharge(true);
      setSelectedCharge(value);
      setCustomCharge("");
    } else {
      setSelectedCharge(value);
      setIsCustomCharge(false);
      setCustomCharge("");
    }
  }, []);

  const handleCustomAmountChange = useCallback(
    (value) => {
      // Clear any existing errors
      setErrorMessage("");
      setErrorType("");

      // Handle empty input
      if (value === "") {
        setCustomAmount("");
        return;
      }

      const numValue = Number(value);

      // Validate against min and max limits
      if (numValue < Number(minPrice)) {
        setCustomAmount(minPrice);
        setErrorMessage(
          `Custom amount cannot be less than minimum price (₦${Number(
            minPrice
          ).toLocaleString()})`
        );
        setErrorType("custom");
      } else if (numValue > Number(maxPrice)) {
        setCustomAmount(maxPrice);
        setErrorMessage(
          `Custom amount cannot exceed maximum price (₦${Number(
            maxPrice
          ).toLocaleString()})`
        );
        setErrorType("custom");
      } else {
        setCustomAmount(value);
      }
    },
    [minPrice, maxPrice]
  );

  const handleCustomChargeChange = useCallback((value) => {
    // Clear any existing errors
    setErrorMessage("");
    setErrorType("");

    // Add basic validation for charge (positive number)
    if (value === "") {
      setCustomCharge("");
    } else if (Number(value) < 0) {
      setCustomCharge("0");
      setErrorMessage("Charge cannot be negative");
      setErrorType("custom");
    } else {
      setCustomCharge(value);
    }
  }, []);

  const handleAddAd = useCallback(() => {
    // Clear any existing errors
    setErrorMessage("");
    setErrorType("");

    // Determine the actual amount and charge values
    const finalAmount = isCustomAmount ? customAmount : selectedAmount;
    const finalCharge = isCustomCharge ? customCharge : selectedCharge;

    if (minPrice && maxPrice && finalAmount && finalCharge) {
      // Check if this amount already exists

      const amountExists = adsList.some((ad) => ad.amount === finalAmount);

      if (amountExists) {
        setErrorMessage(
          `Price setting for ₦${Number(
            finalAmount
          ).toLocaleString()} already exists`
        );
        return;
      }

      // Create a truly unique ID
      const uniqueId = `custom-${finalAmount}-${Date.now()}`;

      const newAd = {
        id: uniqueId,
        minPrice,
        maxPrice,
        amount: finalAmount,
        charge: finalCharge,
        useDefaultSettings: false,
        isDefault: false,
      };

      const updatedList = adsList
        .filter((ad) => ad.isDefault || ad.amount !== finalAmount)
        .concat(newAd);

      setAdsList(updatedList);
      setSelectedAmount("");
      setCustomAmount("");
      setSelectedCharge("");
      setCustomCharge("");
      setIsCustomAmount(false);
      setIsCustomCharge(false);
    } else {
      setErrorMessage("Please fill in all required fields");
    }
  }, [
    adsList,
    customAmount,
    customCharge,
    isCustomAmount,
    isCustomCharge,
    maxPrice,
    minPrice,
    selectedAmount,
    selectedCharge,
  ]);

  const handleToggleChange = useCallback(
    (newValue) => {
      // Clear any existing errors
      setErrorMessage("");
      setErrorType("");

      setUseDefaultSettings(newValue);
      if (newValue) {
        // If turning on default settings, load default ads
        const samples = getDefaultSampleData().filter(
          (sample) =>
            Number(sample.amount) >= Number(minPrice) &&
            Number(sample.amount) <= Number(maxPrice)
        );

        const timestamp = Date.now();
        const defaultAds = samples.map((sample, index) => ({
          id: `default-${sample.amount}-${timestamp}-${index}`,
          minPrice,
          maxPrice,
          amount: sample.amount,
          charge: sample.charge,
          useDefaultSettings: true,
          isDefault: true,
        }));
        setAdsList(defaultAds);
      } else {
        // If turning off default settings, clear all ads
        setAdsList([]);
      }
    },
    [minPrice, maxPrice, getDefaultSampleData]
  );

  const handleDeleteAd = useCallback(
    (id) => {
      // Only allow deletion of non-default ads
      setAdsList(adsList.filter((ad) => ad.id !== id || ad.isDefault));
    },
    [adsList]
  );

  const Switch = ({ enabled, onToggle }) => (
    <button
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
        enabled ? "bg-green-500" : "bg-amber-200"
      }`}
      onClick={onToggle}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const HelpModal = () => (
    <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>How to Create Ads</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="aspect-video bg-amber-50 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <PlayCircle className="w-16 h-16 text-amber-500 mx-auto" />
              <p className="text-amber-700">Tutorial Video</p>
            </div>
          </div>
          <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
            <h3 className="font-semibold text-amber-900">Quick Guide</h3>
            <ol className="list-decimal list-inside space-y-2 text-amber-700">
              <li>
                Set your desired price range (₦{minAmountLimit.toLocaleString()}{" "}
                - ₦{maxAmountLimit.toLocaleString()})
              </li>
              <li>Choose to use default settings or customize your own</li>
              <li>Select amount and charge for custom settings</li>
              <li>Use custom values to input any amount within your range</li>
              <li>Review your price information in the list below</li>
              <li>Add new entries as needed</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const ErrorAlert = ({ message, type }) => (
    <Alert className="mb-4 bg-red-50 border-red-200">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertDescription className="text-red-700">{message}</AlertDescription>
    </Alert>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        <div className="sticky top-0 z-10 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center">
            <ArrowLeft
              className="h-6 w-6 mr-3 cursor-pointer"
              onClick={() =>
                router.push("/userProfile/merchantProfile/merchantHome")
              }
            />
            <h1 className="text-lg font-semibold">Create Ads</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                router.push("/userProfile/merchantProfile/merchantHome/viewAds")
              }
              className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">View Ads</span>
            </button>
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Help</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6 mb-20">
          {errorMessage && (
            <ErrorAlert message={errorMessage} type={errorType} />
          )}

          {isLoading ? (
            <div className="bg-white rounded-lg p-4 shadow-sm flex justify-center items-center h-20">
              <p className="text-amber-700">Loading price range limits...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-amber-900 font-semibold mb-3">
                Set Price Range
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-amber-700 mb-1">
                    Minimum (₦)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:border-amber-500 ${
                      errorType === "min"
                        ? "border-red-500 bg-red-50"
                        : "border-amber-200"
                    }`}
                    placeholder={`Min (₦${minAmountLimit.toLocaleString()})`}
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    Minimum : ₦{minAmountLimit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-amber-700 mb-1">
                    Maximum (₦)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:border-amber-500 ${
                      errorType === "max"
                        ? "border-red-500 bg-red-50"
                        : "border-amber-200"
                    }`}
                    placeholder={`Max (₦${maxAmountLimit.toLocaleString()})`}
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    Maximum : ₦{maxAmountLimit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {minPrice && maxPrice && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-amber-900 font-semibold mb-3">
                Set Price Per Thousand
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-amber-700">Use Default Settings</span>
                  <Switch
                    enabled={useDefaultSettings}
                    onToggle={() => handleToggleChange(!useDefaultSettings)}
                  />
                </div>

                {!useDefaultSettings && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-amber-700 mb-1">
                        Amount
                      </label>
                      <select
                        value={selectedAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className={`w-full p-2 border rounded-lg focus:outline-none focus:border-amber-500 ${
                          errorType === "custom" && isCustomAmount
                            ? "border-red-500"
                            : "border-amber-200"
                        }`}
                      >
                        <option value="">Select amount</option>
                        {getAvailableAmounts().map((option) => (
                          <option
                            key={`amount-${option.value}`}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {isCustomAmount && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) =>
                              handleCustomAmountChange(e.target.value)
                            }
                            className={`w-full p-2 border rounded-lg focus:outline-none focus:border-amber-500 ${
                              errorType === "custom"
                                ? "border-red-500 bg-red-50"
                                : "border-amber-200"
                            }`}
                            placeholder="Enter amount"
                            min={minPrice}
                            max={maxPrice}
                          />
                          <p className="text-xs text-amber-600 mt-1">
                            Enter a value between ₦
                            {Number(minPrice).toLocaleString()} and ₦
                            {Number(maxPrice).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-amber-700 mb-1">
                        Charge
                      </label>
                      <select
                        value={selectedCharge}
                        onChange={(e) => handleChargeChange(e.target.value)}
                        className={`w-full p-2 border rounded-lg focus:outline-none focus:border-amber-500 ${
                          errorType === "custom" && isCustomCharge
                            ? "border-red-500"
                            : "border-amber-200"
                        }`}
                        disabled={!selectedAmount}
                      >
                        <option value="">Select charge</option>
                        {selectedAmount &&
                          chargeRanges[selectedAmount] &&
                          chargeRanges[selectedAmount].map((option) => (
                            <option
                              key={`charge-${option.value}-${selectedAmount}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                      </select>
                      {isCustomCharge && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={customCharge}
                            onChange={(e) =>
                              handleCustomChargeChange(e.target.value)
                            }
                            className={`w-full p-2 border rounded-lg focus:outline-none focus:border-amber-500 ${
                              errorType === "custom"
                                ? "border-red-500 bg-red-50"
                                : "border-amber-200"
                            }`}
                            placeholder="Enter charge"
                            min="0"
                          />
                          <p className="text-xs text-amber-600 mt-1">
                            Enter your custom charge amount
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleAddAd}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-colors"
                      disabled={
                        !(
                          (selectedAmount &&
                            selectedAmount !== "custom" &&
                            selectedCharge &&
                            selectedCharge !== "custom") ||
                          (selectedAmount === "custom" &&
                            customAmount &&
                            selectedCharge &&
                            selectedCharge !== "custom") ||
                          (selectedAmount &&
                            selectedAmount !== "custom" &&
                            selectedCharge === "custom" &&
                            customCharge) ||
                          (selectedAmount === "custom" &&
                            customAmount &&
                            selectedCharge === "custom" &&
                            customCharge)
                        )
                      }
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {adsList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-amber-900">
                  Price Information
                </h2>
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-sm">
                  ₦{Number(minPrice).toLocaleString()} - ₦
                  {Number(maxPrice).toLocaleString()}
                </span>
              </div>
              {adsList.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-gradient-to-r from-amber-50 to-green-50 rounded-lg p-4 shadow-sm border border-amber-100"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-900 font-medium">
                          Amount: ₦{Number(ad.amount).toLocaleString()}
                        </span>
                        {ad.isDefault && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Default
                          </span>
                        )}
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-green-800">
                          <span className="font-medium">Charge:</span> ₦
                          {Number(ad.charge).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!ad.isDefault && (
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        aria-label="Delete ad"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed bottom submit button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-amber-200 shadow-lg">
          <button
            onClick={handleSubmitAds}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-colors flex items-center justify-center"
            disabled={adsList.length === 0}
          >
            <Check className="w-5 h-5 mr-2" />
            Submit Ads
          </button>
        </div>

        {/* Help Modal */}
        <HelpModal />
      </div>
    </ProtectedRoute>
  );
};

export default CreateAdsPage;

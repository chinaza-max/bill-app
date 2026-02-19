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
  const [maxAmountLimit, setMaxAmountLimit] = useState(20000);
  const [minAmountLimit, setMinAmountLimit] = useState(1000);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [isCustomCharge, setIsCustomCharge] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState("");

  const accessToken = useSelector((state) => state.user.accessToken);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const router = useRouter();

  const { data: rangeData, isLoading } = useQuery({
    queryKey: ["rangeLimit", accessToken],
    queryFn: async () => {
      if (!accessToken) return null;
      const queryParams = new URLSearchParams({
        token: accessToken,
        apiType: "getMyRangeLimit",
      }).toString();
      try {
        const response = await fetch(`/api/user?${queryParams}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) throw new Error("Network response was not ok");
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
    try {
      breakPoint =
        typeof breakPoint === "string" ? JSON.parse(breakPoint) : breakPoint;
    } catch (err) {
      console.error("Invalid breakPoint format:", err);
      breakPoint = [];
    }

    const amounts = breakPoint.map((item) => ({
      value: item.amount,
      label: `₦${item.amount}`,
    }));

    const charges = breakPoint.reduce((acc, item) => {
      const chargeOptions = (item.prices || []).map((charge) => ({
        value: charge.toString(),
        label: `₦${charge}`,
      }));
      chargeOptions.push({ value: "custom", label: "Custom Charge" });
      acc[item.amount] = chargeOptions;
      return acc;
    }, {});

    charges["custom"] = [100, 200, 300, 400, 500].map((val) => ({
      value: val.toString(),
      label: `₦${val}`,
    }));
    charges["custom"].push({ value: "custom", label: "Custom Charge" });

    return { allAmounts: amounts, chargeRanges: charges };
  }, [settingsData]);

  // Get default sample data from breakpoints
  const getDefaultSampleData = useCallback(() => {
    let breakPoint = settingsData?.data?.breakPoint || [];
    try {
      breakPoint =
        typeof breakPoint === "string" ? JSON.parse(breakPoint) : breakPoint;
    } catch (err) {
      breakPoint = [];
    }

    if (breakPoint.length > 0) {
      return breakPoint.map((item) => ({
        amount: item.amount.toString(),
        charge: item.prices?.[0]?.toString() || "100",
      }));
    }

    // Fallback static samples
    return [
      { amount: "1000", charge: "100" },
      { amount: "5000", charge: "200" },
      { amount: "10000", charge: "320" },
      { amount: "15000", charge: "350" },
    ];
  }, [settingsData]);

  // Helper: get relevant breakpoints for a given min/max range
  const getRelevantBreakpoints = useCallback(
    (min, max, allSamples) => {
      const minNum = Number(min);
      const maxNum = Number(max);

      // Samples strictly within range (inclusive)
      const withinRange = allSamples.filter(
        (s) => Number(s.amount) >= minNum && Number(s.amount) <= maxNum
      );

      // Check if we need a fallback (nearest lower breakpoint)
      const lowestInRange =
        withinRange.length > 0
          ? Math.min(...withinRange.map((s) => Number(s.amount)))
          : null;

      const needsFallback = lowestInRange === null || lowestInRange > minNum;

      let fallbackSample = null;
      if (needsFallback) {
        const lowerSamples = allSamples.filter(
          (s) => Number(s.amount) < minNum
        );
        if (lowerSamples.length > 0) {
          fallbackSample = lowerSamples.reduce((prev, curr) =>
            Number(curr.amount) > Number(prev.amount) ? curr : prev
          );
        }
      }

      return [
        ...(fallbackSample ? [fallbackSample] : []),
        ...withinRange,
      ];
    },
    []
  );

  const getAvailableAmounts = useCallback(() => {
    if (!minPrice || !maxPrice) return [];

    const usedAmounts = new Set(
      adsList.filter((ad) => !ad.isDefault).map((ad) => ad.amount)
    );

    const min = Number(minPrice);
    const max = Number(maxPrice);

    // Get all breakpoint numeric values (excluding "custom")
    const breakpointValues = allAmounts
      .filter((a) => a.value !== "custom")
      .map((a) => Number(a.value))
      .sort((a, b) => a - b);

    // Breakpoints strictly within range
    const withinRange = breakpointValues.filter((v) => v >= min && v <= max);

    // Determine if we need a fallback (nearest lower breakpoint)
    const lowestInRange =
      withinRange.length > 0 ? Math.min(...withinRange) : null;
    const needsFallback = lowestInRange === null || lowestInRange > min;

    let fallbackValue = null;
    if (needsFallback) {
      const lowerBreakpoints = breakpointValues.filter((v) => v < min);
      if (lowerBreakpoints.length > 0) {
        fallbackValue = Math.max(...lowerBreakpoints);
      }
    }

    // Build final relevant set
    const relevantValues = new Set([
      ...withinRange,
      ...(fallbackValue !== null ? [fallbackValue] : []),
    ]);

    const availableAmounts = allAmounts.filter((amount) => {
      if (amount.value === "custom") return true;
      const value = Number(amount.value);
      return relevantValues.has(value) && !usedAmounts.has(amount.value);
    });

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
  }, [adsList, accessToken, minPrice, maxPrice, router]);

  // Setup default ads when price range changes
  useEffect(() => {
    if (minPrice && maxPrice && useDefaultSettings) {
      const allSamples = getDefaultSampleData();
      const samples = getRelevantBreakpoints(minPrice, maxPrice, allSamples);

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
  }, [minPrice, maxPrice, useDefaultSettings, getDefaultSampleData, getRelevantBreakpoints]);

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

  const handleMinPriceChange = useCallback(
    (value) => {
      setErrorMessage("");
      setErrorType("");

      if (value === "") {
        setMinPrice("");
        return;
      }

      const numValue = Number(value);

      if (numValue < minAmountLimit) {
        setErrorMessage(
          `Minimum price cannot be less than ₦${minAmountLimit.toLocaleString()}`
        );
        setErrorType("min");
      } else if (maxPrice && numValue > Number(maxPrice)) {
        setErrorMessage(
          `Minimum price cannot be greater than maximum price (₦${Number(
            maxPrice
          ).toLocaleString()})`
        );
        setErrorType("min");
      } else if (numValue > maxAmountLimit) {
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

  const handleMaxPriceChange = useCallback(
    (value) => {
      setErrorMessage("");
      setErrorType("");

      if (value === "") {
        setMaxPrice("");
        return;
      }

      const numValue = Number(value);

      if (numValue > maxAmountLimit) {
        setErrorMessage(
          `You have exceeded the maximum limit of ₦${maxAmountLimit.toLocaleString()}`
        );
        setErrorType("max");
      } else if (minPrice && numValue < Number(minPrice)) {
        setErrorMessage(
          `Maximum price cannot be less than minimum price (₦${Number(
            minPrice
          ).toLocaleString()})`
        );
        setErrorType("max");
      } else if (numValue < minAmountLimit) {
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
      setErrorMessage("");
      setErrorType("");

      if (value === "") {
        setCustomAmount("");
        return;
      }

      const numValue = Number(value);

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
    setErrorMessage("");
    setErrorType("");

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
    setErrorMessage("");
    setErrorType("");

    const finalAmount = isCustomAmount ? customAmount : selectedAmount;
    const finalCharge = isCustomCharge ? customCharge : selectedCharge;

    if (minPrice && maxPrice && finalAmount && finalCharge) {
      const amountExists = adsList.some((ad) => ad.amount === finalAmount);
      if (amountExists) {
        setErrorMessage(
          `Price setting for ₦${Number(finalAmount).toLocaleString()} already exists`
        );
        return;
      }

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
      setErrorMessage("");
      setErrorType("");
      setUseDefaultSettings(newValue);

      if (newValue) {
        const allSamples = getDefaultSampleData();
        const samples = getRelevantBreakpoints(minPrice, maxPrice, allSamples);

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
        setAdsList([]);
      }
    },
    [minPrice, maxPrice, getDefaultSampleData, getRelevantBreakpoints]
  );

  const handleDeleteAd = useCallback(
    (id) => {
      setAdsList(adsList.filter((ad) => ad.id !== id || ad.isDefault));
    },
    [adsList]
  );

  const Switch = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-amber-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const HelpModal = () => (
    <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How to Create Ads</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
            <PlayCircle className="text-amber-500 w-8 h-8 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Tutorial Video</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-sm">Quick Guide</p>
            <ol className="text-sm space-y-1 text-gray-600 list-decimal list-inside">
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
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-amber-500 text-white p-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center space-x-3">
              <ArrowLeft
                className="w-6 h-6 cursor-pointer"
                onClick={() =>
                  router.push("/userProfile/merchantProfile/merchantHome")
                }
              />
              <h1 className="text-lg font-semibold">Create Ads</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  router.push(
                    "/userProfile/merchantProfile/merchantHome/viewAds"
                  )
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
        </div>

        <div className="max-w-lg mx-auto p-4 pb-24 space-y-4">
          {errorMessage && (
            <ErrorAlert message={errorMessage} type={errorType} />
          )}

          {isLoading ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
              Loading price range limits...
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-700">Set Price Range</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Min Price */}
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Minimum (₦)</label>
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
                  <p className="text-xs text-gray-400">
                    Minimum : ₦{minAmountLimit.toLocaleString()}
                  </p>
                </div>

                {/* Max Price */}
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Maximum (₦)</label>
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
                  <p className="text-xs text-gray-400">
                    Maximum : ₦{maxAmountLimit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {minPrice && maxPrice && (
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-700">
                  Set Price Per Thousand
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Use Default Settings
                  </span>
                  <Switch
                    enabled={useDefaultSettings}
                    onToggle={() => handleToggleChange(!useDefaultSettings)}
                  />
                </div>
              </div>

              {!useDefaultSettings && (
                <div className="space-y-3">
                  {/* Amount Selector */}
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Amount</label>
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
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {isCustomAmount && (
                      <div className="mt-2 space-y-1">
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
                        <p className="text-xs text-gray-400">
                          Enter a value between ₦{" "}
                          {Number(minPrice).toLocaleString()} and ₦{" "}
                          {Number(maxPrice).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Charge Selector */}
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Charge</label>
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
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>

                    {isCustomCharge && (
                      <div className="mt-2 space-y-1">
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
                        <p className="text-xs text-gray-400">
                          Enter your custom charge amount
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAddAd}
                    className="w-full bg-amber-500 text-white py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ads List */}
          {adsList.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-700">
                  Price Information
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  ₦{Number(minPrice).toLocaleString()} - ₦{" "}
                  {Number(maxPrice).toLocaleString()}
                </span>
              </div>

              {adsList.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-700">
                        Amount: ₦{Number(ad.amount).toLocaleString()}
                      </p>
                      {ad.isDefault && (
                        <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Charge: ₦ {Number(ad.charge).toLocaleString()}
                    </p>
                  </div>
                  {!ad.isDefault && (
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      aria-label="Delete ad"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSubmitAds}
              disabled={adsList.length === 0}
              className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Ads
            </button>
          </div>
        </div>

        <HelpModal />
      </div>
    </ProtectedRoute>
  );
};

export default CreateAdsPage;
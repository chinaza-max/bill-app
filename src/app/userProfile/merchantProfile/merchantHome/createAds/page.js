"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, PlayCircle, HelpCircle, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const CreateAdsPage = () => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [useDefaultSettings, setUseDefaultSettings] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedCharge, setSelectedCharge] = useState("");
  const [adsList, setAdsList] = useState([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [maxAmountLimit, setMaxAmountLimit] = useState(20000); // Default value

  const router = useRouter();

  useEffect(() => {
    const fetchMaxAmount = async () => {
      try {
        const response = await fetch("/api/max-amount-limit"); // Replace with your actual API endpoint
        const data = await response.json();
        setMaxAmountLimit(data.maxAmount);
      } catch (error) {
        console.error("Error fetching max amount:", error);
      }
    };

    fetchMaxAmount();
  }, []);

  // All possible amounts and their charges
  const allAmounts = [
    { value: "1000", label: "₦1,000" },
    { value: "5000", label: "₦5,000" },
    { value: "10000", label: "₦10,000" },
    { value: "15000", label: "₦15,000" },
    { value: "20000", label: "₦20,000" },
  ];

  const chargeRanges = {
    1000: [
      { value: "100", label: "₦100" },
      { value: "150", label: "₦150" },
      { value: "200", label: "₦200" },
    ],
    5000: [
      { value: "200", label: "₦200" },
      { value: "250", label: "₦250" },
      { value: "300", label: "₦300" },
    ],
    10000: [
      { value: "300", label: "₦300" },
      { value: "350", label: "₦350" },
      { value: "400", label: "₦400" },
    ],
    15000: [
      { value: "350", label: "₦350" },
      { value: "400", label: "₦400" },
      { value: "450", label: "₦450" },
    ],
    20000: [
      { value: "400", label: "₦400" },
      { value: "450", label: "₦450" },
      { value: "500", label: "₦500" },
    ],
  };

  // Get default sample data
  const getDefaultSampleData = () => {
    return [
      { amount: "1000", charge: "100" },
      { amount: "5000", charge: "200" },
      { amount: "10000", charge: "300" },
      { amount: "15000", charge: "350" },
    ];
  };

  // Get available amounts based on min and max price
  const getAvailableAmounts = () => {
    if (!minPrice || !maxPrice) return [];

    // Get amounts from existing ads
    const existingAmounts = adsList.map((ad) => ({
      value: ad.amount,
      label: `₦${Number(ad.amount).toLocaleString()}`,
    }));

    // Get amounts from allAmounts that fall within the range
    const rangeAmounts = allAmounts.filter((amount) => {
      const value = Number(amount.value);
      return value >= Number(minPrice) && value <= Number(maxPrice);
    });

    // Combine and deduplicate amounts
    const combinedAmounts = [...existingAmounts, ...rangeAmounts];
    const uniqueAmounts = Array.from(
      new Map(combinedAmounts.map((item) => [item.value, item])).values()
    );

    // Sort amounts numerically
    return uniqueAmounts.sort((a, b) => Number(a.value) - Number(b.value));
  };

  const handleSubmitAds = async () => {
    if (adsList.length === 0) {
      alert("Please add at least one price setting");
      return;
    }

    // Format data for API
    const pricePerThousand = adsList.map((ad) => ({
      amount: Number(ad.amount),
      charge: Number(ad.charge),
    }));

    try {
      const response = await fetch("/api/create-ads", {
        // Replace with your actual API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pricePerThousand }),
      });

      if (response.ok) {
        router.push("/userProfile/merchantProfile/merchantHome/viewAds");
      } else {
        alert("Error creating ads. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting ads:", error);
      alert("Error creating ads. Please try again.");
    }
  };

  useEffect(() => {
    if (minPrice && maxPrice && useDefaultSettings) {
      const samples = getDefaultSampleData().filter(
        (sample) =>
          Number(sample.amount) >= Number(minPrice) &&
          Number(sample.amount) <= Number(maxPrice)
      );

      const defaultAds = samples.map((sample, index) => ({
        id: Date.now() + index,
        minPrice,
        maxPrice,
        amount: sample.amount,
        charge: sample.charge,
        useDefaultSettings: true,
        isDefault: true,
      }));
      setAdsList(defaultAds);
    }
  }, [minPrice, maxPrice, useDefaultSettings]);

  const handleMinPriceChange = (value) => {
    const numValue = Number(value);
    if (numValue < 1000) {
      setMinPrice("1000");
    } else {
      setMinPrice(value);
    }
    setSelectedAmount("");
    setSelectedCharge("");
  };

  const handleMaxPriceChange = (value) => {
    const numValue = Number(value);
    if (numValue > 20000) {
      setMaxPrice("20000");
    } else {
      setMaxPrice(value);
    }
    setSelectedAmount("");
    setSelectedCharge("");
  };

  const handleAddAd = () => {
    if (minPrice && maxPrice && selectedAmount && selectedCharge) {
      const newAd = {
        id: Date.now(),
        minPrice,
        maxPrice,
        amount: selectedAmount,
        charge: selectedCharge,
        useDefaultSettings: false,
        isDefault: false,
      };

      const updatedList = adsList
        .filter((ad) => ad.isDefault || ad.amount !== selectedAmount)
        .concat(newAd);

      setAdsList(updatedList);
      setSelectedAmount("");
      setSelectedCharge("");
    }
  };

  const handleToggleChange = (newValue) => {
    setUseDefaultSettings(newValue);
    if (newValue) {
      // If turning on default settings, load default ads
      const samples = getDefaultSampleData().filter(
        (sample) =>
          Number(sample.amount) >= Number(minPrice) &&
          Number(sample.amount) <= Number(maxPrice)
      );

      const defaultAds = samples.map((sample, index) => ({
        id: Date.now() + index,
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
  };

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
              <li>Set your desired price range (₦1,000 - ₦20,000)</li>
              <li>Choose to use default settings or customize your own</li>
              <li>Select amount and charge for custom settings</li>
              <li>Review your price information in the list below</li>
              <li>Add new entries as needed</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      <div className="sticky top-0 z-10 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white flex items-center justify-between">
        <div className="flex items-center">
          <ArrowLeft
            className="h-6 w-6 mr-3"
            onClick={() => window.history.back()}
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
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-amber-900 font-semibold mb-3">Set Price Range</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-amber-700 mb-1">
                Minimum (₦)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Min (₦1,000)"
                min="1000"
                max="20000"
              />
            </div>
            <div>
              <label className="block text-sm text-amber-700 mb-1">
                Maximum (₦)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Max (₦20,000)"
                min="1000"
                max="20000"
              />
            </div>
          </div>
        </div>

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
                      onChange={(e) => {
                        setSelectedAmount(e.target.value);
                        setSelectedCharge("");
                      }}
                      className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select amount</option>
                      {getAvailableAmounts().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-amber-700 mb-1">
                      Charge
                    </label>
                    <select
                      value={selectedCharge}
                      onChange={(e) => setSelectedCharge(e.target.value)}
                      className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                      disabled={!selectedAmount}
                    >
                      <option value="">Select charge</option>
                      {selectedAmount &&
                        chargeRanges[selectedAmount].map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddAd}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-colors"
                    disabled={!selectedAmount || !selectedCharge}
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
                </div>
              </div>
            ))}
          </div>
        )}

        {adsList.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-amber-100">
            <button
              onClick={handleSubmitAds}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-colors"
            >
              Submit Ads
            </button>
          </div>
        )}
      </div>

      <HelpModal />
    </div>
  );
};

export default CreateAdsPage;

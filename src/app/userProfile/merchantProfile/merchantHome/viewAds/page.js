"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, DollarSign, RefreshCw, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import getErrorMessage from "@/app/component/error";

const MerchantAdsPage = () => {
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);

  // State for the ads data
  const [adsData, setAdsData] = useState(null);
  const [isEdited, setIsEdited] = useState(false);

  // Fetch ads data using React Query - only enabled when accessToken is available
  const { isLoading, error, refetch } = useQuery({
    queryKey: ["defaultAds"],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error("Access token not available");
      }

      const queryParams = new URLSearchParams({
        apiType: "getdefaultAds",
        token: accessToken,
      });

      const response = await fetch(`/api/user?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch ads");
      }

      // Example of the returned data
      const data = await response.json();

      console.log("Ads data:", data);
      setAdsData(data.data.data); // Set the ads data in state
      return data.data.data;
    },
    enabled: false, // Disable automatic fetching
    onError: (error) => {
      console.error("Error fetching ads:", getErrorMessage(error));
    },
  });

  // Watch for accessToken changes and trigger the query when it becomes available
  useEffect(() => {
    if (accessToken) {
      refetch();
    }
  }, [accessToken, refetch]);

  const handleChargeChange = (index, newCharge) => {
    if (!adsData || !adsData.breaks) return;

    const updatedBreaks = [...adsData.breaks];
    updatedBreaks[index] = {
      ...updatedBreaks[index],
      charge: parseInt(newCharge) || 0,
    };

    setAdsData({
      ...adsData,
      breaks: updatedBreaks,
    });

    setIsEdited(true);
  };

  const handleSave = () => {
    // Here you would typically make an API call to save the changes
    console.log("Saving updated charges:", adsData);
    setIsEdited(false);
  };

  const handleReset = () => {
    router.push("/userProfile/merchantProfile/merchantHome/createAds");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-amber-50 items-center justify-center">
        <div className="text-amber-600 text-lg">
          Loading ads configuration...
        </div>
      </div>
    );
  }

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
            <h1 className="text-lg font-semibold">My Ads Configuration</h1>
          </div>
        </div>

        {/* Main Content - with padding for fixed header and footer */}
        <div className="flex-1 overflow-auto pt-16 pb-24 px-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 mt-8">
              <div className="text-red-600 mb-4">{getErrorMessage(error)}</div>
              <button
                onClick={() => accessToken && refetch()}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : !adsData ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-amber-600">
                {accessToken
                  ? "No ads configuration available"
                  : "Waiting for authorization..."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Range Info */}
              <div className="bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
                <div className="text-sm text-amber-600 mb-1">
                  Overall Price Range
                </div>
                <div className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold text-amber-900">
                    ₦{adsData.min?.toLocaleString() || 0} - ₦
                    {adsData.max?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* Price Breaks */}
              <div className="mb-2 text-md font-medium text-amber-800">
                Price Break Points
              </div>

              {adsData.breaks &&
                adsData.breaks.map((breakPoint, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md"
                  >
                    {/* Price Amount Section */}
                    <div className="mb-4">
                      <div className="text-sm text-amber-600 mb-1">
                        Amount Threshold
                      </div>
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold text-amber-900">
                          ₦{breakPoint.amount?.toLocaleString() || 0}
                          {index < adsData.breaks.length - 1
                            ? ` - ₦${
                                (
                                  adsData.breaks[index + 1].amount - 1
                                )?.toLocaleString() || 0
                              }`
                            : ``}
                        </span>
                      </div>
                    </div>

                    {/* Non-editable Charge Display */}
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-sm text-amber-600 mb-1">
                        Charge (₦)
                      </div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-100 border border-amber-200 rounded-lg px-3 py-2 text-amber-900">
                          {breakPoint.charge}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Fixed Footer with Reset and Save Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 p-4">
          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-amber-100 text-amber-700 rounded-lg font-medium transition-colors hover:bg-amber-200"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Adjust Ads</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!isEdited}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isEdited
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-amber-200 text-amber-500 cursor-not-allowed"
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MerchantAdsPage;

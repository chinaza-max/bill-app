"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import ProtectedRoute from "../../component/protect";
import getErrorMessage from "@/app/component/error";

const MerchantAccountPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    NIN: "",
    verificationType: "NIN",
    otp: "",
    verifierId: "default",
  });
  const [errors, setErrors] = useState({});
  const [isVerified, setIsVerified] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const data2 = useSelector((state) => state.user);
  const accessToken = useSelector((state) => state.user.accessToken);

  // Mutation for requesting OTP
  const requestOtpMutation = useMutation({
    mutationFn: async (ninData) => {
      const response = await fetch(`/api/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...ninData,
          apiType: "initiateNINVerify",
          accessToken: accessToken,
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json(); // Parse the error response body
        console.log(errorResponse);

        //getErrorMessage(errorResponse, router);
        throw new Error(errorResponse.message || "Failed to request OTP"); // Use the message from the response
      }

      return response.json();
    },
    onSuccess: () => {
      setShowOtpField(true);
    },
    onError: (error) => {
      // getErrorMessage(error, router);

      console.log(error);
      setErrors((prev) => ({
        ...prev,
        NIN: error.message || "Failed to request OTP",
      }));
    },
  });

  // Mutation for verifying OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (data) => {
      // Replace with your actual API endpoint
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otpCode: data.otp,
          apiType: "verifyNIN",
          accessToken: accessToken,
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.log(errorResponse);
        throw new Error(errorResponse.message || "OTP verification failed");
      }

      return response.json();
    },
    onSuccess: () => {
      setIsVerified(true);

      router.push(`/userProfile/merchantProfile/merchantProfile2`);
      // Notify server about successful verification
    },
    onError: (error) => {
      console.log(error);
      setErrors((prev) => ({
        ...prev,
        otp: error.message || "OTP verification failed",
      }));
    },
  });

  const validateNinForm = () => {
    const newErrors = {};
    if (!formData.NIN.trim()) {
      newErrors.NIN = "NIN is required";
    } else if (formData.NIN.length !== 11) {
      newErrors.NIN = "NIN must be 11 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpForm = () => {
    const newErrors = {};
    if (!formData.otp.trim()) {
      newErrors.otp = "OTP is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRequestOtp = () => {
    if (validateNinForm()) {
      requestOtpMutation.mutate({
        NIN: formData.NIN,
        verificationType: formData.verificationType,
      });
    }
  };

  const handleVerifyOtp = () => {
    if (validateOtpForm()) {
      verifyOtpMutation.mutate({
        NIN: formData.NIN,
        otp: formData.otp,
        verificationType: formData.verificationType,
      });
    }
  };

  useEffect(() => {
    router.prefetch("userProfile/merchantProfile/merchantProfile2");
  }, [router]);

  const isLoading = requestOtpMutation.isPending || verifyOtpMutation.isPending;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => router.back()}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">NIN Verification</h1>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 px-4 py-6 overflow-auto">
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">
                    NIN Number
                  </label>
                  <input
                    type="text"
                    name="NIN"
                    value={formData.NIN}
                    onChange={handleInputChange}
                    disabled={showOtpField}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      errors.NIN ? "border-red-500" : "border-amber-200"
                    } focus:outline-none focus:border-amber-500 ${
                      showOtpField ? "bg-gray-100" : ""
                    }`}
                    placeholder="Enter your 11-digit NIN"
                    maxLength={11}
                  />
                  {errors.NIN && (
                    <p className="mt-1 text-sm text-red-500">{errors.NIN}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">
                    Verification Type
                  </label>
                  <select
                    name="verificationType"
                    value={formData.verificationType}
                    onChange={handleInputChange}
                    disabled={showOtpField}
                    className={`w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:border-amber-500 ${
                      showOtpField ? "bg-gray-100" : ""
                    }`}
                  >
                    <option value="NIN">NIN</option>
                    <option value="vNIN">vNIN</option>
                  </select>
                </div>

                {showOtpField && (
                  <div>
                    <label className="block text-sm font-medium text-amber-900 mb-1">
                      OTP
                    </label>
                    <input
                      type="number"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors.otp ? "border-red-500" : "border-amber-200"
                      } focus:outline-none focus:border-amber-500`}
                      placeholder="Enter the OTP you received"
                    />
                    {errors.otp && (
                      <p className="mt-1 text-sm text-red-500">{errors.otp}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-green-700">
                  NIN verification successful!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="px-4 py-3">
          {!showOtpField ? (
            <button
              onClick={handleRequestOtp}
              disabled={isLoading || isVerified}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isLoading || isVerified
                  ? "bg-amber-200 text-amber-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Request OTP"
              )}
            </button>
          ) : (
            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || isVerified}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isLoading || isVerified
                  ? "bg-amber-200 text-amber-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  <span>Verifying...</span>
                </div>
              ) : isVerified ? (
                "Verified"
              ) : (
                "Verify OTP"
              )}
            </button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MerchantAccountPage;

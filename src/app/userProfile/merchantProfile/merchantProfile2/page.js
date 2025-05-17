"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import getErrorMessage from "@/app/component/error";
import ProtectedRoute from "@/app/component/protect";

const MerchantInfoPage = () => {
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);

  const [formData, setFormData] = useState({
    displayName: "",
    tel: "",
  });
  const [errors, setErrors] = useState({});

  // Mutation for updating merchant profile
  const updateMerchantMutation = useMutation({
    mutationFn: async (merchantData) => {
      const response = await fetch(`/api/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...merchantData,
          apiType: "updateMerchantProfile",
          accessToken: accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update merchant profile"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Navigate to the next page on successful submission
      router.push("/userProfile/merchantProfile/merchantProfile3");
    },
    onError: (error) => {
      // Handle errors
      const errorMessage = getErrorMessage(error);
      setErrors({ submission: errorMessage });
    },
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    } else if (formData.displayName.toLowerCase().includes("fido")) {
      newErrors.displayName =
        "The word 'fido' is not allowed in the display name.";
    } else if (formData.displayName.length > 12) {
      newErrors.displayName = "Display name cannot exceed 11 characters";
    }

    if (!formData.tel.trim()) {
      newErrors.tel = "Phone number is required";
    } else if (!/^\d{11}$/.test(formData.tel)) {
      newErrors.tel = "Enter a valid 11-digit phone number";
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

  const handleSubmit = () => {
    if (validateForm()) {
      updateMerchantMutation.mutate(formData);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => router.back()}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Merchant Information</h1>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 overflow-auto">
          <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">
                    Display Name (max 11 characters)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                        errors.displayName
                          ? "border-red-500"
                          : "border-amber-200"
                      } focus:outline-none focus:border-amber-500`}
                      placeholder="Enter business/merchant name"
                      maxLength={11}
                    />
                  </div>
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.displayName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                    <input
                      type="tel"
                      name="tel"
                      value={formData.tel}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                        errors.tel ? "border-red-500" : "border-amber-200"
                      } focus:outline-none focus:border-amber-500`}
                      placeholder="Enter 11-digit phone number"
                      maxLength={11}
                    />
                  </div>
                  {errors.tel && (
                    <p className="mt-1 text-sm text-red-500">{errors.tel}</p>
                  )}
                </div>

                {errors.submission && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submission}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <button
            onClick={handleSubmit}
            disabled={updateMerchantMutation.isPending}
            className="w-full py-3 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
          >
            {updateMerchantMutation.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MerchantInfoPage;

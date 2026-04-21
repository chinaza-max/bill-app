"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Loader2, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/store/slice"; // ← adjust path if needed
import getErrorMessage from "@/app/component/error";
import ProtectedRoute from "@/app/component/protect";

const STEPS = [
  { label: "NIN Verify",  key: "isNinVerified" },
  { label: "NIN Image",   key: "isninImageVerified" },
  { label: "Profile",     key: "isDisplayNameMerchantSet" },
  { label: "Face Verify", key: "isFaceVerified" },
];
const CURRENT_STEP_INDEX = 2;

// ─── Reusable navigator ───────────────────────────────────────────────────────
export const navigateToNextStep = (router, userData, overrides = {}, method = "replace") => {
  const merged = { ...userData, ...overrides };
  const { isNinVerified, isninImageVerified, isDisplayNameMerchantSet, isFaceVerified, MerchantProfile } = merged;
  const nav = method === "push" ? router.push.bind(router) : router.replace.bind(router);

  if (!isNinVerified)            { nav("/userProfile/merchantProfile");                        return; }
  if (!isninImageVerified)       { nav("/userProfile/merchantProfile/merchantProfile1");        return; }
  if (!isDisplayNameMerchantSet) { nav("/userProfile/merchantProfile/merchantProfile2");        return; }
  if (!isFaceVerified)           { nav("/userProfile/merchantProfile/merchantProfile3");        return; }

  const s = MerchantProfile?.accountStatus;
  if (s === "processing")     nav("/userProfile/merchantProfile/merchantProfile4");
  else if (s === "rejected")  nav("/userProfile/merchantProfile/merchantProfile5");
  else if (s === "suspended") nav("/userProfile/merchantProfile/merchantProfile6");
  else                        nav("/userProfile/merchantProfile/merchantHome");
};

// ─── Progress Stepper ─────────────────────────────────────────────────────────
const ProgressStepper = ({ userData }) => (
  <div className="bg-white px-4 py-3 border-b border-amber-100 shadow-sm">
    <div className="flex items-center justify-between max-w-md mx-auto">
      {STEPS.map((step, i) => {
        const isDone    = userData?.[step.key] === true;
        const isCurrent = i === CURRENT_STEP_INDEX && !isDone;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone ? "bg-green-500 text-white"
                : isCurrent ? "bg-amber-500 text-white ring-2 ring-amber-200"
                : "bg-amber-100 text-amber-400"
              }`}>
                {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${
                isDone ? "text-green-600" : isCurrent ? "text-amber-700" : "text-amber-300"
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all ${isDone ? "bg-green-400" : "bg-amber-100"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const MerchantInfoPage = () => {
  const router      = useRouter();
  const dispatch    = useDispatch();
  const accessToken = useSelector((state) => state.user.accessToken);
  const myUserData  = useSelector((state) => state.user.user);
  const userData    = myUserData?.user;

  // Always-fresh refs — prevents stale closure in onSuccess
  const myUserDataRef = useRef(myUserData);
  const userDataRef   = useRef(userData);
  useEffect(() => {
    myUserDataRef.current = myUserData;
    userDataRef.current   = userData;
  }, [myUserData, userData]);

  const [formData, setFormData] = useState({ displayName: "", tel: "" });
  const [errors, setErrors]     = useState({});

  // ─── Mount guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData) return;
    const { isNinVerified, isninImageVerified, isDisplayNameMerchantSet } = userData;
    if (!isNinVerified || !isninImageVerified) {
      navigateToNextStep(router, userData, {}, "replace");
      return;
    }
    if (isDisplayNameMerchantSet) {
      navigateToNextStep(router, userData, {}, "replace");
    }
    // isNinVerified=true & isninImageVerified=true & isDisplayNameMerchantSet=false → stay ✓
  }, [userData, router]);

  // ─── Mutation ─────────────────────────────────────────────────────────────
  const updateMerchantMutation = useMutation({
    mutationFn: async (merchantData) => {
      const response = await fetch(`/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...merchantData, apiType: "updateMerchantProfileWithoutFile", accessToken }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update merchant profile");
      }
      return response.json();
    },
    onSuccess: () => {
      // ── ROOT FIX ─────────────────────────────────────────────────────────
      // Patch Redux with isDisplayNameMerchantSet=true BEFORE navigating.
      // The next page (merchantProfile3) mounts and its guard reads Redux
      // synchronously — if we navigate first with stale Redux, it bounces
      // the user back here.
      dispatch(setUser({
        ...myUserDataRef.current,             // preserve accessToken and all top-level fields
        user: {
          ...userDataRef.current,             // preserve all existing user flags
          isDisplayNameMerchantSet: true,     // ← patch the flag that just completed
        },
      }));
      // ─────────────────────────────────────────────────────────────────────

      navigateToNextStep(
        router,
        { ...userDataRef.current, isDisplayNameMerchantSet: true },
        {},
        "push"
      );
    },
    onError: (error) => {
      setErrors({ submission: getErrorMessage(error) });
    },
  });

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.displayName.trim())                              newErrors.displayName = "Display name is required";
    else if (formData.displayName.toLowerCase().includes("fido")) newErrors.displayName = "The word 'fido' is not allowed.";
    else if (formData.displayName.length > 12)                    newErrors.displayName = "Display name cannot exceed 11 characters";
    if (!formData.tel.trim())                                      newErrors.tel = "Phone number is required";
    else if (!/^\d{11}$/.test(formData.tel))                      newErrors.tel = "Enter a valid 11-digit phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">Merchant Information</h1>
              <p className="text-xs text-white/70 leading-tight">Step 3 of 4 — Merchant Setup</p>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper userData={userData} />

        {/* Form */}
        <div className="flex-1 px-4 py-6 overflow-auto">
          <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">
                  Display Name (max 11 characters)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                  <input
                    type="text" name="displayName" value={formData.displayName}
                    onChange={handleInputChange} maxLength={11}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.displayName ? "border-red-500" : "border-amber-200"
                    } focus:outline-none focus:border-amber-500`}
                    placeholder="Enter business/merchant name"
                  />
                </div>
                {errors.displayName && <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                  <input
                    type="tel" name="tel" value={formData.tel}
                    onChange={handleInputChange} maxLength={11}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.tel ? "border-red-500" : "border-amber-200"
                    } focus:outline-none focus:border-amber-500`}
                    placeholder="Enter 11-digit phone number"
                  />
                </div>
                {errors.tel && <p className="mt-1 text-sm text-red-500">{errors.tel}</p>}
              </div>

              {errors.submission && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submission}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <button
            onClick={() => validateForm() && updateMerchantMutation.mutate(formData)}
            disabled={updateMerchantMutation.isPending}
            className="w-full py-3 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
          >
            {updateMerchantMutation.isPending
              ? <span className="flex items-center justify-center"><Loader2 className="h-5 w-5 mr-2 animate-spin" />Submitting...</span>
              : "Continue"
            }
          </button>
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default MerchantInfoPage;
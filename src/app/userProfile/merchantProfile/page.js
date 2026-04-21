"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/store/slice"; // ← adjust path if needed
import ProtectedRoute from "../../component/protect";
import getErrorMessage from "@/app/component/error";

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "NIN Verify",  key: "isNinVerified" },
  { label: "NIN Image",   key: "isninImageVerified" },
  { label: "Profile",     key: "isDisplayNameMerchantSet" },
  { label: "Face Verify", key: "isFaceVerified" },
];
const CURRENT_STEP_INDEX = 0;

// ─── Reusable navigator ───────────────────────────────────────────────────────
export const navigateToNextStep = (router, userData, overrides = {}, method = "replace") => {
  const merged = { ...userData, ...overrides };
  const {
    isNinVerified,
    isninImageVerified,
    isDisplayNameMerchantSet,
    isFaceVerified,
    MerchantProfile,
  } = merged;

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
              }`}>
                {step.label}
              </span>
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
const MerchantAccountPage = () => {
  const router      = useRouter();
  const dispatch    = useDispatch();
  const accessToken = useSelector((state) => state.user.accessToken);
  const myUserData  = useSelector((state) => state.user.user); // full object: { user: {...}, accessToken, ... }
  const userData    = myUserData?.user;                        // the inner user flags

  // Always-fresh ref — prevents stale closure in onSuccess
  const myUserDataRef = useRef(myUserData);
  const userDataRef   = useRef(userData);
  useEffect(() => {
    myUserDataRef.current = myUserData;
    userDataRef.current   = userData;
  }, [myUserData, userData]);

  const [formData, setFormData] = useState({
    NIN: "",
    verificationType: "NIN",
    otp: "",
    verifierId: "default",
  });
  const [errors, setErrors]             = useState({});
  const [isVerified, setIsVerified]     = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);

  // ─── Mount guard ──────────────────────────────────────────────────────────
  // Because we now update Redux BEFORE navigating (see onSuccess below),
  // this guard always reads up-to-date flags — no hydration delay needed.
  useEffect(() => {
    if (!userData) return;
    if (userData.isNinVerified) {
      navigateToNextStep(router, userData, {}, "replace");
    }
  }, [userData, router]);

  // ─── Request OTP ──────────────────────────────────────────────────────────
  const requestOtpMutation = useMutation({
    mutationFn: async (ninData) => {
      const response = await fetch(`/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ninData, apiType: "initiateNINVerify", accessToken }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to request OTP");
      }
      return response.json();
    },
    onSuccess: () => setShowOtpField(true),
    onError: (error) => setErrors((prev) => ({ ...prev, NIN: error.message || "Failed to request OTP" })),
  });

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  const verifyOtpMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpCode: data.otp, apiType: "verifyNIN", accessToken }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "OTP verification failed");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsVerified(true);

      // ── ROOT FIX ─────────────────────────────────────────────────────────
      // Patch Redux with isNinVerified=true BEFORE calling router.push.
      //
      // Why this works:
      //   Before this fix, navigation happened first. The next page (merchantProfile1)
      //   mounted and its guard immediately read Redux — which still had
      //   isNinVerified=false — and sent the user back here.
      //
      //   Now we update Redux synchronously first. By the time the next page
      //   mounts and its guard runs, Redux already has isNinVerified=true,
      //   so the guard does NOT redirect back.
      //
      // Shape of state.user.user (myUserData):
      //   { user: { isNinVerified, isninImageVerified, ... }, accessToken, ... }
      // setUser expects the same shape, so we spread and patch just the flag.
      dispatch(setUser({
        ...myUserDataRef.current,         // keep accessToken and all other top-level fields
        user: {
          ...userDataRef.current,         // keep all existing user flags
          isNinVerified: true,            // ← patch the flag that just completed
        },
      }));
      // ─────────────────────────────────────────────────────────────────────

      // Navigate AFTER Redux is updated
      navigateToNextStep(
        router,
        { ...userDataRef.current, isNinVerified: true },
        {},
        "push" // "push" not "replace" — keeps history so back-button works
      );
    },
    onError: (error) => setErrors((prev) => ({ ...prev, otp: error.message || "OTP verification failed" })),
  });

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateNinForm = () => {
    const newErrors = {};
    if (!formData.NIN.trim())            newErrors.NIN = "NIN is required";
    else if (formData.NIN.length !== 11) newErrors.NIN = "NIN must be 11 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpForm = () => {
    const newErrors = {};
    if (!formData.otp.trim()) newErrors.otp = "OTP is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRequestOtp = () => {
    if (validateNinForm()) {
      requestOtpMutation.mutate({ NIN: formData.NIN, verificationType: formData.verificationType });
    }
  };

  const handleVerifyOtp = () => {
    if (validateOtpForm()) {
      verifyOtpMutation.mutate({ NIN: formData.NIN, otp: formData.otp, verificationType: formData.verificationType });
    }
  };

  const isLoading = requestOtpMutation.isPending || verifyOtpMutation.isPending;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">NIN Verification</h1>
              <p className="text-xs text-white/70 leading-tight">Step 1 of 4 — Merchant Setup</p>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper userData={userData} />

        {/* Form */}
        <div className="flex-1 px-4 py-6 overflow-auto">
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">

                {/* NIN Input */}
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">NIN Number</label>
                  <input
                    type="text"
                    name="NIN"
                    value={formData.NIN}
                    onChange={handleInputChange}
                    disabled={showOtpField}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      errors.NIN ? "border-red-500" : "border-amber-200"
                    } focus:outline-none focus:border-amber-500 ${showOtpField ? "bg-gray-100" : ""}`}
                    placeholder="Enter your 11-digit NIN"
                    maxLength={11}
                  />
                  {errors.NIN && <p className="mt-1 text-sm text-red-500">{errors.NIN}</p>}
                </div>

                {/* Verification Type */}
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Verification Type</label>
                  <select
                    name="verificationType"
                    value={formData.verificationType}
                    onChange={handleInputChange}
                    disabled={showOtpField}
                    className={`w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:border-amber-500 ${showOtpField ? "bg-gray-100" : ""}`}
                  >
                    <option value="NIN">NIN</option>
                    <option value="vNIN">vNIN</option>
                  </select>
                </div>

                {/* OTP */}
                {showOtpField && (
                  <div>
                    <label className="block text-sm font-medium text-amber-900 mb-1">OTP</label>
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
                    {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp}</p>}
                  </div>
                )}
              </div>
            </div>

            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-green-700">NIN verification successful!</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
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
              {isLoading
                ? <div className="flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5 mr-2" /><span>Processing...</span></div>
                : "Request OTP"}
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
              {isLoading
                ? <div className="flex items-center justify-center"><Loader2 className="animate-spin h-5 w-5 mr-2" /><span>Verifying...</span></div>
                : isVerified ? "Verified" : "Verify OTP"}
            </button>
          )}
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default MerchantAccountPage;
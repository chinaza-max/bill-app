"use client";

import React, { useState, useEffect } from "react";
import { X, Delete, ArrowRight, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEnterPassCode } from "@/hooks/useAuth";
import { Dosis } from "next/font/google";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDispatch } from "react-redux";
import { setUser, setPasscodeStatus } from "@/store/slice";
import { encryptUserData } from "../../utils/data-encryption";

import {
  encryptData,
  decryptData,
  storeEncryptedData,
  getEncryptedDataFromStorage,
  getDecryptedData,
} from "../../utils/encryption";
import getErrorMessage from "@/app/component/error";

const dosis = Dosis({ subsets: ["latin"], weight: ["400", "600", "700"] });

const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_ATTEMPTS = 7;
const RESET_BUTTON_THRESHOLD = 3;

const SecureLogin = () => {
  const [pin, setPin] = useState("");
  const [numbers, setNumbers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);
  
  const router = useRouter();
  const dispatch = useDispatch();
  const { mutate, isLoading, isError, error, isSuccess, reset } =
    useEnterPassCode(async (data) => {
      dispatch(
        setUser({
          user: data.data.data.modifiedUser,
          accessToken: data.data.data.accessToken,
          isAuthenticated: true,
        })
      );

      dispatch(
        setPasscodeStatus({
          isPasscodeEntered: true,
        })
      );

      const details = {
        emailAddress: data.data.data.modifiedUser.emailAddress,
        firstName: data.data.data.modifiedUser.firstName,
        lastName: data.data.data.modifiedUser.lastName,
        phoneNumber: data.data.data.modifiedUser.phoneNumber,
        imageUrl: data.data.data.modifiedUser.imageUrl,
        merchantActivated: data.data.data.modifiedUser.merchantActivated,
      };

      localStorage.setItem("user", JSON.stringify(details));

      const stateData = {
        isPasscodeEntered: true,
        isAuthenticated: true,
        accessToken: data.data.data.accessToken,
      };

      const encryptedDatas = encryptUserData(stateData);

      localStorage.setItem("userData", encryptedDatas);
      
      // Reset attempts on successful login
      setAttempts(0);
      localStorage.removeItem("pinAttempts");
      localStorage.removeItem("lockoutEndTime");
    });

  // Load attempts and lockout state from localStorage
  useEffect(() => {
    const storedAttempts = localStorage.getItem("pinAttempts");
    const storedLockoutTime = localStorage.getItem("lockoutEndTime");
    
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts, 10));
    }
    
    if (storedLockoutTime) {
      const lockoutTime = parseInt(storedLockoutTime, 10);
      const now = Date.now();
      
      if (now < lockoutTime) {
        setIsLockedOut(true);
        setLockoutEndTime(lockoutTime);
      } else {
        // Lockout expired, clear it
        localStorage.removeItem("lockoutEndTime");
        localStorage.removeItem("pinAttempts");
        setAttempts(0);
      }
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut || !lockoutEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = lockoutEndTime - now;

      if (remaining <= 0) {
        setIsLockedOut(false);
        setLockoutEndTime(null);
        setAttempts(0);
        localStorage.removeItem("lockoutEndTime");
        localStorage.removeItem("pinAttempts");
        clearInterval(interval);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut, lockoutEndTime]);

  useEffect(() => {
    if (isSuccess) {
      router.push(`/home`);
    }
  }, [isSuccess]);

  useEffect(() => {
    randomizeNumbers();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      reset();
      setIsSubmitting(false);
    }, 10000);
  }, [error]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === 4 && !isSubmitting && !isLoading && !isLockedOut) {
      handleSubmit();
    }
  }, [pin, isSubmitting, isLoading, isLockedOut]);

  // Handle failed attempts
  useEffect(() => {
    if (isError) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem("pinAttempts", newAttempts.toString());
      
      // Check if max attempts reached
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_DURATION;
        setIsLockedOut(true);
        setLockoutEndTime(lockoutTime);
        localStorage.setItem("lockoutEndTime", lockoutTime.toString());
      }
      
      setIsSubmitting(false);
      setPin("");
    }
  }, [isError]);

  const randomizeNumbers = () => {
    const shuffled = [...Array(10).keys()]
      .map((n) => n.toString())
      .sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
  };

  const handleNumberClick = (num) => {
    if (pin.length < 4 && !isSubmitting && !isLoading && !isLockedOut) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (!isSubmitting && !isLoading && !isLockedOut) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isSubmitting && !isLoading && !isLockedOut) {
      setPin("");
      randomizeNumbers();
    }
  };

  const handleBack = () => {
    router.push('/sign-in');
  };

  const handleResetPin = async () => {
    const storedEmail = getDecryptedData("emailEncrypt");
    
    if (!storedEmail) {
      setResetError("No email found. Please sign in again.");
      return;
    }

    setIsResetting(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrPhone: storedEmail,
          type: 'user',
          apiType: 'sendPinResetOtp',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        // Optionally redirect to OTP verification page
        setTimeout(() => {
          router.push('/sign-in');
        }, 4000);
      } else {
        setResetError(data.message || "Failed to send reset OTP. Please try again.");
      }
    } catch (error) {
      console.error("Reset PIN error:", error);
      setResetError("Network error. Please check your connection and try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async () => {
    if (pin.length !== 4 || isSubmitting || isLoading || isLockedOut) {
      return;
    }

    setIsSubmitting(true);

    const storedEmail = getDecryptedData("emailEncrypt");

    if (storedEmail) {
      try {
        mutate({
          passCode: pin,
          emailAddress: storedEmail,
        });
      } catch (error) {
        console.error("Decryption or submission error:", error);
        setIsSubmitting(false);
      } finally {
        setTimeout(() => {
          if (!isSuccess) {
            randomizeNumbers();
            setPin("");
          }
        }, 1000);
      }
    } else {
      console.warn("No encrypted email found in storage");
      setIsSubmitting(false);
      return null;
    }
  };

  useEffect(() => {
    router.prefetch("home");
  }, [router]);

  const isInputDisabled = isSubmitting || isLoading || isLockedOut;
  const showLoading = isSubmitting || isLoading;
  const showResetButton = attempts >= RESET_BUTTON_THRESHOLD && !isLockedOut;

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-6 relative">
      {/* Back Arrow */}
      <button
        onClick={handleBack}
        disabled={isInputDisabled}
        className={`absolute top-4 left-4 z-10 p-2 rounded-full transition-colors ${
          isInputDisabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-sm"
        }`}
      >
        <ArrowLeft size={24} />
      </button>

      {/* Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p className="text-gray-600 font-medium">Verifying PIN...</p>
          </div>
        </div>
      )}

      {/* Logo Section */}
      <div className="mt-16 mb-4 flex flex-col items-center">
        <div className="w-20 h-20 relative mb-3">
          <Image
            src="/icon.png"
            alt="Company Logo"
            className="object-contain"
            sizes="(max-width: 80px) 100vw, 80px"
            priority
            width={100}
            height={100}
          />
        </div>
        <div className={`${dosis.className} text-2xl text-gray-800 text-center`}>
          Unlocking Convenience
        </div>
      </div>

      {/* Main Container */}
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 w-full max-w-sm"
        style={{ position: "absolute", bottom: "50px" }}
      >
        {/* Lockout Alert */}
        {isLockedOut && (
          <Alert variant="destructive" className="mb-6 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Temporarily Locked</AlertTitle>
            <AlertDescription>
              Too many failed attempts. Please try again in {formatTime(remainingTime)}.
            </AlertDescription>
          </Alert>
        )}

        {/* Reset Success Alert */}
        {resetSuccess && (
          <Alert className="mb-6 border-emerald-500 bg-emerald-50">
            <AlertTitle className="text-emerald-700">Reset OTP Sent</AlertTitle>
            <AlertDescription className="text-emerald-600">
              Check your email for the reset link and click on it . Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {/* Reset Error Alert */}
        {resetError && (
          <Alert variant="destructive" className="mb-6 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Reset Failed</AlertTitle>
            <AlertDescription>{resetError}</AlertDescription>
          </Alert>
        )}

        {/* Login Error Alert */}
        {isError && !isLockedOut && (
          <Alert variant="destructive" className="mb-6 border-red-500">
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>
              {getErrorMessage(error, router)}
              <div className="mt-2 text-sm">
                Attempts: {attempts}/{MAX_ATTEMPTS}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-700">
            Enter 4-Digit PIN
          </h2>
          <button
            onClick={handleClear}
            disabled={isInputDisabled}
            className={`transition-colors ${
              isInputDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center space-x-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? showLoading
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-emerald-600 scale-105"
                  : "border border-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isInputDisabled}
              className={`border border-gray-200 text-gray-700 rounded-md py-3 text-lg font-medium 
                         transition-all duration-150
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 ${
                           isInputDisabled
                             ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                             : "bg-white hover:border-emerald-600 hover:text-emerald-600 active:bg-emerald-50"
                         }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={isInputDisabled}
            className={`border border-gray-200 rounded-md py-3
                     transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50
                     flex items-center justify-center ${
                       isInputDisabled
                         ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                         : "bg-white text-gray-600 hover:border-emerald-600 hover:text-emerald-600 active:bg-emerald-50"
                     }`}
          >
            <Delete size={18} />
          </button>
          <div className="bg-gray-100 rounded-md py-3 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Auto Submit</span>
          </div>
        </div>

        {/* Reset PIN Button */}
        {showResetButton && (
          <button
            onClick={handleResetPin}
            disabled={isResetting || isLockedOut}
            className={`w-full mb-4 py-3 rounded-md text-sm font-medium transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                       flex items-center justify-center ${
                         isResetting || isLockedOut
                           ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                           : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                       }`}
          >
            {isResetting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Sending Reset OTP...
              </>
            ) : (
              "Forgot PIN? Reset Now"
            )}
          </button>
        )}

        <p className="text-xs text-gray-400 text-center">
          {showLoading
            ? "Verifying your PIN..."
            : isLockedOut
            ? "Account locked due to multiple failed attempts"
            : "Enhanced security: Keypad layout changes automatically"}
        </p>
      </div>
    </div>
  );
};

export default SecureLogin;
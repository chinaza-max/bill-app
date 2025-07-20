"use client";

import React, { useState, useEffect } from "react";
import { X, Delete, ArrowRight, Loader2 } from "lucide-react";
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

const SecureLogin = () => {
  const [pin, setPin] = useState("");
  const [numbers, setNumbers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    });

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
    if (pin.length === 4 && !isSubmitting && !isLoading) {
      handleSubmit();
    }
  }, [pin, isSubmitting, isLoading]);

  const randomizeNumbers = () => {
    const shuffled = [...Array(10).keys()]
      .map((n) => n.toString())
      .sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
  };

  const handleNumberClick = (num) => {
    if (pin.length < 4 && !isSubmitting && !isLoading) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (!isSubmitting && !isLoading) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isSubmitting && !isLoading) {
      setPin("");
      randomizeNumbers();
    }
  };

  const handleSubmit = async () => {
    // Prevent submission if PIN is empty or less than 4 digits
    if (pin.length !== 4 || isSubmitting || isLoading) {
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
        // Don't randomize numbers immediately, wait for response
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

  // Reset submitting state when there's an error
  useEffect(() => {
    if (isError) {
      setIsSubmitting(false);
      setPin("");
    }
  }, [isError]);

  // Determine if inputs should be disabled
  const isInputDisabled = isSubmitting || isLoading;
  const showLoading = isSubmitting || isLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-6 relative">
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
      <div className="mt-4 relative">
        <div className="w-20 h-20 relative">
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
      </div>
      <div className={`${dosis.className} text-2xl text-gray-800`}>
        Unlocking Convenience
      </div>

      {/* Main Container */}
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 w-full max-w-sm"
        style={{ position: "absolute", bottom: "50px" }}
      >
        {isError && (
          <Alert variant="destructive" className="mb-6 border-red-500">
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>
              {getErrorMessage(error, router)}
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

        <p className="text-xs text-gray-400 text-center">
          {showLoading
            ? "Verifying your PIN..."
            : "Enhanced security: Keypad layout changes automatically"}
        </p>
      </div>
    </div>
  );
};

export default SecureLogin;

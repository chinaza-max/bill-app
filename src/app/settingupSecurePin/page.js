"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useUpdatePin } from "@/hooks/useUser";
import getErrorMessage from "@/app/component/error";
import { useSelector } from "react-redux";

const SecureKeypad = () => {
  const [firstPasscode, setFirstPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [keypadNumbers, setKeypadNumbers] = useState([]);
  const [stage, setStage] = useState("first"); // 'first' or 'confirm'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);

  const {
    mutate: updateUser,
    isLoading: isUpdating,
    isError: hasError,
    error: updateError,
    isSuccess: updateSuccess,
  } = useUpdatePin();

  // Randomize keypad on mount and when switching between stages
  useEffect(() => {
    const numbers = [...Array(10).keys()];
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setKeypadNumbers(numbers);
  }, [stage]);

  const handleNumberClick = (number) => {
    setError("");
    if (stage === "first" && firstPasscode.length < 4) {
      setFirstPasscode((prev) => prev + number);
    } else if (stage === "confirm" && confirmPasscode.length < 4) {
      setConfirmPasscode((prev) => prev + number);
    }
  };

  const handleDelete = () => {
    if (stage === "first") {
      setFirstPasscode((prev) => prev.slice(0, -1));
    } else {
      setConfirmPasscode((prev) => prev.slice(0, -1));
    }
    setError("");
  };

  const handleContinue = () => {
    if (stage === "first" && firstPasscode.length === 4) {
      setStage("confirm");
      setConfirmPasscode("");
    } else if (stage === "confirm" && confirmPasscode.length === 4) {
      if (firstPasscode === confirmPasscode) {
        updateUser({
          passCode: firstPasscode,
          accessToken,
        });
      } else {
        setError("Passcodes do not match. Please try again.");
        setStage("first");
        setFirstPasscode("");
        setConfirmPasscode("");
      }
    }
  };

  useEffect(() => {
    if (updateSuccess) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/secureInput`);
      }, 2000);
    }
  }, [updateSuccess]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            {stage === "first" ? "Set Your Passcode" : "Confirm Your Passcode"}
          </h2>

          <p className="mt-2 text-gray-600">
            {stage === "first"
              ? "Choose a 4-digit passcode to secure your account"
              : "Please re-enter your passcode to confirm"}
          </p>
        </div>

        {/* Server Error Alert */}
        {hasError && (
          <Alert variant="destructive" className="mb-6 border-red-500">
            <AlertTitle>Setting pin Failed</AlertTitle>
            <AlertDescription>
              {getErrorMessage(updateError, router)}
            </AlertDescription>
          </Alert>
        )}

        {/* Passcode Display */}
        <div className="flex justify-center space-x-4 my-8">
          {Array(4)
            .fill(0)
            .map((_, i) => {
              const code = stage === "first" ? firstPasscode : confirmPasscode;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    code.length > i
                      ? "bg-green-600 border-green-600"
                      : "border-gray-300"
                  }`}
                />
              );
            })}
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-4">
          {keypadNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handleNumberClick(number)}
              className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {number}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="p-4 text-base font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100"
          >
            Delete
          </button>
          <button
            onClick={handleContinue}
            disabled={
              (stage === "first" && firstPasscode.length !== 4) ||
              (stage === "confirm" && confirmPasscode.length !== 4)
            }
            className={`p-4 text-base font-medium rounded-lg ${
              (stage === "first" && firstPasscode.length === 4) ||
              (stage === "confirm" && confirmPasscode.length === 4)
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mt-4 border-green-600">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your passcode has been set successfully!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default SecureKeypad;

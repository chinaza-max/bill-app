"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ChangePin = () => {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [keypadNumbers, setKeypadNumbers] = useState([]);
  const [stage, setStage] = useState("verify"); // 'verify', 'new', or 'confirm'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get user data and accessToken from Redux store
  const myUserData = useSelector((state) => state.user.user);
  const accessToken = useSelector((state) => state.user.accessToken);
  const emailAddress = myUserData?.user?.emailAddress;

  // Store accessToken and emailAddress in refs so they can be accessed in mutation functions
  // without violating the rules of hooks
  useEffect(() => {
    if (accessToken) {
      queryClient.setQueryData(["accessToken"], accessToken);
      console.log("Access token updated and stored in query cache");
    }

    if (emailAddress) {
      queryClient.setQueryData(["emailAddress"], emailAddress);
    }
  }, [accessToken, emailAddress, queryClient]);

  // Verify PIN mutation
  const VerifyPinMutation = useMutation({
    mutationFn: async (pin) => {
      // Get stored values from query cache instead of using useSelector
      const storedEmailAddress = queryClient.getQueryData(["emailAddress"]);

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiType: "enterPassCode",
          emailAddress: storedEmailAddress,
          passCode: pin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify PIN");
      }

      return response.json();
    },
    onSuccess: () => {
      setStage("new");
      setCurrentPin("");
    },
    onError: () => {
      setError("Incorrect PIN. Please try again.");
      setCurrentPin("");
    },
  });

  // Update PIN mutation
  const UpdatePinMutation = useMutation({
    mutationFn: async (newPin) => {
      // Get stored token from query cache instead of using useSelector
      const storedToken = queryClient.getQueryData(["accessToken"]);

      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: storedToken,
          apiType: "updatePin",
          passCode: newPin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update PIN");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["user-data"] });
      setTimeout(() => {
        router.push("/home");
      }, 1500);
    },
    onError: () => {
      setError("Failed to update PIN. Please try again.");
      setStage("new");
      setNewPin("");
      setConfirmPin("");
    },
  });

  useEffect(() => {
    randomizeKeypad();
  }, [stage]);

  const randomizeKeypad = () => {
    const numbers = [...Array(10).keys()];
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setKeypadNumbers(numbers);
  };

  const handleNumberClick = (number) => {
    setError("");
    if (stage === "verify" && currentPin.length < 4) {
      setCurrentPin((prev) => prev + number);
    } else if (stage === "new" && newPin.length < 4) {
      setNewPin((prev) => prev + number);
    } else if (stage === "confirm" && confirmPin.length < 4) {
      setConfirmPin((prev) => prev + number);
    }
  };

  const handleDelete = () => {
    setError("");
    if (stage === "verify") {
      setCurrentPin((prev) => prev.slice(0, -1));
    } else if (stage === "new") {
      setNewPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleContinue = () => {
    if (stage === "verify") {
      if (currentPin.length === 4) {
        // We can check if token is available before proceeding
        if (!accessToken) {
          setError(
            "Authentication token not available. Please try again later."
          );
          return;
        }
        VerifyPinMutation.mutate(currentPin);
      }
    } else if (stage === "new" && newPin.length === 4) {
      if (newPin === currentPin) {
        setError("New PIN must be different from current PIN");
        setNewPin("");
        return;
      }
      setStage("confirm");
    } else if (stage === "confirm" && confirmPin.length === 4) {
      if (newPin === confirmPin) {
        // Check token availability again before the update operation
        if (!accessToken) {
          setError(
            "Authentication token not available. Please try again later."
          );
          return;
        }
        UpdatePinMutation.mutate(newPin);
      } else {
        setError("PINs do not match. Please try again.");
        setStage("new");
        setNewPin("");
        setConfirmPin("");
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => router.push("/home")}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Change PIN</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                {stage === "verify"
                  ? "Enter Current PIN"
                  : stage === "new"
                  ? "Enter New PIN"
                  : "Confirm New PIN"}
              </h2>
              <p className="mt-2 text-gray-600">
                {stage === "verify"
                  ? "Please enter your current PIN to continue"
                  : stage === "new"
                  ? "Choose a new 4-digit PIN"
                  : "Please re-enter your new PIN to confirm"}
              </p>
            </div>

            {/* PIN Display */}
            <div className="flex justify-center space-x-4 my-8">
              {Array(4)
                .fill(0)
                .map((_, i) => {
                  const code =
                    stage === "verify"
                      ? currentPin
                      : stage === "new"
                      ? newPin
                      : confirmPin;
                  return (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 ${
                        code.length > i
                          ? "bg-amber-600 border-amber-600"
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
                  (stage === "verify" && currentPin.length !== 4) ||
                  (stage === "new" && newPin.length !== 4) ||
                  (stage === "confirm" && confirmPin.length !== 4) ||
                  VerifyPinMutation.isPending ||
                  UpdatePinMutation.isPending ||
                  !accessToken
                }
                className={`p-4 text-base font-medium rounded-lg ${
                  ((stage === "verify" && currentPin.length === 4) ||
                    (stage === "new" && newPin.length === 4) ||
                    (stage === "confirm" && confirmPin.length === 4)) &&
                  !VerifyPinMutation.isPending &&
                  !UpdatePinMutation.isPending &&
                  accessToken
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {VerifyPinMutation.isPending || UpdatePinMutation.isPending
                  ? "Processing..."
                  : "Continue"}
              </button>
            </div>

            {/* Token Status */}
            {!accessToken && (
              <div className="mt-4 text-center text-amber-600">
                Waiting for authentication token...
              </div>
            )}

            {/* Loading Indicator */}
            {(VerifyPinMutation.isPending || UpdatePinMutation.isPending) && (
              <div className="mt-4 text-center text-amber-600">
                Processing your request...
              </div>
            )}

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
              <Alert className="mt-4 border-amber-600">
                <Check className="h-4 w-4 text-amber-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your PIN has been changed successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ChangePin;

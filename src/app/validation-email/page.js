"use client";

import React, { useState, useRef, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useValidateEmail } from "@/hooks/useAuth";
import { useResendEmailValCode } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OTPValidation = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(20); // 5 minutes in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [showResendModal, setShowResendModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isformSub, setIsformSub] = useState(false);
  const [email, setEmail] = useState(null);

  const [isActive, setIsActive] = useState(true);
  //const email = localStorage.getItem("validationEmail");

  let {
    mutate: validateEmailMutate,
    isLoading: validateEmailLoading,
    isError: validateEmailError,
    error: validateEmailErrorMsg,
    isSuccess: validateEmailSuccess,
    reset: resetValidateEmail,
  } = useValidateEmail();

  const {
    mutate: resendValidationMutate,
    isLoading: resendValidationLoading,
    isError: resendValidationError,
    error: resendValidationErrorMsg,
    isSuccess: resendValidationSuccess,
    reset: resetResendValidation,
  } = useResendEmailValCode();

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const router = useRouter();

  // Format time left into minutes and seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const emailFromStorage = localStorage.getItem("validationEmail");
      setEmail(emailFromStorage);
    }
  }, []);
  useEffect(() => {
    let intervalId;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsResendDisabled(false);
            setIsActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeLeft, isActive]);
  useEffect(() => {
    setIsformSub(false);
  }, [validateEmailErrorMsg, validateEmailSuccess]);
  const resetTimer = () => {
    setTimeLeft(20);
    setIsResendDisabled(true);
    setIsActive(true);
  };

  const handleResendOTP = async () => {
    try {
      resetValidateEmail();
      resetResendValidation();
      resendValidationMutate({
        emailAddress: email,
        validateFor: "user",
        type: "email",
      });
      resetTimer();
      setShowResendModal(true);
    } catch (error) {
      console.error("Error resending OTP:", error);
    }
  };

  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .length(6, "OTP must be exactly 6 digits")
      .matches(/^[0-9]+$/, "OTP must contain only numbers")
      .required("OTP is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log("ddddddddddddd");
      console.log("ddddddddddddd");
      setIsformSub(true);
      //setSubmitting(true);
      //return;
      validateEmailMutate({
        emailAddress: email,
        validateFor: "user",
        verificationCode: values.otp,
        type: "email",
      });
      //setSubmitting(false);
      //await new Promise((resolve) => setTimeout(resolve, 2000));
      // console.log("OTP submitted:", values.otp);
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      // setSubmitting(false);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const numbers = pastedData.replace(/\D/g, "");

    if (numbers.length >= 6) {
      const newOtp = numbers.slice(0, 6).split("");
      setOtp(newOtp);
      inputRefs[5].current.focus();

      const formValue = { otp: newOtp.join("") };
      if (validationSchema.isValidSync(formValue)) {
        handleSubmit(formValue, { setSubmitting: () => {} });
      }
    }
  };

  const handleChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== "") {
        if (index < 5) {
          inputRefs[index + 1].current.focus();
        } else {
          inputRefs[index].current.blur();
        }
      }

      if (
        newOtp.every((digit) => digit !== "") &&
        newOtp.join("").length === 6
      ) {
        const formValue = { otp: newOtp.join("") };
        if (validationSchema.isValidSync(formValue)) {
          handleSubmit(formValue, { setSubmitting: () => {} });
        }
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index]) {
        if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
          inputRefs[index - 1].current.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const getErrorMessage = () => {
    if (!validateEmailErrorMsg) return null;

    if (validateEmailErrorMsg?.details) {
      return validateEmailErrorMsg.details;
    }

    // Handle axios error response structure
    if (validateEmailErrorMsg.response?.data?.message) {
      return validateEmailErrorMsg.response.data.message;
    }

    if (validateEmailErrorMsg.response?.data?.errors[0]?.message) {
      return validateEmailErrorMsg.response?.data?.errors[0].message;
    }

    // Handle other error formats your server might return
    if (validateEmailErrorMsg.message) {
      return validateEmailErrorMsg.message;
    }

    return "An unexpected error occurred";
  };

  const getErrorMessageValidate = () => {
    if (!resendValidationErrorMsg) return null;

    // Handle axios error response structure
    if (resendValidationErrorMsg.response?.data?.message) {
      return resendValidationErrorMsg.response.data.message;
    }

    if (resendValidationErrorMsg.response?.data?.errors[0]?.message) {
      return resendValidationErrorMsg.response?.data?.errors[0].message;
    }

    // Handle other error formats your server might return
    if (resendValidationErrorMsg.message) {
      return resendValidationErrorMsg.message;
    }

    return "An unexpected error occurred";
  };

  const ResendButton = () => (
    <div className="flex items-center justify-center space-x-2">
      <button
        type="button"
        className={`text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium focus:outline-none ${
          isResendDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleResendOTP}
        disabled={isResendDisabled || resendValidationLoading}
      >
        {resendValidationLoading
          ? "Sending..."
          : " Did not receive the code? Resend Code"}
      </button>
      <span className="text-amber-700 text-xs sm:text-sm">
        {isResendDisabled && `(${formatTime(timeLeft)})`}
      </span>
    </div>
  );

  useEffect(() => {
    inputRefs[0].current.focus();
  }, []);

  useEffect(() => {
    if (validateEmailSuccess) {
      setShowSuccessModal(true);
      const timer = setTimeout(() => {
        router.push(`/sign-in`);
      }, 3000);

      const timer2 = setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [validateEmailSuccess, router]);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-8">
        {/* Add the Resend Modal */}
        <Dialog open={showResendModal} onOpenChange={setShowResendModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>OTP Resent Successfully</DialogTitle>
              <DialogDescription>
                A new verification code has been sent to your email address (
                {email}). Please check your inbox and spam folder.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                onClick={() => setShowResendModal(false)}
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-green-700 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Email Verified Successfully!
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Your email address has been successfully verified. You can now
                proceed to login.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/sign-in");
                }}
              >
                Continue to Login
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-sm text-amber-700 mb-6">
            We have sent a verification code to your email address.
            <br />
            Please enter the code below.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200">
          <Formik
            initialValues={{ otp: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2 text-center">
                    Enter Verification Code
                  </label>
                  <div
                    className="flex justify-center space-x-1 sm:space-x-2"
                    onPaste={handlePaste}
                  >
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-9 h-10 sm:w-10 sm:h-11 text-center text-lg font-semibold border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>

                <ResendButton />

                {/* Server Error Alert */}
                {validateEmailError && (
                  <Alert variant="destructive" className="mb-6 border-red-500">
                    <AlertTitle>Validating code Failed</AlertTitle>
                    <AlertDescription>{getErrorMessage()}</AlertDescription>
                  </Alert>
                )}

                {/* Server Error Alert */}
                {resendValidationError && (
                  <Alert variant="destructive" className="mb-6 border-red-500">
                    <AlertTitle>Sending code Failed</AlertTitle>
                    <AlertDescription>
                      {getErrorMessageValidate()}
                    </AlertDescription>
                  </Alert>
                )}

                <button
                  type="submit"
                  /*onClick={() => router.push("/sign2-up")}*/
                  disabled={isformSub || otp.join("").length !== 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {isformSub ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    "Verify Email"
                  )}
                </button>

                <div className="text-center text-xs sm:text-sm">
                  <Link
                    href="/sign-in"
                    className="text-green-600 hover:text-green-800"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default OTPValidation;

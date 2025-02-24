"use client";

import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useGetPasswordResetLink } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PasswordReset = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { mutate, isLoading, isError, error, isSuccess } =
    useGetPasswordResetLink();
  const [isformSub, setIsformSub] = useState(false);

  const initialValues = {
    email: "",
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const getErrorMessage = () => {
    if (!error) return null;

    // Handle axios error response structure
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.response?.data?.errors[0]?.message) {
      return error.response?.data?.errors[0].message;
    }

    // Handle other error formats your server might return
    if (error.message) {
      return error.message;
    }

    return "An unexpected error occurred";
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsformSub(true);
      mutate({
        emailOrPhone: values.email,
        type: "user",
      });
      //setSubmitting(false);
    } catch (error) {
      //setSubmitting(false);
      console.error("Password reset error:", error);
    } finally {
      //setSubmitting(false);
    }
  };

  useEffect(() => {
    setIsformSub(false);
  }, [error, isSuccess]);

  useEffect(() => {
    if (isSuccess) {
      setIsSubmitted(true); // Show success message when mutation is successful
    }
  }, [isSuccess]);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-amber-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-sm text-amber-700 mb-8">
            Enter your email address and we will send you a link to reset your
            password
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-green-800">
                Check Your Email
              </h2>
            </div>
            <p className="text-green-700">
              We have sent a password reset link to your email address. Please
              check your inbox and follow the instructions to reset your
              password.
            </p>
            <div className="pt-4">
              <p className="text-sm text-green-600">
                Did not receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-green-800 hover:text-green-900 underline"
                >
                  try again
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  <div>
                    {/* Server Error Alert */}
                    {isError && (
                      <Alert
                        variant="destructive"
                        className="mb-6 border-red-500"
                      >
                        <AlertTitle>Send password link Failed</AlertTitle>
                        <AlertDescription>{getErrorMessage()}</AlertDescription>
                      </Alert>
                    )}
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-amber-800 mb-1"
                    >
                      Email Address
                    </label>
                    <Field
                      type="email"
                      name="email"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.email && touched.email
                          ? "border-red-500"
                          : "border-amber-300"
                      } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                      placeholder="Enter your email address"
                    />
                    <ErrorMessage
                      name="email"
                      component={({ children }) => (
                        <div className="mt-2 flex items-center text-xs text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {children}
                        </div>
                      )}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isformSub || isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
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
                        Sending Reset Link...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>

                  <div className="text-center">
                    <Link
                      href="/sign-in"
                      className="text-sm text-green-600 hover:text-green-800 transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;

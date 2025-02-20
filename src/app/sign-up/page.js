"use client";

import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { mutate, isLoading, isError, error, isSuccess } = useRegister();

  useEffect(() => {
    if (isSuccess) {
      router.push(`/validation-email?email=${email}`);
    }
  }, [isSuccess]);
  //[isSuccess, router]
  const initialValues = {
    firstName: "",
    lastName: "",
    emailAddress: "",
    tel: "",
    password: "",
    dateOfBirth: "",
    acceptTerms: false,
  };

  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .required("First name is required")
      .min(2, "First name must be at least 2 characters"),
    lastName: Yup.string()
      .required("Last name is required")
      .min(2, "Last name must be at least 2 characters"),
    emailAddress: Yup.string()
      .required("Email is required")
      .email("Invalid email format"),
    tel: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]{11}$/, "Phone number must be 11 digits"),
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-zA-Z]/, "Password must contain at least one letter")
      .matches(/[0-9]/, "Password must contain at least one number"),
    dateOfBirth: Yup.date()
      .required("Date of birth is required")
      .max(new Date(), "Date of birth cannot be in the future"),
    acceptTerms: Yup.boolean().oneOf(
      [true],
      "You must accept the terms and conditions"
    ),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true);
      //delete values.acceptTerms;

      mutate({
        dateOfBirth: values.dateOfBirth,
        emailAddress: values.emailAddress,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        tel: values.tel,
        telCode: "+234",
      });
      setEmail(values.emailAddress);
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      console.error("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-amber-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-sm text-amber-700 mb-8">
            Fill in your information below or register with your social account
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-amber-800 mb-1"
                    >
                      First Name
                    </label>
                    <Field
                      type="text"
                      name="firstName"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.firstName && touched.firstName
                          ? "border-red-500"
                          : "border-amber-300"
                      } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                    />
                    <ErrorMessage
                      name="firstName"
                      component="div"
                      className="mt-1 text-xs text-red-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-amber-800 mb-1"
                    >
                      Last Name
                    </label>
                    <Field
                      type="text"
                      name="lastName"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.lastName && touched.lastName
                          ? "border-red-500"
                          : "border-amber-300"
                      } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                    />
                    <ErrorMessage
                      name="lastName"
                      component="div"
                      className="mt-1 text-xs text-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-amber-800 mb-1"
                  >
                    Email Address
                  </label>
                  <Field
                    type="email"
                    name="emailAddress"
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.emailAddress && touched.emailAddress
                        ? "border-red-500"
                        : "border-amber-300"
                    } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  />
                  <ErrorMessage
                    name="emailAddress"
                    component="div"
                    className="mt-1 text-xs text-red-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-amber-800 mb-1"
                  >
                    Phone Number
                  </label>
                  <Field
                    type="tel"
                    name="tel"
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.tel && touched.tel
                        ? "border-red-500"
                        : "border-amber-300"
                    } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  />
                  <ErrorMessage
                    name="tel"
                    component="div"
                    className="mt-1 text-xs text-red-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-amber-800 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-amber-300"
                      } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-amber-500"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-amber-500"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="mt-1 text-xs text-red-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-medium text-amber-800 mb-1"
                  >
                    Date of Birth
                  </label>
                  <Field
                    type="date"
                    name="dateOfBirth"
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.dateOfBirth && touched.dateOfBirth
                        ? "border-red-500"
                        : "border-amber-300"
                    } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                  />
                  <ErrorMessage
                    name="dateOfBirth"
                    component="div"
                    className="mt-1 text-xs text-red-500"
                  />
                </div>

                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    name="acceptTerms"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-amber-300 rounded"
                  />
                  <label
                    htmlFor="acceptTerms"
                    className="ml-2 block text-sm text-amber-700"
                  >
                    I accept the terms and conditions
                  </label>
                </div>
                <ErrorMessage
                  name="acceptTerms"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />

                {/* Server Error Alert */}
                {isError && (
                  <Alert variant="destructive" className="mb-6 border-red-500">
                    <AlertTitle>Registration Failed</AlertTitle>
                    <AlertDescription>{getErrorMessage()}</AlertDescription>
                  </Alert>
                )}

                {/* Success Alert */}
                {isSuccess && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <AlertTitle>Account Created Successfully!</AlertTitle>
                    <AlertDescription>
                      Redirecting you to verify your email...
                    </AlertDescription>
                  </Alert>
                )}

                <button
                  type="submit"
                  /* onClick={() => router.push("/validation-email")}*/
                  disabled={isSubmitting || isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
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
                      Signing up...
                    </div>
                  ) : (
                    "Sign Up"
                  )}
                </button>

                <div className="text-center text-sm text-amber-700">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="text-green-600 hover:text-green-800"
                  >
                    Login
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

export default SignUpForm;

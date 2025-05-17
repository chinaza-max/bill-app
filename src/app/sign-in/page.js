"use client";

import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLogin, useRefreshAccessToken } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import getErrorMessage from "@/app/component/error";

import {
  encryptData,
  decryptData,
  storeEncryptedData,
  getEncryptedDataFromStorage,
} from "../../utils/encryption";
import { useDispatch } from "react-redux"; // Import useDispatch
import { setUser, setUserEmail } from "@/store/slice";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isformSub, setIsformSub] = useState(false);
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();

  const { mutate, isLoading, isError, error, isSuccess } = useLogin(
    async (data) => {
      const myEmail = data.data.data.user.emailAddress;
      const encrypted = await encryptData(myEmail);

      console.log("Encrypted data:", encrypted);
      storeEncryptedData("emailEncrypt", encrypted);

      console.log(data.data.data.user);
      dispatch(
        setUser({
          user: data.data.data.user,
          accessToken: data.data.data.accessToken,
          isAuthenticated: true,
        })
      );
      if (!data.data.data.describeYou) {
        router.push(`/sign2-up`);
      } else if (!data.data.data.passCode) {
        router.push(`/settingupSecurePin`);
      } else {
        router.push(`/secureInput`);
      }
    }
  );

  const initialValues = {
    email: "",
    password: "",
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsformSub(true);
      mutate({
        emailAddress: values.email,
        password: values.password,
        type: "user",
      });

      setEmail(values.email);
    } catch (error) {
      //  setIsformSub(false);
      console.error("Login error:", error);
    } finally {
      //setIsformSub(false);
    }
  };

  useEffect(() => {
    setIsformSub(false);

    localStorage.setItem("validationEmail", email);
  }, [error, isSuccess]);

  useEffect(() => {
    fetch("api/auth?apiType=ping");
    setTimeout(() => {
      fetch("api/auth?apiType=ping");
    }, 3000);

    router.prefetch("/sign2-up");
    router.prefetch("/settingupSecurePin");
    router.prefetch("/secureInput");
    router.prefetch("/validation-email");
  }, [router]);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-amber-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-amber-700 mb-8">
            Sign in to your account to continue
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
                <div>
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
                  />
                  <ErrorMessage
                    name="email"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-amber-300 rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-amber-700"
                    >
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      href="/forgotPassword"
                      className="text-green-600 hover:text-green-800"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Server Error Alert */}
                {isError && (
                  <Alert variant="destructive" className="mb-6 border-red-500">
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>
                      {getErrorMessage(error, router, "", "", pathname)}
                    </AlertDescription>
                  </Alert>
                )}

                <button
                  type="submit"
                  disabled={isformSub}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
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
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="text-center text-sm text-amber-700">
                  Dont have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="text-green-600 hover:text-green-800"
                  >
                    Sign up
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

export default LoginForm;

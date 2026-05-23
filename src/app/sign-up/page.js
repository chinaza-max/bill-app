"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { setUserEmail } from "@/store/slice";
import { useDispatch } from "react-redux";
import getErrorMessage from "@/app/component/error";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID  = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const AUTH_API          = "/api/auth";
const EMAIL_CHECK_API   = `${AUTH_API}?apiType=checkGoogleEmail`;
const GOOGLE_SIGNUP_API = `${AUTH_API}`;
const GOOGLE_LINK_API   = `${AUTH_API}?apiType=link-google`;
// ──────────────────────────────────────────────────────────────────────────────

/* ══════════════════════════════════════════════════════════════════════════════
   POPUP-BASED GOOGLE OAUTH HELPER
   Opens a small popup → Google consent screen → reads id_token from the hash.
   This completely bypasses FedCM / One Tap and all third-party cookie issues.

   REQUIRED SETUP:
   1. In Google Cloud Console → OAuth 2.0 → Authorized redirect URIs, add:
        https://yourdomain.com/auth/google/callback
        http://localhost:3000/auth/google/callback  (for dev)
   2. Create /app/auth/google/callback/page.jsx with the content shown below
      in the JSDoc comment.
══════════════════════════════════════════════════════════════════════════════ */

/**
 * CALLBACK PAGE  →  /app/auth/google/callback/page.jsx
 *
 * "use client";
 * import { useEffect } from "react";
 * export default function GoogleCallback() {
 *   useEffect(() => {
 *     // The id_token lives in the URL hash — read it and close the popup
 *     if (window.opener) {
 *       window.opener.postMessage(window.location.hash, window.location.origin);
 *       window.close();
 *     }
 *   }, []);
 *   return <p style={{ fontFamily: "sans-serif", padding: 32 }}>Signing you in…</p>;
 * }
 */
function openGooglePopup(clientId, onResult) {
  const redirectUri = `${window.location.origin}/auth/google/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "token id_token",
    scope:         "openid email profile",
    nonce:         Math.random().toString(36).slice(2),
    prompt:        "select_account",
  });

  const url    = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  const width  = 500;
  const height = 600;
  const left   = Math.max(0, (window.screen.width  - width)  / 2);
  const top    = Math.max(0, (window.screen.height - height) / 2);

  const popup = window.open(
    url,
    "google-oauth",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  if (!popup) {
    onResult(null, "Popup was blocked. Please allow popups for this site and try again.");
    return;
  }

  // Listen for postMessage from the callback page
  function handleMessage(event) {
    if (event.origin !== window.location.origin) return;
    window.removeEventListener("message", handleMessage);

    const hash    = new URLSearchParams(event.data.replace("#", "?"));
    const idToken = hash.get("id_token");
    const err     = hash.get("error");

    if (idToken) {
      onResult({ credential: idToken }, null);
    } else {
      onResult(null, err || "Google sign-in failed. Please try again.");
    }
  }

  window.addEventListener("message", handleMessage);

  // Fallback: if user closes popup manually without completing sign-in
  const closed = setInterval(() => {
    if (popup.closed) {
      clearInterval(closed);
      window.removeEventListener("message", handleMessage);
      // Only fire if we haven't already received a message
      onResult(null, "Sign-in was cancelled.");
    }
  }, 500);
}

/* ── Google "G" logo ── */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.5-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2 14-5.3l-6.5-5.5C29.6 35.3 27 36 24 36c-5.3 0-9.7-3.3-11.3-8L6 33.1C9.3 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.1 3.9-3.8 5.2l6.5 5.5C37.8 36.8 44 31 44 24c0-1.2-.1-2.5-.4-3.5z"/>
    </svg>
  );
}

/* ── Inline spinner ── */
function BtnSpinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LINK-ACCOUNT MODAL
══════════════════════════════════════════════════════════════════════════════ */
function LinkAccountModal({ googleUser, onLink, onCancel, isLinking, linkError }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(120,90,0,0.35)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 border border-amber-200">

        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-5">
          {googleUser?.picture && (
            <img
              src={googleUser.picture}
              alt={googleUser.firstName}
              width={64}
              height={64}
              className="rounded-full border-2 border-amber-300 shadow-md mb-3"
            />
          )}
          <p className="font-bold text-amber-900 text-base">
            {googleUser?.firstName} {googleUser?.lastName}
          </p>
          <p className="text-amber-600 text-sm">{googleUser?.emailAddress}</p>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>This email is already registered</strong> with a password account. You can
            link your Google account so both sign-in methods work going forward — your data stays
            exactly as is.
          </p>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600 shrink-0"
          />
          <span className="text-sm text-amber-700 leading-relaxed">
            I agree to link my Google account (<strong>{googleUser?.emailAddress}</strong>) to my
            existing FidoPoint account.
          </span>
        </label>

        {linkError && (
          <Alert variant="destructive" className="mb-4 border-red-400">
            <AlertTitle>Linking Failed</AlertTitle>
            <AlertDescription>{linkError}</AlertDescription>
          </Alert>
        )}

        <button
          onClick={onLink}
          disabled={!agreed || isLinking}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700
            hover:from-amber-800 hover:to-amber-800
            disabled:opacity-40 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-amber-500 transition mb-3"
        >
          {isLinking ? <><BtnSpinner /> Linking…</> : "Link & Continue"}
        </button>

        <button
          onClick={onCancel}
          disabled={isLinking}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-amber-700
            border-2 border-amber-300 bg-transparent hover:bg-amber-50
            focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
        >
          Use a Different Account
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN SIGN-UP FORM
══════════════════════════════════════════════════════════════════════════════ */
const SignUpForm = () => {
  const [showPassword, setShowPassword]   = useState(false);
  const [email, setEmail]                 = useState("");
  const router                            = useRouter();
  const [isformSub, setIsformSub]         = useState(false);

  // ── Google state ──
  const [googleStage, setGoogleStage]     = useState("idle"); // idle | loading | checking | done | error
  const [googleUser, setGoogleUser]       = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isLinking, setIsLinking]         = useState(false);
  const [googleError, setGoogleError]     = useState("");
  const [linkError, setLinkError]         = useState("");

  const { mutate, isLoading, isError, error, isSuccess } = useRegister();
  const dispatch = useDispatch();

  // ── Preload / warm up ──
  useEffect(() => {
    fetch("api/auth?apiType=ping");
    setTimeout(() => { fetch("api/auth?apiType=ping"); }, 3000);
    router.prefetch("validation-email");
    router.prefetch("sign-in");
  }, [router]);

  useEffect(() => {
    setIsformSub(false);
    localStorage.setItem("validationEmail", email);
  }, [error, isSuccess]);

  useEffect(() => {
    if (isSuccess) router.push("/validation-email");
  }, [isSuccess]);

  // ── Decode JWT and process the credential returned by the popup ──
  const processCredential = useCallback(async (credential) => {
    setGoogleStage("checking");
    setGoogleError("");
    try {
      const [, payload] = credential.split(".");
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

      console.log("Decoded Google credential:", decoded);
      const user = {
        emailAddress: decoded.email,
        firstName:    decoded.given_name  ?? decoded.name ?? "",
        lastName:     decoded.family_name ?? decoded.name ?? "",
        picture:      decoded.picture,
        googleId:     decoded.sub,
        credential,
      };
      setGoogleUser(user);

      // ── 1. Check if email already exists ──────────────────────────────────
      const checkRes  = await fetch(EMAIL_CHECK_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ emailAddress: user.emailAddress, apiType: "checkGoogleEmail" }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.message || "Email check failed");

      if (checkData.data?.accountExists) {
        // Email already registered → show link modal
        setGoogleStage("idle");
        setShowLinkModal(true);
      } else {
        // ── 2. Create new account via Google ──────────────────────────────
        const cr = await fetch(GOOGLE_SIGNUP_API, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            firstName:    user.firstName,
            lastName:     user.lastName,
            emailAddress: user.emailAddress,
            googleId:     user.googleId,
            apiType:      "googleSignup",
          }),
        });
        const cd = await cr.json();
        if (!cr.ok) throw new Error(cd.message || "Google sign-up failed");

        // ── Google accounts are pre-verified — go straight to sign-in ──
        setGoogleStage("done");
        router.push("/sign-in");
      }
    } catch (err) {
      setGoogleStage("error");
      setGoogleError(err.message || "Google sign-up failed. Please try again.");
    }
  }, [router]);

  // ── Trigger Google popup — completely avoids FedCM ──
  const triggerGoogle = useCallback(() => {
    setGoogleStage("loading");
    setGoogleError("");

    // Track if a result was already delivered (prevents the "cancelled"
    // fallback from firing after a successful postMessage)
    let settled = false;

    openGooglePopup(GOOGLE_CLIENT_ID, (result, err) => {
      if (settled) return;
      settled = true;

      if (err || !result?.credential) {
        // "Sign-in was cancelled" is not really an error worth screaming about
        if (err === "Sign-in was cancelled.") {
          setGoogleStage("idle");
        } else {
          setGoogleStage("error");
          setGoogleError(err || "Google sign-in failed.");
        }
        return;
      }
      processCredential(result.credential);
    });
  }, [processCredential]);

  // ── Link existing account ──
  const handleLink = async () => {
    setIsLinking(true);
    setLinkError("");
    try {
      const res  = await fetch(GOOGLE_LINK_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          emailAddress: googleUser.emailAddress,
          googleId:     googleUser.googleId,
          credential:   googleUser.credential,
        }),
      });
      const data = await res.json();
      console.log("Link response:", data);
      if (!res.ok) throw new Error(data.message || "Linking failed");

      setShowLinkModal(false);
      // Google-linked accounts are already verified — go straight to sign-in
      router.push("/sign-in");
    } catch (err) {
      setLinkError(err.message || "Linking failed. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  // ── Formik config ──
  const initialValues = {
    firstName: "", lastName: "", emailAddress: "",
    tel: "", password: "", dateOfBirth: "", acceptTerms: false,
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
      .max(new Date(), "Date of birth cannot be in the future")
      .test("age", "You must be at least 15 years old", function (value) {
        if (!value) return false;
        const today     = new Date();
        const birthDate = new Date(value);
        const age       = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1 >= 15;
        }
        return age >= 15;
      }),
    acceptTerms: Yup.boolean().oneOf([true], "You must accept the terms and conditions"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true);
      setIsformSub(true);
      mutate({
        dateOfBirth:  values.dateOfBirth,
        emailAddress: values.emailAddress,
        firstName:    values.firstName,
        lastName:     values.lastName,
        password:     values.password,
        tel:          values.tel,
        telCode:      "+234",
      });
      setEmail(values.emailAddress);
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isGoogleBusy = googleStage === "loading" || googleStage === "checking";

  // ── Render ──
  return (
    <>
      {showLinkModal && (
        <LinkAccountModal
          googleUser={googleUser}
          onLink={handleLink}
          onCancel={() => {
            setShowLinkModal(false);
            setGoogleUser(null);
            setLinkError("");
          }}
          isLinking={isLinking}
          linkError={linkError}
        />
      )}

      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-amber-900 mb-2">Create Your Account</h1>
            <p className="text-sm text-amber-700 mb-8">Fill in your information below</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">

            {/* ── GOOGLE BUTTON ── */}
            <div className="mb-6">
              <button
                type="button"
                onClick={triggerGoogle}
                disabled={isGoogleBusy}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg
                  border-2 border-amber-300 bg-white hover:bg-amber-50
                  text-amber-800 font-semibold text-sm
                  shadow-sm hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-200"
              >
                {isGoogleBusy ? (
                  <>
                    <BtnSpinner />
                    <span>
                      {googleStage === "loading" ? "Opening Google…" : "Checking email…"}
                    </span>
                  </>
                ) : (
                  <>
                    <GoogleG />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {googleStage === "error" && googleError && (
                <Alert variant="destructive" className="mt-3 border-red-400">
                  <AlertTitle>Google Sign-Up Failed</AlertTitle>
                  <AlertDescription>{googleError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* ── OR DIVIDER ── */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-amber-200" />
              <span className="text-xs font-medium text-amber-500 uppercase tracking-widest whitespace-nowrap">
                or sign up with email
              </span>
              <div className="flex-1 h-px bg-amber-200" />
            </div>

            {/* ── EMAIL / PASSWORD FORM ── */}
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">

                  {/* First + Last name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-amber-800 mb-1">
                        First Name
                      </label>
                      <Field
                        type="text"
                        name="firstName"
                        className={`appearance-none relative block w-full px-3 py-2 border ${
                          errors.firstName && touched.firstName ? "border-red-500" : "border-amber-300"
                        } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      />
                      <ErrorMessage name="firstName" component="div" className="mt-1 text-xs text-red-500" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-amber-800 mb-1">
                        Last Name
                      </label>
                      <Field
                        type="text"
                        name="lastName"
                        className={`appearance-none relative block w-full px-3 py-2 border ${
                          errors.lastName && touched.lastName ? "border-red-500" : "border-amber-300"
                        } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                      />
                      <ErrorMessage name="lastName" component="div" className="mt-1 text-xs text-red-500" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-amber-800 mb-1">
                      Email Address
                    </label>
                    <Field
                      type="email"
                      name="emailAddress"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.emailAddress && touched.emailAddress ? "border-red-500" : "border-amber-300"
                      } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    />
                    <ErrorMessage name="emailAddress" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="tel" className="block text-sm font-medium text-amber-800 mb-1">
                      Phone Number
                    </label>
                    <Field
                      type="tel"
                      name="tel"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.tel && touched.tel ? "border-red-500" : "border-amber-300"
                      } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    />
                    <ErrorMessage name="tel" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-amber-800 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className={`appearance-none relative block w-full px-3 py-2 border ${
                          errors.password && touched.password ? "border-red-500" : "border-amber-300"
                        } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm pr-10`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-amber-800 mb-1">
                      Date of Birth
                    </label>
                    <Field
                      type="date"
                      name="dateOfBirth"
                      className={`appearance-none relative block w-full px-3 py-2 border ${
                        errors.dateOfBirth && touched.dateOfBirth ? "border-red-500" : "border-amber-300"
                      } placeholder-amber-400 text-amber-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                    />
                    <ErrorMessage name="dateOfBirth" component="div" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Accept Terms */}
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="acceptTerms"
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-amber-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 block text-sm text-amber-700">
                      I accept the terms and conditions
                    </label>
                  </div>
                  <ErrorMessage name="acceptTerms" component="div" className="mt-1 text-xs text-red-500" />

                  {/* Server Error */}
                  {isError && (
                    <Alert variant="destructive" className="mb-6 border-red-500">
                      <AlertTitle>Registration Failed</AlertTitle>
                      <AlertDescription>{getErrorMessage(error, router, "")}</AlertDescription>
                    </Alert>
                  )}

                  {/* Success */}
                  {isSuccess && (
                    <Alert className="mb-6 bg-green-50 border-green-200">
                      <AlertTitle>Account Created Successfully!</AlertTitle>
                      <AlertDescription>Redirecting you to verify your email...</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isformSub}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent
                      text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                      disabled:opacity-50"
                  >
                    {isformSub ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing up...
                      </div>
                    ) : "Sign Up"}
                  </button>

                  <div className="text-center text-sm text-amber-700">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="text-green-600 hover:text-green-800">Login</Link>
                  </div>

                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpForm;
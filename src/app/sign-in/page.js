"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLogin } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import getErrorMessage from "@/app/component/error";
import {
  encryptData,
  storeEncryptedData,
} from "../../utils/encryption";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slice";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID   = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const AUTH_API           = "/api/auth";
const GOOGLE_LOGIN_API   = AUTH_API;
const CONNECT_GOOGLE_API = AUTH_API;
// ─────────────────────────────────────────────────────────────────────────────

/* ═════════════════════════════════════════════════════════════════════════════
   POPUP GOOGLE OAUTH
═════════════════════════════════════════════════════════════════════════════ */
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

  function handleMessage(event) {
    if (event.origin !== window.location.origin) return;
    window.removeEventListener("message", handleMessage);
    const hash    = new URLSearchParams(event.data.replace("#", "?"));
    const idToken = hash.get("id_token");
    const err     = hash.get("error");
    if (idToken) onResult({ credential: idToken }, null);
    else         onResult(null, err || "Google sign-in failed. Please try again.");
  }
  window.addEventListener("message", handleMessage);

  const closed = setInterval(() => {
    if (popup.closed) {
      clearInterval(closed);
      window.removeEventListener("message", handleMessage);
      onResult(null, "Sign-in was cancelled.");
    }
  }, 500);
}

/* ── Google "G" SVG ── */
function GoogleG({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.5-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2 14-5.3l-6.5-5.5C29.6 35.3 27 36 24 36c-5.3 0-9.7-3.3-11.3-8L6 33.1C9.3 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.1 3.9-3.8 5.2l6.5 5.5C37.8 36.8 44 31 44 24c0-1.2-.1-2.5-.4-3.5z"/>
    </svg>
  );
}

/* ── Spinner ── */
function Spinner({ color = "text-white" }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   LINK-ACCOUNT MODAL
   Shown when server returns 409 — email exists but not yet linked to Google.
═════════════════════════════════════════════════════════════════════════════ */
function LinkAccountModal({ googleUser, onLink, onCancel, isLinking, linkError }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.25)" }}
      >
        {/* Top accent strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

        <div className="p-7">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            {googleUser?.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.firstName}
                width={72}
                height={72}
                className="rounded-full border-[3px] border-amber-200 shadow-lg mb-3"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-amber-100 flex items-center justify-center mb-3 text-2xl font-bold text-amber-700">
                {googleUser?.firstName?.[0]}
              </div>
            )}
            <p className="font-semibold text-gray-900 text-base tracking-tight">
              {googleUser?.firstName} {googleUser?.lastName}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{googleUser?.emailAddress}</p>
          </div>

          {/* Info */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3.5 mb-5">
            <p className="text-[13px] text-amber-900 leading-relaxed">
              <span className="font-semibold">This email already has an account</span> created with a
              password. Link your Google account to sign in with either method — your data is untouched.
            </p>
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-5 group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                  ${agreed
                    ? "bg-amber-500 border-amber-500"
                    : "border-amber-300 bg-white group-hover:border-amber-400"
                  }`}
              >
                {agreed && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[13px] text-gray-600 leading-relaxed">
              I agree to link <span className="font-medium text-gray-800">{googleUser?.emailAddress}</span> with
              my Google account.
            </span>
          </label>

          {linkError && (
            <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50 rounded-xl">
              <AlertTitle className="text-red-700 text-sm font-semibold">Linking Failed</AlertTitle>
              <AlertDescription className="text-red-600 text-xs">{linkError}</AlertDescription>
            </Alert>
          )}

          <button
            onClick={onLink}
            disabled={!agreed || isLinking}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-b from-amber-500 to-amber-600
              hover:from-amber-600 hover:to-amber-700
              active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-md shadow-amber-200
              transition-all duration-150 mb-3"
          >
            {isLinking ? <><Spinner /> Linking & signing in…</> : "Link & Sign In"}
          </button>

          <button
            onClick={onCancel}
            disabled={isLinking}
            className="w-full py-3 rounded-xl text-sm font-semibold text-gray-600
              bg-gray-100 hover:bg-gray-200 active:scale-[0.98]
              transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   HELPER — normalise the login response regardless of nesting depth.

   Your API shape (from the OLD working code) is:
     data.data.data = { user, accessToken, describeYou, passCode, ... }

   So describeYou / passCode live ALONGSIDE user, NOT inside user.
   We capture the whole inner data object so nothing is lost.

   Handles two shapes:
     Shape A (direct Google login):  response → { data: { user, accessToken, describeYou, passCode } }
     Shape B (after connectGoogle):  response → { data: { data: { user, accessToken, describeYou, passCode } } }
═════════════════════════════════════════════════════════════════════════════ */
function extractLoginPayload(responseData) {
  // Shape B — deep nesting: data.data.data.*  (what old code read as data.data.data.*)
  if (responseData?.data?.data?.user && responseData?.data?.data?.accessToken) {
    const inner = responseData.data.data;
    return {
      user:        inner.user,
      accessToken: inner.accessToken,
      describeYou: inner.describeYou,   // may be undefined/null — that's fine
      passCode:    inner.passCode,      // same
    };
  }
  // Shape A — shallow nesting: data.data.*
  if (responseData?.data?.user && responseData?.data?.accessToken) {
    const inner = responseData.data;
    return {
      user:        inner.user,
      accessToken: inner.accessToken,
      describeYou: inner.describeYou,
      passCode:    inner.passCode,
    };
  }
  return null;
}

/* ═════════════════════════════════════════════════════════════════════════════
   MAIN LOGIN FORM
═════════════════════════════════════════════════════════════════════════════ */
const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isformSub, setIsformSub]       = useState(false);
  const [email, setEmail]               = useState("");

  // ── Google state ──
  const [googleStage, setGoogleStage]     = useState("idle"); // idle | loading | processing | done | error
  const [googleUser, setGoogleUser]       = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isLinking, setIsLinking]         = useState(false);
  const [googleError, setGoogleError]     = useState("");
  const [linkError, setLinkError]         = useState("");

  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useDispatch();

  // ── useLogin is used for BOTH password and Google sign-in ──
  const { mutate, isLoading, isError, error, isSuccess } = useLogin(handleLoginSuccess);

  // ── Shared redirect logic after any successful login ──
  // describeYou and passCode live ALONGSIDE user in the API response (not inside user).
  // We pass the full payload so the checks are always against the right values.
  function navigateAfterLogin({ describeYou, passCode }) {
    if (!describeYou) {
      // User has not completed profile step 1 yet
      router.push("/sign2-up");
    } else if (!passCode) {
      // Profile done, PIN not set yet
      router.push("/settingupSecurePin");
    } else {
      // Fully set up
      router.push("/secureInput");
    }
  }

  // ── Called by useLogin hook on ANY successful login (password OR Google) ──
  function handleLoginSuccess(data) {
    // Normalise: handles both nesting levels your API returns.
    // payload = { user, accessToken, describeYou, passCode }
    const payload = extractLoginPayload(data.data);

    if (!payload) {
      // Shouldn't happen, but surface it clearly
      setGoogleStage("error");
      setGoogleError("Unexpected server response. Please try again.");
      return;
    }

    const { user, accessToken, describeYou, passCode } = payload;

    const encrypted = encryptData(user.emailAddress);
    storeEncryptedData("emailEncrypt", encrypted);

    dispatch(setUser({ user, accessToken, isAuthenticated: true }));

    // Pass describeYou and passCode from the payload root (alongside user),
    // not from user object — matches how the original working code read them.
    navigateAfterLogin({ describeYou, passCode });
  }

  // ── Warm up routes ──
  useEffect(() => {
    fetch("api/auth?apiType=ping");
    setTimeout(() => { fetch("api/auth?apiType=ping"); }, 3000);
    router.prefetch("sign2-up");
    router.prefetch("settingupSecurePin");
    router.prefetch("secureInput");
    router.prefetch("validation-email");
  }, [router]);

  useEffect(() => {
    setIsformSub(false);
    localStorage.setItem("validationEmail", email);
  }, [error, isSuccess]);

  // ── Google: decode popup credential then fire mutate (same as password login) ──
  const processGoogleCredential = useCallback(async (credential) => {
    setGoogleStage("processing");
    setGoogleError("");

    try {
      const [, payload] = credential.split(".");
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

      const user = {
        emailAddress: decoded.email,
        firstName:    decoded.given_name  ?? decoded.name ?? "",
        lastName:     decoded.family_name ?? decoded.name ?? "",
        picture:      decoded.picture,
        googleId:     decoded.sub,
        credential,
      };
      setGoogleUser(user);

      // ── PRE-CHECK: does this Google account need linking first? ──
      // We hit the login endpoint; a 409 means "linked needed", anything else
      // we let mutate handle normally.
      const checkRes = await fetch(GOOGLE_LOGIN_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          emailAddress: user.emailAddress,
          googleId:     user.googleId,
          loginMethod:  "google",
          type:         "user",
          apiType:      "loginUser",
        }),
      });

      if (checkRes.status === 409) {
        // Email exists but not linked → show modal, mutate NOT called yet
        setGoogleStage("idle");
        setShowLinkModal(true);
        return;
      }

      // For every other outcome (200 or any error), hand off to mutate so
      // handleLoginSuccess / isError / error all work exactly like password login.
      setGoogleStage("done");
      mutate({
        emailAddress: user.emailAddress,
        googleId:     user.googleId,
        loginMethod:  "google",
        type:         "user",
        apiType:      "loginUser",
      });

    } catch (err) {
      setGoogleStage("error");
      setGoogleError(err.message || "Google sign-in failed. Please try again.");
    }
  }, [mutate]);

  // ── Open Google popup ──
  const triggerGoogle = useCallback(() => {
    setGoogleStage("loading");
    setGoogleError("");
    let settled = false;

    openGooglePopup(GOOGLE_CLIENT_ID, (result, err) => {
      if (settled) return;
      settled = true;
      if (err || !result?.credential) {
        if (err === "Sign-in was cancelled.") setGoogleStage("idle");
        else { setGoogleStage("error"); setGoogleError(err || "Google sign-in failed."); }
        return;
      }
      processGoogleCredential(result.credential);
    });
  }, [processGoogleCredential]);

  // ── Link account then fire mutate (same path as everything else) ──
  const handleLink = async () => {
    setIsLinking(true);
    setLinkError("");
    try {
      // 1. Connect the accounts
      const connectRes  = await fetch(CONNECT_GOOGLE_API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          emailAddress: googleUser.emailAddress,
          googleId:     googleUser.googleId,
          apiType:      "connectGoogleAccount",
        }),
      });
      const connectData = await connectRes.json();

      if (!connectRes.ok) {
        throw new Error(connectData.message || "Linking failed");
      }

      // 2. Connect succeeded — now log in via the SAME mutate path as normal login.
      //    handleLoginSuccess will fire on success; isError / error will fire on failure.
      //    Close the modal first so the user sees the main form feedback.
      setShowLinkModal(false);
      setGoogleStage("processing");

      mutate({
        emailAddress: googleUser.emailAddress,
        googleId:     googleUser.googleId,
        loginMethod:  "google",
        type:         "user",
        apiType:      "loginUser",
      });

    } catch (err) {
      setLinkError(err.message || "Linking failed. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  // ── Standard email/password submit ──
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsformSub(true);
      mutate({
        emailAddress: values.email,
        password:     values.password,
        loginMethod:  "password",
        type:         "user",
      });
      setEmail(values.email);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isGoogleBusy = googleStage === "loading" || googleStage === "processing";

  const initialValues    = { email: "", password: "" };
  const validationSchema = Yup.object().shape({
    email:    Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

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
            setGoogleStage("idle");
          }}
          isLinking={isLinking}
          linkError={linkError}
        />
      )}

      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-amber-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-amber-700">Sign in to your account to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* ══ GOOGLE SIGN-IN BUTTON ══ */}
            <div className="px-8 pt-8 pb-6">
              <button
                type="button"
                onClick={triggerGoogle}
                disabled={isGoogleBusy}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            "10px",
                  width:          "100%",
                  padding:        "0 16px",
                  height:         "50px",
                  borderRadius:   "12px",
                  border:         "1.5px solid #E5E7EB",
                  background:     "#FFFFFF",
                  cursor:         isGoogleBusy ? "not-allowed" : "pointer",
                  opacity:        isGoogleBusy ? 0.65 : 1,
                  boxShadow:      "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                  transition:     "box-shadow 0.15s, background 0.15s, transform 0.1s",
                  fontFamily:     "'Google Sans', Roboto, sans-serif",
                  fontSize:       "15px",
                  fontWeight:     500,
                  color:          "#3C4043",
                  letterSpacing:  "0.01em",
                  userSelect:     "none",
                }}
                onMouseEnter={e => { if (!isGoogleBusy) e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)"; }}
                onMouseDown={e => { if (!isGoogleBusy) e.currentTarget.style.transform = "scale(0.985)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {isGoogleBusy ? (
                  <>
                    <Spinner color="text-amber-500" />
                    <span style={{ color: "#6B7280", fontSize: "14px" }}>
                      {googleStage === "loading" ? "Opening Google…" : "Signing you in…"}
                    </span>
                  </>
                ) : (
                  <>
                    <GoogleG size={20} />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {googleStage === "error" && googleError && (
                <Alert variant="destructive" className="mt-3 border-red-300 bg-red-50 rounded-xl">
                  <AlertTitle className="text-red-700 text-sm font-semibold">Google Sign-In Failed</AlertTitle>
                  <AlertDescription className="text-red-600 text-xs">{googleError}</AlertDescription>
                </Alert>
              )}

              {/* OR divider */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                  or sign in with email
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>

            {/* ══ EMAIL / PASSWORD FORM ══ */}
            <div className="px-8 pb-8">
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched }) => (
                  <Form className="space-y-5">

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-amber-800 mb-1.5">
                        Email Address
                      </label>
                      <Field
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        className={`appearance-none block w-full px-3.5 py-2.5 border rounded-xl text-amber-900 text-sm
                          placeholder-amber-300 transition-all duration-150
                          focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                          ${errors.email && touched.email ? "border-red-400 bg-red-50" : "border-amber-200 bg-white"}`}
                      />
                      <ErrorMessage name="email" component="div" className="mt-1 text-xs text-red-500" />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-amber-800">
                          Password
                        </label>
                        <Link href="/forgotPassword" className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="••••••••"
                          className={`appearance-none block w-full px-3.5 py-2.5 border rounded-xl text-amber-900 text-sm
                            placeholder-amber-300 transition-all duration-150
                            focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent pr-11
                            ${errors.password && touched.password ? "border-red-400 bg-red-50" : "border-amber-200 bg-white"}`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-amber-400 hover:text-amber-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <ErrorMessage name="password" component="div" className="mt-1 text-xs text-red-500" />
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-amber-300 text-amber-600 accent-amber-500 focus:ring-amber-400"
                      />
                      <label htmlFor="remember-me" className="ml-2 text-sm text-amber-700">
                        Remember me
                      </label>
                    </div>

                    {/* Server error (shown for both password and Google failures via mutate) */}
                    {isError && (
                      <Alert variant="destructive" className="border-red-300 bg-red-50 rounded-xl">
                        <AlertTitle className="text-red-700 text-sm font-semibold">Login Failed</AlertTitle>
                        <AlertDescription className="text-red-600 text-xs">
                          {getErrorMessage(error, router, "", "", pathname)}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isformSub}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white
                        bg-gradient-to-b from-amber-500 to-amber-600
                        hover:from-amber-600 hover:to-amber-700
                        active:scale-[0.98]
                        focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-md shadow-amber-200/60
                        transition-all duration-150"
                    >
                      {isformSub ? <><Spinner /> Signing in…</> : "Sign In"}
                    </button>

                    <p className="text-center text-sm text-amber-700">
                      Dont have an account?{" "}
                      <Link href="/sign-up" className="text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2">
                        Sign up
                      </Link>
                    </p>

                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
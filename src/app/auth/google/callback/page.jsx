"use client";

/**
 * /app/auth/google/callback/page.jsx
 *
 * This tiny page receives the OAuth redirect from Google, reads the id_token
 * from the URL hash, posts it back to the opener (SignUpForm / SignInForm),
 * then closes itself.
 *
 * SETUP:
 *   Add these to Google Cloud Console → OAuth 2.0 → Authorized redirect URIs:
 *     https://yourdomain.com/auth/google/callback
 *     http://localhost:3000/auth/google/callback
 */

import { useEffect } from "react";

export default function GoogleCallback() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.opener) {
      // Send the full hash (contains id_token or error) back to the parent window
      window.opener.postMessage(window.location.hash, window.location.origin);
      window.close();
    } else {
      // Fallback: if somehow opened without an opener, redirect home
      window.location.replace("/");
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
      background: "#fffbeb",
      color: "#92400e",
    }}>
      <p>Signing you in…</p>
    </div>
  );
}
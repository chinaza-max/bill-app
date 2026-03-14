"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WelcomePage() {
  const spinnerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const el = spinnerRef.current;
    if (!el) return;
    let angle = 0;
    let raf;
    const spin = () => {
      angle += 0.4;
      el.style.transform = `rotate(${angle}deg)`;
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    router.prefetch("/sign-up");
    router.prefetch("/sign-in");
  }, [router]);

  return (
    <div
      style={{
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: "#fdf8ee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 430,
        margin: "0 auto",
        padding: "0 24px",
        fontFamily: "Georgia, serif",
        boxSizing: "border-box",
      }}
    >

      {/* ── TOP: Logo with spinning ring ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "clamp(32px, 8vh, 72px)",
        }}
      >
        {/* Spinning ring + logo */}
        <div style={{ position: "relative", width: "clamp(120px, 22vw, 160px)", height: "clamp(120px, 22vw, 160px)" }}>
          {/* Spinning outer dashed ring — dark gold */}
          <div
            ref={spinnerRef}
            style={{
              position: "absolute",
              inset: -14,
              borderRadius: "50%",
              border: "2.5px dashed #a07800",
              opacity: 0.85,
            }}
          />
          {/* Static soft ring — warm gold */}
          <div
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              border: "1.5px solid rgba(160,120,0,0.35)",
            }}
          />
          {/* Logo circle */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "#fff",
              border: "3px solid rgba(160,120,0,0.25)",
              boxShadow: "0 4px 24px rgba(160,120,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/logo-DsKke-Me.png"
              alt="FidoPoint Logo"
              width={120}
              height={120}
              style={{ objectFit: "contain", width: "85%", height: "85%" }}
            />
          </div>
        </div>

        {/* App name */}
        <h1
          style={{
            fontSize: "clamp(22px, 6vw, 28px)",
            fontWeight: 800,
            color: "#7a5c00",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "clamp(16px, 4vw, 28px) 0 6px",
          }}
        >
          FidoPoint
        </h1>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "#a07800",
            textTransform: "uppercase",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Unlocking Convenience
        </p>

        {/* Thin divider — all gold */}
        <div
          style={{
            marginTop: "clamp(12px, 3vw, 22px)",
            width: 56,
            height: 3,
            borderRadius: 2,
            background: "linear-gradient(to right, #a07800, #d4a800, #a07800)",
          }}
        />
      </div>

      {/* ── MIDDLE: Tagline ── */}
      <div style={{ textAlign: "center", padding: "0 16px" }}>
        {/* 3 feature pills — gold toned */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          {["⚡ Fast", "🔒 Secure", "💰 Earn"].map((label) => (
            <span
              key={label}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#7a5c00",
                background: "rgba(160,120,0,0.09)",
                border: "1px solid rgba(160,120,0,0.28)",
                borderRadius: 20,
                padding: "5px 12px",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <p
          style={{
            fontSize: "clamp(12px, 3.5vw, 14px)",
            lineHeight: 1.85,
            color: "#6b5200",
            margin: 0,
          }}
        >
          Order cash from nearby merchants
          <br />
          <span style={{ color: "#a07800", fontWeight: 700 }}>instantly</span> — no ATM queues, no stress.
          <br />
          Merchants earn on every transaction.
        </p>
      </div>

      {/* ── BOTTOM: Buttons ── */}
      <div
        style={{
          width: "100%",
          paddingBottom: "clamp(24px, 6vh, 48px)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxSizing: "border-box",
        }}
      >
        {/* Separator */}
        <div style={{ height: 1, background: "rgba(160,120,0,0.15)", marginBottom: 4 }} />

        {/* Create Account — ACTIVE: solid dark gold */}
        <Link href="/sign-up" style={{ textDecoration: "none" }}>
          <button
            style={{
              width: "100%",
              padding: "clamp(13px, 3.5vw, 16px)",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #8a6400 0%, #b88a00 50%, #9a7000 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(140,100,0,0.35)",
              fontFamily: "Georgia, serif",
            }}
          >
            Create Account
          </button>
        </Link>

        {/* Sign In — GHOST: outlined gold, transparent */}
        <Link href="/sign-in" style={{ textDecoration: "none" }}>
          <button
            style={{
              width: "100%",
              padding: "clamp(12px, 3.5vw, 15px)",
              borderRadius: 10,
              border: "2px solid #a07800",
              background: "transparent",
              color: "#7a5c00",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.06em",
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}
          >
            Sign In
          </button>
        </Link>

        {/* Terms */}
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "#b8a060",
            margin: "2px 0 0",
            lineHeight: 1.6,
          }}
        >
          By continuing you agree to our{" "}
          <span style={{ color: "#8a6400", cursor: "pointer" }}>Terms of Service</span>
          {" "}and{" "}
          <span style={{ color: "#8a6400", cursor: "pointer" }}>Privacy Policy</span>
        </p>
      </div>

    </div>
  );
}
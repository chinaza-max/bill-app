"use client";
// ─────────────────────────────────────────────────────────────────
//  PWAInstallGuide.jsx
//  Place your app icon at /public/icon.png
//  Requires: /components/PWAInstaller.jsx  +  /public/sw.js
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import PWAInstaller, { triggerInstall } from "../components/PWAInstaller";

// ─── Detect device / browser ─────────────────────────────────────────────────
function detectEnv() {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent;
  const isIos        = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid    = /Android/.test(ua);
  const isSafari     = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome     = /Chrome\//.test(ua) && !/Edg\//.test(ua);
  const isEdge       = /Edg\//.test(ua);
  const isSamsung    = /SamsungBrowser/.test(ua);
  const isFirefox    = /Firefox/.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  return { isIos, isAndroid, isSafari, isChrome, isEdge, isSamsung, isFirefox, isStandalone };
}

// ─── Global styles ────────────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse-ring {
    0%   { transform:scale(1);    opacity:.5; }
    70%  { transform:scale(1.24); opacity:0;  }
    100% { transform:scale(1);    opacity:0;  }
  }
  @keyframes shimmer {
    0%   { background-position:-300px 0; }
    100% { background-position: 300px 0; }
  }
  @keyframes sheetUp {
    from { transform:translateY(100%); }
    to   { transform:translateY(0); }
  }

  .a1{animation:fadeUp .5s ease both .05s}
  .a2{animation:fadeUp .5s ease both .15s}
  .a3{animation:fadeUp .5s ease both .25s}
  .a4{animation:fadeUp .5s ease both .35s}
  .a5{animation:fadeUp .5s ease both .45s}
  .a6{animation:fadeUp .5s ease both .55s}
  .a7{animation:fadeUp .5s ease both .65s}
  .a8{animation:fadeUp .5s ease both .75s}

  .gold-text {
    background: linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c);
    background-size: 300px 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }

  /* ── Buttons ── */
  .btn {
    width:100%; padding:18px 20px;
    border-radius:16px; border:none; cursor:pointer;
    font-family:'Sora',sans-serif; font-size:16px; font-weight:600;
    display:flex; align-items:center; gap:12px;
    text-decoration:none;
    transition:transform .15s ease, box-shadow .2s ease, opacity .15s ease;
    -webkit-tap-highlight-color:transparent;
    user-select:none;
  }
  .btn:active { transform:scale(.97); opacity:.85; }

  .btn-gold {
    background: linear-gradient(135deg,#b8912e 0%,#f0d080 50%,#b8912e 100%);
    background-size:200% 100%;
    color:#080e0a;
    box-shadow:0 4px 24px rgba(201,168,76,.35);
  }
  .btn-gold:hover { background-position:100% 0; box-shadow:0 8px 36px rgba(201,168,76,.5); }

  .btn-ghost {
    background:rgba(255,255,255,.05);
    border:1.5px solid rgba(255,255,255,.14);
    color:#fff;
  }
  .btn-ghost:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.28); }

  .btn-green {
    background:rgba(47,173,90,.1);
    border:1.5px solid rgba(47,173,90,.35);
    color:#2fad5a;
  }
  .btn-green:hover { background:rgba(47,173,90,.18); border-color:rgba(47,173,90,.6); }

  .btn-disabled {
    background:rgba(255,255,255,.04);
    border:1.5px solid rgba(255,255,255,.07);
    color:rgba(255,255,255,.3);
    cursor:not-allowed;
  }

  .chevron { margin-left:auto; opacity:.4; flex-shrink:0; }

  /* ── Social dots ── */
  .social-dot {
    width:50px; height:50px; border-radius:50%;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.12);
    display:flex; align-items:center; justify-content:center;
    text-decoration:none; color:#fff;
    transition:background .2s, border-color .2s, transform .15s;
    -webkit-tap-highlight-color:transparent;
  }
  .social-dot:hover { background:rgba(201,168,76,.18); border-color:rgba(201,168,76,.5); transform:translateY(-2px); }

  /* ── Divider ── */
  .divider {
    display:flex; align-items:center; gap:12px;
    color:rgba(255,255,255,.2);
    font-size:11px; letter-spacing:.1em; text-transform:uppercase;
    font-family:'Sora',sans-serif;
  }
  .divider::before,.divider::after {
    content:''; flex:1; height:1px; background:rgba(255,255,255,.08);
  }

  /* ── Success box ── */
  .success-box {
    width:100%; padding:16px; border-radius:14px;
    background:rgba(47,173,90,.1); border:1px solid rgba(47,173,90,.35);
    color:#2fad5a; text-align:center;
    font-size:15px; font-weight:600; font-family:'Sora',sans-serif;
  }

  /* ── Already installed box ── */
  .already-box {
    width:100%; padding:14px; border-radius:14px;
    background:rgba(201,168,76,.08); border:1px solid rgba(201,168,76,.25);
    color:#c9a84c; text-align:center;
    font-size:14px; font-weight:500; font-family:'Sora',sans-serif;
  }

  /* ── Bottom sheet ── */
  .overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.78);
    display:flex; align-items:flex-end; z-index:300;
  }
  .sheet {
    width:100%; background:#111a14;
    border:1px solid rgba(201,168,76,.2);
    border-radius:24px 24px 0 0;
    padding:20px 22px 52px;
    max-width:480px; margin:0 auto;
    animation:sheetUp .28s cubic-bezier(.22,.61,.36,1) both;
    max-height:92vh; overflow-y:auto;
  }
  .handle {
    width:40px; height:4px; background:rgba(255,255,255,.18);
    border-radius:2px; margin:0 auto 22px;
  }
  .step-row {
    display:flex; gap:14px; align-items:flex-start;
    padding:13px 0; border-bottom:1px solid rgba(255,255,255,.05);
  }
  .step-row:last-of-type { border-bottom:none; }
  .step-num {
    min-width:28px; height:28px; border-radius:50%;
    background:linear-gradient(135deg,#c9a84c,#f0d080);
    display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:700; color:#080e0a;
    flex-shrink:0; font-family:'Sora',sans-serif;
  }
  .step-title { font-weight:600; color:#fff; font-size:14px; margin-bottom:3px; font-family:'Sora',sans-serif; }
  .step-desc  { font-size:13px; color:rgba(255,255,255,.62); line-height:1.6; font-family:'Sora',sans-serif; }
  .step-desc b{ color:#f0d080; font-weight:600; }
  .tip-box {
    margin-top:18px; padding:13px 16px; border-radius:12px;
    background:rgba(201,168,76,.08); border:1px solid rgba(201,168,76,.2);
    font-size:13px; color:rgba(255,255,255,.55); line-height:1.6;
    font-family:'Sora',sans-serif;
  }
  .tip-box b { color:#c9a84c; }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const IosIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);
const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M17.523 15.34A1 1 0 0116.5 16h-9a1 1 0 01-1-1V9.5h11v5.84zM7.562 4.1l-1.44-2.494a.25.25 0 00-.433.25l1.46 2.528A6.97 6.97 0 005 9.5h14a6.97 6.97 0 00-2.15-5.116l1.46-2.528a.25.25 0 00-.433-.25L16.437 4.1A6.952 6.952 0 0012 3a6.952 6.952 0 00-4.438 1.1zM9.5 7a.5.5 0 110-1 .5.5 0 010 1zm5 0a.5.5 0 110-1 .5.5 0 010 1z"/>
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22" aria-hidden="true">
    <path d="M12 3v13M7 11l5 5 5-5M3 18h18"/>
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" aria-hidden="true">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
  </svg>
);
const ChevronRight = () => (
  <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

// ─── Step sheet data per platform ─────────────────────────────────────────────
function getSteps(env) {
  const { isIos, isSafari, isSamsung, isFirefox, isEdge } = env;

  if (isIos) {
    return {
      title: "Install on iPhone / iPad",
      icon: <IosIcon />,
      tip: isSafari
        ? null
        : "⚠️ You're not in Safari. Copy this URL, open Safari, and paste it — Safari is required to install on iOS.",
      steps: [
        { title: "Open this page in Safari", desc: <><b>Safari only</b> supports install on iOS — Chrome & Firefox cannot add to home screen.</> },
        { title: "Tap the Share button ⬆", desc: <>The <b>Share icon</b> (box with arrow) is at the <b>bottom</b> of the Safari toolbar.</> },
        { title: 'Tap "Add to Home Screen"', desc: <>Scroll the share sheet and tap <b>Add to Home Screen</b>.</> },
        { title: "Tap Add", desc: <><b>Confirm</b> with Add in the top-right. FidoPoint appears on your home screen!</> },
      ],
    };
  }

  if (isSamsung) {
    return {
      title: "Install on Samsung Browser",
      icon: <AndroidIcon />,
      tip: null,
      steps: [
        { title: "Tap the ☰ menu", desc: <>Tap the <b>three-line menu</b> at the bottom of the Samsung Internet browser.</> },
        { title: 'Tap "Add page to"', desc: <>Select <b>Add page to</b> from the menu.</> },
        { title: 'Tap "Home screen"', desc: <>Choose <b>Home screen</b> — FidoPoint will be added instantly.</> },
        { title: "Tap Add", desc: <><b>Confirm</b> the dialog. Done!</> },
      ],
    };
  }

  if (isFirefox) {
    return {
      title: "Install on Firefox Android",
      icon: <AndroidIcon />,
      tip: "Firefox on Android supports PWA install from Firefox 79+.",
      steps: [
        { title: "Tap the ⋮ menu", desc: <>Tap the <b>three-dot menu</b> in Firefoxs top bar.</> },
        { title: 'Tap "Install"', desc: <>You should see an <b>Install</b> option in the menu.</> },
        { title: "Confirm install", desc: <><b>Tap Add</b> in the confirmation dialog.</> },
        { title: "Done!", desc: <>FidoPoint is now on your Android home screen.</> },
      ],
    };
  }

  if (isEdge) {
    return {
      title: "Install on Edge",
      icon: <AndroidIcon />,
      tip: null,
      steps: [
        { title: "Tap the ⋯ menu", desc: <>Tap the <b>three-dot menu</b> at the bottom of Edge browser.</> },
        { title: 'Tap "Add to phone"', desc: <>Select <b>Add to phone</b> or <b>Add to Home screen</b>.</> },
        { title: "Tap Add", desc: <><b>Confirm</b> — FidoPoint lands on your home screen.</> },
      ],
    };
  }

  // Default: Chrome Android / generic Android
  return {
    title: "Install on Android",
    icon: <AndroidIcon />,
    tip: null,
    steps: [
      { title: "Tap the ⋮ menu", desc: <>Tap the <b>three-dot menu</b> in the top-right of Chrome.</> },
      { title: 'Tap "Add to Home screen"', desc: <>Find and tap <b>Add to Home screen</b> in the menu list.</> },
      { title: "Tap Add", desc: <><b>Confirm</b> the dialog. FidoPoint is on your home screen!</> },
      { title: "Or wait for the banner", desc: <>Chrome may show an <b>automatic install banner</b> at the bottom — just tap it.</> },
    ],
  };
}

// ─── Bottom sheet modal ───────────────────────────────────────────────────────
function StepSheet({ steps, title, icon, tip, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="handle" />
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          {icon}
          <span style={{ fontSize:17, fontWeight:700, color:"#fff", fontFamily:"'Sora',sans-serif" }}>
            {title}
          </span>
        </div>
        {tip && (
          <div className="tip-box" style={{ marginBottom:16 }}>
            <b>Note:</b> {tip}
          </div>
        )}
        {steps.map((s, i) => (
          <div className="step-row" key={i}>
            <div className="step-num">{i + 1}</div>
            <div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          </div>
        ))}
        <button
          onClick={onClose}
          style={{
            marginTop:20, width:"100%", padding:"15px",
            borderRadius:14,
            background:"rgba(255,255,255,.05)",
            border:"1px solid rgba(255,255,255,.1)",
            color:"rgba(255,255,255,.5)",
            fontFamily:"'Sora',sans-serif",
            fontSize:15, fontWeight:600, cursor:"pointer",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function PWAInstallGuide() {
  const [nativeReady, setNativeReady]   = useState(false);
  const [installed,   setInstalled]     = useState(false);
  const [modal,       setModal]         = useState(false);
  const [env,         setEnv]           = useState({});

  // Detect environment client-side only
  useEffect(() => { setEnv(detectEnv()); }, []);

  const handlePromptReady = useCallback(() => setNativeReady(true), []);
  const handleInstalled   = useCallback(() => { setInstalled(true); setNativeReady(false); }, []);

  const doNativeInstall = async () => {
    const outcome = await triggerInstall();
    if (outcome === "accepted") setInstalled(true);
    setNativeReady(false);
  };

  const { isIos, isStandalone } = env;
  const sheetData = Object.keys(env).length ? getSteps(env) : null;

  // Primary CTA label & behavior
  const primaryLabel = isIos ? "Add to Home Screen (iOS)" : "Install FidoPoint";
  const primaryIcon  = isIos ? <ShareIcon /> : <DownloadIcon />;
  const primaryClick = isIos
    ? () => setModal(true)          // iOS → always show steps (Safari share sheet required)
    : nativeReady
      ? doNativeInstall             // Chrome/Edge/Samsung → one-tap native prompt
      : () => setModal(true);       // fallback → show steps

  return (
    <>
      <style>{STYLE}</style>

      {/* Service worker + prompt registration — renders nothing */}
      <PWAInstaller onPromptReady={handlePromptReady} onInstalled={handleInstalled} />

      {/* Step sheet */}
      {modal && sheetData && (
        <StepSheet {...sheetData} onClose={() => setModal(false)} />
      )}

      {/* Background */}
      <div style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 80% 50% at 50% -5%, rgba(201,168,76,.16) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 110%, rgba(30,122,62,.16) 0%, transparent 55%), #080e0a",
      }} />

      {/* Page */}
      <div style={{
        position:"relative", zIndex:1,
        minHeight:"100vh",
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"60px 20px 64px",
        maxWidth:480, margin:"0 auto",
        fontFamily:"'Sora',sans-serif",
      }}>

        {/* Logo */}
        <div className="a1" style={{ position:"relative", marginBottom:22 }}>
          <div style={{
            position:"absolute", inset:-12, borderRadius:"50%",
            border:"2px solid rgba(201,168,76,.45)",
            animation:"pulse-ring 2.4s ease-out infinite",
          }} />
          <div style={{
            width:92, height:92, borderRadius:"50%",
            background:"linear-gradient(145deg,#1a3322,#080e0a)",
            border:"2.5px solid rgba(201,168,76,.4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            overflow:"hidden",
          }}>
            <Image src="/icon.png" alt="FidoPoint app" width={62} height={62} style={{borderRadius:8}} priority />
          </div>
        </div>

        {/* Name */}
        <h1 className="gold-text a2" style={{ fontSize:34, fontWeight:700, letterSpacing:".02em", marginBottom:8 }}>
          FidoPoint
        </h1>

        {/* Tagline */}
        <p className="a3" style={{
          fontSize:14, color:"rgba(255,255,255,.5)",
          textAlign:"center", lineHeight:1.65, marginBottom:28, maxWidth:280,
        }}>
          unlocking convenience.{" "}
          <span style={{ color:"#c9a84c" }}>1,000+ happy customers and merchants.</span>
        </p>

        {/* Social dots */}
        <div className="a4" style={{ display:"flex", gap:14, marginBottom:44 }}>
          <a href="https://www.tiktok.com/@fidopointofficial" target="_blank" rel="noopener noreferrer" className="social-dot" aria-label="TikTok">
            <TikTokIcon />
          </a>
          <a href="https://x.com/fidopoint" target="_blank" rel="noopener noreferrer" className="social-dot" aria-label="X">
            <XIcon />
          </a>
        </div>

        {/* ── Buttons ── */}
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:12 }}>

          {/* Already running as installed app */}
          {isStandalone && (
            <div className="a5 already-box">✓ You are already using the installed app!</div>
          )}

          {/* Installed success */}
          {installed && !isStandalone && (
            <div className="a5 success-box">✓ Installed! Open FidoPoint from your home screen.</div>
          )}

          {/* Primary install CTA */}
          {!isStandalone && !installed && (
            <div className="a5">
              <button className="btn btn-gold" onClick={primaryClick} aria-label={primaryLabel}>
                {primaryIcon}
                {nativeReady && !isIos ? "Tap to Install Now" : primaryLabel}
                <ChevronRight />
              </button>
            </div>
          )}

          {/* Secondary: show guide even if native prompt is available */}
          {!isIos && !isStandalone && (
            <div className="a6">
              <button className="btn btn-ghost" onClick={() => setModal(true)} aria-label="Show manual install guide">
                <AndroidIcon />
                Manual install guide
                <ChevronRight />
              </button>
            </div>
          )}

          {/* iOS: always show the Safari guide button */}
          {isIos && !isStandalone && (
            <div className="a6">
              <button className="btn btn-ghost" onClick={() => setModal(true)} aria-label="iPhone and iPad install steps">
                <IosIcon />
                iPhone / iPad steps
                <ChevronRight />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="a7 divider" style={{ margin:"6px 0" }}>follow us</div>

          {/* TikTok */}
          <div className="a7">
            <a href="https://www.tiktok.com/@fidopointofficial" target="_blank" rel="noopener noreferrer"
               className="btn btn-ghost" style={{ fontSize:15 }}>
              <TikTokIcon />
              @fidopointofficial
              <ChevronRight />
            </a>
          </div>

          {/* X */}
          <div className="a8">
            <a href="https://x.com/fidopoint" target="_blank" rel="noopener noreferrer"
               className="btn btn-ghost" style={{ fontSize:15 }}>
              <XIcon />
              @fidopoint
              <ChevronRight />
            </a>
          </div>
        </div>

        <p style={{ marginTop:52, fontSize:12, color:"rgba(255,255,255,.2)", textAlign:"center", lineHeight:1.9 }}>
          © {new Date().getFullYear()} FidoPoint · All rights reserved
        </p>
      </div>
    </>
  );
}
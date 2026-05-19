"use client";
// Place your app icon at /public/icon.png

import React, { useState, useEffect } from "react";
import Image from "next/image";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);    opacity: .5; }
    70%  { transform: scale(1.22); opacity: 0;  }
    100% { transform: scale(1);    opacity: 0;  }
  }
  @keyframes shimmer {
    0%   { background-position: -300px 0; }
    100% { background-position:  300px 0; }
  }

  .a1 { animation: fadeUp .5s ease both .05s; }
  .a2 { animation: fadeUp .5s ease both .15s; }
  .a3 { animation: fadeUp .5s ease both .25s; }
  .a4 { animation: fadeUp .5s ease both .35s; }
  .a5 { animation: fadeUp .5s ease both .45s; }
  .a6 { animation: fadeUp .5s ease both .55s; }
  .a7 { animation: fadeUp .5s ease both .65s; }
  .a8 { animation: fadeUp .5s ease both .75s; }

  .gold-text {
    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
    background-size: 300px 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }

  .btn {
    width: 100%;
    padding: 18px 20px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    transition: transform .15s ease, box-shadow .2s ease, opacity .15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .btn:active { transform: scale(.97); opacity: .85; }

  .btn-gold {
    background: linear-gradient(135deg, #b8912e 0%, #f0d080 50%, #b8912e 100%);
    background-size: 200% 100%;
    color: #080e0a;
    box-shadow: 0 4px 20px rgba(201,168,76,.3);
  }
  .btn-gold:hover { background-position: 100% 0; box-shadow: 0 8px 32px rgba(201,168,76,.5); }

  .btn-ghost {
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.13);
    color: #fff;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,.25); }

  .btn-green {
    background: rgba(47,173,90,0.1);
    border: 1.5px solid rgba(47,173,90,0.35);
    color: #2fad5a;
  }
  .btn-green:hover { background: rgba(47,173,90,0.18); border-color: rgba(47,173,90,.6); }

  .social-dot {
    width: 50px; height: 50px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    text-decoration: none; color: #fff;
    transition: background .2s, border-color .2s, transform .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .social-dot:hover { background: rgba(201,168,76,.18); border-color: rgba(201,168,76,.5); transform: translateY(-2px); }

  .chevron { margin-left: auto; opacity: .4; flex-shrink: 0; }

  .divider {
    display: flex; align-items: center; gap: 12px;
    color: rgba(255,255,255,0.2);
    font-size: 11px;
    letter-spacing: .1em;
    text-transform: uppercase;
    font-family: 'Sora', sans-serif;
  }
  .divider::before, .divider::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255,255,255,0.08);
  }

  .success-box {
    width: 100%;
    padding: 16px;
    border-radius: 14px;
    background: rgba(47,173,90,.1);
    border: 1px solid rgba(47,173,90,.35);
    color: #2fad5a;
    text-align: center;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
  }

  /* Bottom sheet modal */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.75);
    display: flex; align-items: flex-end;
    z-index: 200;
    animation: fadeUp .2s ease;
  }
  .sheet {
    width: 100%;
    background: #111a14;
    border: 1px solid rgba(201,168,76,.18);
    border-radius: 24px 24px 0 0;
    padding: 20px 22px 52px;
    max-width: 480px;
    margin: 0 auto;
  }
  .handle {
    width: 40px; height: 4px;
    background: rgba(255,255,255,.18);
    border-radius: 2px;
    margin: 0 auto 22px;
  }
  .step-row {
    display: flex; gap: 14px; align-items: flex-start;
    padding: 13px 0;
    border-bottom: 1px solid rgba(255,255,255,.05);
  }
  .step-row:last-of-type { border-bottom: none; }
  .step-num {
    min-width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #c9a84c, #f0d080);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #080e0a;
    flex-shrink: 0; font-family: 'Sora', sans-serif;
  }
  .step-title { font-weight: 600; color: #fff; font-size: 14px; margin-bottom: 2px; font-family:'Sora',sans-serif; }
  .step-desc  { font-size: 13px; color: rgba(255,255,255,.6); line-height: 1.55; font-family:'Sora',sans-serif; }
  .step-desc b { color: #f0d080; font-weight: 600; }
`;

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const IosIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M17.523 0.976 L15.85 3.9 A6.974 6.974 0 0 0 12 3 A6.974 6.974 0 0 0 8.15 3.9 L6.477 0.976 L5.124 1.774 L6.76 4.64 A7 7 0 0 0 5 9 L19 9 A7 7 0 0 0 17.24 4.64 L18.876 1.774 Z M9.5 7 A0.5 0.5 0 0 1 9.5 6 A0.5 0.5 0 0 1 9.5 7 Z M14.5 7 A0.5 0.5 0 0 1 14.5 6 A0.5 0.5 0 0 1 14.5 7 Z M5 10 L5 19 A2 2 0 0 0 7 21 L7 23 A1 1 0 0 0 9 23 L9 21 L15 21 L15 23 A1 1 0 0 0 17 23 L17 21 A2 2 0 0 0 19 19 L19 10 Z"/>
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

const ChevronRight = () => (
  <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

// ─── Bottom sheet with steps ─────────────────────────────────────────────────
function StepSheet({ platform, onClose }) {
  const ios = platform === "ios";
  const steps = ios ? [
    { title: "Open in Safari", desc: <>Make sure you are using <b>Safari</b> — not Chrome.</> },
    { title: "Tap the Share button ⬆", desc: <>The share icon is at the <b>bottom</b> of your screen.</> },
    { title: "Tap Add to Home Screen", desc: <>Scroll down the share sheet to find it.</> },
    { title: "Tap Add — you're done!", desc: <>FidoPoint now lives on your home screen.</> },
  ] : [
    { title: "Open in Chrome", desc: <>Make sure you are using <b>Chrome</b> browser.</> },
    { title: "Tap the ⋮ menu", desc: <><b>Three dots</b> in the top-right corner of Chrome.</> },
    { title: "Tap Add to Home screen", desc: <>It is in the menu list.</> },
    { title: "Tap Add — you're done!", desc: <>FidoPoint now lives on your home screen.</> },
  ];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="handle" />
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          {ios ? <IosIcon /> : <AndroidIcon />}
          <span style={{ fontSize:17, fontWeight:700, color:"#fff", fontFamily:"'Sora',sans-serif" }}>
            {ios ? "iPhone / iPad" : "Android"} Install Guide
          </span>
        </div>
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
            background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.1)",
            color:"rgba(255,255,255,0.5)",
            fontFamily:"'Sora',sans-serif",
            fontSize:15, fontWeight:600, cursor:"pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PWAInstallGuide() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [modal, setModal] = useState(null); // 'ios' | 'android' | null

  useEffect(() => {
    const handler = e => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const nativeInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };

  return (
    <>
      <style>{STYLE}</style>

      {/* Background */}
      <div style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 80% 50% at 50% -5%, rgba(201,168,76,.16) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 110%, rgba(30,122,62,.16) 0%, transparent 55%), #080e0a",
      }} />

      {/* Modal */}
      {modal && <StepSheet platform={modal} onClose={() => setModal(null)} />}

      {/* Page */}
      <div style={{
        position:"relative", zIndex:1,
        minHeight:"100vh",
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"60px 20px 64px",
        maxWidth:480, margin:"0 auto",
        fontFamily:"'Sora', sans-serif",
      }}>

        {/* ── Logo ── */}
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
            <Image src="/icon.png" alt="FidoPoint app icon" width={62} height={62} style={{borderRadius:8}} priority />
          </div>
        </div>

        {/* ── Name ── */}
        <h1 className="gold-text a2" style={{ fontSize:34, fontWeight:700, letterSpacing:".02em", marginBottom:8 }}>
          FidoPoint
        </h1>

        {/* ── Tagline ── */}
        <p className="a3" style={{
          fontSize:14, color:"rgba(255,255,255,.5)",
          textAlign:"center", lineHeight:1.65, marginBottom:28, maxWidth:280,
        }}>
          unlocking convenience.{" "}
          <span style={{ color:"#c9a84c" }}>1,000+ happy customers and merchants.</span>
        </p>

        {/* ── Social dots ── */}
        <div className="a4" style={{ display:"flex", gap:14, marginBottom:44 }}>
          <a href="https://www.tiktok.com/@fidopointofficial" target="_blank" rel="noopener noreferrer" className="social-dot" aria-label="Follow FidoPoint on TikTok">
            <TikTokIcon />
          </a>
          <a href="https://x.com/fidopoint" target="_blank" rel="noopener noreferrer" className="social-dot" aria-label="Follow FidoPoint on X">
            <XIcon />
          </a>
        </div>

        {/* ── Buttons ── */}
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:12 }}>

          {/* Native one-tap (Chrome/Edge auto-prompt) */}
          {prompt && !installed && (
            <div className="a5">
              <button className="btn btn-gold" onClick={nativeInstall} aria-label="Install FidoPoint app">
                <DownloadIcon />
                Install FidoPoint
                <ChevronRight />
              </button>
            </div>
          )}

          {installed && (
            <div className="a5 success-box">✓ Installed! Open FidoPoint from your home screen.</div>
          )}

          {/* iOS */}
          <div className="a5">
            <button className="btn btn-ghost" onClick={() => setModal("ios")} aria-label="Install on iPhone or iPad">
              <IosIcon />
              Add to iPhone / iPad
              <ChevronRight />
            </button>
          </div>

          {/* Android */}
          <div className="a6">
            <button className="btn btn-green" onClick={() => setModal("android")} aria-label="Install on Android">
              <AndroidIcon />
              Add to Android
              <ChevronRight />
            </button>
          </div>

          {/* Divider */}
          <div className="a7 divider" style={{ margin:"6px 0" }}>follow us</div>

          {/* TikTok row */}
          <div className="a7">
            <a href="https://www.tiktok.com/@fidopointofficial" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize:15 }}>
              <TikTokIcon />
              @fidopointofficial
              <ChevronRight />
            </a>
          </div>

          {/* X row */}
          <div className="a8">
            <a href="https://x.com/fidopoint" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize:15 }}>
              <XIcon />
              @fidopoint
              <ChevronRight />
            </a>
          </div>

        </div>

        {/* Footer */}
        <p style={{ marginTop:52, fontSize:12, color:"rgba(255,255,255,.2)", textAlign:"center", lineHeight:1.9 }}>
          © {new Date().getFullYear()} FidoPoint · All rights reserved
        </p>
      </div>
    </>
  );
}
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// ─── CONFIG — replace with your real values ────────────────────────────────
const GOOGLE_CLIENT_ID  = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const EMAIL_CHECK_API   = "https://your-api.example.com/api/check-email";
const REGISTER_API      = "https://your-api.example.com/api/register";
const GOOGLE_SIGNUP_API = "https://your-api.example.com/api/google-signup";
const GOOGLE_LINK_API   = "https://your-api.example.com/api/link-google";
// ──────────────────────────────────────────────────────────────────────────

/* ── Small helpers ─────────────────────────────────────────────────────── */
function Spinner({ color = "#fff", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none"
      style={{ animation: "fidoSpin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="2.5"
        strokeDasharray="34" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="26" fill="rgba(160,120,0,0.10)" stroke="#a07800" strokeWidth="2" />
      <path d="M17 28.5l8 8 14-16" stroke="#a07800" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#a07800" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#a07800" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Validation ────────────────────────────────────────────────────────── */
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = v => /^\+?[\d\s\-()]{7,15}$/.test(v);
const isValidPwd   = v => v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v);

function pwdStrength(v) {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8)           s++;
  if (v.length >= 12)          s++;
  if (/[A-Z]/.test(v))         s++;
  if (/\d/.test(v))            s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function SignUpPage() {
  const router      = useRouter();
  const logoRingRef = useRef(null);

  /* Logo spin — same as WelcomePage */
  useEffect(() => {
    const el = logoRingRef.current;
    if (!el) return;
    let angle = 0, raf;
    const tick = () => { angle += 0.4; el.style.transform = `rotate(${angle}deg)`; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Load Google GSI SDK */
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  /* ── Form state ── */
  const [form, setForm]     = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  /* ── Global stage ── */
  // idle | submitting | google-loading | google-checking | google-exists | google-linking | done | error
  const [stage, setStage]         = useState("idle");
  const [errorMsg, setErrorMsg]   = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [linkAgreed, setLinkAgreed] = useState(false);

  /* ── Field errors ── */
  const errs = {
    fullName: !form.fullName.trim()                              ? "Full name is required"           : "",
    email:    !form.email                                        ? "Email is required"
            : !isValidEmail(form.email)                          ? "Enter a valid email"             : "",
    phone:    form.phone && !isValidPhone(form.phone)            ? "Enter a valid phone number"      : "",
    password: !form.password                                     ? "Password is required"
            : !isValidPwd(form.password)                         ? "Min 8 chars, 1 uppercase, 1 number" : "",
    confirm:  !form.confirm                                      ? "Please confirm your password"
            : form.confirm !== form.password                     ? "Passwords do not match"          : "",
  };
  const formValid = Object.values(errs).every(e => !e);

  const field = name => ({
    value:    form[name],
    onChange: e => setForm(f => ({ ...f, [name]: e.target.value })),
    onBlur:   () => setTouched(t => ({ ...t, [name]: true })),
  });
  const showErr = name => touched[name] && errs[name];

  /* ── Submit (email/password) ── */
  const handleSubmit = async () => {
    setTouched({ fullName: true, email: true, phone: true, password: true, confirm: true });
    if (!formValid) return;
    setStage("submitting");
    setErrorMsg("");
    try {
      const res = await fetch(REGISTER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email:    form.email.trim(),
          phone:    form.phone.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setStage("done");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setStage("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  /* ── Google credential handler ── */
  const handleGoogleCredential = useCallback(async (response) => {
    setStage("google-checking");
    setErrorMsg("");
    try {
      const [, payload] = response.credential.split(".");
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      const user = {
        email:      decoded.email,
        name:       decoded.name,
        picture:    decoded.picture,
        googleId:   decoded.sub,
        credential: response.credential,
      };
      setGoogleUser(user);

      /* Check if email already exists */
      const checkRes  = await fetch(EMAIL_CHECK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.message || "Email check failed");

      if (checkData.exists) {
        /* Email taken — offer to link */
        setStage("google-exists");
      } else {
        /* Brand new — create account immediately */
        const cr  = await fetch(GOOGLE_SIGNUP_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.name, googleId: user.googleId, credential: user.credential }),
        });
        const cd = await cr.json();
        if (!cr.ok) throw new Error(cd.message || "Account creation failed");
        setStage("done");
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch (err) {
      setStage("error");
      setErrorMsg(err.message || "Google sign-up failed.");
    }
  }, []);

  const triggerGoogle = () => {
    if (typeof window === "undefined" || !window.google) return;
    setStage("google-loading");
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: false });
    window.google.accounts.id.prompt(n => { if (n.isNotDisplayed() || n.isSkippedMoment()) setStage("idle"); });
  };

  /* ── Link existing account ── */
  const linkAccount = async () => {
    if (!linkAgreed) return;
    setStage("google-linking");
    try {
      const res  = await fetch(GOOGLE_LINK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleUser.email, googleId: googleUser.googleId, credential: googleUser.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Linking failed");
      setStage("done");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setStage("error");
      setErrorMsg(err.message || "Account linking failed.");
    }
  };

  const resetOverlay = () => { setStage("idle"); setGoogleUser(null); setLinkAgreed(false); setErrorMsg(""); };

  /* ── Password strength ── */
  const strength = pwdStrength(form.password);
  const strengthColors = ["", "#e05c5c", "#e0943c", "#d4c03c", "#7ab83c", "#3cb85c"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];

  /* ── Design tokens ── */
  const C = {
    bg:       "#fdf8ee",
    gold:     "#a07800",
    goldDark: "#7a5c00",
    goldDeep: "#8a6400",
    cardBg:   "rgba(255,255,255,0.76)",
    border:   "rgba(160,120,0,0.22)",
    text:     "#6b5200",
    muted:    "#b8a060",
  };

  /* ── Shared component styles ── */
  const inputBase = (hasErr) => ({
    width: "100%", padding: "13px 14px", borderRadius: 10,
    border: `1.5px solid ${hasErr ? "#c04040" : C.border}`,
    background: "rgba(255,255,255,0.92)", color: C.goldDark,
    fontSize: 14, fontFamily: "Georgia, serif", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  });

  const labelSt = {
    display: "block", fontSize: 11, letterSpacing: "0.12em", color: C.gold,
    textTransform: "uppercase", fontWeight: 700, marginBottom: 7,
    fontFamily: "Georgia, serif",
  };

  const goldBtn = {
    width: "100%", padding: "14px", borderRadius: 10, border: "none",
    background: `linear-gradient(135deg, ${C.goldDeep} 0%, #b88a00 50%, #9a7000 100%)`,
    color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "0.06em",
    cursor: "pointer", boxShadow: "0 4px 18px rgba(140,100,0,0.28)",
    fontFamily: "Georgia, serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  };

  const ghostBtn = {
    width: "100%", padding: "13px", borderRadius: 10,
    border: `2px solid ${C.gold}`, background: "rgba(255,255,255,0.55)",
    color: C.goldDark, fontSize: 14, fontWeight: 600, letterSpacing: "0.05em",
    cursor: "pointer", fontFamily: "Georgia, serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    backdropFilter: "blur(4px)",
  };

  const errSt = { fontSize: 11, color: "#c04040", marginTop: 5, fontFamily: "Georgia, serif" };

  const isOverlay = stage !== "idle";

  return (
    <>
      <style>{`
        @keyframes fidoSpin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes overlayIn { from { opacity:0; transform:scale(0.97);     } to { opacity:1; transform:scale(1);    } }
        .fu  { animation: fadeUp 0.45s ease forwards; }
        .fu1 { animation: fadeUp 0.45s 0.06s ease both; }
        .fu2 { animation: fadeUp 0.45s 0.13s ease both; }
        .fu3 { animation: fadeUp 0.45s 0.20s ease both; }
        .fu4 { animation: fadeUp 0.45s 0.28s ease both; }
        .ov  { animation: overlayIn 0.32s ease forwards; }
        input:focus { border-color: #a07800 !important; box-shadow: 0 0 0 3px rgba(160,120,0,0.11) !important; }
        input::placeholder { color: rgba(160,120,0,0.35); }
        button:active { opacity: 0.86; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(160,120,0,0.22); border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100dvh", backgroundColor: C.bg,
        display: "flex", flexDirection: "column", alignItems: "center",
        maxWidth: 430, margin: "0 auto", padding: "0 22px",
        fontFamily: "Georgia, serif", boxSizing: "border-box",
      }}>

        {/* ════════════════════════════════════════════
            OVERLAY — covers the whole screen for:
            loading states, google-exists, done, error
        ════════════════════════════════════════════ */}
        {isOverlay && (
          <div className="ov" style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(253,248,238,0.96)", backdropFilter: "blur(12px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "32px 28px", maxWidth: 430, margin: "0 auto",
            boxSizing: "border-box",
          }}>

            {/* Loading spinners */}
            {["submitting","google-loading","google-checking","google-linking"].includes(stage) && (
              <div style={{ textAlign: "center" }}>
                <Spinner color={C.gold} size={44} />
                <p style={{ color: C.goldDark, fontSize: 14, marginTop: 22, lineHeight: 1.75 }}>
                  {stage === "submitting"      && "Creating your account…"}
                  {stage === "google-loading"  && "Opening Google sign-in…"}
                  {stage === "google-checking" && <><span>Checking </span><strong>{googleUser?.email}</strong><span>…</span></>}
                  {stage === "google-linking"  && "Linking your Google account…"}
                </p>
              </div>
            )}

            {/* Email already exists — link offer */}
            {stage === "google-exists" && (
              <div style={{
                width: "100%", background: C.cardBg, borderRadius: 18,
                border: `1.5px solid ${C.border}`,
                boxShadow: "0 6px 32px rgba(160,120,0,0.10)",
                padding: "28px 22px", backdropFilter: "blur(8px)",
              }}>
                {/* Avatar */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  {googleUser?.picture && (
                    <img src={googleUser.picture} alt={googleUser.name} width={64} height={64}
                      style={{ borderRadius: "50%", border: "3px solid rgba(160,120,0,0.28)",
                        boxShadow: "0 2px 14px rgba(160,120,0,0.16)", display: "block", margin: "0 auto 12px" }} />
                  )}
                  <p style={{ fontWeight: 800, color: C.goldDark, fontSize: 16, margin: "0 0 3px" }}>{googleUser?.name}</p>
                  <p style={{ fontSize: 12, color: C.gold, margin: 0 }}>{googleUser?.email}</p>
                </div>
                {/* Notice */}
                <div style={{
                  background: "rgba(160,120,0,0.08)", border: `1.5px solid rgba(160,120,0,0.22)`,
                  borderRadius: 10, padding: "14px 16px", marginBottom: 20,
                }}>
                  <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.8 }}>
                    <strong>This email is already registered</strong> with FidoPoint using a password account.
                    You can link your Google account so both sign-in methods work going forward.
                  </p>
                </div>
                {/* Consent checkbox */}
                <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: 22 }}>
                  <input type="checkbox" checked={linkAgreed} onChange={e => setLinkAgreed(e.target.checked)}
                    style={{ marginTop: 3, accentColor: C.gold, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.text, lineHeight: 1.75 }}>
                    I agree to link my Google account (<strong>{googleUser?.email}</strong>) to my existing FidoPoint account.
                  </span>
                </label>
                <button style={{ ...goldBtn, opacity: linkAgreed ? 1 : 0.42, cursor: linkAgreed ? "pointer" : "not-allowed" }}
                  onClick={linkAccount} disabled={!linkAgreed}>
                  Link &amp; Continue
                </button>
                <button style={{ ...ghostBtn, marginTop: 10 }} onClick={resetOverlay}>
                  Use a Different Account
                </button>
              </div>
            )}

            {/* Success */}
            {stage === "done" && (
              <div style={{ textAlign: "center" }}>
                <CheckCircle />
                <p style={{ fontWeight: 800, color: C.goldDark, fontSize: 19, margin: "20px 0 8px", letterSpacing: "0.04em" }}>
                  Welcome to FidoPoint!
                </p>
                <p style={{ color: C.text, fontSize: 13, margin: 0 }}>Redirecting to your dashboard…</p>
              </div>
            )}

            {/* Error */}
            {stage === "error" && (
              <div style={{ width: "100%" }}>
                <div style={{
                  background: "rgba(200,50,50,0.07)", border: "1.5px solid rgba(200,50,50,0.22)",
                  borderRadius: 12, padding: "18px 20px", marginBottom: 24, textAlign: "center",
                }}>
                  <p style={{ fontSize: 14, color: "#8b2020", margin: 0, lineHeight: 1.75 }}>
                    ⚠️ {errorMsg}
                  </p>
                </div>
                <button style={goldBtn} onClick={resetOverlay}>Try Again</button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            LOGO HEADER
        ════════════════════════════════ */}
        <div className="fu" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: "clamp(28px, 7vh, 52px)",
        }}>
          <div style={{ position: "relative", width: 96, height: 96 }}>
            <div ref={logoRingRef} style={{
              position: "absolute", inset: -12, borderRadius: "50%",
              border: "2.5px dashed #a07800", opacity: 0.82,
            }} />
            <div style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              border: "1.5px solid rgba(160,120,0,0.28)",
            }} />
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
              backgroundColor: "#fff", border: "3px solid rgba(160,120,0,0.20)",
              boxShadow: "0 4px 20px rgba(160,120,0,0.13)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Image src="/logo-DsKke-Me.png" alt="FidoPoint" width={80} height={80}
                style={{ objectFit: "contain", width: "85%", height: "85%" }} />
            </div>
          </div>
          <h1 style={{
            fontSize: 20, fontWeight: 800, color: C.goldDark,
            letterSpacing: "0.09em", textTransform: "uppercase",
            margin: "16px 0 3px",
          }}>FidoPoint</h1>
          <p style={{ fontSize: 10, letterSpacing: "0.16em", color: C.gold, textTransform: "uppercase", margin: 0, fontStyle: "italic" }}>
            Create Account
          </p>
          <div style={{ marginTop: 11, width: 44, height: 3, borderRadius: 2, background: "linear-gradient(to right, #a07800, #d4a800, #a07800)" }} />
        </div>

        {/* ════════════════════════════════
            GOOGLE BUTTON
        ════════════════════════════════ */}
        <div className="fu1" style={{ width: "100%", marginTop: "clamp(20px, 5vw, 32px)" }}>
          <button style={ghostBtn} onClick={triggerGoogle}>
            <GoogleG />
            Continue with Google
          </button>
        </div>

        {/* ════════════════════════════════
            OR DIVIDER
        ════════════════════════════════ */}
        <div className="fu2" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", margin: "20px 0 18px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(160,120,0,0.17)" }} />
          <span style={{ fontSize: 11, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            or sign up with email
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(160,120,0,0.17)" }} />
        </div>

        {/* ════════════════════════════════
            SIGN-UP FORM CARD
        ════════════════════════════════ */}
        <div className="fu3" style={{
          width: "100%",
          background: C.cardBg,
          borderRadius: 18,
          border: `1.5px solid ${C.border}`,
          boxShadow: "0 6px 32px rgba(160,120,0,0.09), 0 1px 4px rgba(0,0,0,0.04)",
          padding: "26px 22px 24px",
          backdropFilter: "blur(8px)",
          boxSizing: "border-box",
        }}>

          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>Full Name</label>
            <input {...field("fullName")} placeholder="Ada Okonkwo"
              style={inputBase(showErr("fullName"))} />
            {showErr("fullName") && <p style={errSt}>{errs.fullName}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>Email Address</label>
            <input {...field("email")} type="email" placeholder="ada@example.com"
              style={inputBase(showErr("email"))} />
            {showErr("email") && <p style={errSt}>{errs.email}</p>}
          </div>

          {/* Phone (optional) */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>
              Phone Number
              <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.08em", color: C.muted, marginLeft: 6, textTransform: "none" }}>
                (optional)
              </span>
            </label>
            <input {...field("phone")} type="tel" placeholder="+234 800 000 0000"
              style={inputBase(showErr("phone"))} />
            {showErr("phone") && <p style={errSt}>{errs.phone}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>Password</label>
            <div style={{ position: "relative" }}>
              <input {...field("password")} type={showPwd ? "text" : "password"}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                style={{ ...inputBase(showErr("password")), paddingRight: 46 }} />
              <button onClick={() => setShowPwd(v => !v)} style={{
                position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center",
              }}>
                <EyeIcon open={showPwd} />
              </button>
            </div>
            {/* Strength bar */}
            {form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength ? strengthColors[strength] : "rgba(160,120,0,0.13)",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: strengthColors[strength], margin: "4px 0 0", fontFamily: "Georgia, serif" }}>
                  {strengthLabels[strength]}
                </p>
              </div>
            )}
            {showErr("password") && <p style={errSt}>{errs.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelSt}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input {...field("confirm")} type={showCfm ? "text" : "password"}
                placeholder="Repeat your password"
                style={{ ...inputBase(showErr("confirm")), paddingRight: 46 }} />
              <button onClick={() => setShowCfm(v => !v)} style={{
                position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center",
              }}>
                <EyeIcon open={showCfm} />
              </button>
            </div>
            {showErr("confirm") && <p style={errSt}>{errs.confirm}</p>}
          </div>

          {/* Submit */}
          <button style={goldBtn} onClick={handleSubmit}>
            Create Account
          </button>
        </div>

        {/* ════════════════════════════════
            FOOTER
        ════════════════════════════════ */}
        <div className="fu4" style={{
          width: "100%", paddingBottom: "clamp(22px, 5vh, 40px)",
          marginTop: 20, textAlign: "center",
        }}>
          <p style={{ fontSize: 10, color: C.muted, margin: "0 0 10px", lineHeight: 1.7 }}>
            By signing up you agree to our{" "}
            <span style={{ color: C.goldDeep, cursor: "pointer" }}>Terms of Service</span>
            {" "}and{" "}
            <span style={{ color: C.goldDeep, cursor: "pointer" }}>Privacy Policy</span>
          </p>
          <p style={{ fontSize: 12, color: C.text, margin: 0 }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: C.goldDeep, fontWeight: 700, textDecoration: "none" }}>
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </>
  );
}
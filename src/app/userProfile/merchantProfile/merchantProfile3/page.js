"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Check, Loader2, AlertCircle, ArrowLeft, CheckCircle, RefreshCw, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/store/slice";
import * as faceapi from "face-api.js";
import ProtectedRoute from "@/app/component/protect";
import Image from "next/image";

const VERIFICATION_STEPS = {
  INITIAL:        "initial",
  LOADING_MODELS: "loading_models",
  CAMERA_SETUP:   "camera_setup",
  POSITIONING:    "positioning",
  STABILIZING:    "stabilizing",   // ← NEW: counting down stability frames
  PREVIEW:        "preview",       // ← NEW: user reviews captured image
  UPLOADING:      "uploading",
  COMPLETE:       "complete",
};

const MODEL_URL = "/models";

// How many consecutive stable frames before we capture (at 250ms each = ~1.5s)
const STABLE_FRAMES_NEEDED = 6;

const LM = {
  jaw:        Array.from({ length: 17 }, (_, i) => i),
  leftBrow:   [17, 18, 19, 20, 21],
  rightBrow:  [22, 23, 24, 25, 26],
  noseBridge: [27, 28, 29, 30],
  noseBottom: [30, 31, 32, 33, 34, 35, 30],
  leftEye:    [36, 37, 38, 39, 40, 41, 36],
  rightEye:   [42, 43, 44, 45, 46, 47, 42],
  mouthOuter: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48],
  mouthInner: [60, 61, 62, 63, 64, 65, 66, 67, 60],
  keyDots:    [36, 39, 42, 45, 30, 33, 48, 54, 8],
};

function avgPos(pts) {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
}

function checkLighting(video) {
  const tmp = document.createElement("canvas");
  tmp.width = 80; tmp.height = 80;
  const ctx = tmp.getContext("2d");
  ctx.drawImage(video, 0, 0, 80, 80);
  const data = ctx.getImageData(0, 0, 80, 80).data;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const brightness = total / (data.length / 4);
  return { brightness, ok: brightness > 55 && brightness < 235 };
}

function isHumanLikeFace(detection) {
  if (!detection?.expressions) return false;
  return Object.values(detection.expressions).reduce((a, b) => a + b, 0) > 0.4;
}

function checkHeadPose(positions) {
  if (!positions || positions.length < 68) return { facingForward: false, reason: "No landmarks" };
  const leftEyeOuter = positions[36], rightEyeOuter = positions[45];
  const noseTip = positions[30], mouthLeft = positions[48], mouthRight = positions[54];
  const eyeMidX  = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
  const noseMidOffsetX = (noseTip.x - eyeMidX) / eyeWidth;
  const yawOk = Math.abs(noseMidOffsetX) < 0.18;
  const eyeMidY  = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const mouthMidY = (mouthLeft.y + mouthRight.y) / 2;
  const nosePctY = (noseTip.y - eyeMidY) / (mouthMidY - eyeMidY);
  const pitchOk = nosePctY > 0.35 && nosePctY < 0.75;
  const rollDeg = Math.abs(Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * (180 / Math.PI));
  const rollOk = rollDeg < 12;
  let reason = "";
  if (!yawOk)        reason = noseMidOffsetX < 0 ? "Turn your face right" : "Turn your face left";
  else if (!pitchOk) reason = nosePctY < 0.35 ? "Lower your chin slightly" : "Raise your chin slightly";
  else if (!rollOk)  reason = "Straighten your head — don't tilt";
  return { facingForward: yawOk && pitchOk && rollOk, yawOk, pitchOk, rollOk, reason };
}

/**
 * Checks how much face landmarks have moved between two frames.
 * Returns true if the face is stable (not blurry / in motion).
 */
function isFaceStable(prevPositions, currPositions, threshold = 3.5) {
  if (!prevPositions || !currPositions || prevPositions.length !== currPositions.length) return false;
  let totalMovement = 0;
  for (let i = 0; i < currPositions.length; i++) {
    const dx = currPositions[i].x - prevPositions[i].x;
    const dy = currPositions[i].y - prevPositions[i].y;
    totalMovement += Math.sqrt(dx * dx + dy * dy);
  }
  const avgMovement = totalMovement / currPositions.length;
  return avgMovement < threshold;
}

function drawOverlay(canvas, video, detection, allGood, stabilityCount = 0) {
  if (!canvas || !video) return;
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h * 0.42, rx = w * 0.28, ry = h * 0.35;

  // Oval outline
  ctx.save();
  const isStabilizing = stabilityCount > 0 && stabilityCount < STABLE_FRAMES_NEEDED;
  const ovalColor = isStabilizing ? "#3b82f6" : allGood ? "#22c55e" : "#f59e0b";
  ctx.strokeStyle = ovalColor; ctx.lineWidth = 3;
  ctx.setLineDash(allGood ? [] : [10, 6]);
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  if (allGood) {
    ctx.strokeStyle = isStabilizing ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)";
    ctx.lineWidth = 14; ctx.setLineDash([]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();

  // Stability progress arc (blue ring showing countdown)
  if (isStabilizing) {
    const progress = stabilityCount / STABLE_FRAMES_NEEDED;
    ctx.save();
    ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy - ry - 24, 18, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Corner brackets
  const bc = isStabilizing ? "#3b82f6" : allGood ? "#22c55e" : "#d97706";
  [[cx-rx*0.72,cy-ry*0.88,1,1],[cx+rx*0.72,cy-ry*0.88,-1,1],[cx-rx*0.72,cy+ry*0.88,1,-1],[cx+rx*0.72,cy+ry*0.88,-1,-1]].forEach(([x,y,dx,dy]) => {
    ctx.save(); ctx.strokeStyle = bc; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+dx*22,y); ctx.moveTo(x,y); ctx.lineTo(x,y+dy*22); ctx.stroke(); ctx.restore();
  });

  if (!detection?.landmarks) return;
  const positions = detection.landmarks.positions;
  if (!positions || positions.length < 68) return;
  ctx.save(); ctx.strokeStyle = "rgba(251,191,36,0.7)"; ctx.lineWidth = 1.3;
  Object.entries(LM).forEach(([key, indices]) => {
    if (key === "keyDots") return;
    ctx.beginPath(); indices.forEach((i, idx) => { const p = positions[i]; idx === 0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y); }); ctx.stroke();
  });
  ctx.fillStyle = "rgba(251,191,36,0.95)";
  LM.keyDots.forEach(i => { const p = positions[i]; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); });
  const lec = avgPos(positions.slice(36,42)), rec = avgPos(positions.slice(42,48));
  const nt = positions[30], me = avgPos([lec,rec]);
  ctx.strokeStyle = "rgba(34,197,94,0.55)"; ctx.lineWidth = 1; ctx.setLineDash([4,5]);
  ctx.beginPath(); ctx.moveTo(lec.x,lec.y); ctx.lineTo(rec.x,rec.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(me.x,me.y); ctx.lineTo(nt.x,nt.y); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "NIN Verify",  key: "isNinVerified" },
  { label: "NIN Image",   key: "isninImageVerified" },
  { label: "Profile",     key: "isDisplayNameMerchantSet" },
  { label: "Face Verify", key: "isFaceVerified" },
];
const CURRENT_STEP_INDEX = 3;

export const navigateToNextStep = (router, userData, overrides = {}, method = "replace") => {
  const merged = { ...userData, ...overrides };
  const { isNinVerified, isninImageVerified, isDisplayNameMerchantSet, isFaceVerified, MerchantProfile } = merged;
  const nav = method === "push" ? router.push.bind(router) : router.replace.bind(router);
  if (!isNinVerified)            { nav("/userProfile/merchantProfile");                        return; }
  if (!isninImageVerified)       { nav("/userProfile/merchantProfile/merchantProfile1");        return; }
  if (!isDisplayNameMerchantSet) { nav("/userProfile/merchantProfile/merchantProfile2");        return; }
  if (!isFaceVerified)           { nav("/userProfile/merchantProfile/merchantProfile3");        return; }
  const s = MerchantProfile?.accountStatus;
  if (s === "processing")     nav("/userProfile/merchantProfile/merchantProfile4");
  else if (s === "rejected")  nav("/userProfile/merchantProfile/merchantProfile5");
  else if (s === "suspended") nav("/userProfile/merchantProfile/merchantProfile6");
  else                        nav("/userProfile/merchantProfile/merchantHome");
};

// ─── Progress Stepper ─────────────────────────────────────────────────────────
const ProgressStepper = ({ userData }) => (
  <div style={{ background:"white", padding:"12px 16px", borderBottom:"1px solid #fef3c7", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:480, margin:"0 auto" }}>
      {STEPS.map((step, i) => {
        const isDone = userData?.[step.key] === true, isCurrent = i === CURRENT_STEP_INDEX && !isDone;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, background:isDone?"#22c55e":isCurrent?"#f59e0b":"#fef3c7", color:isDone||isCurrent?"white":"#fbbf24", boxShadow:isCurrent?"0 0 0 3px rgba(245,158,11,0.25)":"none" }}>
                {isDone ? <CheckCircle size={14} color="white" /> : i+1}
              </div>
              <span style={{ fontSize:9, fontWeight:600, whiteSpace:"nowrap", color:isDone?"#16a34a":isCurrent?"#b45309":"#fcd34d" }}>{step.label}</span>
            </div>
            {i < STEPS.length-1 && <div style={{ flex:1, height:2, margin:"0 4px", marginBottom:16, borderRadius:2, background:isDone?"#86efac":"#fef3c7" }} />}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

function StatusDot({ status }) {
  return <span style={{ width:9, height:9, borderRadius:"50%", background:status==="ok"?"#22c55e":status==="warn"?"#f59e0b":"#ef4444", display:"inline-block", flexShrink:0 }} />;
}

function CheckPill({ label, icon, pass }) {
  return (
    <div style={{ flex:1, padding:"8px 4px", borderRadius:10, textAlign:"center", fontSize:11, fontWeight:500, border:`1px solid ${pass?"#bbf7d0":"#fed7aa"}`, background:pass?"#f0fdf4":"#fef9f0", color:pass?"#15803d":"#92400e", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
      <span style={{ fontSize:14 }}>{icon}</span><span>{label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const FaceVerification = () => {
  const router      = useRouter();
  const dispatch    = useDispatch();
  const accessToken = useSelector((state) => state.user.accessToken);
  const myUserData  = useSelector((state) => state.user.user);
  const userData    = myUserData?.user;

  const myUserDataRef = useRef(myUserData);
  const userDataRef   = useRef(userData);
  useEffect(() => {
    myUserDataRef.current = myUserData;
    userDataRef.current   = userData;
  }, [myUserData, userData]);

  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const streamRef        = useRef(null);
  const intervalRef      = useRef(null);
  const stableCountRef   = useRef(0);          // ← consecutive stable+good frames
  const prevPositionsRef = useRef(null);        // ← last frame's landmarks for motion diff
  const capturedCanvasRef = useRef(null);       // ← stores the canvas at capture moment

  const [currentStep, setCurrentStep]       = useState(VERIFICATION_STEPS.INITIAL);
  const [error, setError]                   = useState("");
  const [instruction, setInstruction]       = useState({ msg: "Position your face in the oval", status: "warn" });
  const [checks, setChecks]                 = useState({ face:false, eyes:false, nose:false, light:false, human:false, forward:false });
  const [modelsLoaded, setModelsLoaded]     = useState(false);
  const [capturedImage, setCapturedImage]   = useState(null);  // data URL for preview
  const [stableProgress, setStableProgress] = useState(0);     // 0–STABLE_FRAMES_NEEDED

  // ─── Mount guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData) return;
    const { isNinVerified, isninImageVerified, isDisplayNameMerchantSet, isFaceVerified } = userData;
    if (!isNinVerified || !isninImageVerified || !isDisplayNameMerchantSet) {
      navigateToNextStep(router, userData, {}, "replace");
      return;
    }
    if (isFaceVerified) {
      navigateToNextStep(router, userData, {}, "replace");
    }
  }, [userData, router]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const loadModels = async () => {
    setCurrentStep(VERIFICATION_STEPS.LOADING_MODELS);
    setError("");
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setCurrentStep(VERIFICATION_STEPS.CAMERA_SETUP);
      await startCamera();
    } catch (err) {
      setError("Failed to load face detection. Please check your connection and retry.");
      setCurrentStep(VERIFICATION_STEPS.INITIAL);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"user", width:{ ideal:640 }, height:{ ideal:854 } },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise((res) => (videoRef.current.onloadedmetadata = res));
        videoRef.current.play();
      }
      setCurrentStep(VERIFICATION_STEPS.POSITIONING);
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions and try again.");
      setCurrentStep(VERIFICATION_STEPS.INITIAL);
    }
  };

  /**
   * Captures the current video frame to a data URL and a canvas reference.
   * Uses an offscreen canvas so the canvas overlay is NOT included in the photo.
   */
  const captureCleanFrame = () => {
    const video = videoRef.current;
    if (!video) return null;
    const offscreen = document.createElement("canvas");
    offscreen.width  = video.videoWidth;
    offscreen.height = video.videoHeight;
    offscreen.getContext("2d").drawImage(video, 0, 0);
    capturedCanvasRef.current = offscreen;
    return offscreen.toDataURL("image/png");
  };

  const runDetection = useCallback(async () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || !modelsLoaded) return;
    try {
      const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize:320, scoreThreshold:0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions();

      const lightCheck = checkLighting(video);
      const vw = video.videoWidth, vh = video.videoHeight;

      if (!det) {
        stableCountRef.current = 0;
        prevPositionsRef.current = null;
        setStableProgress(0);
        setChecks({ face:false, eyes:false, nose:false, light:lightCheck.ok, human:false, forward:false });
        setInstruction({ msg:"No face detected — look at the camera", status:"bad" });
        drawOverlay(canvas, video, null, false, 0);
        return;
      }

      const positions = det.landmarks.positions;
      const box       = det.detection.box;
      const eyesOk    = positions.slice(36,42).length === 6 && positions.slice(42,48).length === 6;
      const noseOk    = positions.slice(27,36).length > 0;
      const humanOk   = isHumanLikeFace(det);
      const headPose  = checkHeadPose(positions);
      const forwardOk = headPose.facingForward;
      const cx = box.x+box.width/2, cy = box.y+box.height/2, sizePct = box.width/vw;
      const centeredX = Math.abs(cx-vw/2) < vw*0.18, centeredY = Math.abs(cy-vh/2) < vh*0.18;
      const goodSize  = sizePct > 0.24 && sizePct < 0.65;

      setChecks({ face:true, eyes:eyesOk, nose:noseOk, light:lightCheck.ok, human:humanOk, forward:forwardOk });

      const allGood = eyesOk && noseOk && lightCheck.ok && humanOk && forwardOk && goodSize && centeredX && centeredY;

      // Motion / stability check
      const stable = isFaceStable(prevPositionsRef.current, positions);
      prevPositionsRef.current = positions;

      if (allGood && stable) {
        stableCountRef.current += 1;
      } else {
        stableCountRef.current = 0;
      }
      setStableProgress(stableCountRef.current);

      drawOverlay(canvas, video, det, allGood, stableCountRef.current);

      let msg = "", status = "warn";
      if (!lightCheck.ok)  { msg = lightCheck.brightness < 55 ? "Too dark — move to a brighter spot" : "Too much backlight — face a light source"; status = "bad"; }
      else if (!goodSize)  { msg = sizePct < 0.24 ? "Move closer to the camera" : "Move back a little"; }
      else if (!centeredX) { msg = cx < vw/2 ? "Shift slightly to your right" : "Shift slightly to your left"; }
      else if (!centeredY) { msg = cy < vh/2 ? "Lower your face a bit" : "Raise your face a bit"; }
      else if (!eyesOk)    { msg = "Make sure both eyes are clearly visible"; }
      else if (!forwardOk) { msg = headPose.reason || "Look straight at the camera"; status = "bad"; }
      else if (!humanOk)   { msg = "Look naturally at the camera"; }
      else if (!stable)    { msg = "Hold still…"; status = "warn"; }
      else {
        const remaining = STABLE_FRAMES_NEEDED - stableCountRef.current;
        msg = remaining > 0 ? `Stay still — capturing in ${remaining}…` : "Capturing…";
        status = "ok";
      }
      setInstruction({ msg, status });

      // Auto-capture once stable long enough
      if (stableCountRef.current >= STABLE_FRAMES_NEEDED) {
        clearInterval(intervalRef.current);
        stableCountRef.current = 0;
        const dataUrl = captureCleanFrame();
        if (dataUrl) {
          setCapturedImage(dataUrl);
          // Stop camera tracks so preview is clean
          streamRef.current?.getTracks().forEach(t => t.stop());
          setCurrentStep(VERIFICATION_STEPS.PREVIEW);
        }
      }
    } catch (err) { console.error("Detection error:", err); }
  }, [modelsLoaded]);

  useEffect(() => {
    if (currentStep === VERIFICATION_STEPS.POSITIONING && modelsLoaded) {
      intervalRef.current = setInterval(runDetection, 250);
    }
    return () => clearInterval(intervalRef.current);
  }, [currentStep, modelsLoaded, runDetection]);

  // ─── Manual capture ───────────────────────────────────────────────────────
  const handleManualCapture = () => {
    if (!Object.values(checks).every(Boolean)) return;
    clearInterval(intervalRef.current);
    const dataUrl = captureCleanFrame();
    if (dataUrl) {
      setCapturedImage(dataUrl);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCurrentStep(VERIFICATION_STEPS.PREVIEW);
    }
  };

  // ─── Retake — restart camera ───────────────────────────────────────────────
  const handleRetake = async () => {
    setCapturedImage(null);
    capturedCanvasRef.current = null;
    stableCountRef.current = 0;
    prevPositionsRef.current = null;
    setStableProgress(0);
    setError("");
    setCurrentStep(VERIFICATION_STEPS.CAMERA_SETUP);
    await startCamera();
  };

  // ─── Submit captured image ────────────────────────────────────────────────
  const handleSubmit = async () => {
    const canvas = capturedCanvasRef.current;
    if (!canvas) return;
    setCurrentStep(VERIFICATION_STEPS.UPLOADING);
    try {
      const imageFile = await new Promise((resolve, reject) =>
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Blob conversion failed"));
          resolve(new File([blob], "face-verification.png", { type:"image/png", lastModified:Date.now() }));
        }, "image/png")
      );

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("apiType", "updateMerchantProfileWithImage");
      formData.append("accessToken", accessToken);

      const response = await fetch("/api/user", { method:"POST", body:formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verification failed");

      setCurrentStep(VERIFICATION_STEPS.COMPLETE);

      dispatch(setUser({
        ...myUserDataRef.current,
        user: { ...userDataRef.current, isFaceVerified: true },
      }));

      setTimeout(() => {
        navigateToNextStep(router, { ...userDataRef.current, isFaceVerified: true }, {}, "push");
      }, 1800);

    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      setCurrentStep(VERIFICATION_STEPS.PREVIEW); // go back to preview so they can retry submit or retake
    }
  };

  const allChecksPass = Object.values(checks).every(Boolean);

  return (
    <ProtectedRoute>
      <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#fef9f0" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg, #d97706, #b45309)", padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => router.back()} style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.18)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ArrowLeft size={18} color="white" />
            </button>
            <div>
              <h1 style={{ color:"white", fontSize:17, fontWeight:500, margin:0 }}>Face Verification</h1>
              <p style={{ color:"rgba(255,255,255,0.7)", fontSize:12, margin:0 }}>Step 4 of 4 — Merchant Setup</p>
            </div>
          </div>
        </div>

        <ProgressStepper userData={userData} />

        <div style={{ flex:1, maxWidth:480, margin:"0 auto", width:"100%", padding:"20px 16px" }}>

          {/* ── INITIAL ── */}
          {currentStep === VERIFICATION_STEPS.INITIAL && (
            <div style={{ textAlign:"center", padding:"40px 16px" }}>
              <div style={{ width:180, height:180, borderRadius:"50%", border:"3px solid #f59e0b", margin:"0 auto 20px", overflow:"hidden", background:"#fef3c7" }}>
                <img src="/scannedface.jpg" alt="Face verification" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <h2 style={{ fontSize:20, fontWeight:600, color:"#1c1917", marginBottom:8 }}>Face Verification</h2>
              <p style={{ fontSize:14, color:"#78716c", marginBottom:20, lineHeight:1.6 }}>
                We scan your face to verify your identity. The photo is taken automatically once you are steady and in position.
              </p>
              <div style={{ background:"#fef3c7", borderRadius:12, padding:14, textAlign:"left", marginBottom:24 }}>
                <p style={{ fontSize:13, color:"#78350f", fontWeight:600, marginBottom:8 }}>For best results:</p>
                <p style={{ fontSize:13, color:"#92400e", lineHeight:1.9 }}>
                  • Face a light source — avoid backlighting<br />
                  • Remove glasses if possible<br />
                  • Look straight into the camera<br />
                  • Keep your full face within the oval<br />
                  • Hold still — the photo is taken automatically
                </p>
              </div>
              {error && (
                <Alert variant="destructive" style={{ marginBottom:16 }}>
                  <AlertCircle size={16} /><AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button onClick={loadModels} style={{ background:"#d97706", color:"white", padding:"12px 28px", borderRadius:12, fontSize:15, display:"inline-flex", alignItems:"center", gap:8 }}>
                <Camera size={18} /> Start Camera
              </Button>
            </div>
          )}

          {/* ── LOADING MODELS ── */}
          {currentStep === VERIFICATION_STEPS.LOADING_MODELS && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <Loader2 size={40} color="#d97706" style={{ animation:"spin 1s linear infinite", margin:"0 auto 16px" }} />
              <h2 style={{ fontSize:18, fontWeight:500, color:"#1c1917", marginBottom:8 }}>Loading Detection</h2>
              <p style={{ fontSize:14, color:"#78716c" }}>Preparing face detection models…</p>
            </div>
          )}

          {/* ── CAMERA / POSITIONING ── */}
          {[VERIFICATION_STEPS.CAMERA_SETUP, VERIFICATION_STEPS.POSITIONING].includes(currentStep) && (
            <>
              {/* State label banner */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10, padding:"6px 12px", borderRadius:20, background:"#fef3c7", width:"fit-content", margin:"0 auto 10px" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: currentStep === VERIFICATION_STEPS.POSITIONING ? "#22c55e" : "#f59e0b", animation: currentStep === VERIFICATION_STEPS.POSITIONING ? "pulse 1.5s infinite" : "none" }} />
                <span style={{ fontSize:12, fontWeight:600, color:"#92400e" }}>
                  {currentStep === VERIFICATION_STEPS.CAMERA_SETUP ? "Starting camera…" : "Camera live — position your face"}
                </span>
              </div>

              <div style={{ position:"relative", width:"100%", aspectRatio:"3/4", background:"#1c1917", borderRadius:18, overflow:"hidden", marginBottom:14 }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transform:"scaleX(-1)" }} />
                <canvas ref={canvasRef} style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", transform:"scaleX(-1)", pointerEvents:"none" }} />

                {currentStep === VERIFICATION_STEPS.CAMERA_SETUP && (
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
                    <Loader2 size={36} color="white" style={{ animation:"spin 1s linear infinite" }} />
                    <span style={{ color:"white", fontSize:14 }}>Starting camera…</span>
                  </div>
                )}

                {/* Stability progress bar at bottom of camera */}
                {currentStep === VERIFICATION_STEPS.POSITIONING && stableProgress > 0 && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"8px 12px", background:"rgba(0,0,0,0.6)", display:"flex", flexDirection:"column", gap:4 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ color:"white", fontSize:11, fontWeight:500 }}>Stability</span>
                      <span style={{ color:"#3b82f6", fontSize:11, fontWeight:600 }}>{Math.round((stableProgress / STABLE_FRAMES_NEEDED) * 100)}%</span>
                    </div>
                    <div style={{ height:4, borderRadius:4, background:"rgba(255,255,255,0.2)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:4, background:"#3b82f6", width:`${(stableProgress / STABLE_FRAMES_NEEDED) * 100}%`, transition:"width 0.2s ease" }} />
                    </div>
                  </div>
                )}
              </div>

              {currentStep === VERIFICATION_STEPS.POSITIONING && (
                <>
                  {/* Instruction */}
                  <div style={{ background:"rgba(28,25,23,0.78)", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                    <StatusDot status={instruction.status} />
                    <span style={{ fontSize:13, color:"white" }}>{instruction.msg}</span>
                  </div>

                  {/* Check pills */}
                  <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                    <CheckPill label="Face"    icon="👤" pass={checks.face} />
                    <CheckPill label="Eyes"    icon="👁"  pass={checks.eyes} />
                    <CheckPill label="Nose"    icon="👃"  pass={checks.nose} />
                    <CheckPill label="Light"   icon="☀️" pass={checks.light} />
                    <CheckPill label="Forward" icon="🎯" pass={checks.forward} />
                    <CheckPill label="Human"   icon="✓"  pass={checks.human} />
                  </div>

                  {/* Auto-capture notice */}
                  <div style={{ textAlign:"center", fontSize:12, color:"#78716c", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <span style={{ fontSize:14 }}>📸</span>
                    Photo is taken <strong>automatically</strong> once all checks pass and you are steady
                  </div>

                  {/* Manual capture fallback */}
                  <Button
                    onClick={handleManualCapture}
                    disabled={!allChecksPass}
                    style={{ width:"100%", padding:"14px", borderRadius:14, background:allChecksPass?"#d97706":"#d4c4a0", color:"white", border:"none", fontSize:15, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:allChecksPass?"pointer":"not-allowed" }}
                  >
                    <Camera size={18} />
                    {allChecksPass ? "Capture Now (manual)" : "Align your face — auto capture will start"}
                  </Button>
                </>
              )}

              {error && (
                <Alert variant="destructive" style={{ marginTop:12 }}>
                  <AlertCircle size={16} /><AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* ── PREVIEW ── */}
          {currentStep === VERIFICATION_STEPS.PREVIEW && (
            <>
              {/* Banner */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10, padding:"7px 14px", borderRadius:20, background:"#fef3c7", width:"fit-content", margin:"0 auto 14px" }}>
                <span style={{ fontSize:12 }}>📸</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#92400e" }}>Photo captured — review before submitting</span>
              </div>

              <div style={{ position:"relative", width:"100%", aspectRatio:"3/4", background:"#1c1917", borderRadius:18, overflow:"hidden", marginBottom:16 }}>
                {capturedImage && (
                  <Image src={capturedImage} alt="Captured face" fill style={{ objectFit:"cover", transform:"scaleX(-1)" }} />
                )}
                {/* Top badge */}
                <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.65)", borderRadius:20, padding:"5px 14px", whiteSpace:"nowrap" }}>
                  <span style={{ color:"white", fontSize:12 }}>Does this look clear and sharp?</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" style={{ marginBottom:12 }}>
                  <AlertCircle size={16} /><AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Quality tips */}
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"10px 14px", marginBottom:16 }}>
                <p style={{ fontSize:12, color:"#166534", fontWeight:600, margin:"0 0 4px" }}>✅ Your photo is good if:</p>
                <p style={{ fontSize:12, color:"#15803d", lineHeight:1.8, margin:0 }}>
                  • Your face is sharp and not blurry<br />
                  • Both eyes are clearly visible<br />
                  • Face is well-lit with no heavy shadows
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display:"flex", gap:12 }}>
                <Button
                  onClick={handleRetake}
                  style={{ flex:1, padding:"14px", borderRadius:14, background:"white", color:"#d97706", border:"2px solid #f59e0b", fontSize:15, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer" }}
                >
                  <RefreshCw size={17} /> Retake
                </Button>
                <Button
                  onClick={handleSubmit}
                  style={{ flex:2, padding:"14px", borderRadius:14, background:"#d97706", color:"white", border:"none", fontSize:15, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer" }}
                >
                  <Upload size={17} /> Submit Photo
                </Button>
              </div>

              <p style={{ textAlign:"center", fontSize:11, color:"#a8a29e", marginTop:10 }}>
                Tap <strong>Retake</strong> if the image is blurry or unclear
              </p>
            </>
          )}

          {/* ── UPLOADING ── */}
          {currentStep === VERIFICATION_STEPS.UPLOADING && (
            <>
              <div style={{ position:"relative", width:"100%", aspectRatio:"3/4", background:"#1c1917", borderRadius:18, overflow:"hidden", marginBottom:14 }}>
                {capturedImage && <Image src={capturedImage} alt="Captured" fill style={{ objectFit:"cover", transform:"scaleX(-1)" }} />}
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.52)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
                  <Loader2 size={44} color="white" style={{ animation:"spin 0.8s linear infinite" }} />
                  <span style={{ color:"white", fontSize:15, fontWeight:500 }}>Uploading & verifying…</span>
                  <span style={{ color:"rgba(255,255,255,0.65)", fontSize:12 }}>Please do not close this screen</span>
                </div>
              </div>
            </>
          )}

          {/* ── COMPLETE ── */}
          {currentStep === VERIFICATION_STEPS.COMPLETE && (
            <div style={{ position:"relative", width:"100%", aspectRatio:"3/4", background:"#1c1917", borderRadius:18, overflow:"hidden" }}>
              {capturedImage && <Image src={capturedImage} alt="Verified" fill style={{ objectFit:"cover", transform:"scaleX(-1)" }} />}
              <div style={{ position:"absolute", inset:0, background:"rgba(21,128,61,0.38)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14 }}>
                <div style={{ width:68, height:68, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Check size={32} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ color:"white", fontSize:18, fontWeight:600 }}>Verification Successful!</span>
                <span style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>Redirecting…</span>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </ProtectedRoute>
  );
};

export default FaceVerification;
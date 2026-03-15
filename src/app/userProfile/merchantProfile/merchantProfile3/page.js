"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Check, Loader2, AlertCircle, ArrowLeft, Sun, Eye, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import * as faceapi from "face-api.js";
import ProtectedRoute from "@/app/component/protect";
import Image from "next/image";

const VERIFICATION_STEPS = {
  INITIAL: "initial",
  LOADING_MODELS: "loading_models",
  CAMERA_SETUP: "camera_setup",
  POSITIONING: "positioning",
  CAPTURING: "capturing",
  UPLOADING: "uploading",
  COMPLETE: "complete",
};

const CHECK_KEYS = { FACE: "face", EYES: "eyes", NOSE: "nose", LIGHT: "light", HUMAN: "human", FORWARD: "forward" };

//const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
      const MODEL_URL = "/models";

// ─── Landmark index groups ────────────────────────────────────────────────────
const LM = {
  jaw:         Array.from({ length: 17 }, (_, i) => i),
  leftBrow:    [17, 18, 19, 20, 21],
  rightBrow:   [22, 23, 24, 25, 26],
  noseBridge:  [27, 28, 29, 30],
  noseBottom:  [30, 31, 32, 33, 34, 35, 30],
  leftEye:     [36, 37, 38, 39, 40, 41, 36],
  rightEye:    [42, 43, 44, 45, 46, 47, 42],
  mouthOuter:  [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48],
  mouthInner:  [60, 61, 62, 63, 64, 65, 66, 67, 60],
  keyDots:     [36, 39, 42, 45, 30, 33, 48, 54, 8],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function avgPos(pts) {
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}

function checkLighting(video) {
  const tmp = document.createElement("canvas");
  tmp.width = 80;
  tmp.height = 80;
  const ctx = tmp.getContext("2d");
  ctx.drawImage(video, 0, 0, 80, 80);
  const data = ctx.getImageData(0, 0, 80, 80).data;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const brightness = total / (data.length / 4);
  return { brightness, ok: brightness > 55 && brightness < 235 };
}

function isHumanLikeFace(detection) {
  if (!detection?.expressions) return false;
  const sum = Object.values(detection.expressions).reduce((a, b) => a + b, 0);
  return sum > 0.4;
}

// ─── Head pose check using landmark geometry ──────────────────────────────────
// Returns { facingForward, yawOk, pitchOk, reason }
// Yaw  : nose tip should sit close to midpoint between the two eye-corner pairs
// Pitch: nose tip should sit between the eye midpoint and the mouth midpoint
function checkHeadPose(positions) {
  if (!positions || positions.length < 68) return { facingForward: false, reason: "No landmarks" };

  // Key points
  const leftEyeInner  = positions[39];  // inner corner left eye
  const rightEyeInner = positions[42];  // inner corner right eye
  const leftEyeOuter  = positions[36];
  const rightEyeOuter = positions[45];
  const noseTip       = positions[30];
  const noseBase      = positions[33];
  const mouthLeft     = positions[48];
  const mouthRight    = positions[54];
  const chin          = positions[8];

  // ── Yaw (left/right turn) ──────────────────────────────────────────────────
  // Measure how centred the nose tip is between the two eye outer corners
  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
  const noseMidOffsetX = (noseTip.x - eyeMidX) / eyeWidth; // –1..+1
  const yawOk = Math.abs(noseMidOffsetX) < 0.18;           // ±18% of eye-width

  // ── Pitch (up/down tilt) ───────────────────────────────────────────────────
  // Nose tip Y should be between the eye midline and the mouth midline
  const eyeMidY   = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const mouthMidY = (mouthLeft.y + mouthRight.y) / 2;
  const faceH     = mouthMidY - eyeMidY;
  const nosePctY  = (noseTip.y - eyeMidY) / faceH; // 0 = eye level, 1 = mouth level
  const pitchOk   = nosePctY > 0.35 && nosePctY < 0.75;   // looking too far up/down

  // ── Roll (head tilt) ──────────────────────────────────────────────────────
  const eyeDY  = rightEyeOuter.y - leftEyeOuter.y;
  const eyeDX  = rightEyeOuter.x - leftEyeOuter.x;
  const rollDeg = Math.abs(Math.atan2(eyeDY, eyeDX) * (180 / Math.PI));
  const rollOk  = rollDeg < 12;

  let reason = "";
  if (!yawOk)  reason = noseMidOffsetX < 0 ? "Turn your face right" : "Turn your face left";
  else if (!pitchOk) reason = nosePctY < 0.35 ? "Lower your chin slightly" : "Raise your chin slightly";
  else if (!rollOk)  reason = "Straighten your head — don't tilt";

  return { facingForward: yawOk && pitchOk && rollOk, yawOk, pitchOk, rollOk, reason };
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────
function drawOverlay(canvas, video, detection, allGood) {
  if (!canvas || !video) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h * 0.42;
  const rx = w * 0.28;
  const ry = h * 0.35;

  // Guide oval
  ctx.save();
  ctx.strokeStyle = allGood ? "#22c55e" : "#f59e0b";
  ctx.lineWidth = 3;
  ctx.setLineDash(allGood ? [] : [10, 6]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (allGood) {
    ctx.strokeStyle = "rgba(34,197,94,0.2)";
    ctx.lineWidth = 14;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Corner brackets
  const bracketColor = allGood ? "#22c55e" : "#d97706";
  const corners = [
    [cx - rx * 0.72, cy - ry * 0.88, 1, 1],
    [cx + rx * 0.72, cy - ry * 0.88, -1, 1],
    [cx - rx * 0.72, cy + ry * 0.88, 1, -1],
    [cx + rx * 0.72, cy + ry * 0.88, -1, -1],
  ];
  ctx.save();
  ctx.strokeStyle = bracketColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  corners.forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * 22, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + dy * 22);
    ctx.stroke();
  });
  ctx.restore();

  if (!detection?.landmarks) return;

  const positions = detection.landmarks.positions;
  if (!positions || positions.length < 68) return;

  // Facial mesh lines
  ctx.save();
  ctx.strokeStyle = "rgba(251,191,36,0.7)";
  ctx.lineWidth = 1.3;
  const drawGroup = (indices) => {
    ctx.beginPath();
    indices.forEach((i, idx) => {
      const p = positions[i];
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  };
  Object.entries(LM).forEach(([key, indices]) => {
    if (key !== "keyDots") drawGroup(indices);
  });

  // Key landmark dots
  ctx.fillStyle = "rgba(251,191,36,0.95)";
  LM.keyDots.forEach((i) => {
    const p = positions[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Symmetry alignment lines
  const leftEyeC = avgPos(positions.slice(36, 42));
  const rightEyeC = avgPos(positions.slice(42, 48));
  const noseTip = positions[30];
  const midEye = avgPos([leftEyeC, rightEyeC]);

  ctx.strokeStyle = "rgba(34,197,94,0.55)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(leftEyeC.x, leftEyeC.y);
  ctx.lineTo(rightEyeC.x, rightEyeC.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(midEye.x, midEye.y);
  ctx.lineTo(noseTip.x, noseTip.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const color =
    status === "ok" ? "#22c55e" : status === "warn" ? "#f59e0b" : "#ef4444";
  return (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Check pill ───────────────────────────────────────────────────────────────
function CheckPill({ label, icon, pass }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "8px 4px",
        borderRadius: 10,
        textAlign: "center",
        fontSize: 11,
        fontWeight: 500,
        border: `1px solid ${pass ? "#bbf7d0" : "#fed7aa"}`,
        background: pass ? "#f0fdf4" : "#fef9f0",
        color: pass ? "#15803d" : "#92400e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const FaceVerification = () => {
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const captureCountRef = useRef(0);

  const [currentStep, setCurrentStep] = useState(VERIFICATION_STEPS.INITIAL);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState({ msg: "Position your face in the oval", status: "warn" });
  const [checks, setChecks] = useState({
    [CHECK_KEYS.FACE]: false,
    [CHECK_KEYS.EYES]: false,
    [CHECK_KEYS.NOSE]: false,
    [CHECK_KEYS.LIGHT]: false,
    [CHECK_KEYS.HUMAN]: false,
    [CHECK_KEYS.FORWARD]: false,
  });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // ── Load models ────────────────────────────────────────────────────────────
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
      console.error("Model load error:", err);
      setError("Failed to load face detection. Please check your connection and retry.");
      setCurrentStep(VERIFICATION_STEPS.INITIAL);
    }
  };

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 854 } },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise((res) => (videoRef.current.onloadedmetadata = res));
        videoRef.current.play();
      }
      setCurrentStep(VERIFICATION_STEPS.POSITIONING);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please enable camera permissions and try again.");
      setCurrentStep(VERIFICATION_STEPS.INITIAL);
    }
  };

  // ── Core detection loop ────────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !modelsLoaded) return;

    try {
      const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions();

      const lightCheck = checkLighting(video);
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (!det) {
        setChecks({ face: false, eyes: false, nose: false, light: lightCheck.ok, human: false });
        setInstruction({ msg: "No face detected — look at the camera", status: "bad" });
        drawOverlay(canvas, video, null, false);
        captureCountRef.current = 0;
        return;
      }

      const positions = det.landmarks.positions;
      const box = det.detection.box;

      const leftEye = positions.slice(36, 42);
      const rightEye = positions.slice(42, 48);
      const nose = positions.slice(27, 36);
      const eyesOk = leftEye.length === 6 && rightEye.length === 6;
      const noseOk = nose.length > 0;
      const humanOk = isHumanLikeFace(det);
      const headPose = checkHeadPose(positions);
      const forwardOk = headPose.facingForward;

      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const sizePct = box.width / vw;
      const centeredX = Math.abs(cx - vw / 2) < vw * 0.18;
      const centeredY = Math.abs(cy - vh / 2) < vh * 0.18;
      const goodSize = sizePct > 0.24 && sizePct < 0.65;

      const newChecks = {
        face: true,
        eyes: eyesOk,
        nose: noseOk,
        light: lightCheck.ok,
        human: humanOk,
        forward: forwardOk,
      };
      setChecks(newChecks);

      const allGood =
        eyesOk && noseOk && lightCheck.ok && humanOk && forwardOk && goodSize && centeredX && centeredY;

      drawOverlay(canvas, video, det, allGood);

      // Instruction message — head pose takes priority once basics are met
      let msg = "";
      let status = "warn";
      if (!lightCheck.ok) {
        msg =
          lightCheck.brightness < 55
            ? "Too dark — move to a brighter spot"
            : "Too much backlight — face a light source";
        status = "bad";
      } else if (!goodSize) {
        msg = sizePct < 0.24 ? "Move closer to the camera" : "Move back a little";
      } else if (!centeredX) {
        msg = cx < vw / 2 ? "Shift slightly to your right" : "Shift slightly to your left";
      } else if (!centeredY) {
        msg = cy < vh / 2 ? "Lower your face a bit" : "Raise your face a bit";
      } else if (!eyesOk) {
        msg = "Make sure both eyes are clearly visible";
      } else if (!forwardOk) {
        // Give the specific head pose correction
        msg = headPose.reason || "Look straight at the camera";
        status = "bad";
      } else if (!humanOk) {
        msg = "Look naturally at the camera";
      } else {
        msg = "Perfect — hold still…";
        status = "ok";
      }
      setInstruction({ msg, status });

      if (allGood) {
        captureCountRef.current += 1;
        if (captureCountRef.current >= 3) {
          clearInterval(intervalRef.current);
          captureAndUpload();
        }
      } else {
        captureCountRef.current = 0;
      }
    } catch (err) {
      console.error("Detection error:", err);
    }
  }, [modelsLoaded]);

  // ── Auto-detection effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (currentStep === VERIFICATION_STEPS.POSITIONING && modelsLoaded) {
      intervalRef.current = setInterval(runDetection, 250);
    }
    return () => clearInterval(intervalRef.current);
  }, [currentStep, modelsLoaded, runDetection]);

  // ── Capture + upload ───────────────────────────────────────────────────────
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedImage(dataUrl);
    return canvas;
  };

  const canvasToFile = (canvas) =>
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Blob conversion failed"));
        resolve(new File([blob], "face-verification.png", { type: "image/png", lastModified: Date.now() }));
      }, "image/png");
    });

  const captureAndUpload = async () => {
    clearInterval(intervalRef.current);
    setCurrentStep(VERIFICATION_STEPS.CAPTURING);

    const canvas = captureImage();
    if (!canvas) {
      setCurrentStep(VERIFICATION_STEPS.POSITIONING);
      return;
    }

    setCurrentStep(VERIFICATION_STEPS.UPLOADING);
    try {
      const imageFile = await canvasToFile(canvas);
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("apiType", "updateMerchantProfileWithImage");
      formData.append("accessToken", accessToken);

      const response = await fetch("/api/user", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verification failed");

      setCurrentStep(VERIFICATION_STEPS.COMPLETE);
      setTimeout(() => router.push("/userProfile/merchantProfile/merchantProfile4"), 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
      setCurrentStep(VERIFICATION_STEPS.POSITIONING);
      captureCountRef.current = 0;
    }
  };

  const handleManualCapture = () => {
    clearInterval(intervalRef.current);
    captureAndUpload();
  };

  const retake = () => {
    setCapturedImage(null);
    setError("");
    captureCountRef.current = 0;
    setCurrentStep(VERIFICATION_STEPS.POSITIONING);
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const allChecksPass = Object.values(checks).every(Boolean);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fef9f0" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #d97706, #b45309)", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{
                width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.18)",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ArrowLeft size={18} color="white" />
            </button>
            <h1 style={{ color: "white", fontSize: 17, fontWeight: 500 }}>Face Verification</h1>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, maxWidth: 480, margin: "0 auto", width: "100%", padding: "20px 16px" }}>

          {/* ── INITIAL ── */}
          {currentStep === VERIFICATION_STEPS.INITIAL && (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              {/* ↓ Replace the src with your own image path e.g. "/images/face-verify-illustration.png" */}
              <div style={{
                width: 180, height: 180, borderRadius: "50%",
                border: "3px solid #f59e0b", margin: "0 auto 20px",
                overflow: "hidden", background: "#fef3c7",
              }}>
                <img
                 src="/scannedface.jpg"
                  alt="Face verification illustration"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1c1917", marginBottom: 8 }}>Face Verification</h2>
              <p style={{ fontSize: 14, color: "#78716c", marginBottom: 20, lineHeight: 1.6 }}>
                We will scan your face to verify your identity. Ensure you are in a well-lit area.
              </p>
              <div style={{
                background: "#fef3c7", borderRadius: 12, padding: 14,
                textAlign: "left", marginBottom: 24,
              }}>
                <p style={{ fontSize: 13, color: "#78350f", fontWeight: 600, marginBottom: 8 }}>For best results:</p>
                <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.9 }}>
                  • Face a light source — avoid backlighting<br />
                  • Remove glasses if possible<br />
                  • Look straight into the camera<br />
                  • Keep your full face within the oval
                </p>
              </div>
              {error && (
                <Alert variant="destructive" style={{ marginBottom: 16 }}>
                  <AlertCircle size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={loadModels}
                style={{ background: "#d97706", color: "white", padding: "12px 28px", borderRadius: 12, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Camera size={18} /> Start Camera
              </Button>
            </div>
          )}

          {/* ── LOADING MODELS ── */}
          {currentStep === VERIFICATION_STEPS.LOADING_MODELS && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Loader2 size={40} color="#d97706" style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 500, color: "#1c1917", marginBottom: 8 }}>Loading Detection</h2>
              <p style={{ fontSize: 14, color: "#78716c" }}>Preparing face detection models…</p>
            </div>
          )}

          {/* ── CAMERA / POSITIONING / CAPTURING ── */}
          {[VERIFICATION_STEPS.CAMERA_SETUP, VERIFICATION_STEPS.POSITIONING, VERIFICATION_STEPS.CAPTURING].includes(currentStep) && (
            <>
              {/* Camera viewport */}
              <div style={{
                position: "relative", width: "100%", aspectRatio: "3/4",
                background: "#1c1917", borderRadius: 18, overflow: "hidden", marginBottom: 14,
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }}
                />
                {/* Overlay canvas — mirrored to match video */}
                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute", top: 0, left: 0,
                    width: "100%", height: "100%",
                    transform: "scaleX(-1)", pointerEvents: "none",
                  }}
                />

                {/* Camera setup spinner */}
                {currentStep === VERIFICATION_STEPS.CAMERA_SETUP && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                  }}>
                    <Loader2 size={36} color="white" style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ color: "white", fontSize: 14 }}>Starting camera…</span>
                  </div>
                )}

                {/* Capturing flash */}
                {currentStep === VERIFICATION_STEPS.CAPTURING && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(251,191,36,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Loader2 size={48} color="white" style={{ animation: "spin 0.6s linear infinite" }} />
                  </div>
                )}
              </div>

              {/* Instruction bar */}
              {currentStep === VERIFICATION_STEPS.POSITIONING && (
                <div style={{
                  background: "rgba(28,25,23,0.78)", borderRadius: 10,
                  padding: "10px 14px", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <StatusDot status={instruction.status} />
                  <span style={{ fontSize: 13, color: "white" }}>{instruction.msg}</span>
                </div>
              )}

              {/* Check pills */}
              {currentStep === VERIFICATION_STEPS.POSITIONING && (
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  <CheckPill label="Face"    icon="👤" pass={checks.face} />
                  <CheckPill label="Eyes"    icon="👁" pass={checks.eyes} />
                  <CheckPill label="Nose"    icon="👃" pass={checks.nose} />
                  <CheckPill label="Light"   icon="☀️" pass={checks.light} />
                  <CheckPill label="Forward" icon="🎯" pass={checks.forward} />
                  <CheckPill label="Human"   icon="✓"  pass={checks.human} />
                </div>
              )}

              {error && (
                <Alert variant="destructive" style={{ marginBottom: 12 }}>
                  <AlertCircle size={16} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Manual capture */}
              {currentStep === VERIFICATION_STEPS.POSITIONING && (
                <Button
                  onClick={handleManualCapture}
                  disabled={!allChecksPass}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14,
                    background: allChecksPass ? "#d97706" : "#d4c4a0",
                    color: "white", border: "none", fontSize: 15, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    cursor: allChecksPass ? "pointer" : "not-allowed",
                  }}
                >
                  <Camera size={18} />
                  {allChecksPass ? "Capture Now" : "Align your face to capture"}
                </Button>
              )}
            </>
          )}

          {/* ── UPLOADING ── */}
          {currentStep === VERIFICATION_STEPS.UPLOADING && (
            <>
              <div style={{
                position: "relative", width: "100%", aspectRatio: "3/4",
                background: "#1c1917", borderRadius: 18, overflow: "hidden", marginBottom: 14,
              }}>
                {capturedImage && (
                  <Image src={capturedImage} alt="Captured" fill style={{ objectFit: "cover" }} />
                )}
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
                }}>
                  <Loader2 size={44} color="white" style={{ animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Uploading & verifying…</span>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 13, color: "#78716c" }}>Please wait while we verify your photo</p>
            </>
          )}

          {/* ── COMPLETE ── */}
          {currentStep === VERIFICATION_STEPS.COMPLETE && (
            <div style={{
              position: "relative", width: "100%", aspectRatio: "3/4",
              background: "#1c1917", borderRadius: 18, overflow: "hidden",
            }}>
              {capturedImage && (
                <Image src={capturedImage} alt="Verified" fill style={{ objectFit: "cover" }} />
              )}
              <div style={{
                position: "absolute", inset: 0, background: "rgba(21,128,61,0.38)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
              }}>
                <div style={{
                  width: 68, height: 68, borderRadius: "50%", background: "#16a34a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={32} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ color: "white", fontSize: 18, fontWeight: 600 }}>Verification Successful!</span>
                <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Redirecting…</span>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </ProtectedRoute>
  );
};

export default FaceVerification;
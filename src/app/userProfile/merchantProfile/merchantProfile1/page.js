"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, X, CheckCircle, AlertCircle,
  Camera, FileImage, Loader2, ZoomIn, RefreshCw,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/store/slice"; // ← adjust path if needed
import getErrorMessage from "@/app/component/error";
import ProtectedRoute from "@/app/component/protect";

const MAX_FILE_SIZE_MB    = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES      = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MIN_WIDTH           = 400;
const MIN_HEIGHT          = 300;

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "NIN Verify",  key: "isNinVerified" },
  { label: "NIN Image",   key: "isninImageVerified" },
  { label: "Profile",     key: "isDisplayNameMerchantSet" },
  { label: "Face Verify", key: "isFaceVerified" },
];
const CURRENT_STEP_INDEX = 1;

// ─── Reusable navigator ───────────────────────────────────────────────────────
export const navigateToNextStep = (router, userData, overrides = {}, method = "replace") => {
  const merged = { ...userData, ...overrides };
  const {
    isNinVerified,
    isninImageVerified,
    isDisplayNameMerchantSet,
    isFaceVerified,
    MerchantProfile,
  } = merged;

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
  <div className="bg-white px-4 py-3 border-b border-amber-100 shadow-sm">
    <div className="flex items-center justify-between max-w-md mx-auto">
      {STEPS.map((step, i) => {
        const isDone    = userData?.[step.key] === true;
        const isCurrent = i === CURRENT_STEP_INDEX && !isDone;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone ? "bg-green-500 text-white"
                : isCurrent ? "bg-amber-500 text-white ring-2 ring-amber-200"
                : "bg-amber-100 text-amber-400"
              }`}>
                {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${
                isDone ? "text-green-600" : isCurrent ? "text-amber-700" : "text-amber-300"
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all ${isDone ? "bg-green-400" : "bg-amber-100"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const MerchantNINUploadPage = () => {
  const router      = useRouter();
  const dispatch    = useDispatch();
  const accessToken = useSelector((state) => state.user.accessToken);
  const myUserData  = useSelector((state) => state.user.user);
  const userData    = myUserData?.user;

  // Always-fresh refs — prevents stale closure in onSuccess
  const myUserDataRef = useRef(myUserData);
  const userDataRef   = useRef(userData);
  useEffect(() => {
    myUserDataRef.current = myUserData;
    userDataRef.current   = userData;
  }, [myUserData, userData]);

  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);

  const [imageFile, setImageFile]               = useState(null);
  const [imagePreview, setImagePreview]         = useState(null);
  const [imageMeta, setImageMeta]               = useState(null);
  const [isDragging, setIsDragging]             = useState(false);
  const [errors, setErrors]                     = useState({});
  const [clarityWarning, setClarityWarning]     = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ─── Mount guard ──────────────────────────────────────────────────────────
  // Because we update Redux BEFORE navigating (see onSuccess), this guard
  // always reads up-to-date flags — no hydration delay or lock needed.
  useEffect(() => {
    if (!userData) return;
    const { isNinVerified, isninImageVerified } = userData;

    if (!isNinVerified) {
      navigateToNextStep(router, userData, {}, "replace");
      return;
    }
    if (isninImageVerified) {
      navigateToNextStep(router, userData, {}, "replace");
    }
    // isNinVerified=true & isninImageVerified=false → stay ✓
  }, [userData, router]);

  // ─── Upload mutation ──────────────────────────────────────────────────────
  const uploadNINMutation = useMutation({
    mutationFn: async (file) => {
      const formDataPayload = new FormData();
      formDataPayload.append("ninImage", file);
      formDataPayload.append("apiType", "uploadNIN");
      formDataPayload.append("accessToken", accessToken);

      const response = await fetch(`/api/user`, {
        method: "POST",
        body: formDataPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload NIN image");
      }

      return response.json();
    },
    onSuccess: () => {
      // ── ROOT FIX ─────────────────────────────────────────────────────────
      // Patch Redux with isninImageVerified=true BEFORE calling router.push.
      // The next page's mount guard reads Redux synchronously on mount —
      // if we navigate first, it sees the stale flag and bounces us back.
      dispatch(setUser({
        ...myUserDataRef.current,         // preserve accessToken and all top-level fields
        user: {
          ...userDataRef.current,         // preserve all existing user flags
          isninImageVerified: true,       // ← patch the flag that just completed
        },
      }));
      // ─────────────────────────────────────────────────────────────────────

      navigateToNextStep(
        router,
        { ...userDataRef.current, isninImageVerified: true },
        {},
        "push"
      );
    },
    onError: (error) => {
      setErrors({ submission: getErrorMessage(error) });
    },
  });

  // ─── Image processing ─────────────────────────────────────────────────────
  const checkImageClarity = (img, file) => {
    const warnings = [];
    if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
      warnings.push(`Image resolution is low (${img.naturalWidth}x${img.naturalHeight}px). For best results, use an image at least ${MIN_WIDTH}x${MIN_HEIGHT}px.`);
    }
    if (file.size < 50 * 1024) {
      warnings.push("File size is very small, which may indicate a low-quality image. Please use a clearer, higher-resolution photo.");
    }
    return warnings.length > 0 ? warnings.join(" ") : null;
  };

  const processFile = useCallback((file) => {
    setErrors({});
    setClarityWarning(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors({ image: "Only JPG, PNG, or WEBP images are accepted." });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors({ image: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.` });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        setClarityWarning(checkImageClarity(img, file));
        setImageMeta({ width: img.naturalWidth, height: img.naturalHeight, size: (file.size / 1024).toFixed(1), name: file.name });
        setImagePreview(dataUrl);
        setImageFile(file);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageMeta(null);
    setClarityWarning(null);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!imageFile) {
      setErrors({ image: "Please upload your NIN image before continuing." });
      return;
    }
    uploadNINMutation.mutate(imageFile);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">Upload NIN Image</h1>
              <p className="text-xs text-white/70 leading-tight">Step 2 of 4 — Merchant Setup</p>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper userData={userData} />

        <div className="flex-1 px-4 py-5 overflow-auto">
          <div className="max-w-md mx-auto space-y-4">

            {/* Info Card */}
            <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-amber-900 mb-1">NIN Image Requirements</h2>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                <li>Must be a clear, unobstructed photo of your NIN slip or card</li>
                <li>All text and numbers must be fully readable</li>
                <li>No blur, glare, or shadows covering the document</li>
                <li>Accepted formats: JPG, PNG, WEBP - Max size: {MAX_FILE_SIZE_MB}MB</li>
                <li>Minimum resolution: {MIN_WIDTH}x{MIN_HEIGHT}px</li>
              </ul>
            </div>

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" capture="environment" onChange={handleFileChange} className="hidden" />

            {/* Upload / Preview Card */}
            <div className="bg-white p-5 rounded-lg shadow-sm">
              {!imagePreview ? (
                <>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 mb-4 ${
                      isDragging ? "border-amber-500 bg-amber-50 scale-[1.01]"
                      : errors.image ? "border-red-400 bg-red-50"
                      : "border-amber-300 hover:border-amber-500 hover:bg-amber-50"
                    }`}
                  >
                    <div className="bg-amber-100 rounded-full p-4 mb-3">
                      <FileImage className="h-10 w-10 text-amber-500" />
                    </div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      {isDragging ? "Drop your NIN image here" : "Upload from Gallery"}
                    </p>
                    <p className="text-xs text-amber-600 text-center">Drag and drop, or tap to browse your files</p>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-100" />
                    <span className="text-xs text-amber-400 font-semibold">OR</span>
                    <div className="flex-1 h-px bg-amber-100" />
                  </div>

                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-3 rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-800 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
                  >
                    <Camera className="h-5 w-5 text-amber-500" />
                    Take a Photo with Camera
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Preview - Check that all details are clear
                  </p>
                  <div
                    className="relative rounded-lg overflow-hidden border border-amber-200 bg-amber-50 cursor-zoom-in"
                    onClick={() => setShowPreviewModal(true)}
                  >
                    <img src={imagePreview} alt="NIN Preview" className="w-full object-contain max-h-60" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                      <div className="bg-white/90 rounded-full p-2 shadow">
                        <ZoomIn className="h-5 w-5 text-amber-700" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                      className="absolute top-2 right-2 bg-white/90 border border-red-200 text-red-500 rounded-full p-1.5 shadow hover:bg-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-amber-600 text-center">Tap the image to zoom in and inspect</p>

                  {imageMeta && (
                    <div className="flex flex-wrap gap-2 text-xs text-amber-700">
                      <span className="bg-amber-100 px-2 py-1 rounded-full">{imageMeta.width}x{imageMeta.height}px</span>
                      <span className="bg-amber-100 px-2 py-1 rounded-full">{imageMeta.size}KB</span>
                      <span className="bg-amber-100 px-2 py-1 rounded-full truncate max-w-[160px]">{imageMeta.name}</span>
                    </div>
                  )}

                  {!clarityWarning ? (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-green-700 font-medium">Image quality looks good. Confirm all NIN details are readable before submitting.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">{clarityWarning}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-2 rounded-lg border border-amber-400 bg-amber-50 text-amber-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retake Photo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-amber-50 transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" /> Choose File
                    </button>
                  </div>
                </div>
              )}

              {errors.image && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{errors.image}</p>
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Tips for a Clear NIN Photo</h3>
              <div className="space-y-2">
                {[
                  { icon: "☀️", tip: "Use good lighting — avoid shadows on the document" },
                  { icon: "📏", tip: "Hold the camera steady and keep the NIN flat" },
                  { icon: "🔍", tip: "Ensure all text, numbers and the photo on the NIN are sharp" },
                  { icon: "✂️", tip: "Frame the full NIN slip or card within the shot" },
                  { icon: "🚫", tip: "Avoid glare from phone screens or windows" },
                ].map(({ icon, tip }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sm">{icon}</span>
                    <p className="text-xs text-amber-800">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {errors.submission && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.submission}</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <button
            onClick={handleSubmit}
            disabled={uploadNINMutation.isPending || !imageFile}
            className="w-full py-3 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
          >
            {uploadNINMutation.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Uploading...
              </span>
            ) : "Submit NIN Image"}
          </button>
        </div>

        {/* Full-screen Preview Modal */}
        {showPreviewModal && imagePreview && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <div className="relative max-w-full max-h-full">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full p-1.5 shadow-lg z-10"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={imagePreview}
                alt="NIN Full Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-center text-white text-xs mt-2 opacity-60">Tap outside to close</p>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default MerchantNINUploadPage;
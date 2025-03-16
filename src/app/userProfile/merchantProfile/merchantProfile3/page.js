"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, Check, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import * as faceapi from "face-api.js";
import ProtectedRoute from "@/app/component/protect";

const VERIFICATION_STEPS = {
  INITIAL: "initial",
  LOADING_MODELS: "loading_models",
  CAMERA_SETUP: "camera_setup",
  POSITIONING: "positioning",
  CAPTURING: "capturing",
  UPLOADING: "uploading",
  COMPLETE: "complete",
};

const FACE_FEATURES = {
  FACE: "face",
  EYES: "eyes",
  MOUTH: "mouth",
};

const FaceVerification = () => {
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);
  const [updatedAccessToken, setUpdatedAccessToken] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(VERIFICATION_STEPS.INITIAL);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const [detectedFeatures, setDetectedFeatures] = useState({
    [FACE_FEATURES.FACE]: false,
    [FACE_FEATURES.EYES]: false,
    [FACE_FEATURES.MOUTH]: false,
  });
  const [facingIssue, setFacingIssue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api.js models
  const loadModels = async () => {
    setCurrentStep(VERIFICATION_STEPS.LOADING_MODELS);
    try {
      // Set the models path - adjust this to the path where you store the models
      const MODEL_URL = "/models";

      // Load all required models for face detection
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);

      // Once models are loaded, we can proceed to camera setup
      setCurrentStep(VERIFICATION_STEPS.CAMERA_SETUP);
      startCamera();
    } catch (err) {
      console.error("Error loading face detection models:", err);
      setError(
        "Failed to load face detection models. Please refresh and try again."
      );
      setCurrentStep(VERIFICATION_STEPS.INITIAL);
    }
  };

  // Start camera with user-facing camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCurrentStep(VERIFICATION_STEPS.POSITIONING);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(
        "Camera access denied. Please enable camera access and try again."
      );
      setCurrentStep(VERIFICATION_STEPS.INITIAL);
    }
  };

  // Detect face features in real-time using face-api.js
  const detectFaceFeatures = async () => {
    if (
      !videoRef.current ||
      !modelsLoaded ||
      currentStep !== VERIFICATION_STEPS.POSITIONING
    )
      return false;

    try {
      const video = videoRef.current;

      // Detect all face features with faceapi
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      // Draw canvas with detections for debugging if needed
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Optional: Draw facial landmarks for debugging
        // faceapi.draw.drawDetections(canvas, detections);
        // faceapi.draw.drawFaceLandmarks(canvas, detections);
      }

      // Check if face is detected
      const faceDetected = detections.length > 0;

      if (faceDetected && detections[0].landmarks) {
        const landmarks = detections[0].landmarks;
        const positions = landmarks.positions;

        // Check for eyes visibility based on landmarks
        const leftEye = positions.slice(36, 42); // Left eye landmarks
        const rightEye = positions.slice(42, 48); // Right eye landmarks

        // Check for mouth visibility based on landmarks
        const mouth = positions.slice(48, 68); // Mouth landmarks

        // Check if all parts of the face are visible and properly positioned
        const eyesDetected = leftEye.length > 0 && rightEye.length > 0;
        const mouthDetected = mouth.length > 0;

        // Get the detection box
        const box = detections[0].detection.box;
        const faceWidth = box.width;
        const faceHeight = box.height;

        // Update detected features
        setDetectedFeatures({
          [FACE_FEATURES.FACE]: faceDetected,
          [FACE_FEATURES.EYES]: eyesDetected,
          [FACE_FEATURES.MOUTH]: mouthDetected,
        });

        // Check if face is too close, too far, or not centered
        const idealFaceSize =
          Math.min(video.videoWidth, video.videoHeight) * 0.4;
        const faceTooSmall = faceWidth < idealFaceSize * 0.7;
        const faceTooBig = faceWidth > idealFaceSize * 1.3;
        const faceNotCentered =
          Math.abs(box.x + box.width / 2 - video.videoWidth / 2) >
          video.videoWidth * 0.15;

        // Give positioning guidance
        if (faceTooSmall) {
          setFacingIssue("Please move closer to the camera");
        } else if (faceTooBig) {
          setFacingIssue("Please move away from the camera");
        } else if (faceNotCentered) {
          setFacingIssue("Please center your face in the frame");
        } else if (!eyesDetected) {
          setFacingIssue("Please ensure your eyes are visible");
        } else if (!mouthDetected) {
          setFacingIssue("Please ensure your whole face is visible");
        } else {
          setFacingIssue("");
        }

        // If all features are detected and face is well positioned
        if (
          faceDetected &&
          eyesDetected &&
          mouthDetected &&
          !faceTooSmall &&
          !faceTooBig &&
          !faceNotCentered
        ) {
          return true;
        }
      } else {
        setDetectedFeatures({
          [FACE_FEATURES.FACE]: false,
          [FACE_FEATURES.EYES]: false,
          [FACE_FEATURES.MOUTH]: false,
        });
        setFacingIssue("Please position your face in the frame");
      }

      return false;
    } catch (err) {
      console.error("Face detection error:", err);
      setError("Face detection error. Please try again.");
      return false;
    }
  };

  // Capture the image when face is properly positioned
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      // Convert to base64 for preview
      const imageDataUrl = canvas.toDataURL("image/png");
      setCapturedImage(imageDataUrl);

      return canvas;
    } catch (err) {
      console.error("Image capture error:", err);
      setError("Failed to capture image. Please try again.");
      return null;
    }
  };

  // Convert canvas to file
  const canvasToFile = async (canvas) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob conversion failed"));
          return;
        }

        // Create a File object from the blob
        const file = new File([blob], "face-verification.png", {
          type: "image/png",
          lastModified: new Date().getTime(),
        });

        resolve(file);
      }, "image/png");
    });
  };

  // Upload the image to the API
  const uploadImage = async (canvas) => {
    setIsUploading(true);
    setCurrentStep(VERIFICATION_STEPS.UPLOADING);

    try {
      // Convert canvas to file
      const imageFile = await canvasToFile(canvas);

      // Create FormData and append the image
      const formData = new FormData();
      formData.append("image", imageFile);

      // Set the API type for the merchant profile update
      formData.append("apiType", "updateMerchantProfileWithImage");

      formData.append("accessToken", accessToken);

      // Send to your Next.js API route
      const response = await fetch("/api/user", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setCurrentStep(VERIFICATION_STEPS.COMPLETE);

      // Redirect after short delay
      setTimeout(() => {
        router.push("/userProfile/merchantProfile/merchantProfile4");
      }, 2000);

      return true;
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image. Please try again.");
      setCurrentStep(VERIFICATION_STEPS.POSITIONING);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const startVerification = () => {
    setError("");
    loadModels();
  };

  const handleCapture = async () => {
    setCurrentStep(VERIFICATION_STEPS.CAPTURING);
    const canvas = captureImage();
    if (canvas) {
      await uploadImage(canvas);
    } else {
      setCurrentStep(VERIFICATION_STEPS.POSITIONING);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCurrentStep(VERIFICATION_STEPS.POSITIONING);
  };

  useEffect(() => {
    let interval;

    if (currentStep === VERIFICATION_STEPS.POSITIONING && modelsLoaded) {
      interval = setInterval(async () => {
        const isReady = await detectFaceFeatures();

        // Auto-capture when face is perfectly positioned for 2 consecutive checks
        if (isReady) {
          // Add a slight delay to ensure consistent good positioning
          setTimeout(() => {
            if (currentStep === VERIFICATION_STEPS.POSITIONING) {
              handleCapture();
            }
          }, 500);
          clearInterval(interval);
        }
      }, 200);
    }

    return () => {
      clearInterval(interval);
    };
  }, [currentStep, modelsLoaded]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  /* useEffect(() => {
    console.log("sssssssssssss");
    console.log(accessToken);
    setUpdatedAccessToken(accessToken);
    console.log("ssssssssssss");
  }, [accessToken]);*/

  // Render face detection guide overlay
  const renderFaceOverlay = () => {
    const allFeaturesDetected = Object.values(detectedFeatures).every(
      (value) => value
    );

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`
          h-64 w-64 rounded-full border-4 
          ${allFeaturesDetected ? "border-green-500" : "border-amber-500"} 
          flex items-center justify-center
        `}
        >
          {facingIssue && (
            <div className="bg-black/70 text-white p-2 rounded">
              {facingIssue}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => router.back()}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Face Verification</h1>
          </div>
        </div>

        <div className="flex-1 container max-w-3xl mx-auto p-6">
          <div className="space-y-6">
            {currentStep === VERIFICATION_STEPS.INITIAL && (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">
                  Start Face Verification
                </h2>
                <p className="text-slate-600">
                  Position yourself in a well-lit area and ensure your face is
                  clearly visible
                </p>
                <Button
                  onClick={startVerification}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}

            {currentStep === VERIFICATION_STEPS.LOADING_MODELS && (
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">
                  Loading Face Detection
                </h2>
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                </div>
                <p className="text-slate-600">
                  Please wait while we load the face detection models...
                </p>
              </div>
            )}

            {(currentStep === VERIFICATION_STEPS.CAMERA_SETUP ||
              currentStep === VERIFICATION_STEPS.POSITIONING ||
              currentStep === VERIFICATION_STEPS.CAPTURING) && (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {currentStep === VERIFICATION_STEPS.POSITIONING &&
                  renderFaceOverlay()}

                {currentStep === VERIFICATION_STEPS.CAMERA_SETUP && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}

                {currentStep === VERIFICATION_STEPS.CAPTURING && (
                  <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                )}
              </div>
            )}

            {currentStep === VERIFICATION_STEPS.UPLOADING && (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured face"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                  <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
                  <p className="text-white font-medium">
                    Uploading and verifying...
                  </p>
                </div>
              </div>
            )}

            {currentStep === VERIFICATION_STEPS.COMPLETE && (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Verified face"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/30">
                  <div className="bg-green-500 rounded-full p-3">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-medium mt-4">
                    Verification successful!
                  </p>
                  <p className="text-white/80 text-sm">Redirecting...</p>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep === VERIFICATION_STEPS.POSITIONING && (
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Position your face in the circle and look straight at the
                  camera
                </p>
                <Button
                  onClick={handleCapture}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg"
                  disabled={
                    !Object.values(detectedFeatures).every((value) => value)
                  }
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Now
                </Button>
              </div>
            )}

            {currentStep === VERIFICATION_STEPS.UPLOADING && (
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Please wait while we verify your photo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FaceVerification;

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const VERIFICATION_STEPS = {
  INITIAL: 'initial',
  CAMERA_SETUP: 'camera_setup',
  DETECTING: 'detecting',
  COMPLETE: 'complete',
};

const FaceVerification = () => { 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(VERIFICATION_STEPS.INITIAL);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [faceData, setFaceData] = useState(null);
  const [detectionBox, setDetectionBox] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCurrentStep(VERIFICATION_STEPS.DETECTING);
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera access and try again.');
      setCurrentStep(VERIFICATION_STEPS.INITIAL);
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || isFaceDetected) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      const formData = new FormData();
      formData.append('image', blob);

      const response = await fetch('/api/face-verification', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      if (data.success && data.isHuman) {
        setFaceData(data);
        setDetectionBox(data.facePosition);
        setCurrentStep(VERIFICATION_STEPS.COMPLETE);
        setIsFaceDetected(true);
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      return false;
    }
  };

  const startVerification = () => {
    setError('');
    setIsFaceDetected(false);
    setCurrentStep(VERIFICATION_STEPS.CAMERA_SETUP);
    startCamera();
  };

  useEffect(() => {
    let interval;

    if (currentStep === VERIFICATION_STEPS.DETECTING && !isFaceDetected) {
      interval = setInterval(captureAndVerify, 5000);
    }

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStep, stream, isFaceDetected]);

  const renderDetectionBox = () => {
    if (!detectionBox) return null;

    return (
      <div
        className="absolute border-2 border-green-500"
        style={{
          left: `${detectionBox.x}px`,
          top: `${detectionBox.y}px`,
          width: `${detectionBox.width}px`,
          height: `${detectionBox.height}px`
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">

      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
            <h1 className="text-lg font-semibold">Face Verification</h1>
          </div> 
        </div>

      <div className="flex-1 container max-w-3xl mx-auto p-6">
        <div className="space-y-6">
          {currentStep === VERIFICATION_STEPS.INITIAL && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Start Face Verification</h2>
              <p className="text-slate-600">
                Position yourself in a well-lit area and ensure your face is clearly visible
              </p>
              <Button
                size="lg"
                onClick={startVerification}
                className="rounded-full h-16 w-16 p-0"
              >
                <Camera className="h-8 w-8" />
              </Button>
            </div>
          )}

          {(currentStep === VERIFICATION_STEPS.CAMERA_SETUP || 
            currentStep === VERIFICATION_STEPS.DETECTING || 
            currentStep === VERIFICATION_STEPS.COMPLETE) && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {renderDetectionBox()}

              {currentStep === VERIFICATION_STEPS.DETECTING && !isFaceDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}

              {currentStep === VERIFICATION_STEPS.COMPLETE && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                  <Check className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {faceData && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-medium mb-3">Verification Results</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt>Confidence Score:</dt>
                <dd className="text-right">{(faceData.confidence * 100).toFixed(1)}%</dd>
                <dt>Status:</dt>
                <dd className="text-right text-green-600">Verified</dd>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceVerification;
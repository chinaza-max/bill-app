'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Check, Circle } from 'lucide-react';

const MerchantAccountPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    nin: '',
    contactNumber: '',
  });
  const [faceVerified, setFaceVerified] = useState(false);
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    if (!formData.nin.trim()) {
      newErrors.nin = 'NIN is required';
    } else if (formData.nin.length !== 11) {
      newErrors.nin = 'NIN must be 11 digits';
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{11}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleVerifyFace = () => {
    // Simulate face verification
    setFaceVerified(true);
  };

  const handleComplete = () => {
    if (faceVerified) {
      // Handle completion
      router.push('/merchant-dashboard');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Create Merchant Account</h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center flex-1">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                1
              </div>
              <div className="flex-1 h-1 mx-2 bg-amber-500" />
            </div>
            <div className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-amber-200'} flex items-center justify-center text-white`}>
                2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-4 py-3 overflow-auto">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.displayName ? 'border-red-500' : 'border-amber-200'
                } focus:outline-none focus:border-amber-500`}
                placeholder="Enter your display name"
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                NIN
              </label>
              <input
                type="text"
                name="nin"
                value={formData.nin}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.nin ? 'border-red-500' : 'border-amber-200'
                } focus:outline-none focus:border-amber-500`}
                placeholder="Enter your NIN"
                maxLength={11}
              />
              {errors.nin && (
                <p className="mt-1 text-sm text-red-500">{errors.nin}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.contactNumber ? 'border-red-500' : 'border-amber-200'
                } focus:outline-none focus:border-amber-500`}
                placeholder="Enter your contact number"
                maxLength={11}
              />
              {errors.contactNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.contactNumber}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-64 h-64 bg-amber-100 rounded-lg flex items-center justify-center">
              <Camera className="h-16 w-16 text-amber-400" />
              {faceVerified && (
                <div className="absolute inset-0 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Check className="h-16 w-16 text-amber-500" />
                </div>
              )}
            </div>
            <p className="text-amber-900 text-center">
              {faceVerified
                ? 'Face verification successful!'
                : 'Position your face within the frame for verification'}
            </p>
            {!faceVerified && (
              <button
                onClick={handleVerifyFace}
                className="bg-amber-500 text-white rounded-lg py-2 px-6 font-medium hover:bg-amber-600 transition-colors"
              >
                Verify Face
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="px-4 py-3">
        <button
          onClick={step === 1 ? handleContinue : handleComplete}
          disabled={step === 2 && !faceVerified}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            step === 2 && !faceVerified
              ? 'bg-amber-200 text-amber-400 cursor-not-allowed'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {step === 1 ? 'Continue' : 'Complete'}
        </button>
      </div>
    </div>
  );
};

export default MerchantAccountPage;
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';

const MerchantAccountPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nin: '',
    verificationType: 'NIN',
    debitAccountNumber: '',
    otp: '',
    verifierId: 'default'
  });
  const [errors, setErrors] = useState({});
  const [isVerified, setIsVerified] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nin.trim()) {
      newErrors.nin = 'NIN is required';
    } else if (formData.nin.length !== 11) {
      newErrors.nin = 'NIN must be 11 digits';
    }
    if (!formData.debitAccountNumber.trim()) {
      newErrors.debitAccountNumber = 'Debit account number is required';
    }
    if (formData.verificationType === 'BVNUSSD' && !formData.otp.trim()) {
      newErrors.otp = 'OTP is required for BVNUSSD verification';
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
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleVerification = () => {
    if (validateForm()) {
      // Simulate verification process

      setIsVerified(true);
      setTimeout(() => {
        router.push('/userProfile/merchantProfile/merchantProfile2');
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">NIN Verification</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-4 py-6 overflow-auto">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">
                  NIN Number
                </label>
                <input
                  type="text"
                  name="nin"
                  value={formData.nin}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors.nin ? 'border-red-500' : 'border-amber-200'
                  } focus:outline-none focus:border-amber-500`}
                  placeholder="Enter your 11-digit NIN"
                  maxLength={11}
                />
                {errors.nin && (
                  <p className="mt-1 text-sm text-red-500">{errors.nin}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">
                  Verification Type
                </label>
                <select
                  name="verificationType"
                  value={formData.verificationType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="NIN">NIN</option>
                  <option value="vNIN">vNIN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">
                  Debit Account Number
                </label>
                <input
                  type="text"
                  name="debitAccountNumber"
                  value={formData.debitAccountNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors.debitAccountNumber ? 'border-red-500' : 'border-amber-200'
                  } focus:outline-none focus:border-amber-500`}
                  placeholder="Enter debit account number"
                />
                {errors.debitAccountNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.debitAccountNumber}</p>
                )}
              </div>

              {formData.verificationType === 'BVNUSSD' && (
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">
                    OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      errors.otp ? 'border-red-500' : 'border-amber-200'
                    } focus:outline-none focus:border-amber-500`}
                    placeholder="Enter OTP"
                  />
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-500">{errors.otp}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {isVerified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-green-700">NIN verification successful!</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-4 py-3">
        <button
          onClick={handleVerification}
          disabled={isVerified}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isVerified
              ? 'bg-amber-200 text-amber-400 cursor-not-allowed'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {isVerified ? 'Verified' : 'Verify NIN'}
        </button>
      </div>
    </div>
  );
};

export default MerchantAccountPage;
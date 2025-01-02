'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone } from 'lucide-react';

const MerchantInfoPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid 11-digit phone number';
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

  const handleSubmit = () => {
    if (validateForm()) {
      router.push('/userProfile/merchantProfile/merchantProfile3');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Merchant Information</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-auto">
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.displayName ? 'border-red-500' : 'border-amber-200'
                    } focus:outline-none focus:border-amber-500`}
                    placeholder="Enter business/merchant name"
                  />
                </div>
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.phoneNumber ? 'border-red-500' : 'border-amber-200'
                    } focus:outline-none focus:border-amber-500`}
                    placeholder="Enter 11-digit phone number"
                    maxLength={11}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MerchantInfoPage;
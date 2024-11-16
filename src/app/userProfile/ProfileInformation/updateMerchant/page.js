'use client';


import React, { useState } from 'react';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
  import { useRouter } from 'next/navigation';

const MerchantEditPage = () => {
  const [merchantInfo, setMerchantInfo] = useState({
    merchantDisplayName: 'Carter Foods & Groceries',
    merchantPhoneNumber: '+234 800 987 6543',
    isPhoneVerified: true
  });

  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMerchantInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle update logic here
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="h-6 w-6 cursor-pointer" onClick={handleBack} />
          <h1 className="text-lg font-semibold">Edit Merchant Information</h1>
        </div>
      </div>

      {/* Content with padding for fixed header */}
      <div className="pt-16 px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="merchantDisplayName"
                  value={merchantInfo.merchantDisplayName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Business Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="merchantPhoneNumber"
                    value={merchantInfo.merchantPhoneNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  {merchantInfo.isPhoneVerified ? (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
                  ) : (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-amber-500 text-white rounded-lg py-2 px-4 font-medium hover:bg-amber-600 transition-colors"
              >
                Save Changes
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantEditPage;
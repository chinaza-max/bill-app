'use client';


import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateAdsPage = () => {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [useDefaultSettings, setUseDefaultSettings] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedCharge, setSelectedCharge] = useState('');
  const [adsList, setAdsList] = useState([]);

  // Amount options for dropdown
  const amountOptions = [
    { value: '1000', label: '₦1,000' },
    { value: '5000', label: '₦5,000' },
    { value: '10000', label: '₦10,000' },
    { value: '20000', label: '₦20,000' }
  ];

  // Default sample data based on price range
  const getDefaultSampleData = (min, max) => {
    const range = max - min;
    let samples = [];
    
    if (range <= 5000) {
      samples = [
        { amount: '1000', charge: '100' },
        { amount: '2000', charge: '150' },
        { amount: '3000', charge: '180' }
      ];
    } else if (range <= 10000) {
      samples = [
        { amount: '2000', charge: '150' },
        { amount: '4000', charge: '200' },
        { amount: '6000', charge: '250' }
      ];
    } else if (range <= 20000) {
      samples = [
        { amount: '5000', charge: '200' },
        { amount: '8000', charge: '300' },
        { amount: '10000', charge: '350' }
      ];
    } else {
      samples = [
        { amount: '10000', charge: '300' },
        { amount: '15000', charge: '400' },
        { amount: '20000', charge: '500' }
      ];
    }
    return samples;
  };

  // Charge ranges based on selected amount
  const chargeRanges = {
    '1000': [
      { value: '100', label: '₦100' },
      { value: '150', label: '₦150' },
      { value: '200', label: '₦200' }
    ],
    '5000': [
      { value: '200', label: '₦200' },
      { value: '250', label: '₦250' },
      { value: '300', label: '₦300' }
    ],
    '10000': [
      { value: '300', label: '₦300' },
      { value: '350', label: '₦350' },
      { value: '400', label: '₦400' }
    ],
    '20000': [
      { value: '400', label: '₦400' },
      { value: '450', label: '₦450' },
      { value: '500', label: '₦500' }
    ]
  };

  useEffect(() => {
    // Load default samples when price range changes and default settings are on
    if (minPrice && maxPrice && useDefaultSettings) {
      const samples = getDefaultSampleData(Number(minPrice), Number(maxPrice));
      const defaultAds = samples.map((sample, index) => ({
        id: Date.now() + index,
        minPrice,
        maxPrice,
        amount: sample.amount,
        charge: sample.charge,
        useDefaultSettings: true,
        isDefault: true
      }));
      setAdsList(defaultAds);
    }
  }, [minPrice, maxPrice, useDefaultSettings]);

  const handleAddAd = () => {
    if (minPrice && maxPrice && selectedAmount && selectedCharge) {
      const newAd = {
        id: Date.now(),
        minPrice,
        maxPrice,
        amount: selectedAmount,
        charge: selectedCharge,
        useDefaultSettings: false,
        isDefault: false
      };
      
      // Keep default entries and add/update custom entry
      const updatedList = adsList
        .filter(ad => ad.isDefault || ad.amount !== selectedAmount)
        .concat(newAd);
      
      setAdsList(updatedList);
      // Reset only the selection fields
      setSelectedAmount('');
      setSelectedCharge('');
    }
  };

  const handleRemoveAd = (id) => {
    setAdsList(adsList.filter(ad => ad.id !== id));
  };

  // Toggle switch component
  const Switch = ({ enabled, onToggle }) => (
    <motion.button
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
        enabled ? 'bg-green-500' : 'bg-amber-200'
      }`}
      onClick={onToggle}
    >
      <motion.span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition"
        animate={{ x: enabled ? 20 : 2 }}
      />
    </motion.button>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Top Navigation */}
      <div className="sticky top-0 z-10 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white flex items-center">
        <ArrowLeft className="h-6 w-6 mr-3" onClick={() => window.history.back()} />
        <h1 className="text-lg font-semibold">Create Ads</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Price Range Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-amber-900 font-semibold mb-3">Set Price Range</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-amber-700 mb-1">Minimum (₦)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Min amount"
              />
            </div>
            <div>
              <label className="block text-sm text-amber-700 mb-1">Maximum (₦)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Max amount"
              />
            </div>
          </div>
        </div>

        {/* Price Per Thousand Section - Only shown when price range is set */}
        {minPrice && maxPrice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 shadow-sm"
          >
            <h2 className="text-amber-900 font-semibold mb-3">Set Price Per Thousand</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-amber-700">Use Default Settings</span>
                <Switch enabled={useDefaultSettings} onToggle={() => setUseDefaultSettings(!useDefaultSettings)} />
              </div>

              <AnimatePresence>
                {!useDefaultSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm text-amber-700 mb-1">Amount</label>
                      <select
                        value={selectedAmount}
                        onChange={(e) => {
                          setSelectedAmount(e.target.value);
                          setSelectedCharge('');
                        }}
                        className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Select amount</option>
                        {amountOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-amber-700 mb-1">Charge</label>
                      <select
                        value={selectedCharge}
                        onChange={(e) => setSelectedCharge(e.target.value)}
                        className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                        disabled={!selectedAmount}
                      >
                        <option value="">Select charge</option>
                        {selectedAmount && chargeRanges[selectedAmount].map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddAd}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 rounded-lg font-medium"
                    >
                      Add
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Created Ads List */}
        {adsList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-900">Price Information</h2>
              <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-sm">
                ₦{Number(minPrice).toLocaleString()} - ₦{Number(maxPrice).toLocaleString()}
              </span>
            </div>
            {adsList.map(ad => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-50 to-green-50 rounded-lg p-4 shadow-sm border border-amber-100"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-900 font-medium">
                        Amount: ₦{Number(ad.amount).toLocaleString()}
                      </span>
                      {ad.isDefault && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                          <Check className="w-3 h-3 mr-1" /> Default
                        </span>
                      )}
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-green-800">
                        <span className="font-medium">Charge:</span> ₦{Number(ad.charge).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!ad.isDefault && (
                    <button
                      onClick={() => handleRemoveAd(ad.id)}
                      className="text-amber-600 hover:text-amber-700 bg-white rounded-full p-1 shadow-sm"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAdsPage;
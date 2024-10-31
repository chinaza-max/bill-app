'use client';


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
  const [amountOptions, setAmountOptions] = useState([]);

  // Generate amount options based on price range
  const generateAmountOptions = (min, max) => {
    const baseAmounts = [1000, 5000, 10000, 15000, 20000];
    return baseAmounts
      .filter(amount => amount >= Number(min) && amount <= Number(max))
      .map(amount => ({
        value: amount.toString(),
        label: `₦${amount.toLocaleString()}`
      }));
  };

  // Update amount options when price range changes
  useEffect(() => {
    if (minPrice && maxPrice) {
      const options = generateAmountOptions(minPrice, maxPrice);
      setAmountOptions(options);
      
      // Reset selected amount if it's no longer in range
      if (selectedAmount && !options.find(opt => opt.value === selectedAmount)) {
        setSelectedAmount('');
        setSelectedCharge('');
      }
    }
  }, [minPrice, maxPrice]);

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
    '15000': [
      { value: '350', label: '₦350' },
      { value: '400', label: '₦400' },
      { value: '450', label: '₦450' }
    ],
    '20000': [
      { value: '400', label: '₦400' },
      { value: '450', label: '₦450' },
      { value: '500', label: '₦500' }
    ]
  };

  // Get default sample data based on available amount options
  const getDefaultSampleData = (options) => {
    // Take up to 3 evenly distributed options
    const count = Math.min(3, options.length);
    const step = Math.floor(options.length / count) || 1;
    
    return Array.from({ length: count }, (_, index) => {
      const option = options[Math.min(index * step, options.length - 1)];
      const charges = chargeRanges[option.value];
      return {
        amount: option.value,
        charge: charges[0].value // Use first charge as default
      };
    });
  };

  useEffect(() => {
    // Load default samples when price range changes and default settings are on
    if (minPrice && maxPrice && useDefaultSettings && amountOptions.length > 0) {
      const samples = getDefaultSampleData(amountOptions);
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
  }, [minPrice, maxPrice, useDefaultSettings, amountOptions]);

  // Validate price input
  const handleMinPriceChange = (value) => {
    const numValue = Number(value);
    if (numValue < 1000) {
      setMinPrice('1000');
    } else {
      setMinPrice(value);
    }
  };

  const handleMaxPriceChange = (value) => {
    const numValue = Number(value);
    if (numValue > 20000) {
      setMaxPrice('20000');
    } else {
      setMaxPrice(value);
    }
  };

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
      
      const updatedList = adsList
        .filter(ad => ad.isDefault || ad.amount !== selectedAmount)
        .concat(newAd);
      
      setAdsList(updatedList);
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
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Min amount (₦1,000)"
                min="1000"
                max="20000"
              />
            </div>
            <div>
              <label className="block text-sm text-amber-700 mb-1">Maximum (₦)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                placeholder="Max amount (₦20,000)"
                min="1000"
                max="20000"
              />
            </div>
          </div>
        </div>

        {/* Price Per Thousand Section */}
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
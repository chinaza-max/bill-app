'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('');
  const [priceRanges] = useState([
    { min: 1000, max: 5000, charge: 200 },
    { min: 5001, max: 10000, charge: 300 },
    { min: 20001, max: 300000, charge: 400 }
  ]);
  const [deliveryDistance, setDeliveryDistance] = useState(10); // Default 10km

  const handleGoBack = () => {
    router.push('/userProfile/merchantProfile/merchantHome');
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={handleGoBack} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">P2P Trading Settings</h1>
        </div>
      </div>

      {/* Price Ranges Section */}
      <div className="px-4 py-3 bg-white border-b border-amber-100">
        <motion.button
          onClick={() => toggleSection('priceRanges')}
          className="w-full flex items-center justify-between"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-amber-900">
              Transaction Range & Information 
            <span className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full text-xs mt-2 text-emerald-500">
              1000 - 20000
            </span>
            </span>
            {activeSection === 'priceRanges' ? (
              <ChevronUp className="h-5 w-5 text-amber-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-amber-500" />
            )}
          </div>
        </motion.button>

        <AnimatePresence>
          {activeSection === 'priceRanges' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {priceRanges.map((range, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-amber-50 px-3 py-2 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium text-amber-900">
                      {range.min.toLocaleString()} - {range.max.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-700">{range.charge} ₦ Charge</span>
                  </div>
                </div>
              ))}
              <p className="text-sm text-amber-600 mt-2">

                Above is a break down of your transaction range and charge.
                
                </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delivery Distance Section */}
      <div className="px-4 py-3 bg-white border-b border-amber-100">
        <motion.button
          onClick={() => toggleSection('deliveryDistance')}
          className="w-full flex items-center justify-between"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-2 justify-between">
            <span className="font-semibold text-amber-900">Cash Delivery Radius</span>
            {activeSection === 'deliveryDistance' ? (
              <ChevronUp className="h-5 w-5 text-amber-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-amber-500" />
            )}
          </div>
        </motion.button>

        <AnimatePresence>
          {activeSection === 'deliveryDistance' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-amber-500" />
                <input
                  type="number"
                  value={deliveryDistance}
                  onChange={(e) => setDeliveryDistance(parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <span className="text-amber-600">km</span>
              </div>
              <p className="text-sm text-amber-600">
                Set the maximum distance you are willing to travel for cash delivery. 
                This helps customers find merchants nearby.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;
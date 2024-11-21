'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  User,
  Store,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TierPage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(null);
  const [expandedTier, setExpandedTier] = useState(null);

  // Sample current tier data for both account types
  const currentTiers = {
    client: {
      type: 'Client',
      name: 'Silver',
      maxAmount: 500000,
      progress: 75,
      nextTier: 'Gold',
      remainingAmount: 250000,
      isActive: true
    },
    merchant: {
      type: 'Merchant',
      name: 'Basic Merchant',
      maxAmount: 1000000,
      progress: 45,
      nextTier: 'Premium Merchant',
      remainingAmount: 500000,
      isActive: true
    }
  };

  // Sample tier data remains the same...
  const tierData = {
    client: [
      {
        name: 'Bronze',
        maxAmount: 100000,
        requirements: [
          'Complete profile verification',
          'Complete at least 5 transactions',
          'Maintain 90% success rate',
        ],
      },
      {
        name: 'Silver',
        maxAmount: 500000,
        requirements: [
          'Complete advanced verification',
          'Complete at least 20 transactions',
          'Maintain 95% success rate',
          '3 months account age',
        ],
      },
      {
        name: 'Gold',
        maxAmount: 1000000,
        requirements: [
          'Complete business verification',
          'Complete at least 50 transactions',
          'Maintain 98% success rate',
          '6 months account age',
        ],
      },
    ],
    merchant: [
      {
        name: 'Basic Merchant',
        maxAmount: 1000000,
        requirements: [
          'Business registration documents',
          'Complete at least 10 successful sales',
          'Maintain 92% success rate',
        ],
      },
      {
        name: 'Premium Merchant',
        maxAmount: 5000000,
        requirements: [
          'Valid business license',
          'Complete at least 50 successful sales',
          'Maintain 95% success rate',
          '6 months as Basic Merchant',
        ],
      },
      {
        name: 'Elite Merchant',
        maxAmount: 10000000,
        requirements: [
          'Corporate documentation',
          'Complete at least 200 successful sales',
          'Maintain 98% success rate',
          '1 year as Premium Merchant',
        ],
      },
    ],
  };

  const handleBackClick = () => {
    router.push('/home');
  };

  const CurrentTierCard = ({ tierInfo }) => (
    <div className={`bg-white rounded-lg p-4 shadow-sm ${!tierInfo.isActive && 'opacity-60'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            {tierInfo.type === 'Client' ? (
              <User className="h-5 w-5 text-amber-600" />
            ) : (
              <Store className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-amber-900">{tierInfo.type}</h3>
              {!tierInfo.isActive && (
                <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-amber-600">{tierInfo.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-amber-900 font-medium">
            Max: ₦{tierInfo.maxAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {tierInfo.isActive && (
        <div className="space-y-2">
          <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${tierInfo.progress}%` }}
            />
          </div>
          <p className="text-xs text-amber-600">
            ₦{tierInfo.remainingAmount.toLocaleString()} more to reach {tierInfo.nextTier}
          </p>
        </div>
      )}
    </div>
  );

  const TierCard = ({ tier }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 shadow-sm"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">{tier.name}</h3>
            <p className="text-sm text-amber-600">
              Up to ₦{tier.maxAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpandedTier(expandedTier === tier.name ? null : tier.name)}
          className="text-amber-500"
        >
          {expandedTier === tier.name ? (
            <ChevronUp className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {expandedTier === tier.name && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <h4 className="text-sm font-medium text-amber-800">Requirements:</h4>
            <ul className="space-y-2">
              {tier.requirements.map((req, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm text-amber-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={handleBackClick} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Tier Status</h1>
        </div>
      </div>

      {/* Current Tiers Section */}
      <div className="px-4 py-6 space-y-4">
        <h2 className="text-lg font-semibold text-amber-900 px-1">Current Status</h2>
        <div className="space-y-4">
          <CurrentTierCard tierInfo={currentTiers.client} />
          <CurrentTierCard tierInfo={currentTiers.merchant} />
        </div>
      </div>

      {/* Section Toggles */}
      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveSection('client')}
          className={`p-4 rounded-lg flex flex-col items-center space-y-2 ${
            activeSection === 'client'
              ? 'bg-amber-500 text-white'
              : 'bg-white text-amber-900'
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-sm font-medium">Client Tiers</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveSection('merchant')}
          className={`p-4 rounded-lg flex flex-col items-center space-y-2 ${
            activeSection === 'merchant'
              ? 'bg-amber-500 text-white'
              : 'bg-white text-amber-900'
          }`}
        >
          <Store className="h-6 w-6" />
          <span className="text-sm font-medium">Merchant Tiers</span>
        </motion.button>
      </div>

      {/* Tier Lists */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <AnimatePresence mode="wait">
          {activeSection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {tierData[activeSection].map((tier) => (
                <TierCard key={tier.name} tier={tier} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TierPage;
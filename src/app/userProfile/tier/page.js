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
  AlertCircle,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TierPage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('client');
  const [expandedTier, setExpandedTier] = useState(null);

  // Current tier data remains the same
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

  // Enhanced tier data with status
  const tierData = {
    client: [
      {
        name: 'Bronze',
        maxAmount: 100000,
        status: 'completed',
        requirements: [
          'Complete profile verification',
          'Complete at least 5 transactions',
          'Maintain 90% success rate',
        ],
      },
      {
        name: 'Silver',
        maxAmount: 500000,
        status: 'current',
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
        status: 'locked',
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
        status: 'current',
        requirements: [
          'Business registration documents',
          'Complete at least 10 successful sales',
          'Maintain 92% success rate',
        ],
      },
      {
        name: 'Premium Merchant',
        maxAmount: 5000000,
        status: 'locked',
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
        status: 'locked',
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

  const TierProgress = ({ tier, index, total }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'completed':
          return 'bg-green-500';
        case 'current':
          return 'bg-amber-500';
        default:
          return 'bg-gray-300';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'completed':
          return <CheckCircle2 className="h-6 w-6 text-green-500" />;
        case 'current':
          return <Shield className="h-6 w-6 text-amber-500" />;
        default:
          return <Shield className="h-6 w-6 text-gray-400" />;
      }
    };

    return (
      <div className="relative">
        <div className="flex items-start space-x-4">
          {/* Status Line */}
          {index < total - 1 && (
            <div className="absolute top-8 left-6 w-0.5 h-full bg-gray-200" />
          )}
          
          {/* Tier Content */}
          <div className="relative">
            <div className="z-10 bg-amber-50">
              {getStatusIcon(tier.status)}
            </div>
          </div>
          
          <div className="flex-1 pb-8">
            <div 
              className={`bg-white rounded-lg p-4 shadow-sm border-l-4 
                ${tier.status === 'current' ? 'border-amber-500' : 
                  tier.status === 'completed' ? 'border-green-500' : 'border-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-amber-900">{tier.name}</h3>
                  <p className="text-sm text-amber-600">
                    Max: ₦{tier.maxAmount.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedTier(expandedTier === tier.name ? null : tier.name)}
                  className="text-amber-500 p-1"
                >
                  {expandedTier === tier.name ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {expandedTier === tier.name && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <h4 className="text-sm font-medium text-amber-800 mb-2">Requirements:</h4>
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
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={handleBackClick} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Tier Status</h1>
        </div>
      </div>

      {/* Section Toggles - Fixed below header */}
      <div className="sticky top-0 z-10 bg-amber-50 px-4 pt-4 pb-2">
        <div className="flex space-x-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection('client')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2
              ${activeSection === 'client' ? 'bg-amber-500 text-white' : 'bg-white text-amber-900'}`}
          >
            <User className="h-5 w-5" />
            <span className="font-medium">Client Tiers</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection('merchant')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2
              ${activeSection === 'merchant' ? 'bg-amber-500 text-white' : 'bg-white text-amber-900'}`}
          >
            <Store className="h-5 w-5" />
            <span className="font-medium">Merchant Tiers</span>
          </motion.button>
        </div>
      </div>

      {/* Current Tier Summary */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-medium text-amber-600 mb-2">Current Tier</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-900">
                {currentTiers[activeSection].name}
              </p>
              <p className="text-sm text-amber-600">
                Max: ₦{currentTiers[activeSection].maxAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-600">Next: {currentTiers[activeSection].nextTier}</p>
              <p className="text-xs text-amber-500">
                {currentTiers[activeSection].progress}% Complete
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Tier List */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-2">
          {tierData[activeSection].map((tier, index) => (
            <TierProgress 
              key={tier.name} 
              tier={tier} 
              index={index}
              total={tierData[activeSection].length}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TierPage;
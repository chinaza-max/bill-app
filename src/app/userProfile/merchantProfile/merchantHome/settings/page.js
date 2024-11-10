'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  MapPin,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Wallet,
  ExternalLink,
  CreditCard,
  Copy
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SettingsPage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('');
  const [currentTier, setCurrentTier] = useState('tier1');
  const [deliveryDistance, setDeliveryDistance] = useState(10);
  const [hasWithdrawalAccount, setHasWithdrawalAccount] = useState(true);
  const [accountDetails] = useState({
    bankName: 'First Bank',
    accountNumber: '1234567890',
    accountName: 'John Doe'
  });



  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };



  const tiers = {
    tier1: {
      name: 'Tier 1 Merchant',
      ranges: [
        { min: 1000, max: 5000, charge: 200 },
        { min: 5001, max: 10000, charge: 300 },
      ],
      requirements: [
        { text: 'Valid ID Verification', met: true },
        { text: 'Phone Number Verification', met: true },
        { text: 'Minimum 10 Successful Transactions', met: false },
        { text: 'Maximum Transaction: ₦10,000', met: true }
      ],
      color: 'amber'
    },
    tier2: {
      name: 'Tier 2 Merchant',
      ranges: [
        { min: 1000, max: 10000, charge: 200 },
        { min: 10001, max: 50000, charge: 300 },
        { min: 50001, max: 100000, charge: 400 }
      ],
      requirements: [
        { text: 'All Tier 1 Requirements', met: false },
        { text: 'Business Registration', met: false },
        { text: 'Minimum 50 Successful Transactions', met: false },
        { text: '95% Positive Ratings', met: false },
        { text: 'Maximum Transaction: ₦100,000', met: false }
      ],
      color: 'purple'
    }
  };

  const handleGoBack = () => {
    router.push('/userProfile/merchantProfile/merchantHome');
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const handleSetupWithdrawalAccount = () => {
    router.push('/userProfile/merchantProfile/merchantHome/settings//settingUpAccount');
  };

  const handleNavigateToWithdrawal = () => {
    router.push('/userProfile/merchantProfile/merchantHome/settings/Withdrawal');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-6">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={handleGoBack} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Merchant Settings</h1>
        </div>
      </div>

      {/* Current Tier Status */}
      <div className="p-4 mt-11">
        <Alert className="bg-amber-50 border-amber-200">
          <Shield className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You are currently a {tiers[currentTier].name}
          </AlertDescription>
        </Alert>
      </div>

      {/* Tier Sections */}
      {Object.entries(tiers).map(([tierId, tierData]) => (
        <div key={tierId} className="px-4 mb-4">
          <div className={`bg-white rounded-lg shadow-sm border border-${tierData.color}-100 overflow-hidden`}>
            <motion.button
              onClick={() => toggleSection(tierId)}
              className="w-full flex items-center justify-between p-4"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <Shield className={`h-6 w-6 text-${tierData.color}-500`} />
                <div>
                  <h3 className={`font-semibold text-${tierData.color}-900`}>
                    {tierData.name}
                  </h3>
                  <span className={`text-sm text-${tierData.color}-600`}>
                    Max Transaction: ₦{tierData.ranges[tierData.ranges.length - 1].max.toLocaleString()}
                  </span>
                </div>
              </div>
              {activeSection === tierId ? (
                <ChevronUp className={`h-5 w-5 text-${tierData.color}-500`} />
              ) : (
                <ChevronDown className={`h-5 w-5 text-${tierData.color}-500`} />
              )}
            </motion.button>

            <AnimatePresence>
              {activeSection === tierId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100"
                >
                  {/* Transaction Ranges */}
                  <div className="p-4 space-y-3">
                    <h4 className="font-medium text-gray-700 mb-2">Transaction Ranges</h4>
                    {tierData.ranges.map((range, index) => (
                      <div key={index} className={`flex items-center justify-between bg-${tierData.color}-50 px-3 py-2 rounded-lg`}>
                        <span className={`font-medium text-${tierData.color}-900`}>
                          ₦{range.min.toLocaleString()} - ₦{range.max.toLocaleString()}
                        </span>
                        <span className={`text-${tierData.color}-700`}>
                          {range.charge} ₦ Charge
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Requirements */}
                  <div className="p-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-700 mb-2">Requirements</h4>
                    <div className="space-y-2">
                      {tierData.requirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {req.met ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <span className={`text-sm ${req.met ? 'text-gray-700' : 'text-gray-500'}`}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentTier !== tierId && (
                    <div className="p-4 border-t border-gray-100">
                      <button 
                        className={`w-full py-2 px-4 rounded-lg bg-${tierData.color}-500 text-white font-medium hover:bg-${tierData.color}-600 transition-colors`}
                        onClick={() => alert('Starting upgrade process...')}
                      >
                        Upgrade to {tierData.name}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {/* Delivery Distance Section */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-gray-900">Delivery Range</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={deliveryDistance}
              onChange={(e) => setDeliveryDistance(parseFloat(e.target.value))}
              className="flex-1 px-3 py-2 border rounded-lg"
              min="1"
              max="50"
            />
            <span className="text-amber-600">km</span>
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            Maximum distance you are willing to travel for cash delivery
          </p>
        </div>
      </div>

         {/* Withdrawal Account Section */}
         <div className="px-4 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-gray-900">Withdrawal Account</span>
              </div>
            </div>

            {!hasWithdrawalAccount ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Set up your withdrawal account to receive payments
                </p>
                <button
                  onClick={handleSetupWithdrawalAccount}
                  className="w-full py-2 px-4 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Set Up Withdrawal Account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Account Details */}
                <div className="space-y-3 bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-900">Bank Name</span>
                    <span className="font-medium text-amber-900">{accountDetails.bankName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-900">Account Number</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-amber-900">{accountDetails.accountNumber}</span>
                    
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-900">Account Name</span>
                    <span className="font-medium text-amber-900">{accountDetails.accountName}</span>
                  </div>
                </div>

                {/* Status and Navigation */}
                <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-green-900">Account Connected</span>
                  </div>
                </div>

                <button
                  onClick={handleSetupWithdrawalAccount}
                  className="w-full py-2 px-4 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Change Withdrawal Account</span>
                </button>

                <button
                  onClick={handleNavigateToWithdrawal}
                  className="w-full py-2 px-4 rounded-lg bg-amber-100 text-amber-700 font-medium hover:bg-amber-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Wallet className="h-5 w-5" />
                  <span>Go to Withdrawals</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default SettingsPage;






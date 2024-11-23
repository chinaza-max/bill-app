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
  Copy,
  Store,
  ShoppingBag
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SettingsPage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('');
  const [currentTier, setCurrentTier] = useState('tier1');
  const [deliveryDistance, setDeliveryDistance] = useState(10);
  const [isAvailable, setIsAvailable] = useState(true);
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

  const handleViewAds = () => {
    router.push('/userProfile/merchantProfile/merchantHome/viewAds');
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

      {/* View Ads Button Section */}
      <div className="px-4 mt-16 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-semibold text-gray-900">My Advertisements</h3>
                <p className="text-sm text-gray-600">View and manage your product listings</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleViewAds}
            className="w-full py-2 px-4 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
          >
            <span>View My Ads</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Availability Toggle Section */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className={`h-5 w-5 ${isAvailable ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-semibold text-gray-900">Merchant Availability</h3>
                <p className="text-sm text-gray-600">
                  {isAvailable ? 'You are currently accepting orders' : 'You are not accepting orders'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none"
              style={{
                backgroundColor: isAvailable ? '#10B981' : '#D1D5DB'
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  isAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className={`mt-2 text-sm ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
            {isAvailable
              ? 'Customers can currently place orders with you'
              : 'Customers cannot place orders with you while you are unavailable'}
          </div>
        </div>
      </div>

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
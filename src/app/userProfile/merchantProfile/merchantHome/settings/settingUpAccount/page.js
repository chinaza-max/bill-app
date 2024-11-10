
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  CreditCard,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccountSettingsPage = () => {
  const router = useRouter();
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [showBankList, setShowBankList] = useState(false);

  // Sample bank list
  const banks = [
    { id: '1', name: 'Access Bank', code: '044' },
    { id: '2', name: 'First Bank', code: '011' },
    { id: '3', name: 'GT Bank', code: '058' },
    { id: '4', name: 'UBA', code: '033' },
    { id: '5', name: 'Zenith Bank', code: '057' },
  ];

  // Filter banks based on search query
  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  // Simulate account verification
  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;

    setIsVerifying(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Sample verification response
    const mockResponse = {
      accountName: 'John Doe',
      accountNumber: accountNumber,
      bankCode: selectedBank.code,
      bankName: selectedBank.name
    };
    
    setVerifiedAccount(mockResponse);
    setIsVerifying(false);
  };

  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setAccountNumber(value);
      if (value.length === 10 && selectedBank) {
        verifyAccount();
      }
    }
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setShowBankList(false);
    if (accountNumber.length === 10) {
      verifyAccount();
    }
  };

  const handleSaveAccount = () => {
    if (verifiedAccount) {
      setShowSuccessModal(true);
      // Here you would typically make an API call to save the account
    }
  };

  const SuccessModal = () => (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-lg w-full max-w-md p-6"
          >
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Saved Successfully</h3>
              <p className="text-gray-600 mb-6">Your bank account has been verified and saved successfully.</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/settings');
                }}
                className="w-full py-3 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Bank Account Settings</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-16 pb-20 px-4">
        <div className="space-y-6 mt-4">
          {/* Bank Selection */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="text-sm text-gray-600 block mb-2">Select Bank</label>
            <div className="relative">
              <button
                onClick={() => setShowBankList(!showBankList)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between hover:border-green-500 focus:outline-none focus:border-green-500"
              >
                <span className={selectedBank ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedBank ? selectedBank.name : 'Select your bank'}
                </span>
                <CreditCard className="h-5 w-5 text-green-500" />
              </button>

              <AnimatePresence>
                {showBankList && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200"
                  >
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search banks..."
                          value={bankSearchQuery}
                          onChange={(e) => setBankSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-auto">
                      {filteredBanks.map((bank) => (
                        <button
                          key={bank.id}
                          onClick={() => handleBankSelect(bank)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span className="text-gray-900">{bank.name}</span>
                          {selectedBank?.id === bank.id && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Account Number Input */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label className="text-sm text-gray-600 block mb-2">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="Enter 10-digit account number"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
              maxLength={10}
            />
          </div>

          {/* Verification Status */}
          {isVerifying && (
            <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
              <span className="text-gray-600">Verifying account...</span>
            </div>
          )}

          {/* Verified Account Details */}
          {verifiedAccount && !isVerifying && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Verified Account</h3>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Account Name</div>
                  <div className="font-medium text-gray-900">{verifiedAccount.accountName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Account Number</div>
                  <div className="font-medium text-gray-900">{verifiedAccount.accountNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Bank</div>
                  <div className="font-medium text-gray-900">{verifiedAccount.bankName}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          {verifiedAccount && !isVerifying && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAccount}
              className="w-full py-3 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
            >
              Save Account
            </motion.button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal />
    </div>
  );
};

export default AccountSettingsPage;
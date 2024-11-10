'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wallet,
  CreditCard,   
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WithdrawalPage = () => {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState('withdraw');

  // Sample wallet data
  const walletData = {
    availableBalance: 150000,
    pendingBalance: 25000,
    accountDetails: {
      bankName: 'First Bank',
      accountNumber: '1234567890',
      accountName: 'John Doe'
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
  };

  const handleSubmit = () => {
    if (parseFloat(amount) >= 5000 && parseFloat(amount) <= walletData.availableBalance) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmWithdrawal = () => {
    // Handle withdrawal logic here
    setShowConfirmModal(false);
    setAmount('');
    // You can add success notification here
  };

  const ConfirmationModal = () => (
    <AnimatePresence>
      {showConfirmModal && (
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-amber-900">Confirm Withdrawal</h3>
              <button onClick={() => setShowConfirmModal(false)}>
                <X className="h-6 w-6 text-amber-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-sm text-amber-600 mb-1">Amount to withdraw</div>
                <div className="text-xl font-semibold text-amber-900">
                  ₦{parseFloat(amount).toLocaleString()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-amber-600">Destination Account</div>
                <div className="text-amber-900">
                  <div className="font-medium">{walletData.accountDetails.bankName}</div>
                  <div>{walletData.accountDetails.accountNumber}</div>
                  <div>{walletData.accountDetails.accountName}</div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 px-4 border border-amber-500 text-amber-500 rounded-lg font-medium hover:bg-amber-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmWithdrawal}
                  className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                >
                  Confirm
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Withdraw Funds</h1>
        </div>
      </div>

      {/* Main Content - with padding-top to account for fixed header */}
      <div className="flex-1 overflow-auto pt-16 pb-20 px-4">
        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-amber-600">Available Balance</span>
            </div>
            <div className="text-xl font-semibold text-amber-900">
              ₦{walletData.availableBalance.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-amber-600">Pending Balance</span>
            </div>
            <div className="text-xl font-semibold text-amber-900">
              ₦{walletData.pendingBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-amber-900">Account Details</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-amber-600">Bank Name</div>
              <div className="font-medium text-amber-900">{walletData.accountDetails.bankName}</div>
            </div>
            <div>
              <div className="text-sm text-amber-600">Account Number</div>
              <div className="font-medium text-amber-900">{walletData.accountDetails.accountNumber}</div>
            </div>
            <div>
              <div className="text-sm text-amber-600">Account Name</div>
              <div className="font-medium text-amber-900">{walletData.accountDetails.accountName}</div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">Withdrawal Amount</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-amber-600 block mb-2">
                Enter amount (Minimum: ₦5,000)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-900">₦</span>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-8 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={parseFloat(amount) < 5000 || parseFloat(amount) > walletData.availableBalance}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                parseFloat(amount) >= 5000 && parseFloat(amount) <= walletData.availableBalance
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-amber-200 text-amber-500 cursor-not-allowed'
              }`}
            >
              Withdraw Funds
            </motion.button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal />
    </div>
  );
};

export default WithdrawalPage;
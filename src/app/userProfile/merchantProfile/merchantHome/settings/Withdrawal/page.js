    'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wallet,
  Clock,
  Bank,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WithdrawalPage = () => {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState('withdrawal');

  // Sample wallet data
  const walletData = {
    availableBalance: 150000,
    pendingBalance: 25000,
    bankDetails: {
      bankName: 'First Bank',
      accountNumber: '1234567890',
      accountName: 'John Doe'
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };

  const handleWithdrawalSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(amount) >= 5000 && parseFloat(amount) <= walletData.availableBalance) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmWithdrawal = () => {
    // Handle withdrawal confirmation logic here
    setShowConfirmModal(false);
    // You could show a success message or redirect
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => handleTabChange('home')} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Withdrawal</h1>
        </div>
      </div>

      {/* Main Content - with padding-top to account for fixed header */}
      <div className="flex-1 overflow-auto pt-16 pb-20 px-4">
        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <Wallet className="h-5 w-5" />
              <span className="text-sm">Available Balance</span>
            </div>
            <div className="text-lg font-semibold text-amber-900">
              {formatCurrency(walletData.availableBalance)}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Pending Balance</span>
            </div>
            <div className="text-lg font-semibold text-amber-900">
              {formatCurrency(walletData.pendingBalance)}
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex items-center space-x-2 text-amber-900 mb-4">
            <Bank className="h-5 w-5" />
            <h2 className="font-semibold">Bank Account Details</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-amber-600">Bank Name</div>
              <div className="font-medium text-amber-900">{walletData.bankDetails.bankName}</div>
            </div>
            <div>
              <div className="text-sm text-amber-600">Account Number</div>
              <div className="font-medium text-amber-900">{walletData.bankDetails.accountNumber}</div>
            </div>
            <div>
              <div className="text-sm text-amber-600">Account Name</div>
              <div className="font-medium text-amber-900">{walletData.bankDetails.accountName}</div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleWithdrawalSubmit} className="bg-white rounded-lg p-4 shadow-sm">
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm text-amber-600 mb-2">
              Withdrawal Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
              placeholder="Enter amount (minimum ₦5,000)"
              min="5000"
              max={walletData.availableBalance}
            />
            <div className="text-xs text-amber-600 mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Minimum withdrawal amount is ₦5,000
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-amber-500 text-white rounded-lg py-3 px-4 font-medium hover:bg-amber-600 transition-colors"
            disabled={parseFloat(amount) < 5000 || parseFloat(amount) > walletData.availableBalance}
          >
            Withdraw Funds
          </motion.button>
        </form>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-amber-900">Confirm Withdrawal</h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-amber-500 hover:text-amber-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="text-sm text-amber-600">Amount to Withdraw</div>
                  <div className="text-xl font-semibold text-amber-900">
                    {formatCurrency(parseFloat(amount))}
                  </div>
                </div>

                <div className="text-sm text-amber-600">
                  Are you sure you want to withdraw this amount to your bank account?
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-amber-500 text-amber-500 rounded-lg hover:bg-amber-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmWithdrawal}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center space-x-2"
                >
                  <Check className="h-5 w-5" />
                  <span>Confirm</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-200">
        <div className="flex justify-around py-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'home' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <Wallet className="h-6 w-6" />
            <span className="text-xs mt-1">Wallet</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabChange('withdrawal')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'withdrawal' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <Bank className="h-6 w-6" />
            <span className="text-xs mt-1">Withdraw</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;
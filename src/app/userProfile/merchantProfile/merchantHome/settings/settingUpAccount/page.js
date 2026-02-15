'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccountSettingsPage = () => {
  const router = useRouter();

  // Bank list state
  const [banks, setBanks] = useState([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [bankError, setBankError] = useState(null);

  // Form state
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [showBankList, setShowBankList] = useState(false);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ─── Fetch banks on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    setIsFetchingBanks(true);
    setBankError(null);
    try {
      const accessToken =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

      const queryParams = new URLSearchParams({
        token: accessToken,
        apiType: 'banks',
      }).toString();

      const response = await fetch(`/api/user?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error fetching banks: ${response.status}`);
      }

      const result = await response.json();
      // Normalise – handle both top-level array and nested data.data array
      const list =
        Array.isArray(result) ? result :
        Array.isArray(result?.data) ? result.data :
        Array.isArray(result?.data?.data) ? result.data.data : [];

      setBanks(list);
    } catch (error) {
      console.error('Bank fetch error:', error);
      setBankError('Failed to load banks. Please try again.');
    } finally {
      setIsFetchingBanks(false);
    }
  };

  // ─── Filtered banks ───────────────────────────────────────────────────────
  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    (bank.alias || []).some((a) => a.toLowerCase().includes(bankSearchQuery.toLowerCase()))
  );

  // ─── Account verification (mock – swap for real API) ──────────────────────
  const verifyAccount = async (bankToUse = selectedBank, accNum = accountNumber) => {
    if (!bankToUse || accNum.length !== 10) return;

    setIsVerifying(true);
    setVerifiedAccount(null);

    try {
      // Replace this block with a real name-enquiry API call when available
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setVerifiedAccount({
        accountName: 'Account Holder Name',
        accountNumber: accNum,
        bankCode: bankToUse.bankCode,
        bankName: bankToUse.name,
      });
    } catch {
      setVerifiedAccount(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setAccountNumber(value);
      setVerifiedAccount(null);
      if (value.length === 10 && selectedBank) {
        verifyAccount(selectedBank, value);
      }
    }
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setShowBankList(false);
    setBankSearchQuery('');
    setVerifiedAccount(null);
    if (accountNumber.length === 10) {
      verifyAccount(bank, accountNumber);
    }
  };

  // ─── Save (POST setWithdrawalBank) ────────────────────────────────────────
  const handleSaveAccount = async () => {
    if (!verifiedAccount) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const accessToken =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';

      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          apiType: 'setWithdrawalBank',
          settlementAccount: verifiedAccount.accountNumber,
          bankCode: verifiedAccount.bankCode,
          bankName: verifiedAccount.bankName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error saving account: ${response.status}`);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Save error:', error);
      setSaveError(error.message || 'Failed to save account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Success Modal ────────────────────────────────────────────────────────
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Account Saved Successfully
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Your bank account has been verified and saved as your withdrawal account.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/settings');
                }}
                className="w-full py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Bank Account Settings</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-16 pb-24 px-4">
        <div className="space-y-4 mt-4">

          {/* ── Bank Selection ── */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-medium text-gray-600 block mb-2">
              Select Bank
            </label>

            {/* Trigger button */}
            <button
              onClick={() => !isFetchingBanks && setShowBankList(!showBankList)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between hover:border-amber-400 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {isFetchingBanks ? (
                <span className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading banks…
                </span>
              ) : (
                <span className={selectedBank ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {selectedBank ? selectedBank.name : 'Select your bank'}
                </span>
              )}
              <ChevronDown
                className={`h-5 w-5 text-gray-400 transition-transform ${showBankList ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Bank error */}
            {bankError && (
              <div className="mt-2 flex items-center justify-between text-sm text-red-500">
                <span>{bankError}</span>
                <button onClick={fetchBanks} className="underline font-medium">
                  Retry
                </button>
              </div>
            )}

            {/* Dropdown */}
            <AnimatePresence>
              {showBankList && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="relative z-30 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                >
                  {/* Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search banks…"
                        value={bankSearchQuery}
                        onChange={(e) => setBankSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-64 overflow-auto">
                    {filteredBanks.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        No banks found
                      </div>
                    ) : (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank.bankCode}
                          onClick={() => handleBankSelect(bank)}
                          className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-900">{bank.name}</span>
                          </div>
                          {selectedBank?.bankCode === bank.bankCode && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Account Number ── */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-medium text-gray-600 block mb-2">
              Account Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="Enter 10-digit account number"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-gray-900 tracking-widest font-mono"
              maxLength={10}
            />
            {accountNumber.length > 0 && accountNumber.length < 10 && (
              <p className="text-xs text-gray-400 mt-1.5">
                {10 - accountNumber.length} digits remaining
              </p>
            )}
          </div>

          {/* ── Verifying ── */}
          <AnimatePresence>
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
              >
                <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
                <span className="text-sm text-gray-600">Verifying account details…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Verified Account Card ── */}
          <AnimatePresence>
            {verifiedAccount && !isVerifying && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Verified Account</h3>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Account Name</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verifiedAccount.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Account Number</span>
                    <span className="text-sm font-mono font-medium text-gray-900">
                      {verifiedAccount.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Bank</span>
                    <span className="text-sm font-medium text-gray-900">
                      {verifiedAccount.bankName}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Save Error ── */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600"
              >
                {saveError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fixed Save Button ── */}
      <AnimatePresence>
        {verifiedAccount && !isVerifying && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAccount}
              disabled={isSaving}
              className="w-full py-3.5 px-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Account'
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Modal ── */}
      <SuccessModal />
    </div>
  );
};

export default AccountSettingsPage;
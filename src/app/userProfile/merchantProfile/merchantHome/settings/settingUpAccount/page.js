'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Loader2,
  Building2,
  Sparkles,
  BadgeCheck,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Confetti ─────────────────────────────────────────────────────────────────
const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa'];

const Particle = ({ x, color, delay }) => (
  <motion.div
    className="absolute top-0 rounded-full"
    style={{ left: `${x}%`, width: 8, height: 8, background: color }}
    initial={{ y: -10, opacity: 1, scale: 1 }}
    animate={{
      y: ['0%', '110vh'],
      x: [`${x}%`, `${x + (Math.random() * 40 - 20)}%`],
      rotate: [0, Math.random() * 720 - 360],
      opacity: [1, 1, 0],
      scale: [1, 0.6],
    }}
    transition={{ duration: 2.4 + Math.random(), delay, ease: 'easeIn' }}
  />
);

const ConfettiBurst = () => {
  const particles = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.6,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} color={p.color} delay={p.delay} />
      ))}
    </div>
  );
};

// ─── Success Modal ────────────────────────────────────────────────────────────
const SuccessModal = ({ onDone }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center relative overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-200 rounded-full opacity-40 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-200 rounded-full opacity-40 blur-3xl" />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
        className="mx-auto mb-5 w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-300"
      >
        <BadgeCheck className="w-12 h-12 text-white" strokeWidth={1.8} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-semibold text-yellow-500 uppercase tracking-widest">All Set!</span>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Connected!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Your withdrawal account has been verified and linked successfully. You can now receive payouts directly to this account.
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-base shadow-md shadow-green-200 hover:shadow-green-300 transition-shadow"
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  </motion.div>
);

// ─── Bank Bottom Sheet ────────────────────────────────────────────────────────
const BankBottomSheet = ({ banks, isOpen, onClose, onSelect, selectedBank, isFetchingBanks, bankError, onRetry }) => {
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const filtered = banks.filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      (b.alias || []).some((a) => a.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pt-3 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-gray-900">Select Your Bank</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {banks.length > 0 ? `${filtered.length} banks available` : 'Loading banks…'}
              </p>
            </div>

            <div className="px-4 pb-3 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search banks…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-8">
              {isFetchingBanks ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                  <span className="text-sm text-gray-400">Loading banks…</span>
                </div>
              ) : bankError ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                  <span className="text-sm text-red-500">{bankError}</span>
                  <button onClick={onRetry} className="text-amber-600 font-semibold text-sm underline">
                    Tap to retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Building2 className="h-8 w-8 text-gray-300" />
                  <span className="text-sm text-gray-400">No banks found</span>
                </div>
              ) : (
                filtered.map((bank, i) => {
                  const isSelected = selectedBank?.bankCode?.trim() === bank.bankCode?.trim();
                  const hue = bank.name.charCodeAt(0) * 15 % 360;
                  return (
                    <motion.button
                      key={`${bank.bankCode?.trim()}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.015, duration: 0.2 }}
                      onClick={() => onSelect(bank)}
                      className={`w-full px-3 py-3 rounded-2xl flex items-center gap-3 transition-colors mb-0.5 ${
                        isSelected ? 'bg-green-50 border border-green-100' : 'hover:bg-amber-50'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                            : `hsl(${hue}, 70%, 92%)`,
                          color: isSelected ? '#059669' : `hsl(${hue}, 60%, 40%)`,
                        }}
                      >
                        {bank.name
                          .split(' ')
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')}
                      </div>

                      <span className={`flex-1 text-left text-sm font-medium ${isSelected ? 'text-green-800' : 'text-gray-800'}`}>
                        {bank.name}
                      </span>

                      {isSelected && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Digit progress track ─────────────────────────────────────────────────────
const DigitTrack = ({ count }) => (
  <div className="flex gap-1 mt-2.5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className={`h-0.5 flex-1 rounded-full transition-all duration-200 ${
          i < count ? (count === 10 ? 'bg-green-500' : 'bg-amber-400') : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);

  const [banks, setBanks] = useState([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [bankError, setBankError] = useState(null);

  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [showBankSheet, setShowBankSheet] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const verifyTimer = useRef(null);

  // ─── Fetch banks ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (accessToken) fetchBanks();
  }, [accessToken]);

  const fetchBanks = async () => {
    setIsFetchingBanks(true);
    setBankError(null);
    try {
      const qs = new URLSearchParams({ token: accessToken, apiType: 'banks' }).toString();
      const res = await fetch(`/api/user?${qs}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      const raw =
        Array.isArray(result?.data?.data?.data) ? result.data.data.data :
        Array.isArray(result?.data?.data) ? result.data.data :
        Array.isArray(result?.data) ? result.data :
        Array.isArray(result) ? result : [];

      const seen = new Set();
      const deduped = raw.filter((b) => {
        const key = b.bankCode?.trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => a.name.localeCompare(b.name));
      setBanks(deduped);
    } catch (err) {
      console.error('Bank fetch error:', err);
      setBankError('Failed to load banks. Tap to retry.');
    } finally {
      setIsFetchingBanks(false);
    }
  };

  // ─── Name enquiry ─────────────────────────────────────────────────────────
  const verifyAccount = useCallback(async (bank, accNum) => {
    if (!bank || !accNum || accNum.length !== 10) return;
    setIsVerifying(true);
    setVerifiedAccount(null);
    setVerifyError(null);

    try {
      const qs = new URLSearchParams({
        token: accessToken,
        apiType: 'nameEnquiry',
        bankCode: bank.bankCode?.trim(),
        accountNumber: accNum,
      }).toString();

      const res = await fetch(`/api/user?${qs}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Verification failed (${res.status})`);
      }

      const result = await res.json();

      // ── Parse name enquiry response ──
      // Supports nested shapes: result.data.data.data, result.data.data, result.data, result
      const data =
        result?.data?.data?.data ??
        result?.data?.data ??
        result?.data ??
        result;

      // Extract accountName from the response — handles both camelCase and snake_case keys
      const accountName =
        data?.accountName ||
        data?.account_name ||
        data?.name ||
        null;

      if (!accountName) throw new Error('Could not retrieve account name.');

      // Store the full verified account — accountName is sent to setWithdrawalBank later
      setVerifiedAccount({
        accountName,
        accountNumber: data?.accountNumber || data?.account_number || accNum,
        bankCode: bank.bankCode?.trim(),
        bankName: bank.name,
      });
    } catch (err) {
      console.error('Name enquiry error:', err);
      setVerifyError(err.message || 'Could not verify account. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [accessToken]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(value);
    setVerifiedAccount(null);
    setVerifyError(null);
    clearTimeout(verifyTimer.current);

    if (value.length === 10) {
      if (selectedBank) {
        verifyTimer.current = setTimeout(() => verifyAccount(selectedBank, value), 600);
      } else {
        setShowBankSheet(true);
      }
    }
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setShowBankSheet(false);
    setVerifiedAccount(null);
    setVerifyError(null);

    if (accountNumber.length === 10) {
      verifyAccount(bank, accountNumber);
    }
  };

  // ─── Save — includes accountName from name enquiry response ───────────────
  const handleSaveAccount = async () => {
    if (!verifiedAccount) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          apiType: 'setWithdrawalBank',
          settlementAccount: verifiedAccount.accountNumber,
          bankCode: verifiedAccount.bankCode,
          bankName: verifiedAccount.bankName,
          accountName: verifiedAccount.accountName, // ← from name enquiry
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Save failed (${res.status})`);
      }

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2600);
      setShowSuccess(true);
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(err.message || 'Failed to save account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50">

      <AnimatePresence>{showConfetti && <ConfettiBurst />}</AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <SuccessModal onDone={() => { setShowSuccess(false); router.push('/userProfile/withdraw'); }} />
        )}
      </AnimatePresence>

      <BankBottomSheet  
        banks={banks}
        isOpen={showBankSheet}
        onClose={() => setShowBankSheet(false)}
        onSelect={handleBankSelect}
        selectedBank={selectedBank}
        isFetchingBanks={isFetchingBanks}
        bankError={bankError}
        onRetry={fetchBanks}
      />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Bank Account Settings</h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto pt-16 pb-32 px-4">
        <div className="space-y-4 mt-4">

          {!accessToken && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              Session not found. Please log in again.
            </div>
          )}

          {/* Account number */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Account Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="Enter 10-digit account number"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors text-gray-900 tracking-widest font-mono text-xl ${
                accountNumber.length === 10
                  ? 'border-green-400 bg-green-50'
                  : accountNumber.length > 0
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200'
              }`}
              maxLength={10}
            />
            <DigitTrack count={accountNumber.length} />
            {accountNumber.length > 0 && accountNumber.length < 10 && (
              <p className="text-xs text-gray-400 mt-2">
                {10 - accountNumber.length} more digit{10 - accountNumber.length !== 1 ? 's' : ''} needed
              </p>
            )}
            {accountNumber.length === 10 && !selectedBank && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                ↓ Select your bank below to continue
              </p>
            )}
          </div>

          {/* Selected bank pill */}
          <AnimatePresence>
            {selectedBank && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Selected Bank
                </label>
                <button
                  onClick={() => setShowBankSheet(true)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-green-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{selectedBank.name}</span>
                  </div>
                  <span className="text-xs text-amber-600 font-semibold">Change</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verifying spinner */}
          <AnimatePresence>
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border-l-4 border-amber-400"
              >
                <Loader2 className="h-5 w-5 text-amber-500 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Looking up account name…</p>
                  <p className="text-xs text-gray-400 mt-0.5">This takes just a moment</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify error */}
          <AnimatePresence>
            {verifyError && !isVerifying && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2"
              >
                <X className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-600">Verification Failed</p>
                  <p className="text-xs text-red-400 mt-0.5">{verifyError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verified account card */}
          <AnimatePresence>
            {verifiedAccount && !isVerifying && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Account Verified</h3>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Account Name', value: verifiedAccount.accountName },
                    { label: 'Account Number', value: verifiedAccount.accountNumber, mono: true },
                    { label: 'Bank', value: verifiedAccount.bankName },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex justify-between items-center py-0.5">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono tracking-widest' : ''}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save error */}
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

      {/* Confirm bar */}
      <AnimatePresence>
        {verifiedAccount && !isVerifying && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100 shadow-2xl"
          >
            <p className="text-xs text-center text-gray-400 mb-3">
              Confirm that{' '}
              <span className="font-semibold text-gray-700">{verifiedAccount.accountName}</span>{' '}
              is the correct account holder
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveAccount}
              disabled={isSaving}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md shadow-green-200 hover:shadow-green-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm &amp; Save Account
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AccountSettingsPage;
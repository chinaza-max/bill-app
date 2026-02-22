'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Building2,
  Sparkles,
  BadgeCheck,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Confetti particle ────────────────────────────────────────────────────────
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

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa'];

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

// ─── Success modal ────────────────────────────────────────────────────────────
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
      {/* green glow blob */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-200 rounded-full opacity-40 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-200 rounded-full opacity-40 blur-3xl" />

      {/* icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
        className="mx-auto mb-5 w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-300"
      >
        <BadgeCheck className="w-12 h-12 text-white" strokeWidth={1.8} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-1 mb-1">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-semibold text-yellow-500 uppercase tracking-widest">
            All Set!
          </span>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Connected!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Your withdrawal account has been verified and linked successfully. You can now receive
          payouts directly to this account.
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

// ─── Main component ───────────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);

  // Banks
  const [banks, setBanks] = useState([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [bankError, setBankError] = useState(null);

  // Form
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [showBankList, setShowBankList] = useState(false);

  // Name enquiry
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // Save
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Success / confetti
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Debounce ref
  const verifyTimer = useRef(null);

  // ─── Fetch banks ────────────────────────────────────────────────────────────
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
        Array.isArray(result?.data?.data)        ? result.data.data :
        Array.isArray(result?.data)              ? result.data :
        Array.isArray(result)                    ? result : [];

      // Deduplicate by bankCode
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

  // ─── Name enquiry (GET) ─────────────────────────────────────────────────────
  const verifyAccount = async (bank, accNum) => {
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

      // Normalise — adjust path if your API wraps differently
      const data =
        result?.data?.data?.data ??
        result?.data?.data ??
        result?.data ??
        result;

      const accountName =
        data?.accountName ||
        data?.name ||
        data?.account_name ||
        null;

      if (!accountName) throw new Error('Could not retrieve account name.');

      setVerifiedAccount({
        accountName,
        accountNumber: accNum,
        bankCode: bank.bankCode?.trim(),
        bankName: bank.name,
      });
    } catch (err) {
      console.error('Name enquiry error:', err);
      setVerifyError(err.message || 'Could not verify account. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(value);
    setVerifiedAccount(null);
    setVerifyError(null);

    // Debounce verification: fire after user stops typing for 600 ms
    clearTimeout(verifyTimer.current);
    if (value.length === 10 && selectedBank) {
      verifyTimer.current = setTimeout(() => verifyAccount(selectedBank, value), 600);
    }
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setShowBankList(false);
    setBankSearchQuery('');
    setVerifiedAccount(null);
    setVerifyError(null);
    if (accountNumber.length === 10) {
      verifyAccount(bank, accountNumber);
    }
  };

  // ─── Save — POST setWithdrawalBank ──────────────────────────────────────────
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
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `Save failed (${res.status})`);
      }

      // 🎉 Trigger confetti then show modal
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

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    (bank.alias || []).some((a) => a.toLowerCase().includes(bankSearchQuery.toLowerCase()))
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Confetti */}
      <AnimatePresence>{showConfetti && <ConfettiBurst />}</AnimatePresence>

      {/* Success modal */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessModal
            onDone={() => {
              setShowSuccess(false);
              router.push('/settings');
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Bank Account Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pt-16 pb-32 px-4">
        <div className="space-y-4 mt-4">

          {!accessToken && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              Session not found. Please log in again.
            </div>
          )}

          {/* ── Bank selector ── */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-medium text-gray-600 block mb-2">Select Bank</label>

            <button
              onClick={() => !isFetchingBanks && setShowBankList(!showBankList)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between hover:border-amber-400 focus:outline-none transition-colors"
            >
              {isFetchingBanks ? (
                <span className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading banks…
                </span>
              ) : (
                <span className={selectedBank ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {selectedBank ? selectedBank.name : 'Select your bank'}
                </span>
              )}
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showBankList ? 'rotate-180' : ''}`} />
            </button>

            {bankError && (
              <div className="mt-2 flex items-center justify-between text-sm text-red-500">
                <span>{bankError}</span>
                <button onClick={fetchBanks} className="underline font-medium">Retry</button>
              </div>
            )}

            <AnimatePresence>
              {showBankList && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="relative z-30 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search banks…"
                        value={bankSearchQuery}
                        onChange={(e) => setBankSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {filteredBanks.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">No banks found</div>
                    ) : (
                      filteredBanks.map((bank, i) => (
                        <button
                          key={`${bank.bankCode?.trim()}-${i}`}
                          onClick={() => handleBankSelect(bank)}
                          className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-900">{bank.name}</span>
                          </div>
                          {selectedBank?.bankCode?.trim() === bank.bankCode?.trim() && (
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

          {/* ── Account number ── */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-medium text-gray-600 block mb-2">Account Number</label>
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

          {/* ── Verifying spinner ── */}
          <AnimatePresence>
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
              >
                <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
                <span className="text-sm text-gray-600">Looking up account name…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Verify error ── */}
          <AnimatePresence>
            {verifyError && !isVerifying && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 text-sm text-red-600"
              >
                <X className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Verified account card ── */}
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
                    <div key={label} className="flex justify-between items-center">
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

          {/* ── Save error ── */}
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

      {/* ── Fixed confirm button ── */}
      <AnimatePresence>
        {verifiedAccount && !isVerifying && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100"
          >
            <p className="text-xs text-center text-gray-400 mb-3">
              Confirm that <span className="font-semibold text-gray-700">{verifiedAccount.accountName}</span> is the correct account holder
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
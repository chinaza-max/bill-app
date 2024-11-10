'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, ChevronRight, Building2, Wallet, Eye, Copy } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';

const TransferPage = () => {
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState('start');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const contentRef = useRef(null);
  const sliderControls = useAnimation();
  const SLIDER_THRESHOLD = 0.5;
  const SLIDER_WIDTH = 300;
  const router = useRouter();

  const range = {
    min: 1000,
    max: 5000
  };

  const merchant = 'Acme Inc.';

  const calculateCharge = (value) => {
    const numValue = parseFloat(value) || 0;
    return numValue * 0.02;
  };

  const isValidAmount = (value) => {
    const numValue = parseFloat(value);
    return numValue >= range.min && numValue <= range.max;
  };

  const handleTabChange = (tab) => {
    router.push(`/${tab}`);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };

  const handleViewOrder = () => {
    // Add your view order logic here
    router.push('/orders/order');
  };

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText('0123456789');
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy account number:', err);
    }
  };

  useEffect(() => {
    if (transferType && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [transferType]);

  const handleSliderDrag = (_, info) => {
    setIsDragging(true);
    sliderControls.set({ x: info.offset.x });
  };

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    const progress = info.offset.x / SLIDER_WIDTH;
    
    if (progress >= SLIDER_THRESHOLD) {
      sliderControls.start({
        x: SLIDER_WIDTH,
        transition: { duration: 0.2, ease: "easeOut" }
      });
      setSliderPosition('end');
      setShowSuccessModal(true);
    } else {
      sliderControls.start({
        x: 0,
        transition: { duration: 0.2, ease: "easeOut" }
      });
      setSliderPosition('start');
    }
  };

  useEffect(() => {
    sliderControls.start({ x: 0 });
    setSliderPosition('start');
  }, [transferType, sliderControls]);

  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3 z-10">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => handleTabChange('p2p')} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Transfer</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 pb-24 space-y-6 overflow-y-auto mt-14">
        {/* Range Display */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-amber-600 mb-2">Available Range</div>
          <div className="text-xl font-bold text-amber-900">
            ₦{range.min.toLocaleString()} - ₦{range.max.toLocaleString()}
          </div>
          <div className="text-sm text-amber-600 mt-2">Merchant: {merchant}</div>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-amber-600 mb-2">Enter Amount</div>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="w-full px-4 py-3 text-lg border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {amount && !isValidAmount(amount) && (
            <div className="mt-2 text-red-500 text-sm">
              Amount must be between ₦{range.min.toLocaleString()} and ₦{range.max.toLocaleString()}
            </div>
          )}
          {amount && isValidAmount(amount) && (
            <div className="mt-2 text-amber-600 text-sm">
              Service charge: ₦{calculateCharge(amount).toLocaleString()}
            </div>
          )}
        </div>

        {/* Transfer Type Selection */}
        {amount && isValidAmount(amount) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-sm text-amber-600">Select Transfer Type</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTransferType('direct')}
                className={`p-4 rounded-lg border ${
                  transferType === 'direct'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-amber-200 bg-white'
                } flex flex-col items-center space-y-2`}
              >
                <Building2 className="h-6 w-6 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Direct Transfer</span>
              </button>

              <button
                onClick={() => setTransferType('wallet')}
                className={`p-4 rounded-lg border ${
                  transferType === 'wallet'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-amber-200 bg-white'
                } flex flex-col items-center space-y-2`}
              >
                <Wallet className="h-6 w-6 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Wallet Transfer</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Transfer Details */}
        <div ref={contentRef}>
          {transferType === 'direct' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-4 shadow-sm space-y-4"
            >
              <div className="space-y-2">
                <div className="text-sm text-amber-600">Account Details</div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-amber-600">Bank Name:</span>
                      <span className="ml-2 text-amber-900 font-medium">First Bank</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm text-amber-600">Account Number:</span>
                        <span className="ml-2 text-amber-900 font-medium">0123456789</span>
                      </div>
                      <button
                        onClick={handleCopyAccountNumber}
                        className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                        title="Copy account number"
                      >
                        <Copy className="h-4 w-4 text-amber-600" />
                      </button>
                    </div>
                    {showCopySuccess && (
                      <div className="text-green-600 text-sm">
                        Account number copied!
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-amber-600">Account Name:</span>
                      <span className="ml-2 text-amber-900 font-medium">John Doe</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {transferType === 'wallet' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-4 shadow-sm"
            >
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-5 w-5 text-green-500" />
                <AlertDescription>
                  <div className="ml-2">
                    <span className="text-green-800 font-medium">Wallet Balance Available</span>
                    <div className="text-green-600 text-sm">₦{parseFloat(amount).toLocaleString()}</div>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced Slider with Transaction Status */}
      {transferType && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
          {sliderPosition === 'end' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">Completed</span>
                </div>
                <button
                  onClick={handleViewOrder}
                  className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Order</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-14 bg-amber-100 rounded-full relative">
              <motion.div
                className="absolute left-0 top-0 h-full aspect-square rounded-full bg-amber-500 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: SLIDER_WIDTH }}
                dragElastic={0.1}
                dragMomentum={false}
                animate={sliderControls}
                onDrag={handleSliderDrag}
                onDragEnd={handleDragEnd}
                whileTap={{ scale: 1.1 }}
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center text-amber-600 font-medium pointer-events-none">
                Slide to {transferType === 'direct' ? 'confirm paid' : 'transfer'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Transaction Complete!
              </h3>
              <p className="text-gray-600 mb-6">
                Your transfer of ₦{parseFloat(amount).toLocaleString()} has been processed successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-amber-500 text-white rounded-lg py-2 px-4 font-medium hover:bg-amber-600 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferPage;
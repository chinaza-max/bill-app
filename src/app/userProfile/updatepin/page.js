'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const ChangePin = () => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [keypadNumbers, setKeypadNumbers] = useState([]);
  const [stage, setStage] = useState('verify'); // 'verify', 'new', or 'confirm'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Stored PIN for demo (in real app, this would come from secure storage/API)
  const DEMO_PIN = '1234';

  useEffect(() => {
    randomizeKeypad();
  }, [stage]);

  const randomizeKeypad = () => {
    const numbers = [...Array(10).keys()];
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setKeypadNumbers(numbers);
  };

  const handleNumberClick = (number) => {
    setError('');
    if (stage === 'verify' && currentPin.length < 4) {
      setCurrentPin(prev => prev + number);
    } else if (stage === 'new' && newPin.length < 4) {
      setNewPin(prev => prev + number);
    } else if (stage === 'confirm' && confirmPin.length < 4) {
      setConfirmPin(prev => prev + number);
    }
  };

  const handleDelete = () => {
    setError('');
    if (stage === 'verify') {
      setCurrentPin(prev => prev.slice(0, -1));
    } else if (stage === 'new') {
      setNewPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleContinue = () => {
    if (stage === 'verify') {
      if (currentPin === DEMO_PIN) {
        setStage('new');
        setCurrentPin('');
      } else {
        setError('Incorrect PIN. Please try again.');
        setCurrentPin('');
      }
    } else if (stage === 'new' && newPin.length === 4) {
      setStage('confirm');
    } else if (stage === 'confirm' && confirmPin.length === 4) {
      if (newPin === confirmPin) {
        setSuccess(true);
        // Here you would typically make an API call to update the PIN
        setTimeout(() => {
          router.push('/home');
        }, 1500);
      } else {
        setError('PINs do not match. Please try again.');
        setStage('new');
        setNewPin('');
        setConfirmPin('');
      }
    }
  };

  const getStageTitle = () => {
    switch (stage) {
      case 'verify':
        return 'Enter Current PIN';
      case 'new':
        return 'Enter New PIN';
      case 'confirm':
        return 'Confirm New PIN';
      default:
        return '';
    }
  };

  const getCurrentCode = () => {
    switch (stage) {
      case 'verify':
        return currentPin;
      case 'new':
        return newPin;
      case 'confirm':
        return confirmPin;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.push('/home')} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Change PIN</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              {getStageTitle()}
            </h2>
            <p className="mt-2 text-gray-600">
              {stage === 'verify' 
                ? 'Please enter your current PIN to continue'
                : stage === 'new'
                ? 'Choose a new 4-digit PIN'
                : 'Please re-enter your new PIN to confirm'
              }
            </p>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center space-x-4 my-8">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 ${
                  getCurrentCode().length > i 
                    ? 'bg-amber-600 border-amber-600' 
                    : 'border-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-4">
            {keypadNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                {number}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="p-4 text-base font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              Delete
            </button>
            <button
              onClick={handleContinue}
              disabled={getCurrentCode().length !== 4}
              className={`p-4 text-base font-medium rounded-lg ${
                getCurrentCode().length === 4
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="mt-4 border-amber-600">
              <Check className="h-4 w-4 text-amber-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your PIN has been changed successfully!</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePin;
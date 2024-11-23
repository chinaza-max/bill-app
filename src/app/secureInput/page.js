'use client';

import React, { useState, useEffect } from 'react';
import { X, Delete, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SecureLogin = () => {
  const [pin, setPin] = useState('');
  const [numbers, setNumbers] = useState([]);
  const router = useRouter();

  // Randomize number pad on mount and after each submit
  useEffect(() => {
    randomizeNumbers();
  }, []);

  const randomizeNumbers = () => {
    const shuffled = [...Array(10).keys()]
      .map(n => n.toString())
      .sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
  };

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    randomizeNumbers();
  };

  const handleSubmit = () => {
    // Handle submission logic here
    console.log('PIN submitted');
    setPin('');
    randomizeNumbers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex flex-col items-center p-6">
      {/* Logo Section */}
      <div className="mb-12 mt-8">
        <div className="w-32 h-32 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-4xl font-bold text-white">LOGO</span>
        </div>
      </div>

      {/* PIN Display */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Enter PIN</h2>
          <button 
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center space-x-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < pin.length
                  ? 'bg-yellow-500'
                  : 'border-2 border-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="bg-gradient-to-r from-yellow-50 to-yellow-100 text-gray-800 rounded-lg p-4 text-2xl font-semibold hover:from-yellow-100 hover:to-yellow-200 active:scale-95 transition-all duration-150 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="bg-gradient-to-r from-green-50 to-green-100 text-gray-800 rounded-lg p-4 flex items-center justify-center hover:from-green-100 hover:to-green-200 active:scale-95 transition-all duration-150 shadow-sm"
          >
            <Delete size={24} />
          </button>
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-4 flex items-center justify-center hover:from-yellow-600 hover:to-yellow-700 active:scale-95 transition-all duration-150 shadow-sm"
          >
            <ArrowRight size={24} />
          </button>
        </div>

        {/* Security Notice */}
        <p className="text-sm text-gray-500 text-center">
          For your security, the keypad layout is randomized each time
        </p>
      </div>
    </div>
  );
};

export default SecureLogin;
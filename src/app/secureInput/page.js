'use client';



import React, { useState, useEffect } from 'react';
import { X, Delete, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const SecureLogin = () => {
  const [pin, setPin] = useState('');
  const [numbers, setNumbers] = useState([]);
  
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
    console.log('PIN submitted');
    setPin('');
    randomizeNumbers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex flex-col items-center px-4 py-6">
      {/* Logo Section with Next.js Image */}
      <div className="mb-6 mt-4 relative">
        <div className="w-20 h-20 relative">
          <Image
            src="/icon.png" // Replace with your logo path
            alt="Company Logo"
            fill
            className="object-contain"
            sizes="(max-width: 80px) 100vw, 80px"
            priority
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl shadow-md p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Enter PIN</h2>
          <button 
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex justify-center space-x-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < pin.length
                  ? 'bg-yellow-500'
                  : 'border-2 border-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="bg-gradient-to-r from-yellow-50 to-yellow-100 text-gray-800 rounded-lg py-3 text-xl font-semibold hover:from-yellow-100 hover:to-yellow-200 active:scale-95 transition-all duration-150"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="bg-gradient-to-r from-green-50 to-green-100 text-gray-800 rounded-lg py-3 flex items-center justify-center hover:from-green-100 hover:to-green-200 active:scale-95 transition-all duration-150"
          >
            <Delete size={20} />
          </button>
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg py-3 flex items-center justify-center hover:from-yellow-600 hover:to-yellow-700 active:scale-95 transition-all duration-150"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Keypad layout randomizes for security
        </p>
      </div>
    </div>
  );
};

export default SecureLogin;
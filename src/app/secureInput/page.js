'use client';

import React, { useState, useEffect } from 'react';
import { X, Delete, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Doto  } from 'next/font/google'


const cormorantGaramond = Doto({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
});

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-6 relative">
      {/* Logo Section */}
      <div className=" mt-4 relative">
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
      <div className={`${cormorantGaramond.className} text-2xl text-gray-800`}>
         Unlocking Convience
        </div>

      {/* Main Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 w-full max-w-sm" 
          style={{ position: 'absolute', bottom: '50px' }}
        >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-700">Enter PIN</h2>
          <button 
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center space-x-3 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-emerald-600 scale-105'
                  : 'border border-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="bg-white border border-gray-200 text-gray-700 rounded-md py-3 text-lg font-medium 
                         hover:border-emerald-600 hover:text-emerald-600 
                         active:bg-emerald-50 
                         transition-all duration-150
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="bg-white border border-gray-200 text-gray-600 rounded-md py-3
                     hover:border-emerald-600 hover:text-emerald-600
                     active:bg-emerald-50
                     transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50
                     flex items-center justify-center"
          >
            <Delete size={18} />
          </button>
          <button
            onClick={handleSubmit}
            className="bg-emerald-600 text-white rounded-md py-3
                     hover:bg-emerald-700
                     active:bg-emerald-800
                     transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50
                     flex items-center justify-center"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Enhanced security: Keypad layout changes automatically
        </p>
      </div>
    </div>
  );
};

export default SecureLogin;
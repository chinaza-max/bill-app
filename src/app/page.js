'use client';
//icon.png




import React from 'react';
import Image from 'next/image';
import { ArrowUpRight, ArrowDown } from 'lucide-react';

const PWAInstallGuide = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* App Logo Placeholder */}
        <div className="flex justify-center mb-12 relative w-[120px] h-[120px] mx-auto">
          <Image 
            src="/icon.png" 
            alt="App Logo"
            width={90}
            height={60}
            className="rounded-xl shadow-lg object-cover"
            priority
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl p-8 shadow-xl relative">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Install Our App
          </h1>

          {/* Browser Bar Guide */}
          <div className="mb-12 relative">
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-700 mb-2">
                Look for the install icon in your browsers address bar
              </p>
              {/* Animated Arrow pointing up-right */}
              <div className="absolute -right-4 -top-4 animate-bounce">
                <ArrowUpRight 
                  className="w-8 h-8 text-green-600"
                  style={{
                    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mobile Guide */}
          <div className="relative">
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-700 mb-2">
                On mobile? Tap the menu button and select Add to Home Screen
              </p>
              {/* Animated Arrow pointing down */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-12 animate-bounce">
                <ArrowDown 
                  className="w-8 h-8 text-amber-600"
                  style={{
                    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PWAInstallGuide;
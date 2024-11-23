'use client';

import React, { useState } from 'react';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MerchantAdsPage = () => {
  const router = useRouter();
  
  // Initial merchant ads data
  const initialAds = [
    {
      id: 1,
      priceRange: { min: 1000, max: 5000 },
      charge: 200,
      status: 'active'
    },
    {
      id: 2,
      priceRange: { min: 5001, max: 10000 },
      charge: 180,
      status: 'active'
    },
    {
      id: 3,
      priceRange: { min: 10001, max: 20000 },
      charge: 150,
      status: 'active'
    },
    {
      id: 4,
      priceRange: { min: 20001, max: 50000 },
      charge: 120,
      status: 'active'
    },
    {
      id: 5,
      priceRange: { min: 50001, max: 100000 },
      charge: 100,
      status: 'active'
    }
  ];

  const [ads, setAds] = useState(initialAds);
  const [isEdited, setIsEdited] = useState(false);

  const handleChargeChange = (id, newCharge) => {
    const updatedAds = ads.map(ad => {
      if (ad.id === id) {
        return { ...ad, charge: newCharge };
      }
      return ad;
    });
    setAds(updatedAds);
    setIsEdited(true);
  };

  const handleSave = () => {
    // Here you would typically make an API call to save the changes
    console.log('Saving updated charges:', ads);
    setIsEdited(false);
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3 fixed w-full top-0 z-10">
        <div className="flex items-center space-x-3">
          <ArrowLeft onClick={() => router.back()} className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">My Active Ads</h1>
        </div>
      </div>

      {/* Main Content - with padding for fixed header and footer */}
      <div className="flex-1 overflow-auto pt-16 pb-24 px-4">
        <div className="space-y-4">
          {ads.map((ad) => (
            <div 
              key={ad.id} 
              className="bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md"
            >
              {/* Price Range Section */}
              <div className="mb-4">
                <div className="text-sm text-amber-600 mb-1">Price Range</div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold text-amber-900">
                    ₦{ad.priceRange.min.toLocaleString()} - ₦{ad.priceRange.max.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Editable Charge */}
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-sm text-amber-600 mb-1">Charge (₦)</div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={ad.charge}
                    onChange={(e) => handleChargeChange(ad.id, parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex justify-end">
                <span className="px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full">
                  {ad.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Save Button at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 p-4">
        <button
          onClick={handleSave}
          disabled={!isEdited}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isEdited
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-amber-200 text-amber-500 cursor-not-allowed'
          }`}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default MerchantAdsPage;
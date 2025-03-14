'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'
import BottomNav from '../component/bottomNav';



import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Users,
  Home,
  History,
  ShoppingBag,
  Circle,
  Check,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const P2PPage = () => {    
  const [activeTab, setActiveTab] = useState('p2p');
  const router = useRouter();



  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };

  const [filters, setFilters] = useState({
    accuracy: '',
    distance: '',
    amount: '',
    preference: '',
  });
  const [openFilter, setOpenFilter] = useState('');
  const [showOfferDetails, setShowOfferDetails] = useState(null);

  // Filter options
  const filterOptions = {
    accuracy: [
      { label: 'Any', value: '' },
      { label: '90% and above', value: '90' },
      { label: '95% and above', value: '95' },
      { label: '98% and above', value: '98' },
    ],
    distance: [
      { label: 'Any', value: '' },
      { label: 'Within 1km', value: '1' },
      { label: 'Within 5km', value: '5' },
      { label: 'Within 10km', value: '10' },
    ],
    amount: [
      { label: 'Any', value: '' },
      { label: '₦1,000 - ₦5,000', value: '1-5' },
      { label: '₦5,001 - ₦10,000', value: '5-10' },
      { label: '₦10,001 - ₦20,000', value: '10-20' },
    ],
    preference: [
      { label: 'Any', value: '' },
      { label: 'Fastest', value: 'fastest' },
      { label: 'Lowest Charge', value: 'lowest-charge' },
      { label: 'Highest Accuracy', value: 'highest-accuracy' },
    ],
  };

  // Sample P2P offers data
  const p2pOffers = [
    {
      id: 1,
      name: 'John Carter',
      avatar: 'avatar.jpg',
      online: true,
      badge: 'Verified',
      priceRanges: [
        { min: 1000, max: 5000, charge: 200 },
        { min: 5001, max: 10000, charge: 300 },
        { min: 10001, max: 20000, charge: 400 }
      ],
      orders: 156,
      accuracy: 98.5,
      distance: 2.5, // kilometers
    },
    {
      id: 2,
      name: 'Sarah Doe',
      avatar: 'avatar.jpg',
      online: true,
      badge: 'Verified',
      priceRanges: [
        { min: 1000, max: 5000, charge: 180 },
        { min: 5001, max: 10000, charge: 250 },
        { min: 10001, max: 20000, charge: 350 }
      ],
      orders: 234,
      accuracy: 95.2,
      distance: 5.7, // kilometers
    },
    // ... more sample data
  ];

  const handleFilterClick = (filterName) => {
    setOpenFilter(openFilter === filterName ? '' : filterName);
  };

  const handleFilterSelect = (filterName, value) => {

    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setOpenFilter('');
  };


  
  const handleOfferDetailsToggle = (offer) => {
    setShowOfferDetails(showOfferDetails === offer.id ? null : offer.id);
  };

  const OfferRangeDetails = ({ offer }) => (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-amber-900">Offer Range Details</div>
        <button onClick={() => handleOfferDetailsToggle(offer)}>
          {showOfferDetails === offer.id ? (
            <ChevronUp className="h-6 w-6 text-amber-500" />
          ) : (
            <ChevronRight className="h-6 w-6 text-amber-500" />
          )}
        </button>
      </div>
      <AnimatePresence>
        {showOfferDetails === offer.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-amber-50 rounded-lg p-4"
          >
                <div className="space-y-3">
              {offer.priceRanges.map((range, index) => (
                <div key={index} className="border-b border-amber-100 pb-2 last:border-b-0">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm text-amber-600">Range</div>
                      <div className="font-medium text-amber-900">
                        ₦{range.min.toLocaleString()} - ₦{range.max.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-amber-600">Charge</div>
                      <div className="font-medium text-amber-900">
                        ₦{range.charge}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const FilterDropdown = ({ name, label, options }) => (
    <div className="relative">
      <button
        onClick={() => handleFilterClick(name)}
        className={`w-full px-3 py-2 text-sm bg-white rounded-lg shadow-sm border 
        ${
          openFilter === name ? 'border-amber-500' : 'border-amber-200'
        } flex items-center justify-between`}
      >
        <span className="text-amber-900">
          {filters[name]
            ? options.find((opt) => opt.value === filters[name])?.label
            : label}
        </span>
        {openFilter === name ? (
          <ChevronUp className="h-4 w-4 text-amber-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-500" />
        )}
      </button>

      <AnimatePresence>
        {openFilter === name && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-amber-100 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterSelect(name, option.value)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50 flex items-center justify-between"
              >
                <span className="text-amber-900">{option.label}</span>
                {filters[name] === option.value && (
                  <Check className="h-4 w-4 text-amber-500" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );



  // Filter the p2pOffers based on the selected filters
  const filteredOffers = p2pOffers.filter((offer) => {
    const { accuracy, distance, amount, preference } = filters;
    return (
      (accuracy === '' || offer.accuracy >= parseFloat(accuracy)) &&
      (distance === '' || parseFloat(offer.minRange / 1000) <= parseFloat(distance)) &&
      (amount === '' || (offer.minRange >= parseFloat(amount.split('-')[0]) && offer.maxRange <= parseFloat(amount.split('-')[1]))) &&
      (preference === '' || preference === 'fastest' || preference === 'lowest-charge' || preference === 'highest-accuracy')
    );
  });

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft  onClick={() => handleTabChange('home')}  className="h-6 w-6" />
          <h1 className="text-lg font-semibold">P2P Trading</h1>
        </div>
      </div>

      {/* Filters Section - Fixed on scroll */}
      <div className="sticky top-0 z-10 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <FilterDropdown name="accuracy" label="Accuracy %" options={filterOptions.accuracy} />
          <FilterDropdown name="distance" label="Distance (m)" options={filterOptions.distance} />
          <FilterDropdown name="amount" label="Amount Range" options={filterOptions.amount} />
          <FilterDropdown name="preference" label="Preference" options={filterOptions.preference} />
        </div>
      </div>

      
      {/* P2P Offers List */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="space-y-3">
          {filteredOffers.map((offer) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-4 shadow-sm"
            >


              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium">
                    
                      <img
                        src={offer.avatar} // Ensure `offer.avatarUrl` holds the actual image URL
                        alt={offer.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    {offer.online && (
                      <div className="absolute -bottom-1 -right-1">
                        <Circle className="h-4 w-4 fill-green-500 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-amber-900">{offer.name}</h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full">
                        {offer.badge}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-amber-600">
                      <span>{offer.orders} orders</span>
                      <span>•</span>
                      <span>{offer.accuracy}% accuracy</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="space-y-1">
                  <div className="text-sm text-amber-600">Range</div>
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-amber-900">
                      ₦{offer.priceRanges[0].min.toLocaleString()} - ₦{offer.priceRanges[offer.priceRanges.length - 1].max.toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleOfferDetailsToggle(offer)}
                      className="flex items-center space-x-2 text-amber-600 hover:text-amber-900 transition-colors"
                    >
                      {showOfferDetails === offer.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-amber-600">
                  <MapPin className="h-5 w-5" />
                  <span>{offer.distance} km away</span>
                </div>
              </div>

              <AnimatePresence>
                {showOfferDetails === offer.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <OfferRangeDetails offer={offer} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange('p2p/transfer')} 
                className="w-full bg-amber-500 text-white rounded-lg py-2 px-4 font-medium hover:bg-amber-600 transition-colors"
              >
                Transfer
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav  handleTabChangeP={handleTabChange} activeTabP={activeTab}/>
          
    </div>
  );
};

export default P2PPage;
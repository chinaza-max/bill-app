'use client';


import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  Users, 
  Home, 
  History, 
  ShoppingBag,
  Circle
} from 'lucide-react';
import { motion } from 'framer-motion';

const P2PPage = () => {
  const [activeTab, setActiveTab] = useState('p2p');
  const [filters, setFilters] = useState({
    accuracy: '',
    distance: '',
    amount: '',
    preference: ''
  });

  // Sample P2P offers data
  const p2pOffers = [
    {
      id: 1,
      name: "John Carter",
      avatar: "JC",
      online: true,
      badge: "Verified",
      minRange: 1000,
      maxRange: 20000,
      charge: 20,
      orders: 156,
      accuracy: 98.5
    },
    {
      id: 2,
      name: "Sarah Williams",
      avatar: "SW",
      online: true,
      badge: "Premium",
      minRange: 500,
      maxRange: 15000,
      charge: 15,
      orders: 234,
      accuracy: 99.2
    },
    {
      id: 3,
      name: "Mike Brown",
      avatar: "MB",
      online: false,
      badge: "Verified",
      minRange: 2000,
      maxRange: 50000,
      charge: 25,
      orders: 89,
      accuracy: 97.8
    },
    {
      id: 4,
      name: "Emma Davis",
      avatar: "ED",
      online: true,
      badge: "New",
      minRange: 1000,
      maxRange: 10000,
      charge: 18,
      orders: 45,
      accuracy: 96.5
    },
    {
      id: 5,
      name: "Alex Johnson",
      avatar: "AJ",
      online: false,
      badge: "Verified",
      minRange: 3000,
      maxRange: 30000,
      charge: 22,
      orders: 167,
      accuracy: 98.9
    },
    {
      id: 6,
      name: "Lisa Chen",
      avatar: "LC",
      online: true,
      badge: "Premium",
      minRange: 1500,
      maxRange: 25000,
      charge: 19,
      orders: 198,
      accuracy: 99.5
    },
    {
      id: 7,
      name: "David Kim",
      avatar: "DK",
      online: true,
      badge: "Verified",
      minRange: 2500,
      maxRange: 40000,
      charge: 21,
      orders: 145,
      accuracy: 98.2
    },
    {
      id: 8,
      name: "Rachel Green",
      avatar: "RG",
      online: false,
      badge: "Premium",
      minRange: 1000,
      maxRange: 35000,
      charge: 17,
      orders: 267,
      accuracy: 99.1
    },
    {
      id: 9,
      name: "Tom Wilson",
      avatar: "TW",
      online: true,
      badge: "Verified",
      minRange: 4000,
      maxRange: 45000,
      charge: 23,
      orders: 123,
      accuracy: 97.9
    },
    {
      id: 10,
      name: "Maria Garcia",
      avatar: "MG",
      online: true,
      badge: "New",
      minRange: 500,
      maxRange: 12000,
      charge: 16,
      orders: 34,
      accuracy: 95.8
    }
  ];

  const FilterDropdown = ({ label, options }) => (
    <div className="relative">
      <button className="w-full px-3 py-2 text-sm bg-white rounded-lg shadow-sm border border-amber-200 flex items-center justify-between">
        <span className="text-amber-900">{label}</span>
        <ChevronDown className="h-4 w-4 text-amber-500" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="h-6 w-6" />
          <h1 className="text-lg font-semibold">P2P Trading</h1>
        </div>
      </div>

      {/* Filters Section - Fixed on scroll */}
      <div className="sticky top-0 z-10 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <FilterDropdown label="Accuracy %" options={[]} />
          <FilterDropdown label="Distance (m)" options={[]} />
          <FilterDropdown label="Amount Range" options={[]} />
          <FilterDropdown label="Preference" options={[]} />
        </div>
      </div>

      {/* P2P Offers List */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="space-y-3">
          {p2pOffers.map((offer) => (
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
                      {offer.avatar}
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
                  <div className="font-medium text-amber-900">
                    ₦{offer.minRange.toLocaleString()} - ₦{offer.maxRange.toLocaleString()}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm text-amber-600">Charge</div>
                  <div className="font-medium text-amber-900">{offer.charge}%</div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-amber-500 text-white rounded-lg py-2 px-4 font-medium hover:bg-amber-600 transition-colors"
              >
                Transfer
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-amber-200">
        <div className="flex justify-around py-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'home' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'orders' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="text-xs mt-1">Orders</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'history' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <History className="h-6 w-6" />
            <span className="text-xs mt-1">History</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('p2p')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'p2p' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs mt-1">P2P</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default P2PPage;
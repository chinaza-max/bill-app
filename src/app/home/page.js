'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, ChevronDown, Home, History, Users, ShoppingBag, Package2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useRouter } from 'next/navigation'

const MobileApp = () => {
  const [userType, setUserType] = useState('Client');
  const [activeTab, setActiveTab] = useState('home');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const intervalRef = useRef(null);
  const dragConstraintsRef = useRef(null);
  const controls = useAnimation();
  const x = useMotionValue(0);

  // Enhanced carousel data
  const carouselItems = [
    {
      id: 1,
      title: "Special Offer",
      description: "50% off on first transaction",
      image: "credit-card.png",
      color: "from-amber-400 to-amber-600"
    },
    {
      id: 2,
      title: "New Feature",
      description: "Instant P2P transfers",
      image: "credit-card.png",
      color: "from-amber-500 to-amber-700"
    },
    {
      id: 3,
      title: "Weekend Promotion",
      description: "Earn 2x points this weekend",
      image: "credit-card.png",
      color: "from-amber-300 to-amber-500"
    }
  ];

  const startInterval = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 6000);
    }
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const recentTransactions = [];

  const nextSlide = () => {
    const newSlide = (currentSlide + 1) % carouselItems.length;
    setCurrentSlide(newSlide);
  };

  const prevSlide = () => {
    const newSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
    setCurrentSlide(newSlide);
  };

  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;

    // Determine swipe direction based on drag offset and velocity
    if (offset.x < -100 || (velocity.x < -500 && offset.x < 0)) {
      nextSlide();
    } else if (offset.x > 100 || (velocity.x > 500 && offset.x > 0)) {
      prevSlide();
    }

    // Reset position
    controls.start({ x: 0, transition: { duration: 0.3 } });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };

  const EmptyTransactionState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-3 px-4 bg-white rounded-lg shadow-sm"
    >
      <div className="w-16 h-16 mb-4 bg-amber-100 rounded-full flex items-center justify-center">
        <Package2 className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-amber-900 mb-2">No Transactions Yet</h3>
      <p className="text-amber-600 text-center text-sm mb-6">
        Start your journey by making your first transaction. It is quick and easy!
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {handleTabChange('p2p') }}
        className="px-6 py-2 bg-amber-100 text-amber-600 rounded-full font-medium text-sm"
      >
        Start New Transaction
      </motion.button>
    </motion.div>
  );

  useEffect(() => {
    startInterval();
    return () => stopInterval();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <img
              onClick={() => {handleTabChange('userProfile') }}
              src={'avatar.jpg'}
              alt={"avatar"}
              className="w-full h-full object-cover rounded-full"
            />
            </div>
            <div>
              <p className="text-sm">Good Morning,</p>
              <p className="font-semibold">John Doe</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6" />
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 text-white hover:bg-amber-600 px-2 py-1 rounded"
              >
                <span>{userType}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button 
                    onClick={() => {
                      setUserType('Merchant');
                      setIsDropdownOpen(false);
                      handleTabChange("userProfile/merchantProfile/merchantHome")
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 w-full text-left"
                  >
                    Merchant
                  </button>
                  <button 
                    onClick={() => {
                      setUserType('Client');
                      setIsDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 w-full text-left"
                  >
                    Client
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Enhanced Carousel with Swipe */}
        <div className="relative p-4" ref={dragConstraintsRef}>
          <div className="relative overflow-hidden rounded-lg">
            <motion.div 
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={handleDragEnd}
              animate={controls}
              style={{ x }}
              className="touch-none"
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-gradient-to-r
                    ${carouselItems[currentSlide].color}
                     rounded-lg p-6 
                     shadow-lg
                     relative `}
                  style={{
                    padding:"9px" ,
                    height:"160px"
                  }}
                >
                  <div 
                   className="absolute inset-0 bg-center bg-no-repeat bg-contain"
                   style={{
                     backgroundImage: `url(${carouselItems[currentSlide].image})`,
                     opacity: 0.3,
                     height:"160px"
                   }}
                  
                  />
                  <h4 className="text-lg font-semibold text-white">
                    {carouselItems[currentSlide].title}
                  </h4>
                  <p className="text-white/90" style={{fontSize:"12px"}}>
                    {carouselItems[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <div style={{bottom:"5px"}} className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Rest of the code remains the same as in the original file */}
        {/* Transactions */}
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3 text-amber-900">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <EmptyTransactionState />
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(transaction => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium">
                        {transaction.initials}
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">{transaction.title}</p>
                        <p className="text-sm text-amber-600">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'incoming' ? 'text-green-600' : 'text-amber-700'
                      }`}>
                        {transaction.type === 'incoming' ? '+' : '-'}{transaction.amount}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Order Button */}
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-2 px-6 shadow-lg flex items-center justify-center space-x-2 relative overflow-hidden group"
              onClick={() => {handleTabChange('p2p') }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              <ShoppingBag className="h-6 w-6" />
              <span  className="text-lg font-semibold relative z-10">Place New Order</span>
            </motion.button>
          </motion.div> 
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-amber-200">
        <div className="flex justify-around py-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'home' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabChange('history')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'history' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <ShoppingBag  className="h-6 w-6" />
            <span className="text-xs mt-1">Orders</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabChange('history')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'history' ? 'text-amber-600' : 'text-amber-400'
            }`}
          >
            <History className="h-6 w-6" />
            <span className="text-xs mt-1">History</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {handleTabChange('p2p') }}
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

export default MobileApp;
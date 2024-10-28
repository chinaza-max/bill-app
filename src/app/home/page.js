'use client';


import React, { useState } from 'react';
import { Bell, ChevronDown, Home, History, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const MobileApp = () => {
  const [userType, setUserType] = useState('Merchant');
  const [activeTab, setActiveTab] = useState('home');
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Enhanced transactions with avatar data
  const recentTransactions = [
    {
      id: 1,
      title: "Payment to John",
      amount: "$50.00",
      date: "Today",
      avatar: "/api/placeholder/32/32",
      initials: "JD",
      type: "outgoing"
    },
    {
      id: 2,
      title: "Received from Sarah",
      amount: "$120.00",
      date: "Yesterday",
      avatar: "/api/placeholder/32/32",
      initials: "SW",
      type: "incoming"
    },
    {
      id: 3,
      title: "Payment to Store",
      amount: "$35.00",
      date: "2 days ago",
      avatar: "/api/placeholder/32/32",
      initials: "ST",
      type: "outgoing"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/api/placeholder/32/32" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">Good Morning,</p>
              <p className="font-semibold">John Doe</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 text-white hover:bg-amber-600">
                  <span>{userType}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setUserType('Merchant')}>
                  Merchant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserType('Client')}>
                  Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Enhanced Carousel */}
        <div className="relative p-4">
          <div className="relative overflow-hidden rounded-lg">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className={`bg-gradient-to-r ${carouselItems[currentSlide].color} rounded-lg p-6 shadow-lg`}
              >
                <img 
                  src={carouselItems[currentSlide].image} 
                  alt={carouselItems[currentSlide].title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold text-white">
                  {carouselItems[currentSlide].title}
                </h3>
                <p className="text-white/90">
                  {carouselItems[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>
            
            <button 
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
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

        {/* Enhanced Transactions */}
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3 text-amber-900">Recent Transactions</h2>
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
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={transaction.avatar} />
                      <AvatarFallback>{transaction.initials}</AvatarFallback>
                    </Avatar>
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

export default MobileApp;
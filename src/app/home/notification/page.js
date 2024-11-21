'use client';

import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, RotateCcw, CreditCard, Circle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const NotificationPage = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'transfer',
      title: 'Transfer Order Received',
      message: 'You received a transfer order of ₦15,000 from John Carter',
      time: '2 minutes ago',
      read: false,
      icon: CreditCard,
      amount: '15,000'
    },
    {
      id: 2,
      type: 'reversal',
      title: 'Order Reversed',
      message: 'Order #12345 has been reversed due to payment timeout',
      time: '1 hour ago',
      read: false,
      icon: RotateCcw
    },
    {
      id: 3,
      type: 'chat',
      title: 'New Message',
      message: 'Sarah Doe: Hello, is this order still available?',
      time: '3 hours ago',
      read: true,
      icon: MessageSquare
    }
  ]);

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'transfer':
        return 'bg-green-100 text-green-600';
      case 'reversal':
        return 'bg-red-100 text-red-600';
      case 'chat':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-amber-100 text-amber-600';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ArrowLeft 
              className="h-6 w-6 cursor-pointer" 
              onClick={() => router.back()}
            />
            <h1 className="text-lg font-semibold">Notifications</h1>
          </div>
          {notifications.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearAllNotifications}
              className="flex items-center space-x-1 text-sm bg-white/20 rounded-full px-3 py-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-auto px-4 pt-16 pb-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-amber-600">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-lg">No notifications</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`bg-white rounded-lg p-4 shadow-sm ${
                    !notification.read ? 'border-l-4 border-amber-500' : ''
                  } relative group`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getNotificationStyle(notification.type)}`}>
                      <notification.icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-amber-900">{notification.title}</h3>
                        {!notification.read && (
                          <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      
                      {notification.amount && (
                        <div className="mt-2 text-sm font-medium text-amber-600">
                          Amount: ₦{notification.amount}
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">{notification.time}</div>
                    </div>

                    {/* Clear single notification button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => clearNotification(notification.id)}
                      className="absolute top-2 right-2 p-1 rounded-full 
                        opacity-0 group-hover:opacity-100 transition-opacity
                        hover:bg-red-50 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
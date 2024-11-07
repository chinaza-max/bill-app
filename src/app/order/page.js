'use client';



import React, { useState } from 'react';
import { 
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Map,
  Circle,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderTrackingPage = () => {
  const [showExternalMapModal, setShowExternalMapModal] = useState(false);
  const [showInAppMap, setShowInAppMap] = useState(false);
  
  // Sample order data
  const order = {
    id: 1,
    merchant: {
      name: "John Carter",
      avatar: "avatar.jpg",
      badge: "Premium",
      online: true,
      location: {
        distance: "2.5 km",
        estimatedTime: "15 mins"
      }
    },
    amount: {
      range: "₦5,000 - ₦10,000",
      minimum: "₦5,000"
    }
  };

  const Modal = ({ isOpen, onClose, children }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-lg w-full max-w-md p-4"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="h-6 w-6 cursor-pointer" />
          <h1 className="text-lg font-semibold">Order Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-16 px-4 pb-4">
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
          {/* Merchant Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <img
                    src={order.merchant.avatar}
                    alt={order.merchant.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                {order.merchant.online && (
                  <div className="absolute -bottom-1 -right-1">
                    <Circle className="h-4 w-4 fill-green-500 text-green-500" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-amber-900">{order.merchant.name}</h3>
                  <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full">
                    {order.merchant.badge}
                  </span>
                </div>
              </div>
            </div>

            {/* Communication Icons */}
            <div className="flex space-x-3">
              <button className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200">
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4 mb-4">
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <div>
                <div className="text-sm text-amber-600">Amount Range</div>
                <div className="font-medium text-amber-900">{order.amount.range}</div>
              </div>
              <div>
                <div className="text-sm text-amber-600">Minimum</div>
                <div className="font-medium text-amber-900">{order.amount.minimum}</div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <div>
                <div className="text-sm text-amber-600">Distance</div>
                <div className="font-medium text-amber-900">{order.merchant.location.distance}</div>
              </div>
              <div>
                <div className="text-sm text-amber-600">Est. Time</div>
                <div className="font-medium text-amber-900">{order.merchant.location.estimatedTime}</div>
              </div>
            </div>
          </div>

          {/* Map Options */}
          <div className="space-y-3">
            <button
              onClick={() => setShowInAppMap(true)}
              className="w-full p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200"
            >
              <MapPin className="h-5 w-5" />
              <span>Track in App</span>
            </button>

            <button
              onClick={() => setShowExternalMapModal(true)}
              className="w-full p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200"
            >
              <Map className="h-5 w-5" />
              <span>Open in Google Maps</span>
            </button>
          </div>

          {/* Cancel Order Button */}
          <button className="w-full mt-4 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            Cancel Order
          </button>
        </div>
      </div>

      {/* External Map Modal */}
      <Modal 
        isOpen={showExternalMapModal} 
        onClose={() => setShowExternalMapModal(false)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <h3 className="text-lg font-semibold text-amber-900">Leave App?</h3>
          </div>
          <button 
            onClick={() => setShowExternalMapModal(false)}
            className="text-amber-500 hover:text-amber-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <p className="text-amber-700 mb-4">
          You're about to leave the app and open Google Maps. Continue?
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExternalMapModal(false)}
            className="flex-1 p-2 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            onClick={() => window.open('https://maps.google.com', '_blank')}
            className="flex-1 p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* In-App Map Modal */}
      <Modal 
        isOpen={showInAppMap} 
        onClose={() => setShowInAppMap(false)}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-900">Live Tracking</h3>
          <button 
            onClick={() => setShowInAppMap(false)}
            className="text-amber-500 hover:text-amber-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="bg-amber-100 h-64 rounded-lg flex items-center justify-center">
          <span className="text-amber-600">Map View</span>
        </div>
        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center justify-between text-amber-700">
            <span>Current Location:</span>
            <span>{order.merchant.location.distance} away</span>
          </div>
          <div className="flex items-center justify-between text-amber-700">
            <span>Estimated Arrival:</span>
            <span>{order.merchant.location.estimatedTime}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderTrackingPage;
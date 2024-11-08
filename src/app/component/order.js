'use client';


import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Map,
  Circle,
  AlertTriangle,
  X,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ order }) => {
  const [map, setMap] = useState(null);
  const [merchantMarker, setMerchantMarker] = useState(null);
  const [customerMarker, setCustomerMarker] = useState(null);
  const [route, setRoute] = useState(null);

  useEffect(() => {


    if (typeof window !== 'undefined') {  // Check if window is defined
      console.log(" ddddd ddddd ddddd")
    
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        const newMap = L.map(mapContainer).setView([order.merchant.location.latitude, order.merchant.location.longitude], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(newMap);

        setMerchantMarker(L.marker([order.merchant.location.latitude, order.merchant.location.longitude], {
          icon: L.divIcon({
            className: 'relative',
            html: `
              <div class="bg-amber-500 text-white px-2 py-1 rounded-full font-medium text-sm">
                Delivery Point
              </div>
              <div class="bg-white rounded-full w-8 h-8 flex items-center justify-center">
                <User className="h-5 w-5 text-amber-500" />
              </div>
            `
          })
        }).addTo(newMap));

        setCustomerMarker(L.marker([order.customer.location.latitude, order.customer.location.longitude], {
          icon: L.divIcon({
            className: 'relative',
            html: `
              <div class="bg-amber-500 text-white px-2 py-1 rounded-full font-medium text-sm">
                Order Amount: ${order.amount.range}
              </div>
              <div class="bg-white rounded-full w-8 h-8 flex items-center justify-center">
                <User className="h-5 w-5 text-amber-500" />
              </div>
            `
          })
        }).addTo(newMap));

        const routeLine = L.polyline([
          [order.customer.location.latitude, order.customer.location.longitude],
          [order.merchant.location.latitude, order.merchant.location.longitude]
        ], {
          color: 'amber',
          weight: 4
        });
        routeLine.addTo(newMap);
        setRoute(routeLine);

        newMap.fitBounds(routeLine.getBounds());

        setMap(newMap);

        const interval = setInterval(() => {
          updateMerchantLocation(newMap, merchantMarker, routeLine);
        }, 5000);

        return () => {
          clearInterval(interval);
          newMap.remove();
          setMap(null);
          setMerchantMarker(null);
          setCustomerMarker(null);
          setRoute(null);
        };
      }
    }
  }, [order.merchant.location.latitude, order.merchant.location.longitude, order.customer.location.latitude, order.customer.location.longitude]);

  const updateMerchantLocation = (map, merchantMarker, route) => {
    const newLatitude = order.merchant.location.latitude + Math.random() * 0.01 - 0.005;
    const newLongitude = order.merchant.location.longitude + Math.random() * 0.01 - 0.005;

    if (merchantMarker) {
      merchantMarker.setLatLng([newLatitude, newLongitude]);
    }

    if (route) {
      route.setLatLngs([
        [order.customer.location.latitude, order.customer.location.longitude],
        [newLatitude, newLongitude]
      ]);
      map.fitBounds(route.getBounds());
    }
  };

  return (
    <div id="map" className="h-64 rounded-lg"></div>
  );
};

const OrderTrackingPage = () => {
  const [showExternalMapModal, setShowExternalMapModal] = useState(false);
  const [showInAppMap, setShowInAppMap] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);

  const order = {
    id: 1,
    merchant: {
      name: "John Carter",
      avatar: "avatar.jpg",
      badge: "Premium",
      online: true,
      location: {
        latitude: 6.5244,
        longitude: 3.3792,
        distance: "2.5 km",
        estimatedTime: "15 mins"
      }
    },
    customer: {
      location: {
        latitude: 6.5278,
        longitude: 3.3731
      }
    },
    amount: {
      range: "₦5,000 - ₦10,000",
      minimum: "₦5,000"
    }
  };

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
          <button
            onClick={() => setShowCancelOrderModal(true)}
            className="w-full mt-4 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
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
          You are about to leave the app and open Google Maps. Continue?
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExternalMapModal(false)}
            className="flex-1 p-2 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {  window.open('https://maps.google.com', '_blank')  }}
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
        <LeafletMap order={order} />
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        isOpen={showCancelOrderModal}
        onClose={() => setShowCancelOrderModal(false)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <h3 className="text-lg font-semibold text-amber-900">Cancel Order</h3>
          </div>
          <button
            onClick={() => setShowCancelOrderModal(false)}
            className="text-amber-500 hover:text-amber-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <p className="text-amber-700 mb-4">
          Are you sure you want to cancel this order?
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCancelOrderModal(false)}
            className="flex-1 p-2 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50"
          >
            No, Keep Order
          </button>
          <button
            onClick={() => alert('Order Cancelled')}
            className="flex-1 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Yes, Cancel Order
          </button>
        </div>
      </Modal>
    </div>
  );
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

export default OrderTrackingPage;
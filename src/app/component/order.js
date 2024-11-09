'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Map,
  Circle,
  AlertTriangle,
  Receipt,
  X,
  User,
  QrCode,
  CheckCircle,
  Camera,
  ScanLine,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

// ... LeafletMap component remains unchanged ...
const LeafletMap = ({ order }) => {
  const [map, setMap] = useState(null);
  const [merchantMarker, setMerchantMarker] = useState(null);
  const [customerMarker, setCustomerMarker] = useState(null);
  const [route, setRoute] = useState(null);




  
  useEffect(() => {


    if (typeof window !== 'undefined') {  // Check if window is defined
    
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


const MerchantScanner = ({ onClose, onScan }) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Check for camera availability
    Html5Qrcode.getCameras()
      .then(devices => {
        setHasCamera(devices && devices.length > 0);
      })
      .catch(err => {
        setError('Camera access denied or no cameras found');
        console.error('Camera error:', err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Handle successful scan
          await stopScanner();
          setScanSuccess(true);
          setTimeout(() => {
            onScan(decodedText);
          }, 1500);
        },
        (errorMessage) => {
          // Suppress error logging during normal scanning
          if (errorMessage.includes('No QR code found')) {
            return;
          }
          console.error(errorMessage);
        }
      );
      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError('Failed to start camera. Please check permissions.');
      console.error('Scanner error:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleRestartScan = async () => {
    setScanSuccess(false);
    setError(null);
    await startScanner();
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Scan Customer QR Code</h3>
        <button onClick={onClose} className="text-white hover:text-amber-100">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="p-4">
        {error ? (
          <div className="text-center p-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={handleRestartScan}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
            >
              Retry Camera Access
            </button>
          </div>
        ) : scanSuccess ? (
          <div className="text-center p-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-medium text-green-600 mb-4">Scan Successful!</p>
            <button
              onClick={handleRestartScan}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
            >
              Scan Another Code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"></div>
            
            {!isScanning && (
              <div className="text-center">
                <button
                  onClick={startScanner}
                  className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center mx-auto space-x-2"
                >
                  <Camera className="h-5 w-5" />
                  <span>{hasCamera ? 'Start Scanning' : 'Enable Camera'}</span>
                </button>
              </div>
            )}
            
            {isScanning && (
              <div className="text-center">
                <button
                  onClick={stopScanner}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};



const ClientQRCode = ({ onClose }) => {
  const qrValue = "example-order-123"; // Replace with actual order ID

  return (
    <div className="bg-white rounded-lg overflow-hidden">

      <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Order QR Code</h3>
        <button onClick={onClose} className="text-white hover:text-amber-100">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="p-8 text-center flex flex-col justify-center items-center">
        <div className="w-64 h-64 bg-white  rounded-lg flex items-center justify-center border-2 border-amber-200">
          <QrCode className="h-48 w-48 text-amber-500" />
        </div>
        <p className="mt-4 text-amber-700">Show this code to the merchant</p>
      </div>

    </div>
  );
};

const OrderTrackingPage = () => {
  const [showExternalMapModal, setShowExternalMapModal] = useState(false);
  const [showInAppMap, setShowInAppMap] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isMerchant, setIsMerchant] = useState(true); // Toggle for testing different views
  const [scanComplete, setScanComplete] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const router = useRouter();

  useEffect(() => {


    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }


    // Auto-show QR scanner after 5 seconds
    const timer = setTimeout(() => {
      if (!scanComplete) {
        setShowQRScanner(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [scanComplete]);

  const handleScanComplete = () => {
    setScanComplete(true);
    setShowQRScanner(false);
  };


  const handleTabChange = (tab) => {
    router.push(`/${tab}`);
  };


  const openGoogleMaps = () => {
    if (currentLocation) {
      const destination = `${order.merchant.location.latitude},${order.merchant.location.longitude}`;
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      alert('Unable to get your current location. Please enable location services.');
    }
  };
 
  const order = {
    id: 1,
    totalOrders: 5,
    merchant: {
      name: "John Carter",
      avatar: "../avatar.jpg",
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
      orderTotal: "8,500",
      deliveryFee: "1,200",
      total: "9,700"
    }
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              onClick={() => router.back()}
              className="h-6 w-6 cursor-pointer"
            />
            <h1 className="text-lg font-semibold">Order Details</h1>
          </div>

          {
          isMerchant ?  (
            <button
              onClick={() => setShowQRScanner(true)}
              className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ScanLine className="h-5 w-5" />
              <span>Scan QR</span>
            </button>
          )    :  
          
          (
            <button
              onClick={() => setShowQRScanner(true)}
              className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200"
            >
              <QrCode className="h-5 w-5" />
            </button>
          )
          }

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
                <MessageCircle 
                  onClick={() => handleTabChange("orders/order/chat")}
                className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-2 mb-2">
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">

            <div className="bg-amber-50 rounded-lg  mb-2 w-full pl-2 pr-2 pb-1 pt-2">
              <div className="flex items-center space-x-2 mb-3">
                <Receipt className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">Order Summary</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Order Amount</span>
                  <span className="font-medium text-amber-900">₦{order.amount.orderTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Delivery Fee</span>
                  <span className="font-medium text-amber-900">₦{order.amount.deliveryFee}</span>
                </div>
               
                <div className="border-t border-amber-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-900">Total</span>
                    <span className="font-semibold text-amber-900">₦{order.amount.total}</span>
                  </div>
                </div>
              </div>
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

              onClick={openGoogleMaps}

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
      {/* ... existing content remains unchanged ... */}

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      >
        {isMerchant ? (
          <MerchantScanner
            onClose={() => setShowQRScanner(false)}
            onScan={handleScanComplete}
          />
        ) : (
          <ClientQRCode
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </Modal>



        
      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flag className="h-6 w-6 text-amber-500" />
            <h3 className="text-lg font-semibold text-amber-900">Report Issue</h3>
          </div>
          <button
            onClick={() => setShowReportModal(false)}
            className="text-amber-500 hover:text-amber-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => alert('Reported: Delivery Delay')}
            className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50"
          >
            Delivery Delay
          </button>
          <button
            onClick={() => alert('Reported: Wrong Order Details')}
            className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50"
          >
            Wrong Order Details
          </button>
          <button
            onClick={() => alert('Reported: Payment Issue')}
            className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50"
          >
            Payment Issue
          </button>
          <button
            onClick={() => alert('Reported: Other Issue')}
            className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50"
          >
            Other Issue
          </button>
        </div>
      </Modal>



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

        {/* Added Report Button */}
        <button
            onClick={() => setShowReportModal(true)}
            className="w-full mt-4 p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200"
          >
            <Flag className="h-5 w-5" />
            <span>Report Issue</span>
          </button>

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
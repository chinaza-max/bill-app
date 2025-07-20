"use client";
import { toast, Toaster } from "sonner";
import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { XCircle } from "lucide-react";

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
  Flag,
  Clock,
  Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter, useParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import useRequest from "@/hooks/useRequest";

// Custom hook for QR scanning submission
const useQRSubmission = () => {
  const {
    data: qrSubmissionData,
    loading: qrSubmissionLoading,
    request: submitQRData,
    error: qrSubmissionError,
    errorDetail: qrErrorDetail,
  } = useRequest();

  return {
    qrSubmissionData,
    qrSubmissionLoading,
    submitQRData,
    qrSubmissionError,
    qrErrorDetail,
  };
};

// Custom hook for order cancellation
const useCancelOrder = () => {
  const {
    data: cancelData,
    loading: cancelLoading,
    request: cancelOrder,
    error: cancelError,
  } = useRequest();

  return { cancelData, cancelLoading, cancelOrder, cancelError };
};

// Custom hook for QR code generation
const useQRGeneration = () => {
  const {
    data: qrCodeData,
    loading: qrCodeLoading,
    request: generateQRCode,
    error: qrCodeError,
  } = useRequest();

  return { qrCodeData, qrCodeLoading, generateQRCode, qrCodeError };
};

// LeafletMap component with API data
const LeafletMap = ({ orderData }) => {
  const [map, setMap] = useState(null);
  const [sourceMarker, setSourceMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [route, setRoute] = useState(null);
  const [blinkInterval, setBlinkInterval] = useState(null);

  useEffect(() => {
    // console.log("LeafletMap useEffect triggered with orderData:", orderData);
    if (typeof window !== "undefined" && orderData?.userDetails) {
      const mapContainer = document.getElementById("map");
      if (mapContainer) {
        console.log(orderData.userDetails);
        const source = orderData.userDetails.sourceCoordinate;
        const destination = orderData.userDetails.destinationCoordinate;

        const newMap = L.map(mapContainer).setView(
          [parseFloat(source.lat), parseFloat(source.lng)],
          13
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(newMap);

        // Source marker (current location)
        const sourceIcon = L.divIcon({
          className: "relative",
          html: `
            <div class="bg-blue-500 text-white px-2 py-1 rounded-full font-medium text-sm whitespace-nowrap">
              Start Point
             </div>
            <div class="bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-blue-500">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const sourceMarkerInstance = L.marker(
          [parseFloat(source.lat), parseFloat(source.lng)],
          { icon: sourceIcon }
        ).addTo(newMap);

        // Destination marker (blinking)
        const createDestinationIcon = (isVisible) =>
          L.divIcon({
            className: "relative",
            html: `
            <div class="bg-red-500 text-white px-2 py-1 rounded-full font-medium text-sm whitespace-nowrap">
              Destination
            </div>
            <div class="bg-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-red-500 ${
              isVisible ? "opacity-100" : "opacity-30"
            }">
              <div class="w-3 h-3 bg-red-500 rounded-full ${
                isVisible ? "animate-pulse" : ""
              }"></div>
            </div>
          `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          });

        const destinationMarkerInstance = L.marker(
          [parseFloat(destination.lat), parseFloat(destination.lng)],
          { icon: createDestinationIcon(true) }
        ).addTo(newMap);

        // Blinking animation for destination
        let isVisible = true;
        const interval = setInterval(() => {
          isVisible = !isVisible;
          destinationMarkerInstance.setIcon(createDestinationIcon(isVisible));
        }, 1000);

        // Route line
        const routeLine = L.polyline(
          [
            [parseFloat(source.lat), parseFloat(source.lng)],
            [parseFloat(destination.lat), parseFloat(destination.lng)],
          ],
          {
            color: "#f59e0b",
            weight: 4,
            dashArray: "10, 5",
          }
        );
        routeLine.addTo(newMap);

        newMap.fitBounds(routeLine.getBounds(), { padding: [20, 20] });

        setMap(newMap);
        setSourceMarker(sourceMarkerInstance);
        setDestinationMarker(destinationMarkerInstance);
        setRoute(routeLine);
        setBlinkInterval(interval);

        return () => {
          clearInterval(interval);
          newMap.remove();
          setMap(null);
          setSourceMarker(null);
          setDestinationMarker(null);
          setRoute(null);
          setBlinkInterval(null);
        };
      }
    }
  }, [orderData]);

  return <div id="map" className="h-64 rounded-lg"></div>;
};

const MerchantScanner = ({ onClose, onScan, accessToken, orderId }) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const {
    qrSubmissionData,
    submitQRData,
    qrSubmissionLoading,
    qrSubmissionError,
    qrErrorDetail,
  } = useQRSubmission();

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setHasCamera(devices && devices.length > 0);
      })
      .catch((err) => {
        setError("Camera access denied or no cameras found");
        console.error("Camera error:", err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (qrSubmissionError || qrErrorDetail) {
      toast.custom(
        (t) => (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md shadow-md w-full max-w-md flex items-start justify-between space-x-3">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>Error Submitting QR Code</span>
              </div>
              {qrSubmissionError && (
                <p className="mt-1 text-sm">{qrSubmissionError.toString()}</p>
              )}
              {qrErrorDetail && (
                <p className="mt-1 text-xs text-red-600">
                  {qrErrorDetail.toString()}
                </p>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ),
        {
          id: "qr-error-toast",
          duration: Infinity,
          dismissible: true,
          important: true,
        }
      );
    }
  }, [qrSubmissionError]);

  useEffect(() => {
    console.log(qrSubmissionData);
    console.log(qrSubmissionData);
    console.log(qrSubmissionData);
    console.log(qrSubmissionData);
    if (qrSubmissionData) {
      console.log(qrSubmissionData);
      toast.success("QR Code submitted successfully!", {
        duration: 10000, // 10 seconds
        id: "qr-success-toast",
      });
    }
  }, [qrSubmissionData]);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await stopScanner();
          setScanSuccess(true);
          console.log(decodedText);
          // Submit QR data to API
          try {
            const body = {
              accessToken,
              apiType: "verifyCompleteOrder",
              orderId,
              hash: decodedText,
            };

            await submitQRData(`/api/user`, "POST", body);

            setTimeout(() => {
              onScan(decodedText);
            }, 1500);
          } catch (error) {
            setError("Failed to submit QR code data");
            console.error("QR submission error:", error);
          }
        },
        (errorMessage) => {
          if (errorMessage.includes("No QR code found")) {
            return;
          }
          console.error(errorMessage);
        }
      );
      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError("Failed to start camera. Please check permissions.");
      console.error("Scanner error:", err);
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
            <p className="text-lg font-medium text-green-600 mb-4">
              {qrSubmissionLoading ? "Processing..." : "Scan Successful!"}
            </p>
            <button
              onClick={handleRestartScan}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
              disabled={qrSubmissionLoading}
            >
              Scan Another Code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              id="reader"
              className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"
            ></div>

            {!isScanning && (
              <div className="text-center">
                <button
                  onClick={startScanner}
                  className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center mx-auto space-x-2"
                >
                  <Camera className="h-5 w-5" />
                  <span>{hasCamera ? "Start Scanning" : "Enable Camera"}</span>
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

const ClientQRCode = ({ onClose, orderData, accessToken }) => {
  const { generateQRCode, qrCodeData, qrCodeLoading } = useQRGeneration();
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  useEffect(() => {
    if (orderData?.orderId && accessToken) {
      try {
        // Generate QR code as data URL

        async function callfunc() {
          const url = await QRCode.toDataURL(orderData.qrCodeHash, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeUrl(url);
        }
        callfunc();
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }
  }, [orderData, accessToken]);

  useEffect(() => {
    console.log("qrCodeUrl");
    console.log(qrCodeUrl);
    console.log("qrCodeUrl");
  }, [qrCodeUrl]);

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Order QR Code</h3>
        <button onClick={onClose} className="text-white hover:text-amber-100">
          <X className="h-6 w-6" />
        </button>
      </div>
      <Toaster position="top-right" richColors />
      <div className="p-8 text-center flex flex-col justify-center items-center">
        <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center border-2 border-amber-200">
          {qrCodeLoading ? (
            <div className="text-amber-500">Generating QR Code...</div>
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Order QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <QrCode className="h-48 w-48 text-amber-500" />
          )}
        </div>
        <p className="mt-4 text-amber-700">Show this code to the merchant</p>
        <p className="mt-2 text-sm text-amber-600">
          Order ID: {orderData?.orderId}
        </p>
      </div>
    </div>
  );
};

// Order status component
const OrderStatusBadge = ({ status, startTime, endTime }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":
        return { color: "bg-yellow-100 text-yellow-800", text: "Pending" };
      case "inProgress":
        return { color: "bg-blue-100 text-blue-800", text: "In Progress" };
      case "completed":
        return { color: "bg-green-100 text-green-800", text: "Completed" };
      case "rejected":
        return { color: "bg-red-100 text-red-800", text: "Rejected" };
      case "cancelled":
        return { color: "bg-gray-100 text-gray-800", text: "Cancelled" };
      default:
        return { color: "bg-gray-100 text-gray-800", text: "Unknown" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="space-y-2">
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.text}
      </span>

      {startTime && (
        <div className="flex items-center space-x-2 text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          <span>Started: {new Date(startTime).toLocaleString()}</span>
        </div>
      )}

      {endTime && status === "completed" && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Completed: {new Date(endTime).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

const OrderTrackingPage = () => {
  const [showExternalMapModal, setShowExternalMapModal] = useState(false);
  const [showInAppMap, setShowInAppMap] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isMerchant, setIsMerchant] = useState(true);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [userType, setUserType] = useState("");

  const accessToken = useSelector((state) => state.user.accessToken);
  const {
    data: OrderDetails,
    loading: loadingFetchOrderDetails,
    request: fetchOrderDetails,
    error: errorFetchOrderDetails,
  } = useRequest();

  const { cancelOrder, cancelLoading } = useCancelOrder();
  const params = useParams();
  const orderId = params?.orderId;
  const router = useRouter();

  useEffect(() => {
    const storedUserType = localStorage.getItem("who");
    if (storedUserType) {
      setUserType(storedUserType);
      setIsMerchant(storedUserType === "merchant");
    } else {
      setUserType("merchant");
      setIsMerchant(true);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (accessToken && userType) {
      const queryParams = new URLSearchParams({
        token: accessToken,
        apiType: "getMyOrderDetails",
        userType: userType,
        orderId,
      }).toString();

      fetchOrderDetails(`/api/user?${queryParams}`, "GET");
    }
  }, [accessToken, userType, orderId]);

  const handleScanComplete = () => {
    setScanComplete(true);
    setShowQRScanner(false);
  };

  const handleTabChange = (tab) => {
    router.push(`/${tab}`);
  };

  const openGoogleMaps = () => {
    if (
      OrderDetails?.data?.data.orderDetails.userDetails.destinationCoordinate
    ) {
      const destination =
        OrderDetails?.data?.data.orderDetails.userDetails.destinationCoordinate;
      const destString = `${destination.lat},${destination.lng}`;

      let url;
      if (currentLocation) {
        const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destString}&travelmode=driving`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${destString}`;
      }

      window.open(url, "_blank");
    } else {
      alert("Destination coordinates not available.");
    }
  };

  const handleCancelOrder = async () => {
    try {
      const body = {
        accessToken,
        apiType: "orderAcceptOrCancel",
        orderId: orderId,
        type: "cancel",
      };

      await cancelOrder(`/api/user`, "POST", body);
      setShowCancelOrderModal(false);

      // Refresh order details
      const refreshParams = new URLSearchParams({
        token: accessToken,
        apiType: "getMyOrderDetails",
        userType: userType,
        orderId,
      }).toString();

      fetchOrderDetails(`/api/user?${refreshParams}`, "GET");
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  if (loadingFetchOrderDetails) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-amber-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-amber-700">Loading order details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (errorFetchOrderDetails) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-amber-50">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Failed to load order details</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const orderData = OrderDetails?.data?.data?.orderDetails;
  console.log("Order Data:", orderData);
  return (
    <ProtectedRoute>
      <div
        className="flex flex-col h-screen bg-amber-50"
        style={{ paddingBottom: "700px" }}
      >
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

            {isMerchant ? (
              <button
                onClick={() => setShowQRScanner(true)}
                className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ScanLine className="h-5 w-5" />
                <span>Scan QR</span>
              </button>
            ) : (
              <button
                onClick={() => setShowQRScanner(true)}
                className="p-2 bg-amber-100 rounded-full text-black hover:bg-amber-200"
              >
                <QrCode className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-16 px-4 pb-4">
          <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            {/* Order Status */}
            <div className="mb-4">
              <OrderStatusBadge
                status={orderData?.orderStatus}
                startTime={orderData?.startTime}
                endTime={orderData?.endTime}
              />
            </div>

            {/* User Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <img
                      src={
                        orderData?.userDetails?.image || "/default-avatar.png"
                      }
                      alt={orderData?.userDetails?.displayname || "User"}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                  </div>
                  {orderData?.isOnline && (
                    <div className="absolute -bottom-1 -right-1">
                      <Circle className="h-4 w-4 fill-green-500 text-green-500" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-amber-900">
                      {orderData?.userDetails?.displayname || "Unknown User"}
                    </h3>
                  </div>
                  <p className="text-sm text-amber-600">
                    Order ID: {orderData?.orderId}
                  </p>
                </div>
              </div>

              {/* Communication Icons */}
              <div className="flex space-x-3">
                <a
                  href={`tel:${orderData?.userDetails?.tel || "08184724615"}`}
                  className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200"
                >
                  <Phone className="h-5 w-5" />
                </a>

                <button
                  onClick={() =>
                    handleTabChange(
                      `orders/${orderData?.id}/${Math.min(
                        orderData?.clientId,
                        orderData?.merchantId
                      )}-${Math.max(
                        orderData?.clientId,
                        orderData?.merchantId
                      )}room/chat`
                    )
                  }
                  className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <div className="bg-amber-50 rounded-lg mb-2 w-full pl-2 pr-2 pb-1 pt-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Receipt className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">
                      Order Summary
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Order Amount</span>
                      <span className="font-medium text-amber-900">
                        ₦{orderData?.amountOrder || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Distance</span>
                      <span className="font-medium text-amber-900">
                        {orderData?.distance || "0"} km
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Estimated Time</span>
                      <span className="font-medium text-amber-900">
                        {orderData?.estimatedDeliveryTime || "N/A"}
                      </span>
                    </div>
                  </div>
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
                <Navigation className="h-5 w-5" />
                <span>Navigate with Google Maps</span>
              </button>
            </div>

            {/* Cancel Order Button - Only show if order can be cancelled */}
            {orderData?.orderStatus === "pending" ||
            orderData?.orderStatus === "inProgress" ? (
              <button
                onClick={() => setShowCancelOrderModal(true)}
                className="w-full mt-4 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Order"}
              </button>
            ) : null}
          </div>
        </div>

        {/* QR Scanner Modal */}
        <Modal isOpen={showQRScanner} onClose={() => setShowQRScanner(false)}>
          {isMerchant ? (
            <MerchantScanner
              onClose={() => setShowQRScanner(false)}
              onScan={handleScanComplete}
              accessToken={accessToken}
              orderId={orderData?.id}
            />
          ) : (
            <ClientQRCode
              onClose={() => setShowQRScanner(false)}
              orderData={orderData}
              accessToken={accessToken}
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
              <h3 className="text-lg font-semibold text-amber-900">
                Report Issue
              </h3>
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
              onClick={() => router.push(`/orders/order/complain`)}
              className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50"
            >
              Delivery Delay
            </button>
            <button
              onClick={() => router.push(`/orders/order/complain`)}
              className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50"
            >
              Wrong Order Details
            </button>
            <button
              onClick={() => router.push(`/orders/order/complain`)}
              className="w-full p-3 text-left border border-amber-200 rounded-lg hover:bg-amber-50"
            >
              Payment Issue
            </button>
            <button
              onClick={() => router.push(`/orders/order/complain`)}
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
              <h3 className="text-lg font-semibold text-amber-900">
                Leave App?
              </h3>
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
              onClick={() => {
                window.open("https://maps.google.com", "_blank");
              }}
              className="flex-1 p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              Continue
            </button>
          </div>
        </Modal>

        {/* In-App Map Modal */}
        <Modal isOpen={showInAppMap} onClose={() => setShowInAppMap(false)}>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-900">
              Live Tracking
            </h3>
            <button
              onClick={() => setShowInAppMap(false)}
              className="text-amber-500 hover:text-amber-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <LeafletMap orderData={orderData} />
        </Modal>

        {/* Added Report Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg z-10">
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full p-3 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center space-x-2 hover:bg-amber-200"
          >
            <Flag className="h-5 w-5" />
            <span>Report Issue</span>
          </button>
        </div>

        {/* Cancel Order Confirmation Modal */}
        <Modal
          isOpen={showCancelOrderModal}
          onClose={() => setShowCancelOrderModal(false)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-amber-900">
                Cancel Order
              </h3>
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
              onClick={() => handleCancelOrder()}
              className="flex-1 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Yes, Cancel Order
            </button>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
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

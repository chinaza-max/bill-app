"use client";

import React, { useState, useEffect } from "react";

import {
  ArrowLeft,
  Package,
  User,
  ExternalLink,
  Clock,
  MapPin,
  ShoppingBag,
  Check,
  X,
  Copy,
  CheckCircle,
  Loader,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import useRequest from "@/hooks/useRequest";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import Link from "next/link";
// Toast Notification Component
const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  const icon =
    type === "success" ? (
      <CheckCircle className="h-5 w-5" />
    ) : type === "error" ? (
      <AlertCircle className="h-5 w-5" />
    ) : (
      <AlertCircle className="h-5 w-5" />
    );

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div
        className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm`}
      >
        {icon}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Rejection Reason Modal Component
const RejectionModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason.trim());
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reject Order
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Please provide a reason for rejecting this order..."
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !reason.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span>{isLoading ? "Rejecting..." : "Reject Order"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ClientEmptyState = ({ router }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
      <ShoppingBag className="h-8 w-8 text-amber-600" />
    </div>
    <h3 className="text-xl font-semibold text-amber-900 mb-2">No Orders Yet</h3>
    <p className="text-amber-600 mb-6 max-w-sm">
      Looks like you dont have any active orders, start one now
    </p>
    <button
      onClick={() => router.push(`/p2p/`)}
      className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
    >
      Order Now
    </button>
  </div>
);

const MerchantEmptyState = () => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
      <Package className="h-8 w-8 text-amber-600" />
    </div>
    <h3 className="text-xl font-semibold text-amber-900 mb-2">No Orders</h3>
    <p className="text-amber-600 mb-6 max-w-sm">
      You have no orders yet. New orders will appear here when customers place
      them.
    </p>
  </div>
);

const OrderCard = ({
  order,
  userType,
  onAcknowledgeOrder,
  onRejectOrder,
  router,
  isProcessing,
}) => {
  const [copied, setCopied] = useState(false);

  const handleAccept = () => {
    onAcknowledgeOrder(order.id, "accept");
  };

  const handleReject = () => {
    onRejectOrder(order.id);
  };

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy order ID:", err);
    }
  };

  const formatOrderStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-600";
      case "accepted":
        return "bg-green-100 text-green-600";
      case "completed":
        return "bg-blue-100 text-blue-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      case "rejected":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const showActionButtons =
    userType === "merchant" && order.orderStatus === "pending" && !isProcessing;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mx-2 sm:mx-0 transition-all duration-200 hover:shadow-lg">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-amber-900 text-sm sm:text-base">
              {userType === "client" ? "Merchant" : "Customer"}
            </h3>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                order.orderStatus
              )}`}
            >
              {formatOrderStatus(order.orderStatus)}
            </span>
          </div>
        </div>

        {/* Amount and Order ID Section */}
        <div className="flex items-center justify-between sm:block sm:text-right">
          <div className="text-lg font-semibold text-amber-900">
            ₦{order.amountOrder?.toLocaleString() || "0"}
          </div>
          <div className="flex items-center space-x-1 text-sm text-amber-600">
            <span>#{order.orderId}</span>
            <button
              onClick={handleCopyOrderId}
              className="p-1 hover:bg-amber-100 rounded transition-colors"
              title="Copy Order ID"
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Distance, Time and View More Section - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center space-x-1 text-amber-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                Estimated distance from you: {order.distance} km
              </span>
            </div>
            <div className="flex items-center space-x-1 text-amber-600">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                Estimated time from you: {order.transactionTime}
              </span>
            </div>
          </div>

          <Link
            // onClick={() => router.push(`/orders/${order.id}`)}
            href={`/orders/${order.id}`}
            prefetch={true}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors w-full sm:w-auto"
          >
            <span className="text-sm font-medium">View More</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Order Details - Payment Status Only */}
        <div className="bg-amber-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-900">
              Payment Status:
            </span>
            <span
              className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                order.moneyStatus === "received"
                  ? "bg-green-100 text-green-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {order.moneyStatus === "received" ? "Paid" : "Pending"}
            </span>
          </div>
          {order.note && order.note !== "0" && (
            <div className="text-sm text-amber-700 mt-3 pt-3 border-t border-amber-200">
              <span className="font-medium">Note:</span> {order.note}
            </div>
          )}
        </div>

        {/* Action Buttons for Merchants */}
        {showActionButtons && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isProcessing ? "Processing..." : "Accept Order"}
              </span>
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Reject Order</span>
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <Loader className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">
              Processing your request...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderListPage = () => {
  const [userType, setUserType] = useState("");
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [toast, setToast] = useState({
    message: "",
    type: "",
    isVisible: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const accessToken = useSelector((state) => state.user.accessToken);

  // Hook for fetching orders
  const {
    data: orderResponse,
    loading: loadingOrder,
    request: fetchOrder,
    error: orderError,
  } = useRequest();

  // Hook for accept/reject orders
  const {
    data: actionResponse,
    loading: loadingAction,
    request: orderAction,
    error: actionError,
  } = useRequest();

  const router = useRouter();

  // Extract orders from the API response
  const orders = orderResponse?.data?.data || [];

  // Function to show toast notifications
  const showToast = (message, type = "info") => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Function to fetch orders
  const fetchOrders = async (showRefreshIndicator = false) => {
    if (accessToken && userType) {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }

      try {
        const queryParams = new URLSearchParams({
          token: accessToken,
          apiType: "getMyOrders",
          userType: userType,
          type: "active",
        }).toString();

        await fetchOrder(`api/user?${queryParams}`, "GET");

        if (showRefreshIndicator) {
          showToast("Orders refreshed successfully", "success");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (showRefreshIndicator) {
          showToast("Failed to refresh orders", "error");
        }
      } finally {
        if (showRefreshIndicator) {
          setIsRefreshing(false);
        }
      }
    }
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  useEffect(() => {
    const storedUserType = localStorage.getItem("who");

    if (storedUserType) {
      setUserType(storedUserType);
    } else {
      setUserType("merchant"); // Fallback to merchant if there's no value in localStorage
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [accessToken, userType]);

  useEffect(() => {
    console.log("Order data fetched:", orderResponse);
  }, [orderResponse]);

  // Handle API errors
  useEffect(() => {
    if (orderError) {
      console.error("Order fetch error:", orderError);
      showToast("Failed to fetch orders. Please try again.", "error");
    }
  }, [orderError]);

  useEffect(() => {
    if (actionError) {
      setTimeout(() => {
        fetchOrders();
      }, 1000);

      showToast(`${actionError}`, "error");
      setProcessingOrderId(null);
      setShowRejectionModal(false);
      setSelectedOrderId(null);
    }
  }, [actionError]);

  // Handle API response for accept/reject actions
  useEffect(() => {
    console.log("Action response received:", actionResponse);
    if (actionResponse) {
      console.log("Order action response:", actionResponse);

      setTimeout(() => {
        fetchOrders();
      }, 1000);
      // Reset processing state
      setProcessingOrderId(null);
      setShowRejectionModal(false);
      setSelectedOrderId(null);

      // Show success/error message
      // if (actionResponse.success) {
      const message =
        actionResponse.message || "Order status updated successfully";
      showToast(message, "success");
      /*} else {
        const errorMessage =
          actionResponse.message || "Failed to update order status";
        showToast(errorMessage, "error");
      }*/
    }
  }, [actionResponse]);

  const handleAcknowledgeOrder = async (orderId, action = "accept") => {
    console.log(
      `${action === "accept" ? "Accepting" : "Rejecting"} order ${orderId}`
    );

    // Set processing state
    setProcessingOrderId(orderId);

    try {
      // Prepare request body
      const requestBody = {
        apiType: "orderAcceptOrCancel",
        accessToken,
        orderId: orderId,
        type: action,
      };

      // Make POST request
      await orderAction("/api/user", "POST", requestBody);
    } catch (error) {
      console.error(`Error ${action}ing order:`, error);
      setProcessingOrderId(null);
      showToast(`Failed to ${action} order. Please try again.`, "error");
    }
  };

  const handleRejectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setShowRejectionModal(true);
  };

  const handleRejectionSubmit = async (reason) => {
    if (!selectedOrderId) return;

    console.log(`Rejecting order ${selectedOrderId} with reason: ${reason}`);

    // Set processing state
    setProcessingOrderId(selectedOrderId);

    try {
      // Prepare request body with reason
      const requestBody = {
        apiType: "orderAcceptOrCancel",
        accessToken,
        orderId: selectedOrderId,
        type: "reject",
        reason: reason,
      };

      // Make POST request
      await orderAction("/api/user", "POST", requestBody);
    } catch (error) {
      console.error("Error rejecting order:", error);
      setProcessingOrderId(null);
      setShowRejectionModal(false);
      setSelectedOrderId(null);
      showToast("Failed to reject order. Please try again.", "error");
    }
  };

  const handleCloseRejectionModal = () => {
    if (!loadingAction) {
      setShowRejectionModal(false);
      setSelectedOrderId(null);
    }
  };

  if (loadingOrder && !orders.length) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-screen bg-amber-50">
          <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ArrowLeft
                  onClick={() => router.back()}
                  className="h-6 w-6 cursor-pointer"
                />
                <h1 className="text-lg font-semibold">
                  {userType === "client" ? "My Orders" : "My Orders"}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex-1 pt-16 px-4 pb-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-amber-600">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Loading orders...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />

        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <ArrowLeft
                onClick={() => router.back()}
                className="h-6 w-6 cursor-pointer flex-shrink-0"
              />
              <h1 className="text-lg font-semibold truncate">
                {userType === "client" ? "My Orders" : "My Orders"}
              </h1>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loadingOrder}
                className="p-2 hover:bg-amber-400/30 rounded-full transition-colors disabled:opacity-50"
                title="Refresh orders"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
              <Package className="h-5 w-5" />
              <div className="bg-amber-400/30 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">
                  {orders.length} Orders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-16 pb-4 overflow-y-auto">
          {orders.length === 0 ? (
            userType === "client" ? (
              <ClientEmptyState router={router} />
            ) : (
              <MerchantEmptyState />
            )
          ) : (
            <div className="space-y-4 mt-4 px-2 sm:px-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  userType={userType}
                  onAcknowledgeOrder={handleAcknowledgeOrder}
                  onRejectOrder={handleRejectOrder}
                  router={router}
                  isProcessing={processingOrderId === order.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        <RejectionModal
          isOpen={showRejectionModal}
          onClose={handleCloseRejectionModal}
          onSubmit={handleRejectionSubmit}
          isLoading={loadingAction && processingOrderId === selectedOrderId}
        />
      </div>
    </ProtectedRoute>
  );
};

export default OrderListPage;

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Package,
  User,
  ExternalLink,
  Clock,
  MapPin,
  Check,
  X,
  Copy,
  CheckCircle,
  Loader,
  ChevronDown,
  Filter,
} from "lucide-react";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Status Dropdown Component
const StatusDropdown = ({ selectedStatuses, onStatusChange, orderCounts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const statusOptions = [
    {
      id: "all",
      label: "All Orders",
      count: Object.values(orderCounts).reduce((a, b) => a + b, 0),
    },
    { id: "pending", label: "Pending", count: orderCounts.pending },
    { id: "inProgress", label: "In Progress", count: orderCounts.inProgress },
    { id: "completed", label: "Completed", count: orderCounts.completed },
    { id: "cancelled", label: "Cancelled", count: orderCounts.cancelled },
    { id: "rejected", label: "Rejected", count: orderCounts.rejected },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusToggle = (statusId) => {
    if (statusId === "all") {
      // If "All" is selected, clear all other selections
      onStatusChange(["all"]);
    } else {
      let newSelectedStatuses = [...selectedStatuses];

      // Remove "all" if it's selected and we're selecting a specific status
      if (newSelectedStatuses.includes("all")) {
        newSelectedStatuses = newSelectedStatuses.filter((s) => s !== "all");
      }

      if (newSelectedStatuses.includes(statusId)) {
        // Remove the status if it's already selected
        newSelectedStatuses = newSelectedStatuses.filter((s) => s !== statusId);

        // If no statuses are selected, default to "all"
        if (newSelectedStatuses.length === 0) {
          newSelectedStatuses = ["all"];
        }
      } else {
        // Add the status
        newSelectedStatuses.push(statusId);
      }

      onStatusChange(newSelectedStatuses);
    }
  };

  const getDisplayText = () => {
    if (selectedStatuses.includes("all")) {
      return "All Orders";
    }

    if (selectedStatuses.length === 1) {
      const status = statusOptions.find((s) => s.id === selectedStatuses[0]);
      return status?.label || "Select Status";
    }

    return `${selectedStatuses.length} Statuses Selected`;
  };

  const getSelectedCount = () => {
    if (selectedStatuses.includes("all")) {
      return Object.values(orderCounts).reduce((a, b) => a + b, 0);
    }

    return selectedStatuses.reduce((total, statusId) => {
      return total + (orderCounts[statusId] || 0);
    }, 0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors min-w-0 flex-1 sm:flex-none sm:min-w-[200px]"
      >
        <Filter className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm font-medium text-amber-900 truncate">
          {getDisplayText()}
        </span>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
            {getSelectedCount()}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-amber-600 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-72 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-100">
              Select Order Status
            </div>
            {statusOptions.map((status) => (
              <div
                key={status.id}
                onClick={() => handleStatusToggle(status.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  selectedStatuses.includes(status.id)
                    ? "bg-amber-50 border border-amber-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedStatuses.includes(status.id)
                        ? "bg-amber-500 border-amber-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedStatuses.includes(status.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      selectedStatuses.includes(status.id)
                        ? "font-medium text-amber-900"
                        : "text-gray-700"
                    }`}
                  >
                    {status.label}
                  </span>
                </div>
                {status.count > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      selectedStatuses.includes(status.id)
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status.count}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => onStatusChange(["all"])}
                className="flex-1 px-3 py-2 text-xs bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Rejection Reason Popup Component
const RejectionPopup = ({ isOpen, onClose, onConfirm, isProcessing }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim());
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
          <p className="text-sm text-gray-600 mb-4">
            Please provide a reason for rejecting this order:
          </p>

          <form onSubmit={handleSubmit}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows="4"
              maxLength="500"
              disabled={isProcessing}
              required
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {reason.length}/500 characters
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !reason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span>Reject Order</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Simplified useRequest hook
const useRequest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (url, method = "GET", body = null) => {
    setLoading(true);
    setError(null);

    try {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body && method !== "GET") {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      console.error("Request error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, request };
};

// Empty State Component
const EmptyState = ({ selectedStatuses, userType, router }) => {
  const getEmptyMessage = () => {
    if (selectedStatuses.includes("all")) {
      return {
        title: "No Orders Yet",
        message:
          userType === "client"
            ? "Looks like you dont have any orders, start one now"
            : "You have no orders yet. New orders will appear here when customers place them.",
        showAction: userType === "client",
      };
    }

    const statusLabels = {
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      rejected: "Rejected",
    };

    const selectedLabels = selectedStatuses
      .map((status) => statusLabels[status])
      .filter(Boolean);
    const statusText =
      selectedLabels.length > 1 ? "Selected Statuses" : selectedLabels[0];

    return {
      title: `No ${statusText} Orders`,
      message: `No orders found for the selected status${
        selectedStatuses.length > 1 ? "es" : ""
      }.`,
      showAction: userType === "client" && selectedStatuses.includes("pending"),
    };
  };

  const { title, message, showAction } = getEmptyMessage();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <Package className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-semibold text-amber-900 mb-2">{title}</h3>
      <p className="text-amber-600 mb-6 max-w-sm">{message}</p>
      {showAction && (
        <button
          onClick={() => router.push(`/p2p/`)}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Order Now
        </button>
      )}
    </div>
  );
};

// Order Card Component
const OrderCard = ({
  order,
  userType,
  onAcknowledgeOrder,
  onRejectOrder,
  router,
  isProcessing,
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAccept = () => {
    onAcknowledgeOrder(order.id, "accept");
    setIsAcknowledged(true);
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
    const statusMap = {
      inProgress: "In Progress",
      cancelled: "Cancelled",
      rejected: "Rejected",
      completed: "Completed",
      pending: "Pending",
    };
    return (
      statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1)
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-600";
      case "inProgress":
        return "bg-blue-100 text-blue-600";
      case "completed":
        return "bg-green-100 text-green-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      case "rejected":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

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
              <span className="text-sm">Distance: {order.distance} km</span>
            </div>
            <div className="flex items-center space-x-1 text-amber-600">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Time: {order.transactionTime}</span>
            </div>
          </div>

          <Link
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
                  : order.moneyStatus === "refunded"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {order.moneyStatus === "received"
                ? "Paid"
                : order.moneyStatus === "refunded"
                ? "Refunded"
                : "Pending"}
            </span>
          </div>
          {order.note && order.note !== "0" && (
            <div className="text-sm text-amber-700 mt-3 pt-3 border-t border-amber-200">
              <span className="font-medium">Note:</span> {order.note}
            </div>
          )}
        </div>

        {/* Action Buttons for Merchants */}
        {userType === "merchant" &&
          !isAcknowledged &&
          order.orderStatus === "pending" && (
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
      </div>
    </div>
  );
};

// Main Orders Navigation Page Component
const OrdersNavigationPage = () => {
  const [selectedStatuses, setSelectedStatuses] = useState(["all"]);
  const [userType, setUserType] = useState("");
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionOrderId, setRejectionOrderId] = useState(null);
  const accessToken = useSelector((state) => state.user.accessToken);

  // Simplified hooks
  const {
    data: orderResponse,
    loading: loadingOrder,
    request: fetchOrder,
  } = useRequest();
  const {
    data: actionResponse,
    loading: loadingAction,
    request: orderAction,
    error: actionError,
  } = useRequest();

  const router = useRouter();

  // Extract orders from the API response
  const orders = orderResponse?.data?.data || [];

  // Get user type from localStorage on mount
  useEffect(() => {
    const storedUserType = localStorage.getItem("who") || "merchant";
    setUserType(storedUserType);

    // Load saved status selection
    const savedStatuses = localStorage.getItem("selectedOrderStatuses");
    if (savedStatuses) {
      try {
        const parsed = JSON.parse(savedStatuses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedStatuses(parsed);
        }
      } catch (error) {
        console.error("Error parsing saved statuses:", error);
      }
    }
  }, []);

  useEffect(() => {
    //router.prefetch("orders/3");
    if (!orders || orders.length === 0) return;

    orders.forEach((order) => {
      router.prefetch(`/orders/${order.id}`);
    });
  }, [router, orders]);

  // Save selected statuses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "selectedOrderStatuses",
      JSON.stringify(selectedStatuses)
    );
  }, [selectedStatuses]);

  useEffect(() => {
    if (actionError) {
      setTimeout(() => {
        fetchOrders();
      }, 1000);
      // showToast(`${actionError}`, "error"); // Uncomment if you have toast functionality
      setProcessingOrderId(null);
    }
  }, [actionError]);

  // Fetch orders when userType changes
  useEffect(() => {
    if (userType && accessToken) {
      fetchOrders();
    }
  }, [userType, accessToken]);

  // Handle action response
  useEffect(() => {
    if (actionResponse) {
      console.log("Action response received:", actionResponse);
      fetchOrders();
      // Always reset processing state
      setProcessingOrderId(null);
      setShowRejectionPopup(false);
      setRejectionOrderId(null);
    }
  }, [actionResponse]);

  const fetchOrders = () => {
    if (!userType || !accessToken) return;

    const queryParams = new URLSearchParams({
      token: accessToken,
      apiType: "getMyOrders",
      userType: userType,
      type: "all",
    }).toString();

    console.log("Fetching orders with params:", queryParams);
    fetchOrder(`/api/user?${queryParams}`);
  };

  const getOrderCounts = () => {
    const counts = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
    };

    orders.forEach((order) => {
      counts[order.orderStatus] = (counts[order.orderStatus] || 0) + 1;
    });

    return counts;
  };

  const getFilteredOrders = () => {
    if (selectedStatuses.includes("all")) {
      return orders;
    }
    return orders.filter((order) =>
      selectedStatuses.includes(order.orderStatus)
    );
  };

  const handleStatusChange = (newSelectedStatuses) => {
    setSelectedStatuses(newSelectedStatuses);
  };

  const handleAcknowledgeOrder = async (orderId, action = "accept") => {
    console.log(`${action}ing order:`, orderId);
    setProcessingOrderId(orderId);

    try {
      const requestBody = {
        apiType: "orderAcceptOrCancel",
        accessToken,
        orderId: orderId,
        type: action,
      };

      console.log("Sending request:", requestBody);
      await orderAction("/api/user", "POST", requestBody);
    } catch (error) {
      console.error(`Error ${action}ing order:`, error);
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = (orderId) => {
    console.log("Opening rejection popup for order:", orderId);
    setRejectionOrderId(orderId);
    setShowRejectionPopup(true);
  };

  const handleConfirmRejection = async (reason) => {
    console.log("Confirming rejection with reason:", reason);
    setProcessingOrderId(rejectionOrderId);

    try {
      const requestBody = {
        apiType: "orderAcceptOrCancel",
        accessToken,
        orderId: rejectionOrderId,
        type: "reject",
        reason: reason,
      };

      console.log("Sending rejection request:", requestBody);
      await orderAction("/api/user", "POST", requestBody);
    } catch (error) {
      console.error("Error rejecting order:", error);
      setProcessingOrderId(null);
      setShowRejectionPopup(false);
      setRejectionOrderId(null);
    }
  };

  const handleCloseRejectionPopup = () => {
    console.log("Closing rejection popup");
    setShowRejectionPopup(false);
    setRejectionOrderId(null);
  };

  if (loadingOrder) {
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
                <h1 className="text-lg font-semibold">Orders</h1>
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

  const filteredOrders = getFilteredOrders();
  const orderCounts = getOrderCounts();

  const getHeaderTitle = () => {
    if (selectedStatuses.includes("all")) {
      return "All Orders";
    }

    if (selectedStatuses.length === 1) {
      const statusLabels = {
        pending: "Pending",
        inProgress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        rejected: "Rejected",
      };
      return `${statusLabels[selectedStatuses[0]]} Orders`;
    }

    return "Filtered Orders";
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <ArrowLeft
                onClick={() => router.back()}
                className="h-6 w-6 cursor-pointer flex-shrink-0"
              />
              <h1 className="text-lg font-semibold truncate">
                {getHeaderTitle()}
              </h1>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Package className="h-5 w-5" />
              <div className="bg-amber-400/30 px-3 py-1 rounded-full">
                <span className="text-sm font-medium">
                  {filteredOrders.length} Orders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter Dropdown */}
        <div className="fixed top-16 left-0 right-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <StatusDropdown
            selectedStatuses={selectedStatuses}
            onStatusChange={handleStatusChange}
            orderCounts={orderCounts}
          />
        </div>

        {/* Main Content Scrollable Section */}
        <div className="flex-1 overflow-y-auto pt-[144px] pb-4 px-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <EmptyState
              selectedStatuses={selectedStatuses}
              userType={userType}
              router={router}
            />
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userType={userType}
                onAcknowledgeOrder={handleAcknowledgeOrder}
                onRejectOrder={handleRejectOrder}
                router={router}
                isProcessing={processingOrderId === order.id && loadingAction}
              />
            ))
          )}
        </div>

        {/* Rejection Reason Modal */}
        <RejectionPopup
          isOpen={showRejectionPopup}
          onClose={handleCloseRejectionPopup}
          onConfirm={handleConfirmRejection}
          isProcessing={processingOrderId === rejectionOrderId && loadingAction}
        />
      </div>
    </ProtectedRoute>
  );
};

export default OrdersNavigationPage;

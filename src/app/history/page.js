"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";

import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Copy,
  Check,
  Search,
  PackageX,
  Receipt,
  RefreshCcw,
  Flag,
  User,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import useRequest from "@/hooks/useRequest";
import { useSelector } from "react-redux";

const HistoryPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const accessToken = useSelector((state) => state.user.accessToken);

  const {
    data: TransactionResponse,
    loading: loadingGetAllTransaction,
    request: getAllTransaction,
  } = useRequest();

  const {
    data: OrderResponse,
    loading: loadingGetAllOrder,
    request: getAllOrder,
  } = useRequest();

  useEffect(() => {
    if (accessToken) {
      // console.log("Fetching order history with access token:", accessToken);
      const queryParams = new URLSearchParams({
        token: accessToken,
        apiType: "getTransactionHistoryOrder",
      }).toString();

      getAllOrder(`/api/user?${queryParams}`);

      const queryParams2 = new URLSearchParams({
        token: accessToken,
        apiType: "getGeneralTransaction",
      }).toString();
      getAllTransaction(`/api/user?${queryParams2}`);
    }
  }, [accessToken]);

  // Process Order API data
  const processOrderData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    return apiData.map((item) => ({
      id: item.id,
      transactionId: `TXN${item.id}`,
      merchantName: item.merchantDetails?.name || "Unknown Merchant",
      merchantImage: item.merchantDetails?.imageUrl || null,
      amount: item.amount || 0,
      orderAmount: item.orderDetails?.amountOrder || 0,
      orderStatus: item.orderDetails?.orderStatus || "pending",
      paymentStatus: item.paymentStatus || "pending",
      transactionType: item.transactionType || "order",
      timestamp: item.createdAt || new Date().toISOString(),
      orderId: item.orderDetails?.id || null,
    }));
  };

  // Process General Transaction API data
  const processTransactionData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    return apiData.map((item) => ({
      id: item.id,
      transactionId: `TXN${item.id}`,
      title: item.title || "Transaction",
      initials: item.initials || "TX",
      amount: parseFloat(item.amount?.replace(/[₦,\s]/g, "") || "0"),
      type: item.type || "general", // incoming/outgoing
      paymentStatus: item.paymentStatus || "pending",
      timestamp: item.date
        ? `${item.date}T00:00:00Z`
        : new Date().toISOString(),
      description: item.title || "General Transaction",
    }));
  };

  console.log("OrderResponse data:", OrderResponse?.data);
  console.log("TransactionResponse data:", TransactionResponse?.data);

  const orders = processOrderData(OrderResponse?.data?.data || []);
  const transactions = processTransactionData(
    TransactionResponse?.data?.data || []
  );

  const handleReport = (path) => {
    router.push(path);
  };

  const handleBack = () => {
    router.back();
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [expandedOrder, setExpandedOrder] = useState(null);

  const EmptyState = ({ type }) => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-6 rounded-2xl mb-6 shadow-sm">
        {type === "orders" ? (
          <PackageX className="h-12 w-12 sm:h-16 sm:w-16 text-amber-600 mx-auto" />
        ) : (
          <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-amber-600 mx-auto" />
        )}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-amber-900 mb-3">
        {type === "orders" ? "No Orders Yet" : "No Transactions Yet"}
      </h3>
      <p className="text-sm sm:text-base text-amber-600 mb-8 max-w-sm leading-relaxed">
        {type === "orders"
          ? "You haven't placed any orders yet. Start ordering to see your history here."
          : "You haven't made any transactions yet. Your transaction history will appear here."}
      </p>
      <button
        onClick={() => router.push("/")}
        className="flex items-center space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <RefreshCcw className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="font-medium text-sm sm:text-base">
          {type === "orders" ? "Place an Order" : "Make a Transaction"}
        </span>
      </button>
    </div>
  );

  // Filter items based on search term and date range
  const getFilteredItems = () => {
    const items = activeTab === "orders" ? orders : transactions;

    return items.filter((item) => {
      const searchMatch =
        searchTerm === "" ||
        (activeTab === "orders"
          ? item.merchantName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
          : item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.transactionId
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));

      const itemDate = new Date(item.timestamp);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;

      const dateMatch =
        (!startDate || itemDate >= startDate) &&
        (!endDate || itemDate <= endDate);

      return searchMatch && dateMatch;
    });
  };

  const getCurrentItems = () => {
    const filteredItems = getFilteredItems();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredItems.slice(
      indexOfFirstItem,
      indexOfFirstItem + itemsPerPage
    );
  };

  const filteredItems = getFilteredItems();
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "successful":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled":
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const OrderCard = ({ order }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-100 mb-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm">
              {order.merchantImage ? (
                <img
                  src={order.merchantImage}
                  alt={order.merchantName}
                  className="w-full h-full rounded-xl sm:rounded-2xl object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-amber-700 font-bold text-sm sm:text-lg ${
                  order.merchantImage ? "hidden" : "flex"
                }`}
              >
                {order.merchantName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 text-base sm:text-lg truncate mb-1">
              {order.merchantName}
            </h3>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 font-medium">
                  Order Status:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 font-medium">
                  Payment Status:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-amber-600">
              Order #{order.orderId}
            </div>
          </div>
        </div>

        <button
          onClick={() => handleReport("orders/order/complain")}
          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200 flex-shrink-0"
          title="Report Issue"
        >
          <Flag className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="text-xs sm:text-sm text-amber-600 font-medium">
              Order Amount
            </p>
            <p className="text-lg sm:text-2xl font-bold text-amber-900">
              ₦{order.orderAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-amber-600 font-medium">
              Total Paid
            </p>
            <p className="text-base sm:text-lg font-semibold text-amber-800">
              ₦{order.amount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expandedOrder === order.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-amber-100 pt-4 mb-4"
          >
            <div className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-3 bg-amber-50 rounded-lg gap-2">
                <span className="text-amber-600 font-medium">
                  Transaction ID
                </span>
                <button
                  onClick={() => handleCopyId(order.transactionId)}
                  className="flex items-center space-x-1 text-amber-700 hover:text-amber-800"
                >
                  {copiedId === order.transactionId ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="font-mono text-xs break-all">
                    {order.transactionId}
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-3 bg-amber-50 rounded-lg gap-2">
                <span className="text-amber-600 font-medium">Order Date</span>
                <span className="text-amber-800 font-medium">
                  {format(new Date(order.timestamp), "MMM dd, yyyy")}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-3 bg-amber-50 rounded-lg gap-2">
                <span className="text-amber-600 font-medium">Order Time</span>
                <span className="text-amber-800 font-medium">
                  {format(new Date(order.timestamp), "HH:mm")}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() =>
          setExpandedOrder(expandedOrder === order.id ? null : order.id)
        }
        className="w-full py-3 text-amber-600 text-sm font-medium flex items-center justify-center hover:bg-amber-50 rounded-xl transition-colors duration-200"
      >
        {expandedOrder === order.id ? "Show Less" : "Show More"}
        <ChevronRight
          className={`h-4 w-4 ml-2 transform transition-transform duration-200 ${
            expandedOrder === order.id ? "rotate-90" : ""
          }`}
        />
      </button>
    </motion.div>
  );

  const TransactionCard = ({ transaction }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-100 mb-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm">
              <div className="w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-amber-700 font-bold text-sm sm:text-lg">
                {transaction.initials}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 text-base sm:text-lg truncate mb-1">
              {transaction.title}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 font-medium">
                  Type:
                </span>
                <div className="flex items-center gap-1">
                  {transaction.type === "incoming" ? (
                    <ArrowDownLeft className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium capitalize ${
                      transaction.type === "incoming"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 font-medium">
                  Status:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    transaction.paymentStatus
                  )}`}
                >
                  {transaction.paymentStatus}
                </span>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-amber-600">
              ID: {transaction.transactionId}
            </div>
          </div>
        </div>

        <button
          onClick={() => handleCopyId(transaction.transactionId)}
          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors duration-200 flex-shrink-0"
          title="Copy Transaction ID"
        >
          {copiedId === transaction.transactionId ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 mb-4">
        <div className="text-center">
          <p className="text-xs sm:text-sm text-amber-600 font-medium mb-1">
            Amount
          </p>
          <p
            className={`text-lg sm:text-2xl font-bold ${
              transaction.type === "incoming"
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {transaction.type === "incoming" ? "+" : "-"}₦
            {transaction.amount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-3 bg-amber-50 rounded-lg gap-2">
          <span className="text-amber-600 font-medium">Date & Time</span>
          <span className="text-amber-800 font-medium">
            {format(new Date(transaction.timestamp), "MMM dd, yyyy")}
          </span>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="text-amber-600 font-medium mb-2">Description</div>
          <div className="text-amber-800">{transaction.description}</div>
        </div>
      </div>
    </motion.div>
  );

  // Loading state
  if (loadingGetAllOrder || loadingGetAllTransaction) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="text-center">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg">
              <RefreshCcw className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-amber-600 mx-auto mb-4" />
              <p className="text-amber-700 font-medium text-base sm:text-lg">
                Loading your history...
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg">
          <div className="px-4 py-4 flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-amber-500 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold">History</h1>
          </div>

          {/* Tabs */}
          <div className="flex px-4 space-x-1 pb-1">
            <button
              onClick={() => {
                setActiveTab("orders");
                setCurrentPage(1);
              }}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-t-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === "orders"
                  ? "bg-white text-amber-600 shadow-lg"
                  : "text-amber-200 hover:text-white hover:bg-amber-500"
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("transactions");
                setCurrentPage(1);
              }}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-t-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === "transactions"
                  ? "bg-white text-amber-600 shadow-lg"
                  : "text-amber-200 hover:text-white hover:bg-amber-500"
              }`}
            >
              Transactions ({transactions.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="fixed top-[120px] left-0 right-0 z-10 bg-white px-4 py-4 shadow-sm border-b border-amber-100">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none transition-colors"
                disabled={
                  activeTab === "orders"
                    ? orders.length === 0
                    : transactions.length === 0
                }
              />
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            </div>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-xl border-2 border-amber-200 hover:border-amber-300 transition-colors ${
                dateRange.start || dateRange.end
                  ? "bg-amber-100 border-amber-300"
                  : ""
              } ${
                (
                  activeTab === "orders"
                    ? orders.length === 0
                    : transactions.length === 0
                )
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                activeTab === "orders"
                  ? orders.length === 0
                  : transactions.length === 0
              }
            >
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            </button>
          </div>

          {/* Active filters */}
          {(searchTerm || dateRange.start || dateRange.end) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-2 sm:px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-xs sm:text-sm font-medium">
                  Search: {searchTerm}
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="ml-2 text-amber-600 hover:text-amber-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
              {(dateRange.start || dateRange.end) && (
                <span className="px-2 sm:px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-xs sm:text-sm font-medium">
                  Date: {dateRange.start || "Start"} to {dateRange.end || "End"}
                  <button
                    onClick={() => {
                      setDateRange({ start: "", end: "" });
                      setCurrentPage(1);
                    }}
                    className="ml-2 text-amber-600 hover:text-amber-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Results count */}
          {filteredItems.length > 0 && (
            <div className="mt-2 text-xs sm:text-sm text-amber-600 font-medium">
              Showing {filteredItems.length} {activeTab}
            </div>
          )}

          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute mt-3 p-4 sm:p-6 bg-white rounded-2xl shadow-xl border border-amber-100 left-4 right-4 z-30"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-600 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, start: e.target.value })
                      }
                      className="w-full p-2.5 sm:p-3 text-sm sm:text-base rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-600 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, end: e.target.value })
                      }
                      className="w-full p-2.5 sm:p-3 text-sm sm:text-base rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setDateRange({ start: "", end: "" });
                        setCurrentPage(1);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-medium hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        setShowDatePicker(false);
                        setCurrentPage(1);
                      }}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl py-2.5 sm:py-3 text-sm sm:text-base font-medium hover:from-amber-600 hover:to-amber-700 transition-all"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto pt-[200px] px-4 pb-6 mt-10">
          {activeTab === "orders" ? (
            orders.length > 0 ? (
              filteredItems.length > 0 ? (
                <>
                  {getCurrentItems().map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-4 mt-8 pb-4">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl"
                        }`}
                      >
                        Previous
                      </button>

                      <div className="px-4 py-2 bg-white rounded-xl border border-amber-200 text-amber-700 font-medium">
                        {currentPage} of {totalPages}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <p className="text-amber-600 text-lg font-medium mb-4">
                      No orders match your search criteria.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setDateRange({ start: "", end: "" });
                        setCurrentPage(1);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )
            ) : (
              <EmptyState type="orders" />
            )
          ) : transactions.length > 0 ? (
            filteredItems.length > 0 ? (
              <>
                {getCurrentItems().map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6 pb-4">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      Prev
                    </button>

                    <span className="text-amber-700">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === totalPages
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-amber-600">
                  No transactions match your search criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDateRange({ start: "", end: "" });
                    setCurrentPage(1);
                  }}
                  className="mt-2 text-amber-500 hover:text-amber-600"
                >
                  Clear filters
                </button>
              </div>
            )
          ) : (
            <EmptyState type="transactions" />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HistoryPage;

'use client';



import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HistoryPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const itemsPerPage = 10;

  // Sample order history data
  const orderHistory = [
    {
      id: 1,
      status: 'successful',
      avatar: 'avatar.jpg',
      name: 'John Carter',
      amount: 5000,
      orderNumber: 'ORD-001',
      distance: '2.5km',
      deliveryTime: '30 mins',
      accuracy: 98.5,
      date: '2024-03-15T14:30:00',
      details: {
        paymentMethod: 'Bank Transfer',
        charge: 200,
        totalAmount: 5200,
        notes: 'Delivered to specified location'
      }
    },
    {
      id: 2,
      status: 'cancelled',
      avatar: 'avatar.jpg',
      name: 'Sarah Smith',
      amount: 3000,
      orderNumber: 'ORD-002',
      distance: '1.8km',
      deliveryTime: '25 mins',
      accuracy: 95.2,
      date: '2024-03-14T16:45:00',
      details: {
        paymentMethod: 'Cash',
        charge: 150,
        totalAmount: 3150,
        notes: 'Cancelled by customer'
      }
    },
    // Add more order history items as needed
  ];

  // Sample transaction history data
  const transactionHistory = [
    {
      id: 'TRX123456789',
      type: 'wallet_transfer',
      amount: 10000,
      date: '2024-03-15T14:30:00',
      status: 'successful',
      sender: 'John Doe',
      recipient: 'Jane Smith',
      description: 'Monthly rent payment'
    },
    {
      id: 'TRX987654321',
      type: 'direct_transfer',
      amount: 5000,
      date: '2024-03-14T16:45:00',
      status: 'successful',
      sender: 'Sarah Johnson',
      recipient: 'Mike Wilson',
      description: 'Utility bill payment'
    },
    // Add more transaction history items as needed
  ];

  const handleCopyId = useCallback((id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-amber-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination calculations
  const getCurrentItems = () => {
    const items = activeTab === 'orders' ? orderHistory : transactionHistory;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(
    (activeTab === 'orders' ? orderHistory.length : transactionHistory.length) / itemsPerPage
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft 
            className="h-6 w-6 cursor-pointer" 
            onClick={() => router.push('/home')}
          />
          <h1 className="text-lg font-semibold">History</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200">
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'orders'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-amber-400'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          Order History
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'transactions'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-amber-400'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          Transaction History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {getCurrentItems().map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <img
                            src={order.avatar}
                            alt={order.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-amber-900">{order.name}</h3>
                          <span className={`flex items-center ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 text-sm capitalize">{order.status}</span>
                          </span>
                        </div>
                        <div className="text-sm text-amber-600">
                          {formatDate(order.date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-amber-900">
                        ₦{order.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-amber-600">{order.distance}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-amber-600">
                    <div>Accuracy: {order.accuracy}%</div>
                    <div>Delivery: {order.deliveryTime}</div>
                  </div>

                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="mt-2 w-full flex items-center justify-center space-x-1 text-amber-600 hover:text-amber-800"
                  >
                    <span>{expandedOrder === order.id ? 'View Less' : 'View More'}</span>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-amber-100"
                      >
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-amber-600">Order Number:</span>
                            <span className="text-amber-900">{order.orderNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600">Payment Method:</span>
                            <span className="text-amber-900">{order.details.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600">Charge:</span>
                            <span className="text-amber-900">₦{order.details.charge}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-600">Total Amount:</span>
                            <span className="text-amber-900">₦{order.details.totalAmount}</span>
                          </div>
                          <div className="text-amber-600">Notes:</div>
                          <div className="text-amber-900 bg-amber-50 p-2 rounded">
                            {order.details.notes}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="transactions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {getCurrentItems().map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      <span className={`text-sm ${getStatusColor(transaction.status)} capitalize`}>
                        {transaction.type.replace('_', ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyId(transaction.id)}
                      className="flex items-center space-x-1 text-amber-600 hover:text-amber-800"
                    >
                      {copiedId === transaction.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="text-xs">{transaction.id}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-amber-900">
                        ₦{transaction.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-amber-600">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="text-amber-600">From: {transaction.sender}</div>
                      <div className="text-amber-600">To: {transaction.recipient}</div>
                    </div>
                    <div className="text-sm text-amber-600">{transaction.description}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 p-4 bg-white border-t border-amber-200">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-amber-100 text-amber-600 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-amber-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-amber-100 text-amber-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
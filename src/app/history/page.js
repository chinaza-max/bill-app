'use client';


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const HistoryPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const itemsPerPage = 10;

  // Sample data for orders
  const orders = [
    {
      id: 1,
      avatar: '/avatar1.jpg',
      name: 'John Doe',
      amount: 5000,
      status: 'successful',
      distance: '2.5km',
      deliveryTime: '30 mins',
      accuracy: 98.5,
      timestamp: '2024-03-15T14:30:00',
      details: 'Additional order details here...'
    },
    // Add more sample orders...
  ];

  // Sample data for transactions
  const transactions = [
    {
      id: 'TXN123456',
      type: 'wallet_transfer',
      amount: 10000,
      status: 'successful',
      timestamp: '2024-03-15T15:45:00',
      sender: 'Alice Smith',
      recipient: 'Bob Johnson',
      description: 'Monthly rent payment'
    },
    // Add more sample transactions...
  ];

  const handleBack = () => {
    router.push('/');
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [expandedOrder, setExpandedOrder] = useState(null);

  // Get current items based on pagination
  const getCurrentItems = () => {
    const items = activeTab === 'orders' ? orders : transactions;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
  };

  const totalPages = Math.ceil(
    (activeTab === 'orders' ? orders.length : transactions.length) / itemsPerPage
  );

  const OrderCard = ({ order }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 shadow-sm mb-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <img
              src={order.avatar}
              alt={order.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium text-amber-900">{order.name}</h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs ${
                order.status === 'successful' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {order.status}
              </span>
              <span className="text-amber-600">₦{order.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-amber-600">
          <div>{order.distance}</div>
          <div>{order.deliveryTime}</div>
        </div>
      </div>

      <AnimatePresence>
        {expandedOrder === order.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-amber-100"
          >
            <div className="space-y-2 text-sm text-amber-700">
              <div className="flex justify-between">
                <span>Accuracy:</span>
                <span>{order.accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span>Order Time:</span>
                <span>{format(new Date(order.timestamp), 'MMM dd, yyyy HH:mm')}</span>
              </div>
              <div className="mt-2">{order.details}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
        className="w-full mt-3 text-amber-600 text-sm flex items-center justify-center"
      >
        {expandedOrder === order.id ? 'View Less' : 'View More'}
        <ChevronRight className={`h-4 w-4 ml-1 transform transition-transform ${
          expandedOrder === order.id ? 'rotate-90' : ''
        }`} />
      </button>
    </motion.div>
  );

  const TransactionCard = ({ transaction }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 shadow-sm mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCopyId(transaction.id)}
            className="flex items-center space-x-1 text-amber-600 hover:text-amber-700"
          >
            {copiedId === transaction.id ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="text-sm">{transaction.id}</span>
          </button>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          transaction.status === 'successful' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {transaction.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-amber-600">Amount</span>
          <span className="font-medium text-amber-900">₦{transaction.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-600">Type</span>
          <span className="text-amber-900">{transaction.type.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-600">Time</span>
          <span className="text-amber-900">{format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}</span>
        </div>
        <div className="pt-2 border-t border-amber-100">
          <div className="text-amber-600 mb-1">Description</div>
          <div className="text-amber-900">{transaction.description}</div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white">
        <div className="px-4 py-3 flex items-center space-x-3">
          <button onClick={handleBack}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">History</h1>
        </div>

        {/* Tabs */}
        <div className="flex px-4 space-x-4 border-b border-amber-400">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 ${
              activeTab === 'orders'
                ? 'border-b-2 border-white text-white'
                : 'text-amber-200'
            }`}
          >
            Order History
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-4 ${
              activeTab === 'transactions'
                ? 'border-b-2 border-white text-white'
                : 'text-amber-200'
            }`}
          >
            Transaction History
          </button>
        </div>
      </div>

      {/* Filters - Fixed below header */}
      <div className="fixed top-[104px] left-0 right-0 z-10 bg-amber-50 px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-amber-200 focus:border-amber-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
          </div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-amber-200"
          >
            <Calendar className="h-5 w-5 text-amber-500" />
            <span className="text-amber-700">Date</span>
          </button>
        </div>

        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute mt-2 p-4 bg-white rounded-lg shadow-lg border border-amber-100"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-amber-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full p-2 rounded border border-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-amber-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full p-2 rounded border border-amber-200"
                  />
                </div>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="w-full bg-amber-500 text-white rounded-lg py-2 font-medium"
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto pt-[168px] px-4 pb-4">
        {activeTab === 'orders' ? (
          getCurrentItems().map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          getCurrentItems().map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))
        )}

        {/* Pagination */}
        <div className="mt-4 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-amber-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-amber-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-amber-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
 
export default HistoryPage;
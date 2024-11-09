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
  Search,
  PackageX,
  Receipt,
  RefreshCcw
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

  // Initialize empty arrays for orders and transactions
  const orders = [
    {
    id: 1,
    avatar: 'avatar.jpg',
    name: 'John Doe',
    amount: 5000,
    status: 'successful',
    distance: '2.5km',
    deliveryTime: '30 mins',
    accuracy: 98.5,
    timestamp: '2024-03-15T14:30:00',
    details: 'Food delivery from Lagos Kitchen - 2 parcels delivered successfully'
    },
    {
    id: 2,
    avatar: 'avatar.jpg',
    name: 'Sarah Wilson',
    amount: 3500,
    status: 'cancelled',
    distance: '1.8km',
    deliveryTime: '25 mins',
    accuracy: 0,
    timestamp: '2024-03-15T13:15:00',
    details: 'Order cancelled by customer - Restaurant was too busy'
    },
    {
    id: 3,
    avatar: 'avatar.jpg',
    name: 'Michael Brown',
    amount: 7500,
    status: 'successful',
    distance: '3.2km',
    deliveryTime: '40 mins',
    accuracy: 96.8,
    timestamp: '2024-03-15T12:45:00',
    details: 'Grocery delivery from SuperMart - All items delivered in perfect condition'
    },
    {
    id: 4,
    avatar: 'avatar.jpg',
    name: 'Emily Chen',
    amount: 4200,
    status: 'cancelled',
    distance: '4.0km',
    deliveryTime: '35 mins',
    accuracy: 0,
    timestamp: '2024-03-15T11:20:00',
    details: 'Delivery cancelled - Address not accessible'
    },
    {
    id: 5,
    avatar: 'avatar.jpg',
    name: 'David Kumar',
    amount: 6800,
    status: 'successful',
    distance: '2.1km',
    deliveryTime: '28 mins',
    accuracy: 99.1,
    timestamp: '2024-03-15T10:05:00',
    details: 'Medicine delivery from HealthPlus - Priority delivery completed'
    }
];

// Sample data for transactions with varied types and statuses
const transactions = [
    {
    id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    type: 'wallet_transfer',
    status: 'successful',
    amount: 10000,
    timestamp: '2024-03-15T15:45:00',
    sender: 'Alice Smith',
    recipient: 'Bob Johnson',
    description: 'Wallet funding for multiple deliveries'
    },
    {
    id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    type: 'direct_transfer',
    status: 'failed',
    amount: 5000,
    timestamp: '2024-03-15T14:30:00',
    sender: 'Charlie Brown',
    recipient: 'Delivery App',
    description: 'Failed attempt to fund wallet - Insufficient funds'
    },
    {
    id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    type: 'withdrawal',
    status: 'successful',
    amount: 25000,
    timestamp: '2024-03-15T13:15:00',
    sender: 'Delivery App',
    recipient: 'Driver Account',
    description: 'Weekly earnings withdrawal to bank account'
    },
    {
    id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    type: 'funding',
    status: 'successful',
    amount: 15000,
    timestamp: '2024-03-15T12:00:00',
    sender: 'David Wilson',
    recipient: 'Delivery App',
    description: 'Wallet top-up for upcoming deliveries'
    },
    {
    id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    type: 'order',
    status: 'successful',
    amount: 4500,
    timestamp: '2024-03-15T11:30:00',
    sender: 'Emma Davis',
    recipient: 'Restaurant Partner',
    description: 'Payment for food delivery order #45678'
    }
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

  const EmptyState = ({ type }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
      {type === 'orders' ? (
        <div className="bg-amber-100 p-4 rounded-full mb-4">
          <PackageX className="h-12 w-12 text-amber-600" />
        </div>
      ) : (
        <div className="bg-amber-100 p-4 rounded-full mb-4">
          <Receipt className="h-12 w-12 text-amber-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-amber-900 mb-2">
        {type === 'orders' ? 'No Orders Yet' : 'No Transactions Yet'}
      </h3>
      <p className="text-amber-600 mb-6 max-w-xs">
        {type === 'orders' 
          ? "You haven't placed any orders yet. Start ordering to see your history here."
          : "You haven't made any transactions yet. Your transaction history will appear here."}
      </p>
      <button
        onClick={() => router.push('/')}
        className="flex items-center space-x-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        <RefreshCcw className="h-5 w-5" />
        <span>{type === 'orders' ? 'Place an Order' : 'Make a Transaction'}</span>
      </button>
    </div>
  );

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
                order.status === 'successful' 
                  ? 'bg-green-100 text-green-600' 
                  : order.status === 'cancelled'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-yellow-100 text-yellow-600'
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
            <span className="text-sm truncate max-w-[150px]">{transaction.id}</span>
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
              disabled={activeTab === 'orders' ? orders.length === 0 : transactions.length === 0}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
          </div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-amber-200 ${
              (activeTab === 'orders' ? orders.length === 0 : transactions.length === 0)
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            disabled={activeTab === 'orders' ? orders.length === 0 : transactions.length === 0}
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
          orders.length > 0 ? (
            getCurrentItems().map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <EmptyState type="orders" />
          )
        ) : (
          transactions.length > 0 ? (
            getCurrentItems().map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <EmptyState type="transactions" />
          )
        )}
      </div>
    </div>
  );
};

export default HistoryPage;


    /* const orders = [
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
        details: 'Food delivery from Lagos Kitchen - 2 parcels delivered successfully'
        },
        {
        id: 2,
        avatar: '/avatar2.jpg',
        name: 'Sarah Wilson',
        amount: 3500,
        status: 'cancelled',
        distance: '1.8km',
        deliveryTime: '25 mins',
        accuracy: 0,
        timestamp: '2024-03-15T13:15:00',
        details: 'Order cancelled by customer - Restaurant was too busy'
        },
        {
        id: 3,
        avatar: '/avatar3.jpg',
        name: 'Michael Brown',
        amount: 7500,
        status: 'successful',
        distance: '3.2km',
        deliveryTime: '40 mins',
        accuracy: 96.8,
        timestamp: '2024-03-15T12:45:00',
        details: 'Grocery delivery from SuperMart - All items delivered in perfect condition'
        },
        {
        id: 4,
        avatar: '/avatar4.jpg',
        name: 'Emily Chen',
        amount: 4200,
        status: 'cancelled',
        distance: '4.0km',
        deliveryTime: '35 mins',
        accuracy: 0,
        timestamp: '2024-03-15T11:20:00',
        details: 'Delivery cancelled - Address not accessible'
        },
        {
        id: 5,
        avatar: '/avatar5.jpg',
        name: 'David Kumar',
        amount: 6800,
        status: 'successful',
        distance: '2.1km',
        deliveryTime: '28 mins',
        accuracy: 99.1,
        timestamp: '2024-03-15T10:05:00',
        details: 'Medicine delivery from HealthPlus - Priority delivery completed'
        }
    ];

    // Sample data for transactions with varied types and statuses
    const transactions = [
        {
        id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'wallet_transfer',
        status: 'successful',
        amount: 10000,
        timestamp: '2024-03-15T15:45:00',
        sender: 'Alice Smith',
        recipient: 'Bob Johnson',
        description: 'Wallet funding for multiple deliveries'
        },
        {
        id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'direct_transfer',
        status: 'failed',
        amount: 5000,
        timestamp: '2024-03-15T14:30:00',
        sender: 'Charlie Brown',
        recipient: 'Delivery App',
        description: 'Failed attempt to fund wallet - Insufficient funds'
        },
        {
        id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'withdrawal',
        status: 'successful',
        amount: 25000,
        timestamp: '2024-03-15T13:15:00',
        sender: 'Delivery App',
        recipient: 'Driver Account',
        description: 'Weekly earnings withdrawal to bank account'
        },
        {
        id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'funding',
        status: 'successful',
        amount: 15000,
        timestamp: '2024-03-15T12:00:00',
        sender: 'David Wilson',
        recipient: 'Delivery App',
        description: 'Wallet top-up for upcoming deliveries'
        },
        {
        id: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        type: 'order',
        status: 'successful',
        amount: 4500,
        timestamp: '2024-03-15T11:30:00',
        sender: 'Emma Davis',
        recipient: 'Restaurant Partner',
        description: 'Payment for food delivery order #45678'
        }
    ]; */
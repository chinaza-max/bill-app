'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  RotateCcw,
  CreditCard,
  Wallet,
  Circle,
  Trash2,
  X,
  Bell,
  RefreshCw,
  ChevronDown,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  Clock,
  Banknote,
  UserCheck,
  Zap,
  PackageCheck,
  PackageX,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import ProtectedRoute from '@/app/component/protect';

// ─── type → icon + colour ─────────────────────────────────────────────────────
const getTypeStyle = (type = '') => {
  switch (type) {
    case 'FUND_WALLET':
    case 'WALLET_FUNDED':
    case 'GENERATE_ACCOUNT_VIRTUAL':
      return { icon: Wallet,          style: 'bg-green-100 text-green-600',     border: 'border-green-400'   };
    case 'WITHDRAWAL':
    case 'WITHDRAWAL_SUCCESS':
    case 'WITHDRAWAL_FAILED':
      return { icon: ArrowUpCircle,   style: 'bg-rose-100 text-rose-600',       border: 'border-rose-400'    };
    case 'TRANSFER':
    case 'TRANSFER_RECEIVED':
    case 'TRANSFER_SENT':
      return { icon: ArrowDownCircle, style: 'bg-blue-100 text-blue-600',       border: 'border-blue-400'    };
    case 'ORDER_PLACED':
    case 'NEW_ORDER':
      return { icon: ShoppingBag,     style: 'bg-amber-100 text-amber-600',     border: 'border-amber-400'   };
    case 'ORDER_COMPLETED':
    case 'ORDER_DELIVERED':
      return { icon: PackageCheck,    style: 'bg-green-100 text-green-600',     border: 'border-green-400'   };
    case 'ORDER_CANCELLED':
    case 'ORDER_REJECTED':
      return { icon: PackageX,        style: 'bg-red-100 text-red-600',         border: 'border-red-400'     };
    case 'ORDER_PENDING':
      return { icon: Clock,           style: 'bg-yellow-100 text-yellow-600',   border: 'border-yellow-400'  };
    case 'REVERSAL':
    case 'ORDER_REVERSED':
      return { icon: RotateCcw,       style: 'bg-orange-100 text-orange-600',   border: 'border-orange-400'  };
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_SUCCESS':
      return { icon: CheckCircle2,    style: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-400' };
    case 'PAYMENT_FAILED':
      return { icon: XCircle,         style: 'bg-red-100 text-red-600',         border: 'border-red-400'     };
    case 'ESCROW_RELEASED':
    case 'ESCROW_FUNDED':
      return { icon: Banknote,        style: 'bg-teal-100 text-teal-600',       border: 'border-teal-400'    };
    case 'KYC_APPROVED':
    case 'NIN_VERIFIED':
    case 'FACE_VERIFIED':
      return { icon: UserCheck,       style: 'bg-indigo-100 text-indigo-600',   border: 'border-indigo-400'  };
    case 'KYC_REJECTED':
      return { icon: AlertCircle,     style: 'bg-red-100 text-red-600',         border: 'border-red-400'     };
    case 'NEW_MESSAGE':
    case 'CHAT':
      return { icon: MessageSquare,   style: 'bg-purple-100 text-purple-600',   border: 'border-purple-400'  };
    case 'PROMO':
    case 'PROMOTION':
      return { icon: Zap,             style: 'bg-pink-100 text-pink-600',       border: 'border-pink-400'    };
    case 'CARD_PAYMENT':
      return { icon: CreditCard,      style: 'bg-blue-100 text-blue-600',       border: 'border-blue-400'    };
    default:
      return { icon: Bell,            style: 'bg-amber-100 text-amber-600',     border: 'border-amber-400'   };
  }
};

const relativeTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// ─── Notification Card ────────────────────────────────────────────────────────
const NotificationCard = ({ notification, onDelete, onMarkRead }) => {
  const { icon: Icon, style, border } = getTypeStyle(notification.type);
  const isUnread = !notification.isRead;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(notification.id);
    setDeleting(false);
  };

  const handleTap = () => {
    if (isUnread) onMarkRead(notification.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -120, transition: { duration: 0.22 } }}
      onClick={handleTap}
      className={`bg-white rounded-xl p-4 shadow-sm relative group overflow-hidden cursor-pointer
        ${isUnread ? `border-l-4 ${border}` : 'border-l-4 border-transparent'}`}
    >
      {isUnread && (
        <div className="absolute inset-0 bg-amber-50/40 pointer-events-none" />
      )}

      <div className="flex items-start gap-3 relative">
        <div className={`p-2 rounded-full shrink-0 ${style}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-amber-900 text-sm leading-snug">
              {notification.title}
            </h3>
            {isUnread && (
              <Circle className="h-2 w-2 fill-amber-500 text-amber-500 shrink-0 mt-1" />
            )}
          </div>

          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
            {notification.body}
          </p>

          <p className="mt-1.5 text-xs text-gray-400">
            {relativeTime(notification.createdAt)}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          disabled={deleting}
          className="absolute -top-1 -right-1 p-1.5 rounded-full
            opacity-0 group-hover:opacity-100 transition-opacity
            hover:bg-red-50 text-red-400 disabled:opacity-40"
        >
          {deleting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <X className="h-3.5 w-3.5" />
          }
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const NotificationPage = () => {
  const router      = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);

  // derive user_type from localStorage 'who' — set by app on login/switch
  const userType = typeof window !== 'undefined' && localStorage.getItem('who') === 'client'
    ? 'CLIENT'
    : 'MERCHANT';

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [page, setPage]                   = useState(1);
  const [pagination, setPagination]       = useState(null);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const limit = 10;

  // ── Fetch unread count ────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const queryParams = new URLSearchParams({
        apiType:   'notificationCountUnread',
        user_type: userType,
        token:     accessToken,
      }).toString();

      const response = await fetch(`/api/user?${queryParams}`, {
        method:  'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return;

      const json  = await response.json();
      // response: { data: { data: { unreadCount } } }
      const count = json?.data?.data?.unreadCount ?? 0;
      setUnreadCount(Number(count));






    } catch {
      // non-critical — fail silently
    }
  }, [accessToken]);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      if (!accessToken) return;

      append ? setLoadingMore(true) : setLoading(true);
      setError('');

      try {
        const queryParams = new URLSearchParams({
          apiType:   'notification',
          user_type: userType,
          page:      pageNum,
          limit,
          token:     accessToken,
        }).toString();

        const response = await fetch(`/api/user?${queryParams}`, {
          method:  'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Error: ${response.status}`);
        }

        const json    = await response.json();
        const fetched = json?.data?.data?.data       ?? [];
        const pag     = json?.data?.data?.pagination ?? null;

        setNotifications((prev) =>
          append
            ? [...prev, ...(Array.isArray(fetched) ? fetched : [])]
            : Array.isArray(fetched) ? fetched : []
        );
        setPagination(pag);
        setPage(pageNum);
      } catch (err) {
        setError(err.message || 'Failed to load notifications.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications(1, false);
  }, [fetchUnreadCount, fetchNotifications]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const queryParams = new URLSearchParams({
        apiType: 'notificationDelete',
        token:   accessToken,
      }).toString();

      await fetch(`/api/user?${queryParams}`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          apiType:     'notificationDelete',
          accessToken,
          id,
        }),
      });
    } catch (err) {
      console.error('[Notifications] delete failed →', err.message);
      fetchNotifications(page, false);
      fetchUnreadCount();
    }
  };

  // ── Mark as read ──────────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const queryParams = new URLSearchParams({
        apiType: 'notificationMarkRead',
        token:   accessToken,
      }).toString();

      await fetch(`/api/user?${queryParams}`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          apiType:     'notificationMarkRead',
          accessToken,
          id,
        }),
      });
    } catch (err) {
      console.error('[Notifications] mark read failed →', err.message);
      fetchUnreadCount();
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const loadMore = () => {
    if (pagination && page < pagination.totalPages) {
      fetchNotifications(page + 1, true);
    }
  };

  const hasMore = pagination && page < pagination.totalPages;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">

        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold leading-tight">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-amber-100">{unreadCount} unread</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* unread badge on bell */}
              <div className="relative">
                <Bell className="h-5 w-5 opacity-80" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 rounded-full
                    bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.9, rotate: 360 }}
                transition={{ duration: 0.4 }}
                onClick={() => { fetchNotifications(1, false); fetchUnreadCount(); }}
                disabled={loading}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>

              {notifications.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 pt-16 pb-6">

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => fetchNotifications(1, false)}
                className="underline text-xs shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-amber-100 rounded w-2/3" />
                    <div className="h-2.5 bg-amber-50 rounded w-full" />
                    <div className="h-2 bg-amber-50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && notifications.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-3"
            >
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Bell className="h-8 w-8 text-amber-400" />
              </div>
              <p className="font-medium text-amber-900">You're all caught up!</p>
              <p className="text-sm text-amber-600 text-center max-w-xs">
                No notifications right now. Check back later.
              </p>
            </motion.div>
          )}

          {/* Cards */}
          {!loading && notifications.length > 0 && (
            <AnimatePresence mode="popLayout">
              <div className="mt-4 space-y-3">
                {notifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onDelete={handleDelete}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Load more */}
          {!loading && hasMore && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3
                text-sm font-medium text-amber-700 bg-white rounded-xl shadow-sm
                hover:bg-amber-50 transition-colors disabled:opacity-60"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Load more
                </>
              )}
            </motion.button>
          )}

          {/* Pagination info */}
          {pagination && !loading && notifications.length > 0 && (
            <p className="mt-3 text-center text-xs text-amber-600">
              Showing {notifications.length} of {pagination.total} notifications
            </p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default NotificationPage;
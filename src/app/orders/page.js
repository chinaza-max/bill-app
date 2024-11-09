'use client';



import React from 'react';
import { ArrowLeft, Package, User, ExternalLink, Clock, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

const OrderListPage = () => {
  const router = useRouter();

  // Sample orders data
  const orders = [
    {
      id: 1,
      merchant: {
        name: "John Carter",
        avatar: "avatar.jpg",
        badge: "Premium",
        location: {
          distance: "2.5 km",
          estimatedTime: "15 mins"
        }
      },
      amount: {
        total: "9,700"
      }
    },
    {
      id: 2,
      merchant: {
        name: "Sarah Wilson",
        avatar: "avatar.jpg",
        badge: "Standard",
        location: {
          distance: "3.2 km",
          estimatedTime: "20 mins"
        }
      },
      amount: {
        total: "12,500"
      }
    },
    {
      id: 3,
      merchant: {
        name: "Mike Johnson",
        avatar: "avatar.jpg",
        badge: "Premium",
        location: {
          distance: "1.8 km",
          estimatedTime: "10 mins"
        }
      },
      amount: {
        total: "7,800"
      }
    }
  ];

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
            <h1 className="text-lg font-semibold">My Orders</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <div className="bg-amber-400/30 px-3 py-1 rounded-full">
              <span className="text-sm font-medium">{orders.length} Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-16 px-4 pb-4">
        <div className="space-y-4 mt-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <img
                      src={order.merchant.avatar}
                      alt={order.merchant.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">{order.merchant.name}</h3>
                    <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full">
                      {order.merchant.badge}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-amber-900">₦{order.amount.total}</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-amber-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{order.merchant.location.distance}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{order.merchant.location.estimatedTime}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/orders/order`)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200"
                >
                  <span className="text-sm font-medium">View Details</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderListPage;
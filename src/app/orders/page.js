'use client';


import React, { useState,useEffect } from 'react';

import { ArrowLeft, Package, User, ExternalLink, Clock, MapPin, ShoppingBag, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ClientEmptyState = ({router}) => (
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
    <h3 className="text-xl font-semibold text-amber-900 mb-2">No Pending Orders</h3>
    <p className="text-amber-600 mb-6 max-w-sm">
      You have no pending orders yet. New orders will appear here when customers place them.
    </p>
  </div>
);

/*
const OrderCard = ({ order, userType, onAcknowledgeOrder, router }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <img
            src={userType === 'client' ? order.merchant.avatar : order.client.avatar}
            alt={userType === 'client' ? order.merchant.name : order.client.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900">
            {userType === 'client' ? order.merchant.name : order.client.name}
          </h3>
          <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full">
            {userType === 'client' ? order.merchant.badge : 'Customer'}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold text-amber-900">₦{order.amount.total}</div>
        <div className="text-sm text-amber-600">Order #{order.id}</div>
      </div>
    </div>

    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 text-amber-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{order.location.distance}</span>
        </div>
        <div className="flex items-center space-x-1 text-amber-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{order.location.estimatedTime}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => router.push(`/orders/order`)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200"
        >
          <span className="text-sm font-medium">View2 More</span>
          <ExternalLink className="h-4 w-4" />
        </button>
        
        {userType === 'merchant' && (
          <button
            onClick={() => onAcknowledgeOrder(order.id)}
            className="flex items-center space-x-1 px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Acknowledge Order</span>
          </button>
        )}
      
      </div>
    </div>
  </div>
);
*/

const OrderCard = ({ order, userType, onAcknowledgeOrder, router }) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    onAcknowledgeOrder(order.id);
    setIsAcknowledged(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <img
              src={userType === 'client' ? order.merchant.avatar : order.client.avatar}
              alt={userType === 'client' ? order.merchant.name : order.client.name}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
              }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">
              {userType === 'client' ? order.merchant.name : order.client.name}
            </h3>
            <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full">
              {userType === 'client' ? order.merchant.badge : 'Customer'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-amber-900">₦{order.amount.total}</div>
          <div className="text-sm text-amber-600">Order #{order.id}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-amber-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{order.location.distance}</span>
            </div>
            <div className="flex items-center space-x-1 text-amber-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{order.location.estimatedTime}</span>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/orders/order`)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200"
          >
            <span className="text-sm font-medium">View More</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {userType === 'merchant' && !isAcknowledged && (
          <button
            onClick={handleAcknowledge}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Acknowledge Order</span>
          </button>
        )}
      </div>
    </div>
  );
};



const OrderListPage = () => {

  const [userType, setUserType] = useState("merchant");

  
  const router = useRouter();
  // You can change this to 'merchant' to test merchant view

  // Sample orders data - you can set this to empty array to test empty state
  const orders = [
    {
      id: "1",
      merchant: {
        name: "John's Cafe",
        avatar: "avatar.jpg",
        badge: "Top Merchant",
      },
      client: {
        name: "Alice Smith",
        avatar: "avatar.jpg",
      },
      amount: {
        total: 2500,
      },
      items: ["Latte", "Blueberry Muffin"],
      quantity: 2,
      notes: "Extra whipped cream on the latte",
      location: {
        distance: "1.5 km",
        estimatedTime: "15 min",
      },
    },
    {
      id: "2",
      merchant: {
        name: "Pizza Palace",
        avatar: "avatar.jpg",
        badge: "Premium Vendor",
      },
      client: {
        name: "Bob Johnson",
        avatar: "avatar.jpg",
      },
      amount: {
        total: 3400,
      },
      items: ["Pepperoni Pizza", "Garlic Bread"],
      quantity: 3,
      notes: "No olives on the pizza",
      location: {
        distance: "3 km",
        estimatedTime: "25 min",
      },
    },
    {
      id: "3",
      merchant: {
        name: "Baker's Delight",
        avatar: "avatar.jpg",
        badge: "Trusted Partner",
      },
      client: {
        name: "Cathy Lee",
        avatar: "avatar.jpg",
      },
      amount: {
        total: 1200,
      },
      items: ["Chocolate Cake", "Iced Coffee"],
      quantity: 1,
      notes: "Less sugar in the coffee",
      location: {
        distance: "500 m",
        estimatedTime: "5 min",
      },
    },
  ];


  useEffect(() => {


    const storedUserType = localStorage.getItem("who");

    if (storedUserType) {
      setUserType(storedUserType);
    } else {
      setUserType("merchant"); // Fallback to merchant if there's no value in localStorage
    }
   
  }, []);


  const handleAcknowledgeOrder = (orderId) => {
    // Handle order acknowledgement logic here
    console.log(`Acknowledging order ${orderId}`);
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
            <h1 className="text-lg font-semibold">
              {userType === 'client' ? 'My Orders' : 'Pending Orders'}
            </h1>
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
        {orders.length === 0 ? (
          userType === 'client' ? (
            <ClientEmptyState router={router} />
          ) : (
            <MerchantEmptyState />
          )
        ) : (
          <div className="space-y-4 mt-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userType={userType}
                onAcknowledgeOrder={handleAcknowledgeOrder}
                router={router}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderListPage;




/*  const orders = [
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
    
    
    
      const orders = [
    {
      id: "1",
      merchant: {
        name: "John's Cafe",
        avatar: "https://via.placeholder.com/50",
        badge: "Top Merchant",
      },
      client: {
        name: "Alice Smith",
        avatar: "https://via.placeholder.com/50",
      },
      amount: {
        total: 2500,
      },
      items: ["Latte", "Blueberry Muffin"],
      quantity: 2,
      notes: "Extra whipped cream on the latte",
      location: {
        distance: "1.5 km",
        estimatedTime: "15 min",
      },
    },
    {
      id: "2",
      merchant: {
        name: "Pizza Palace",
        avatar: "https://via.placeholder.com/50",
        badge: "Premium Vendor",
      },
      client: {
        name: "Bob Johnson",
        avatar: "https://via.placeholder.com/50",
      },
      amount: {
        total: 3400,
      },
      items: ["Pepperoni Pizza", "Garlic Bread"],
      quantity: 3,
      notes: "No olives on the pizza",
      location: {
        distance: "3 km",
        estimatedTime: "25 min",
      },
    },
    {
      id: "3",
      merchant: {
        name: "Baker's Delight",
        avatar: "https://via.placeholder.com/50",
        badge: "Trusted Partner",
      },
      client: {
        name: "Cathy Lee",
        avatar: "https://via.placeholder.com/50",
      },
      amount: {
        total: 1200,
      },
      items: ["Chocolate Cake", "Iced Coffee"],
      quantity: 1,
      notes: "Less sugar in the coffee",
      location: {
        distance: "500 m",
        estimatedTime: "5 min",
      },
    },
  ];*/


    /**
      1. add the view more button 
      2.  acknowledge button not accept


     */ 
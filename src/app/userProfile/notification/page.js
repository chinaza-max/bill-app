'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Home, 
  ShoppingBag, 
  History, 
  Users,
  Bell,
  Volume2,
  VolumeX 
} from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const router = useRouter();

  // State for notifications
  const [notifications, setNotifications] = useState({
    textNotifications: true,
    voiceNotifications: false
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/${tab}`);
  };

  const toggleNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const NotificationToggle = ({ type, label, icon: Icon }) => (
    <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm mb-3">
      <div className="flex items-center space-x-3">
        <div className="bg-amber-50 p-2 rounded-full">
          <Icon className="h-6 w-6 text-amber-600" />
        </div>
        <span className="text-amber-900 font-medium">{label}</span>
      </div>
      <div 
        onClick={() => toggleNotification(type)}
        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
          notifications[type] 
            ? 'bg-amber-500' 
            : 'bg-gray-200'
        }`}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
            notifications[type] 
              ? 'translate-x-6' 
              : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft 
            onClick={() => handleTabChange('home')} 
            className="h-6 w-6 cursor-pointer" 
          />
          <h1 className="text-lg font-semibold">Notification Settings</h1>
        </div>
      </div>

      {/* Notification Settings Content */}
      <div className="flex-1 overflow-auto px-4 py-6 space-y-4">
        <NotificationToggle 
          type="textNotifications"
          label="Text Notifications"
          icon={Bell}
        />
        <NotificationToggle 
          type="voiceNotifications"
          label="Voice Notifications"
          icon={Volume2}
        />

        {/* Additional Information */}
        <div className="bg-amber-100 rounded-lg p-4 text-amber-900 text-sm">
          <p>
            • Text notifications will send you SMS alerts for transactions and updates.
          </p>
          <p className="mt-2">
            • Voice notifications will provide audio alerts for important account activities.
          </p>
        </div>
      </div>

     
    </div>
  );
};

export default NotificationSettingsPage;
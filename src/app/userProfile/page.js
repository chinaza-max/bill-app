'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  User,
  Mail,
  CreditCard,
  Bell,
  Users,
  Shield,
  FileText,
  ChevronRight,
  Wallet,
  Store,
  Phone,
  HelpCircle,
  Package2
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/home');
  };

  const handleNavigation = (path) => {
    console.log(path)
    router.push(path);
  };

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-emerald-700 px-4 mb-2">{title}</h2>
      <div className="bg-white rounded-lg shadow-sm">{children}</div>
    </div>
  );

  const MenuItem = ({ icon: Icon, title, subtitle, path, highlight }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-between p-4 border-b border-amber-100 last:border-0 hover:bg-emerald-50/30"
      onClick={() => handleNavigation(path)}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full ${highlight ? 'bg-emerald-50' : 'bg-amber-50'} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${highlight ? 'text-emerald-600' : 'text-amber-600'}`} />
        </div>
        <div className="text-left">
          <div className="text-amber-900 font-medium">{title}</div>
          {subtitle && (
            <div className={`text-sm ${highlight ? 'text-emerald-600' : 'text-amber-500'}`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <ChevronRight className={`h-5 w-5 ${highlight ? 'text-emerald-400' : 'text-amber-400'}`} />
    </motion.button>
  );

  const handleLogout = () => {
    // Add logout logic here
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="h-6 w-6 cursor-pointer" onClick={handleBack} />
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-b from-amber-500 to-amber-600 text-white p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center border-2 border-emerald-400/30">
            <img
              src="avatar.jpg"
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">John Doe</h2>
            <p className="text-emerald-100">john.doe@example.com</p>
            <span className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full text-xs mt-2 text-emerald-100">
              Verified Account
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto py-4">
        <Section title="Account">
          <MenuItem
            icon={User}
            title="Profile Information"
            subtitle="Change phone number, email address"
            path="/userProfile/ProfileInformation"
            highlight={true}
          />
          <MenuItem
            icon={Store}
            title="Merchant Account"
            subtitle="Create a merchant account"
            path="/userProfile/merchantProfile"
            highlight={true}
          />
          <MenuItem
            icon={CreditCard}
            title="Payment Methods"
            subtitle="Saved cards, PayPal"
            path="/userProfile/payment-methods"
          />
          <MenuItem
            icon={Wallet}
            title="Wallet"
            subtitle="Upgrade to wallet"
            path="/userProfile/wallet"
            highlight={true}
          />
        </Section>

        <Section title="Preferences">
          <MenuItem
            icon={Bell}
            title="Notifications"
            subtitle="Push notifications"
            path="/userProfile/notifications"
          />
          <MenuItem
            icon={Users}
            title="Invite Friends"
            subtitle="Tell a friend"
            path="/userProfile/invite"
            highlight={true}
          />
        </Section>

        <Section title="Help & Support">
          <MenuItem
            icon={Shield}
            title="Privacy Policy"
            subtitle="Security notifications"
            path="/profile/privacy"
          />
          <MenuItem
            icon={FileText}
            title="Terms & Conditions"
            subtitle="Cancellation Policy"
            path="/profile/terms"
          />
          <MenuItem
            icon={HelpCircle}
            title="Support"
            subtitle="Get help"
            path="/profile/support"
            highlight={true}
          />
        </Section>

        {/* Version and Logout */}
        <div className="px-4 py-6 space-y-4">
          <div className="text-center text-amber-400 text-sm">
            Version 1.0.0
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-red-50 text-red-600 rounded-lg py-3 px-4 font-medium hover:bg-red-100 transition-colors"
            onClick={handleLogout}
          >
            Logout
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
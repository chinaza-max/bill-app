"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import getErrorMessage from "@/app/component/error";
import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  Package2,
} from "lucide-react";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1502685104226-e9df14d4d9f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  );
  const router = useRouter();

  const myUserData = useSelector((state) => state.user.user);

  useEffect(() => {
    console.log("myUserData Data:", myUserData);
    if (myUserData) {
      setName(myUserData.user.firstName + " " + myUserData.user.lastName);
      setEmail(myUserData.user.emailAddress);
      setImageUrl(myUserData.user.imageUrl);
    }
  }, [myUserData]);

  const handleBack = () => {
    router.push("/home");
  };

  const handleNavigation = (path) => {
    if (path === "/userProfile") {
      console.log("Merchant Profile");
      moveToMerchant();
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    router.prefetch("/userProfile/ProfileInformation");
    router.prefetch("/userProfile/merchantProfile");
    router.prefetch("/userProfile/fundwallet");
  }, [router]);

  const moveToMerchant = () => {
    if (myUserData?.user?.isNinVerified === false) {
      router.push(`/userProfile/merchantProfile`);
    } else if (myUserData?.user?.isDisplayNameMerchantSet === false) {
      router.push(`/userProfile/merchantProfile/merchantProfile2`);
    } else if (myUserData?.user?.isFaceVerified === false) {
      router.push(`/userProfile/merchantProfile/merchantProfile3`);
    } else if (
      myUserData?.user?.MerchantProfile?.accountStatus === "processing"
    ) {
      router.push(`/userProfile/merchantProfile/merchantProfile4`);
    } else if (
      myUserData?.user?.MerchantProfile?.accountStatus === "rejected"
    ) {
      router.push(`/userProfile/merchantProfile/merchantProfile5`);
    } else if (
      myUserData?.user?.MerchantProfile?.accountStatus === "suspended"
    ) {
      router.push(`/userProfile/merchantProfile/merchantProfile6`);
    } else if (myUserData?.user?.merchantActivated === true) {
      console.log(2);
      router.push(`/userProfile/merchantProfile/merchantHome`);
    } else {
      router.push(`/userProfile/merchantProfile/merchantHome`);
    }
  };
  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-emerald-700 px-4 mb-2">
        {title}
      </h2>
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
        <div
          className={`w-8 h-8 rounded-full ${
            highlight ? "bg-emerald-50" : "bg-amber-50"
          } flex items-center justify-center`}
        >
          <Icon
            className={`h-5 w-5 ${
              highlight ? "text-emerald-600" : "text-amber-600"
            }`}
          />
        </div>
        <div className="text-left">
          <div className="text-amber-900 font-medium">{title}</div>
          {subtitle && (
            <div
              className={`text-sm ${
                highlight ? "text-emerald-600" : "text-amber-500"
              }`}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <ChevronRight
        className={`h-5 w-5 ${
          highlight ? "text-emerald-400" : "text-amber-400"
        }`}
      />
    </motion.button>
  );

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("userToken");
    router.push("/sign-in");
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              className="h-6 w-6 cursor-pointer"
              onClick={handleBack}
            />
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-gradient-to-b from-amber-500 to-amber-600 text-white p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center border-2 border-emerald-400/30">
              <img
                src={imageUrl}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold"> {name} </h2>
              <p className="text-emerald-100">{email} </p>
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
              highlight={true}
              path="/userProfile"
              onClick={() => {
                moveToMerchant("userProfile/merchantProfile/merchantHome");
              }}
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
              path="/userProfile/fundwallet"
              highlight={true}
            />
            <MenuItem
              icon={Shield}
              title="Tier"
              subtitle="Upgrade upgrade your Tier"
              path="/userProfile/tier"
              highlight={true}
            />

            <MenuItem
              icon={Shield}
              title="Security"
              subtitle="Chnage you pin"
              path="/userProfile/updatepin"
              highlight={true}
            />
          </Section>

          <Section title="Preferences">
            <MenuItem
              icon={Bell}
              title="Notifications"
              subtitle="Push notifications"
              path="/userProfile/notification"
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
              title="Support or suggestion"
              subtitle="Get help"
              path="/userProfile/support"
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
    </ProtectedRoute>
  );
};

export default ProfilePage;

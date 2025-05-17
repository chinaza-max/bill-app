"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Camera,
  Upload,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";

const UserProfilePage = () => {
  const [userProfile, setUserProfile] = useState({
    firstName: "John",
    lastName: "Carter",
    dateOfBirth: "1990-01-01",
    email: "john.carter@example.com",
    phoneNumber: "+234 800 123 4567",
    isPhoneVerified: true,
    profilePicture: "../../avatar.jpg",
    isMerchant: true,
    merchantDisplayName: "Carter Foods & Groceries",
    merchantPhoneNumber: "+234 800 987 6543",
  });

  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditMerchantInfo = () => {
    router.push("/userProfile/ProfileInformation/updateMerchant");
  };

  const handleEditPersonalInfo = () => {
    router.push("/userProfile/ProfileInformation/updatePersonal");
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setIsEditing(false);
    if (previewImage) {
      setUserProfile((prev) => ({
        ...prev,
        profilePicture: previewImage,
      }));
      setPreviewImage(null);
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    // Handle password update logic here
  };
  const myUserData = useSelector((state) => state.user.user);

  useEffect(() => {
    if (myUserData) {
      const dob = new Date(myUserData.user.dateOfBirth);
      const day = String(dob.getDate()).padStart(2, "0");
      const month = String(dob.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const year = dob.getFullYear();

      setUserProfile({
        firstName: myUserData.user.firstName,
        lastName: myUserData.user.lastName,
        dateOfBirth: `${day}/${month}/${year}`,
        email: myUserData.user.emailAddress,
        phoneNumber: myUserData.user.tel,
        isPhoneVerified: true,
        profilePicture: myUserData.user.imageUrl,
        isMerchant: myUserData.user.merchantActivated,
        merchantDisplayName: myUserData?.user?.MerchantProfile?.displayName,
        merchantPhoneNumber: myUserData?.user?.MerchantProfile?.tel,
      });
    }
  }, [myUserData]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-amber-50">
        {/* Fixed Navigation */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              className="h-6 w-6 cursor-pointer"
              onClick={handleBack}
            />
            <h1 className="text-lg font-semibold">Profile Settings</h1>
          </div>
        </div>

        {/* Content with padding for fixed header */}
        <div className="pt-16 px-4 py-6 space-y-6">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">
              Profile Picture
            </h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <img
                  src={userProfile.profilePicture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-200"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewImage && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-amber-700">
                    New image selected
                  </span>
                  <Upload className="h-4 w-4 text-amber-500" />
                </div>
              )}
            </div>
          </div>

          {/* Merchant Information Section */}
          {userProfile.isMerchant && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-amber-900">
                  Merchant Information
                </h2>
                <button
                  onClick={handleEditMerchantInfo}
                  className="text-amber-600 flex items-center gap-1 hover:text-amber-700"
                  disabled
                >
                  Edit <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Business Name
                  </label>
                  <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                    {userProfile.merchantDisplayName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Business Phone
                  </label>
                  <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                    {userProfile.merchantPhoneNumber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personal Information Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-amber-900">
                Personal Information
              </h2>
              <button
                onClick={handleEditPersonalInfo}
                className="text-amber-600 flex items-center gap-1 hover:text-amber-700"
                disabled
              >
                Edit <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  First Name
                </label>
                <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                  {userProfile.firstName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Last Name
                </label>
                <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                  {userProfile.lastName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Date of Birth
                </label>
                <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                  {userProfile.dateOfBirth}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Email Address
                </label>
                <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                  {userProfile.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                    {userProfile.phoneNumber}
                  </div>
                  {userProfile.isPhoneVerified ? (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
                  ) : (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UserProfilePage;

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Upload,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import Image from "next/image";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Same Google Drive formatter used across the app (MobileApp, PersonalInfoEdit)
const formatImageUrl = (url) => {
  if (!url) return "/default-avatar.png";
  if (url.includes("uc?export=view&id=")) return url;
  const match = url.match(/\/d\/(.*?)\//);
  if (match?.[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
};

// Same tel parser used in PersonalInfoEditPage — handles "+234 8001234567",
// "8001234567", numbers, etc.
const parseTel = (raw) => {
  if (!raw) return { telCode: "+234", tel: "" };
  const str   = String(raw).trim();
  const match = str.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    return { telCode: match[1], tel: match[2].replace(/\s/g, "") };
  }
  return { telCode: "+234", tel: str.replace(/\s/g, "") };
};

// Bulletproof date formatter — works whether dateOfBirth is
// "2008-06-05T00:00:00.000Z", "2008-06-05", or empty/null.
const formatDOB = (raw) => {
  if (!raw) return "Not set";
  const sliced = String(raw).trim().slice(0, 10);
  const match = sliced.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "Not set";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

const UserProfilePage = () => {
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "Not set",
    email: "",
    phoneNumber: "Not set",
    isPhoneVerified: false,
    profilePicture: "/default-avatar.png",
    isMerchant: false,
    merchantDisplayName: "",
    merchantPhoneNumber: "",
  });

  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleEditMerchantInfo = () => {
    router.push("/userProfile/ProfileInformation/updateMerchant");
  };

  const handleEditPersonalInfo = () => {
    router.push("/userProfile/ProfileInformation/updatePersonal");
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

  const myUserData = useSelector((state) => state.user.user);

  useEffect(() => {
    const user = myUserData?.user;
    if (!user) return;

    const { telCode, tel } = parseTel(user.tel);
    const fullPhone = tel ? `${telCode} ${tel}` : "Not set";

    setUserProfile({
      firstName:           user.firstName ?? "",
      lastName:            user.lastName ?? "",
      dateOfBirth:         formatDOB(user.dateOfBirth),
      email:               user.emailAddress ?? "",
      phoneNumber:         fullPhone,
      isPhoneVerified:     user.isTelValid ?? false,
      profilePicture:      formatImageUrl(user.imageUrl),
      isMerchant:          user.merchantActivated ?? false,
      merchantDisplayName: user?.MerchantProfile?.displayName ?? "",
      merchantPhoneNumber: user?.MerchantProfile?.tel ?? "",
    });
  }, [myUserData]);

  const displayImage = previewImage || userProfile.profilePicture;

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
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-amber-200 bg-amber-100">
                <Image
                  src={displayImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  width={128}
                  height={128}
                  unoptimized={displayImage.startsWith("data:") || displayImage.startsWith("blob:")}
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
              <button
                onClick={handleEditPersonalInfo}
                className="text-amber-600 text-sm flex items-center gap-1 hover:text-amber-700"
              >
                Change photo <ChevronRight className="h-4 w-4" />
              </button>
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
                    {userProfile.merchantDisplayName || "Not set"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Business Phone
                  </label>
                  <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                    {userProfile.merchantPhoneNumber || "Not set"}
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
                  {userProfile.firstName || "Not set"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Last Name
                </label>
                <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg">
                  {userProfile.lastName || "Not set"}
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
                  {userProfile.email || "Not set"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg pr-10">
                    {userProfile.phoneNumber}
                  </div>
                  {userProfile.phoneNumber !== "Not set" && (
                    userProfile.isPhoneVerified ? (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
                    ) : (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                    )
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
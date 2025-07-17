"use client";

import React, { useState, useRef } from "react";
import { ArrowLeft, Check, AlertCircle, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PersonalInfoEditPage = () => {
  const [userProfile, setUserProfile] = useState({
    firstName: "John",
    lastName: "Carter",
    dateOfBirth: "1990-01-01",
    email: "john.carter@example.com",
    phoneNumber: "+234 800 123 4567",
    isPhoneVerified: true,
    profilePicture: "../../avatar.jpg",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle update logic here
    // Include profile picture update if changed
    if (previewImage) {
      setUserProfile((prev) => ({
        ...prev,
        profilePicture: previewImage,
      }));
    }
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="h-6 w-6 cursor-pointer" onClick={handleBack} />
          <h1 className="text-lg font-semibold">Edit Personal Information</h1>
        </div>
      </div>

      {/* Content with padding for fixed header */}
      <div className="pt-16 px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-900 mb-4">
              Profile Picture
            </h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Image
                  src={previewImage || userProfile.profilePicture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-200"
                />
                <button
                  type="button"
                  onClick={handleProfilePictureClick}
                  className="absolute bottom-0 right-0 bg-amber-500 p-2 rounded-full text-white hover:bg-amber-600 transition-colors"
                >
                  <Camera className="h-5 w-5" />
                </button>
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

          {/* Personal Information Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={userProfile.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={userProfile.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={userProfile.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={userProfile.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userProfile.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  {userProfile.isPhoneVerified ? (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
                  ) : (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-amber-500 text-white rounded-lg py-2 px-4 font-medium hover:bg-amber-600 transition-colors"
              >
                Save Changes
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoEditPage;

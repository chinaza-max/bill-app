"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Users,
  ShoppingBag,
  Shield,
  Navigation,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useRequest from "@/hooks/useRequest";
import { useSelector } from "react-redux";

const LocationPermissionScreen = () => {
  const [permissionStatus, setPermissionStatus] = useState(null); // null, 'granted', 'denied', 'requesting'
  const [location, setLocation] = useState(null);
  const [showSkipOption, setShowSkipOption] = useState(false);
  const router = useRouter();
  const { data, error, loading, request, errorDetail } = useRequest();
  const accessToken = useSelector((state) => state.user.accessToken);

  // Preflight request for home page
  useEffect(() => {
    // Preload home page resources
    router.prefetch("/home");
  }, [router]);

  const sendLocationToServer = async (latitude, longitude) => {
    try {
      console.log(latitude, longitude);
      await request("/api/user", "POST", {
        lat:  Number(latitude.toFixed(7))+"",
        lng:  Number(longitude.toFixed(7))+"",
        role: "user",
        accessToken,
        apiType: "updateUser",
      });

      if (!error) {
        // Success - proceed to home
        setTimeout(() => {
          router.push("/settingupSecurePin");
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to send location to server:", err);
      // Still proceed to home even if server request fails
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    }
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setPermissionStatus("denied");
      setShowSkipOption(true);
      return;
    }

    setPermissionStatus("requesting");

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setPermissionStatus("granted");

        // Send location to server
        await sendLocationToServer(latitude, longitude);
      },
      (err) => {
        console.error("Location error:", err);
        setPermissionStatus("denied");
        setShowSkipOption(true);
      },
      options
    );
  };

  const handleSkipLocation = () => {
    // Proceed to home without location
    router.push("/home");
  };

  const benefits = [
    {
      icon: Users,
      title: "Find Nearby Merchants",
      description: "Connect with trusted merchants in your area",
    },
    {
      icon: ShoppingBag,
      title: "Personalized Recommendations",
      description: "Get relevant offers and services near you",
    },
    {
      icon: Shield,
      title: "Enhanced Security",
      description: "Verify transactions and prevent fraud",
    },
    {
      icon: Navigation,
      title: "Better User Experience",
      description: "Optimized app performance based on your location",
    },
  ];

  const getStatusMessage = () => {
    switch (permissionStatus) {
      case "requesting":
        return {
          title: "Requesting Location Access...",
          description: "Please allow location access in your browser",
          variant: "default",
          icon: Navigation,
        };
      case "granted":
        return {
          title: "Location Access Granted",
          description: "Thank you! Setting up your personalized experience...",
          variant: "default",
          icon: CheckCircle,
        };
      case "denied":
        return {
          title: "Location Access Denied",
          description:
            "You can still use the app, but some features may be limited",
          variant: "destructive",
          icon: AlertCircle,
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Enable Location Access
          </h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Help us provide you with the best experience by allowing location
            access
          </p>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <Alert
            variant={statusMessage.variant}
            className={`mb-6 ${
              statusMessage.variant === "destructive"
                ? "border-red-500"
                : "border-amber-500"
            }`}
          >
            <statusMessage.icon className="h-4 w-4" />
            <AlertTitle>{statusMessage.title}</AlertTitle>
            <AlertDescription>{statusMessage.description}</AlertDescription>
          </Alert>
        )}

        {/* Server Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Update Failed</AlertTitle>
            <AlertDescription>{errorDetail || error}</AlertDescription>
          </Alert>
        )}

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900 mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {permissionStatus !== "granted" && (
            <button
              className={`w-full p-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                permissionStatus === "requesting" || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }`}
              onClick={requestLocation}
              disabled={permissionStatus === "requesting" || loading}
            >
              {permissionStatus === "requesting" || loading
                ? "Requesting Location..."
                : "Allow Location Access"}
            </button>
          )}

          {(showSkipOption || permissionStatus === "denied") && (
            <button
              className="w-full p-3 rounded-lg font-medium text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
              onClick={handleSkipLocation}
            >
              Continue Without Location
            </button>
          )}

          {permissionStatus === "granted" && !loading && (
            <button
              className="w-full p-3 rounded-lg font-medium text-sm bg-green-600 text-white hover:bg-green-700 transition-all duration-200"
              onClick={() => router.push("/home")}
            >
              Continue to App
            </button>
          )}
        </div>

        {/* Privacy Note */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Your location is only used to enhance your experience and is never
            shared without your permission.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionScreen;

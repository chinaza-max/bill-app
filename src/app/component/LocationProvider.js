"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import locationService from "@/services/backgroundLocationService";
import useRequest from "@/hooks/useRequest";

export default function LocationProvider({ children }) {
  const { request } = useRequest();
  const accessToken = useSelector((s) => s.user.accessToken);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!accessToken || hasInitialized.current) return;

    // Initialize service
    locationService.init({
      updateInterval: 10 * 1000, // 20 minutes  1 * 60 * 1000
      simulationMode: false, // Change to false for real GPS
      
      onUpdate: async (location) => {
        try {
          console.log("📤 Sending location to server...");
          
          await request("/api/user", "POST", {
            lat: location.latitude.toString(),
            lng: location.longitude.toString(),
            role: "user",
            accessToken,
            apiType: "updateUser",
          });

          console.log("✅ Location sent successfully");
          
          if (location.simulated) {
            console.log(`📍 Simulated at: ${location.locationName}`);
          }
        } catch (error) {
          console.error("❌ Failed to send location:", error);
        }
      },

      onError: (error) => {
        console.error("⚠️ Location service error:", error.message);
      },
    });

    locationService.start();
    hasInitialized.current = true;

    return () => {
      locationService.stop();
      hasInitialized.current = false;
    };
  }, [accessToken, request]);

  return <>{children}</>;
}
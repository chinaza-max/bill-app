// ==================================================
// INTEGRATION FILE
// ==================================================
// Place this in: /hooks/useBackgroundLocation.js

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import locationService from "@/services/backgroundLocationService";
import useRequest from "@/hooks/useRequest";

export const useBackgroundLocation = (config = {}) => {
  const { request } = useRequest();
  const accessToken = useSelector((s) => s.user.accessToken);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!accessToken || hasInitialized.current) return;

    // Initialize service
    locationService.init({
      updateInterval: config.intervalMinutes ? config.intervalMinutes * 60 * 1000 : 20 * 60 * 1000,
      simulationMode: config.simulationMode ?? false,
      
      // Callback when location is obtained
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

      // Callback on error
      onError: (error) => {
        console.error("⚠️ Location service error:", error.message);
      },
    });

    // Start the service
    locationService.start();
    hasInitialized.current = true;

    // Cleanup on unmount
    return () => {
      locationService.stop();
      hasInitialized.current = false;
    };
  }, [accessToken]);

  return locationService;
};


// ==================================================
// USAGE IN _app.js OR layout.js
// ==================================================
/*

// In pages/_app.js (Pages Router)
import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";

function MyApp({ Component, pageProps }) {
  // Start background location service
  const locationService = useBackgroundLocation({
    intervalMinutes: 20,      // Update every 20 minutes
    simulationMode: false,    // false = real GPS, true = simulation
  });

  return <Component {...pageProps} />;
}

export default MyApp;

*/

// ==================================================
// OR IN app/layout.js (App Router)
// ==================================================
/*

// Create: app/components/LocationProvider.js
"use client";

import { useBackgroundLocation } from "@/hooks/useBackgroundLocation";

export default function LocationProvider({ children }) {
  useBackgroundLocation({
    intervalMinutes: 20,
    simulationMode: false,
  });

  return <>{children}</>;
}

// Then in app/layout.js
import LocationProvider from "./components/LocationProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LocationProvider>
          {children}
        </LocationProvider>
      </body>
    </html>
  );
}

*/


// ==================================================
// DYNAMIC CONTROLS (Optional)
// ==================================================
// You can control the service from anywhere in your app:

/*
import locationService from "@/services/backgroundLocationService";

// Change interval to 5 minutes
locationService.setInterval(5);

// Change to 40 minutes
locationService.setInterval(40);

// Toggle simulation mode
locationService.setSimulationMode(true);  // Enable simulation
locationService.setSimulationMode(false); // Use real GPS

// Check status
const status = locationService.getStatus();
console.log(status);
// {
//   isRunning: true,
//   simulationMode: false,
//   updateInterval: 1200000,
//   intervalMinutes: 20,
//   lastLocation: { lat: 9.0765, lng: 7.3986 }
// }

// Stop service
locationService.stop();

// Restart service
locationService.start();

// Force immediate update (doesn't wait for interval)
await locationService.performUpdate();
*/
import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import useRequest from "@/hooks/useRequest";

export const useLocationService = (accessToken) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [showLocationNotification, setShowLocationNotification] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const { request, error } = useRequest();
  const intervalRef = useRef(null);
  const retryIntervalRef = useRef(null);
  const reduxAccessToken = useSelector((state) => state.user.accessToken);

  accessToken = accessToken || reduxAccessToken;

  // Send location to server
  const sendLocationToServer = async (latitude, longitude) => {
    try {
      console.log("Sending location:", latitude, longitude);
      await request("/api/user", "POST", {
        lat: latitude + "",
        lng: longitude + "",
        role: "user",
        accessToken,
        apiType: "updateUser",
      });

      if (!error) {
        setLastLocationUpdate(new Date());
        console.log("Location updated successfully");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to send location to server:", err);
      return false;
    }
  };

  // Get current position using Geolocation API
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error("Geolocation is not supported by this browser");
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          
          // Set specific error messages based on error code
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location unavailable. Please enable location services on your device and ensure you have a good GPS signal.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "Unable to get your location. Please try again.";
              break;
          }
          
          const customError = new Error(errorMessage);
          customError.code = error.code;
          reject(customError);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 2 * 60 * 1000, // 2 minutes
        }
      );
    });
  }, []);

  // Try to get location and handle success/failure
  const tryGetLocation = useCallback(async (showNotificationOnFail = true) => {
    try {
      setLocationError(null);
      const location = await getCurrentLocation();
      const success = await sendLocationToServer(location.latitude, location.longitude);
      
      if (success) {
        setIsLocationEnabled(true);
        setLocationPermission("granted");
        setShowLocationNotification(false); // Hide notification on success
        setIsRetrying(false);
        
        // Start regular updates if not already running
        if (!intervalRef.current) {
          startLocationUpdates();
        }
        
        return true;
      } else {
        throw new Error("Failed to send location to server");
      }

    } catch (error) {
      console.error("Location error:", error);
      
      if (error.code === 1) { // PERMISSION_DENIED
        setLocationPermission("denied");
      }
      
      setIsLocationEnabled(false);
      setLocationError(error);
      
      // Show notification modal if requested
      if (showNotificationOnFail) {
        setShowLocationNotification(true);
      }
      
      return false;
    }
  }, [getCurrentLocation, accessToken]);

  // Start automatic location updates every 10 minutes
  const startLocationUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      await tryGetLocation(false); // Don't show notification for background updates
    }, 10 * 60 * 1000); // 10 minutes
  }, [tryGetLocation]);

  // Start retry attempts every 2 minutes when location is not available
  const startRetryAttempts = useCallback(() => {
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
    }

    setIsRetrying(true);
    retryIntervalRef.current = setInterval(async () => {
      console.log("Retrying location...");
      const success = await tryGetLocation(false); // Silent retry
      
      if (success) {
        // Stop retrying if successful
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
        setIsRetrying(false);
      }
    }, 2 * 60 * 1000); // 2 minutes
  }, [tryGetLocation]);

  // Stop all location updates and retries
  const stopAllLocationServices = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
    setIsRetrying(false);
  }, []);

  // Manual retry function for user action
  const retryLocation = useCallback(async () => {
    const success = await tryGetLocation(true);
    
    if (!success) {
      // Start background retries if manual retry failed
      startRetryAttempts();
    }
    
    return success;
  }, [tryGetLocation, startRetryAttempts]);

  // Dismiss notification but continue background retries
  const dismissNotification = useCallback(() => {
    setShowLocationNotification(false);
    
    // Start background retries if location is still not enabled
    if (!isLocationEnabled) {
      startRetryAttempts();
    }
  }, [isLocationEnabled, startRetryAttempts]);

  // Initialize location service
  useEffect(() => {
    const initializeLocation = async () => {
      if (!navigator.geolocation) {
        setLocationError(new Error("Geolocation is not supported by this browser"));
        setShowLocationNotification(true);
        return;
      }

      // Check permission status if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" });
          setLocationPermission(permission.state);

          // Listen for permission changes
          permission.onchange = () => {
            setLocationPermission(permission.state);
            if (permission.state === "granted") {
              tryGetLocation(false);
            } else if (permission.state === "denied") {
              setIsLocationEnabled(false);
              setShowLocationNotification(true);
              setLocationError(new Error("Location access denied"));
            }
          };
        } catch (error) {
          console.error("Error checking permissions:", error);
        }
      }

      // Try to get location initially
      const success = await tryGetLocation(true);
      
      if (!success) {
        // Start background retries if initial attempt failed
        startRetryAttempts();
      }
    };

    if (accessToken) {
      initializeLocation();
    }

    return () => {
      stopAllLocationServices();
    };
  }, [accessToken]);

  return {
    isLocationEnabled,
    locationPermission,
    showLocationNotification, // Show notification modal when true
    lastLocationUpdate,
    locationError, // Error message to display
    isRetrying, // Show retry indicator
    retryLocation, // Manual retry function
    dismissNotification, // Dismiss notification but keep trying
    getCurrentLocation,
  };
};
/*import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import useRequest from "@/hooks/useRequest";

export const useLocationService = (accessToken) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [showLocationNotification, setShowLocationNotification] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  
  const { request, error } = useRequest();
  const intervalRef = useRef(null);
  const retryIntervalRef = useRef(null);
  const watchPositionId = useRef(null);
  const reduxAccessToken = useSelector((state) => state.user.accessToken);

  accessToken = accessToken || reduxAccessToken;

  // Send location to server
  const sendLocationToServer = async (latitude, longitude, accuracy) => {
    try {
      console.log("Sending location:", { latitude, longitude, accuracy });
      await request("/api/user", "POST", {
        lat: latitude + "",
        lng: longitude + "",
        accuracy: accuracy + "",
        role: "user",
        accessToken,
        apiType: "updateUser",
      });

      if (!error) {
        setLastLocationUpdate(new Date());
        setCurrentAccuracy(accuracy);
        console.log("Location updated successfully with accuracy:", accuracy);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to send location to server:", err);
      return false;
    }
  };

  // Get high accuracy position using watchPosition for better results
  const getHighAccuracyLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error("Geolocation is not supported by this browser");
        reject(error);
        return;
      }

      let bestPosition = null;
      let attempts = 0;
      const maxAttempts = 3;
      const acceptableAccuracy = 50; // meters
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          attempts++;
          console.log(`Location attempt ${attempts}:`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          });

          // Keep the most accurate position
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          // Resolve if we get acceptable accuracy or max attempts reached
          if (position.coords.accuracy <= acceptableAccuracy || attempts >= maxAttempts) {
            navigator.geolocation.clearWatch(watchId);
            resolve({
              latitude: bestPosition.coords.latitude,
              longitude: bestPosition.coords.longitude,
              accuracy: bestPosition.coords.accuracy,
              timestamp: bestPosition.timestamp
            });
          }
        },
        (error) => {
          navigator.geolocation.clearWatch(watchId);
          console.error("Geolocation error:", error);
          
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
          enableHighAccuracy: true,        // Use GPS instead of network location
          timeout: 30000,                  // Increased timeout for better accuracy
          maximumAge: 0,                   // Don't use cached location data
        }
      );

      // Fallback timeout to ensure we don't wait forever
      setTimeout(() => {
        if (bestPosition) {
          navigator.geolocation.clearWatch(watchId);
          resolve({
            latitude: bestPosition.coords.latitude,
            longitude: bestPosition.coords.longitude,
            accuracy: bestPosition.coords.accuracy,
            timestamp: bestPosition.timestamp
          });
        }
      }, 25000); // 25 seconds fallback
    });
  }, []);

  // Fallback to getCurrentPosition with optimized settings
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error("Geolocation is not supported by this browser");
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Current position:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          });
          
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          
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
          enableHighAccuracy: true,        // Changed to true for GPS accuracy
          timeout: 20000,                  // Increased timeout
          maximumAge: 0,                   // Changed to 0 for fresh location
        }
      );
    });
  }, []);

  // Try to get location with fallback strategy
  const tryGetLocation = useCallback(async (showNotificationOnFail = true) => {
    try {
      setLocationError(null);
      let location;

      try {
        // First try high accuracy method
        location = await getHighAccuracyLocation();
        console.log("Using high accuracy location");
      } catch (highAccuracyError) {
        console.log("High accuracy failed, falling back to getCurrentPosition");
        // Fallback to regular getCurrentPosition
        location = await getCurrentLocation();
      }

      const success = await sendLocationToServer(
        location.latitude, 
        location.longitude, 
        location.accuracy
      );
      
      if (success) {
        setIsLocationEnabled(true);
        setLocationPermission("granted");
        setShowLocationNotification(false);
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
      
      if (showNotificationOnFail) {
        setShowLocationNotification(true);
      }
      
      return false;
    }
  }, [getHighAccuracyLocation, getCurrentLocation, accessToken]);

  // Start automatic location updates with better frequency
  const startLocationUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // More frequent updates for better tracking (5 minutes instead of 10)
    intervalRef.current = setInterval(async () => {
      await tryGetLocation(false);
    }, 5 * 60 * 1000); // 5 minutes
  }, [tryGetLocation]);

  // Start retry attempts with exponential backoff
  const startRetryAttempts = useCallback(() => {
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
    }

    let retryCount = 0;
    const maxRetries = 5;
    
    setIsRetrying(true);
    
    const doRetry = async () => {
      retryCount++;
      console.log(`Retry attempt ${retryCount}/${maxRetries}`);
      
      const success = await tryGetLocation(false);
      
      if (success || retryCount >= maxRetries) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
        setIsRetrying(false);
        return;
      }
      
      // Exponential backoff: 1min, 2min, 4min, 8min, 16min
      const nextDelay = Math.min(Math.pow(2, retryCount - 1) * 60 * 1000, 16 * 60 * 1000);
      
      setTimeout(() => {
        if (retryIntervalRef.current) {
          doRetry();
        }
      }, nextDelay);
    };

    // Start first retry after 1 minute
    retryIntervalRef.current = setTimeout(doRetry, 60 * 1000);
  }, [tryGetLocation]);

  // Stop all location services
  const stopAllLocationServices = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
    setIsRetrying(false);
  }, []);

  // Manual retry function for user action
  const retryLocation = useCallback(async () => {
    const success = await tryGetLocation(true);
    
    if (!success) {
      startRetryAttempts();
    }
    
    return success;
  }, [tryGetLocation, startRetryAttempts]);

  // Dismiss notification but continue background retries
  const dismissNotification = useCallback(() => {
    setShowLocationNotification(false);
    
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
    showLocationNotification,
    lastLocationUpdate,
    locationError,
    isRetrying,
    currentAccuracy, // Added accuracy info
    retryLocation,
    dismissNotification,
    getCurrentLocation,
    getHighAccuracyLocation, // Expose high accuracy method
  };
};
*/


import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import useRequest from "@/hooks/useRequest";

// Simple moving average filter
class LocationFilter {
  constructor(windowSize = 5) {
    this.history = [];
    this.windowSize = windowSize;
  }

  add(lat, lng, accuracy) {
    this.history.push({ lat, lng, accuracy });
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
    return this.getSmoothed();
  }

  getSmoothed() {
    const avgLat = this.history.reduce((s, p) => s + p.lat, 0) / this.history.length;
    const avgLng = this.history.reduce((s, p) => s + p.lng, 0) / this.history.length;
    const avgAccuracy = this.history.reduce((s, p) => s + p.accuracy, 0) / this.history.length;
    return { lat: avgLat, lng: avgLng, accuracy: avgAccuracy };
  }
}

// Haversine distance (meters)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useLocationService = (accessToken) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [showLocationNotification, setShowLocationNotification] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);

  const { request, error } = useRequest();
  const intervalRef = useRef(null);
  const retryIntervalRef = useRef(null);
  const watchPositionId = useRef(null);
  const reduxAccessToken = useSelector((state) => state.user.accessToken);

  accessToken = accessToken || reduxAccessToken;

  const filterRef = useRef(new LocationFilter(5));
  const lastGoodLocationRef = useRef(null);

  // Send location to server
  const sendLocationToServer = async (latitude, longitude, accuracy) => {
    try {
      console.log("Sending location:", { latitude, longitude, accuracy });
      await request("/api/user", "POST", {
        lat: latitude + "",
        lng: longitude + "",
        accuracy: accuracy + "",
        role: "user",
        accessToken,
        apiType: "updateUser",
      });

      if (!error) {
        setLastLocationUpdate(new Date());
        setCurrentAccuracy(accuracy);
        console.log("✅ Location updated with accuracy:", accuracy);
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Failed to send location:", err);
      return false;
    }
  };

  // Outlier check (ignore >500m jumps)
  const isOutlier = (lat, lng) => {
    if (!lastGoodLocationRef.current) return false;
    const distance = haversine(
      lastGoodLocationRef.current.lat,
      lastGoodLocationRef.current.lng,
      lat,
      lng
    );
    return distance > 500;
  };

  // High accuracy with smoothing + outlier rejection
  const getHighAccuracyLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      let bestPosition = null;
      let attempts = 0;
      const maxAttempts = 3;
      const acceptableAccuracy = 50;

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          attempts++;
          const { latitude, longitude, accuracy } = pos.coords;

          console.log(`Attempt ${attempts}:`, { latitude, longitude, accuracy });

          if (isOutlier(latitude, longitude)) {
            console.warn("⚠️ Outlier location ignored");
            return;
          }

          if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }

          if (accuracy <= acceptableAccuracy || attempts >= maxAttempts) {
            navigator.geolocation.clearWatch(watchId);

            const smoothed = filterRef.current.add(
              bestPosition.coords.latitude,
              bestPosition.coords.longitude,
              bestPosition.coords.accuracy
            );

            lastGoodLocationRef.current = { lat: smoothed.lat, lng: smoothed.lng };

            resolve({
              latitude: smoothed.lat,
              longitude: smoothed.lng,
              accuracy: smoothed.accuracy,
              timestamp: bestPosition.timestamp,
            });
          }
        },
        (err) => {
          navigator.geolocation.clearWatch(watchId);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );

      // Fallback after 25s
      setTimeout(() => {
        if (bestPosition) {
          navigator.geolocation.clearWatch(watchId);

          const smoothed = filterRef.current.add(
            bestPosition.coords.latitude,
            bestPosition.coords.longitude,
            bestPosition.coords.accuracy
          );

          lastGoodLocationRef.current = { lat: smoothed.lat, lng: smoothed.lng };

          resolve({
            latitude: smoothed.lat,
            longitude: smoothed.lng,
            accuracy: smoothed.accuracy,
            timestamp: bestPosition.timestamp,
          });
        }
      }, 25000);
    });
  }, []);

  // Fallback simple getCurrentPosition
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          if (isOutlier(latitude, longitude)) {
            console.warn("⚠️ Outlier current position ignored");
            reject(new Error("Outlier location ignored"));
            return;
          }

          const smoothed = filterRef.current.add(latitude, longitude, accuracy);
          lastGoodLocationRef.current = { lat: smoothed.lat, lng: smoothed.lng };

          resolve({
            latitude: smoothed.lat,
            longitude: smoothed.lng,
            accuracy: smoothed.accuracy,
            timestamp: pos.timestamp,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    });
  }, []);

  // Strategy: try high accuracy first, fallback if needed
  const tryGetLocation = useCallback(async (showNotificationOnFail = true) => {
    try {
      setLocationError(null);
      let location;

      try {
        location = await getHighAccuracyLocation();
      } catch {
        console.log("High accuracy failed, falling back");
        location = await getCurrentLocation();
      }

      const success = await sendLocationToServer(
        location.latitude,
        location.longitude,
        location.accuracy
      );

      if (success) {
        setIsLocationEnabled(true);
        setLocationPermission("granted");
        setShowLocationNotification(false);
        setIsRetrying(false);

        if (!intervalRef.current) {
          startLocationUpdates();
        }

        return true;
      } else {
        throw new Error("Failed to send location");
      }
    } catch (err) {
      console.error("Location error:", err);

      if (err.code === 1) setLocationPermission("denied");

      setIsLocationEnabled(false);
      setLocationError(err);

      if (showNotificationOnFail) {
        setShowLocationNotification(true);
      }

      return false;
    }
  }, [getHighAccuracyLocation, getCurrentLocation, accessToken]);

  const startLocationUpdates = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      await tryGetLocation(false);
    }, 5 * 60 * 1000);
  }, [tryGetLocation]);

  const startRetryAttempts = useCallback(() => {
    if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);

    let retryCount = 0;
    const maxRetries = 5;
    setIsRetrying(true);

    const doRetry = async () => {
      retryCount++;
      console.log(`Retry ${retryCount}/${maxRetries}`);

      const success = await tryGetLocation(false);
      if (success || retryCount >= maxRetries) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
        setIsRetrying(false);
        return;
      }

      const nextDelay = Math.min(Math.pow(2, retryCount - 1) * 60 * 1000, 16 * 60 * 1000);
      setTimeout(() => {
        if (retryIntervalRef.current) doRetry();
      }, nextDelay);
    };

    retryIntervalRef.current = setTimeout(doRetry, 60 * 1000);
  }, [tryGetLocation]);

  const stopAllLocationServices = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
    setIsRetrying(false);
  }, []);

  const retryLocation = useCallback(async () => {
    const success = await tryGetLocation(true);
    if (!success) startRetryAttempts();
    return success;
  }, [tryGetLocation, startRetryAttempts]);

  const dismissNotification = useCallback(() => {
    setShowLocationNotification(false);
    if (!isLocationEnabled) startRetryAttempts();
  }, [isLocationEnabled, startRetryAttempts]);

  useEffect(() => {
    const init = async () => {
      if (!navigator.geolocation) {
        setLocationError(new Error("Geolocation not supported"));
        setShowLocationNotification(true);
        return;
      }

      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" });
          setLocationPermission(permission.state);

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
        } catch (e) {
          console.error("Permission check error:", e);
        }
      }

      const success = await tryGetLocation(true);
      if (!success) startRetryAttempts();
    };

    if (accessToken) init();
    return () => stopAllLocationServices();
  }, [accessToken]);

  return {
    isLocationEnabled,
    locationPermission,
    showLocationNotification,
    lastLocationUpdate,
    locationError,
    isRetrying,
    currentAccuracy,
    retryLocation,
    dismissNotification,
    getCurrentLocation,
    getHighAccuracyLocation,
  };
};

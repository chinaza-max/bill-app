import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import useRequest from "@/hooks/useRequest";

// ----------------------------------------------------
// MOVING AVERAGE FILTER
// ----------------------------------------------------
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
    const avgLat =
      this.history.reduce((s, p) => s + p.lat, 0) / this.history.length;
    const avgLng =
      this.history.reduce((s, p) => s + p.lng, 0) / this.history.length;
    const avgAccuracy =
      this.history.reduce((s, p) => s + p.accuracy, 0) / this.history.length;

    return { lat: avgLat, lng: avgLng, accuracy: avgAccuracy };
  }
}

// ----------------------------------------------------
// HAVERSINE DISTANCE FOR OUTLIER FILTERING
// ----------------------------------------------------
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ====================================================
// MAIN HOOK
// ====================================================
export const useLocationService = (accessToken) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [showLocationNotification, setShowLocationNotification] =
    useState(false);

  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);

  const [locationStatus, setLocationStatus] = useState("idle");

  const { request, error } = useRequest();
  const reduxAccessToken = useSelector((s) => s.user.accessToken);
  accessToken = accessToken || reduxAccessToken;

  const filterRef = useRef(new LocationFilter(5));
  const lastGoodLocationRef = useRef(null);

  const intervalRef = useRef(null);
  const retryIntervalRef = useRef(null);

  const pendingUpdateRef = useRef(null);
  const isPageVisibleRef = useRef(true);

  // ----------------------------------------------------
  // OUTLIER CHECK (More lenient: 1500m)
  // Works much better indoors / poor GPS
  // ----------------------------------------------------
  const isOutlier = (lat, lng) => {
    if (!lastGoodLocationRef.current) return false;

    const d = haversine(
      lastGoodLocationRef.current.lat,
      lastGoodLocationRef.current.lng,
      lat,
      lng
    );

    return d > 1500; // less sensitive indoors
  };

  // ----------------------------------------------------
  // SEND LOCATION TO SERVER
  // ----------------------------------------------------
  const sendLocationToServer = async (lat, lng, accuracy) => {
    try {
      setLocationStatus("pending");

      const updatePromise = request("/api/user", "POST", {
        lat: lat + "",
        lng: lng + "",
        role: "user",
        accessToken,
        apiType: "updateUser",
      });

      pendingUpdateRef.current = updatePromise;
      await updatePromise;

      if (!error) {
        pendingUpdateRef.current = null;
        setLocationStatus("success");
        setLastLocationUpdate(new Date());
        setCurrentAccuracy(accuracy);

        setTimeout(() => setLocationStatus("idle"), 2500);
        return true;
      }

      throw new Error("Server rejected location");
    } catch (err) {
      console.error("❌ Failed to send:", err);
      setLocationStatus("error");
      pendingUpdateRef.current = null;

      setTimeout(() => setLocationStatus("idle"), 3000);
      return false;
    }
  };

  // ----------------------------------------------------
  // HIGH ACCURACY (BEST EFFORT)
  // WORKS EVEN WHEN GPS SIGNAL IS WEAK
  // ----------------------------------------------------
  const getHighAccuracyLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      let best = null;

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000, // CRITICAL for indoor usage
      };

      const fallbackTimer = setTimeout(() => {
        if (best) resolve(format(best));
        else reject(new Error("High accuracy timeout"));
      }, 16000);

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          if (accuracy > 500) return; // ignore extremely bad readings
          if (isOutlier(latitude, longitude)) return;

          if (!best || accuracy < best.coords.accuracy) best = pos;

          if (accuracy <= 70) {
            clearAll();
            resolve(format(best));
          }
        },
        (err) => {
          clearAll();
          reject(err);
        },
        options
      );

      function clearAll() {
        clearTimeout(fallbackTimer);
        navigator.geolocation.clearWatch(watchId);
      }

      function format(p) {
        const smooth = filterRef.current.add(
          p.coords.latitude,
          p.coords.longitude,
          p.coords.accuracy
        );

        lastGoodLocationRef.current = {
          lat: smooth.lat,
          lng: smooth.lng,
        };

        return {
          latitude: smooth.lat,
          longitude: smooth.lng,
          accuracy: smooth.accuracy,
          timestamp: p.timestamp,
        };
      }
    });
  }, []);

  // ----------------------------------------------------
  // SIMPLE FALLBACK (MEDIUM ACCURACY)
  // ----------------------------------------------------
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          if (accuracy > 800) {
            // very weak signal but still usable
            console.warn("Weak GPS signal accepted");
          }

          if (isOutlier(latitude, longitude)) {
            return reject(new Error("Outlier rejected"));
          }

          const smooth = filterRef.current.add(latitude, longitude, accuracy);

          lastGoodLocationRef.current = {
            lat: smooth.lat,
            lng: smooth.lng,
          };

          resolve({
            latitude: smooth.lat,
            longitude: smooth.lng,
            accuracy: smooth.accuracy,
            timestamp: pos.timestamp,
          });
        },
        (err) => reject(err),
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }, []);

  // ----------------------------------------------------
  // LOCATION STRATEGY
  // ----------------------------------------------------
  const tryGetLocation = useCallback(
    async (showNotificationOnFail = true) => {
      try {
        setLocationError(null);

        let loc;
        try {
          loc = await getHighAccuracyLocation();
        } catch {
          loc = await getCurrentLocation();
        }

        const ok = await sendLocationToServer(
          loc.latitude,
          loc.longitude,
          loc.accuracy
        );

        if (ok) {
          setLocationPermission("granted");
          setIsLocationEnabled(true);
          setShowLocationNotification(false);
          return true;
        }

        throw new Error("Save failed");
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
    },
    [getHighAccuracyLocation, getCurrentLocation, accessToken]
  );

  // ----------------------------------------------------
  // PERIODIC UPDATES
  // ----------------------------------------------------
  const startLocationUpdates = useCallback(() => {
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (isPageVisibleRef.current) tryGetLocation(false);
    }, 5 * 60 * 1000);
  }, [tryGetLocation]);

  // ----------------------------------------------------
  // RETRY LOGIC
  // ----------------------------------------------------
  const startRetryAttempts = useCallback(() => {
    clearInterval(retryIntervalRef.current);

    let retry = 0;
    const max = 5;

    retryIntervalRef.current = setInterval(async () => {
      retry++;

      const success = await tryGetLocation(false);
      if (success || retry >= max) {
        clearInterval(retryIntervalRef.current);
      }
    }, 60000);
  }, [tryGetLocation]);

  // ----------------------------------------------------
  // CLEANUP
  // ----------------------------------------------------
  const stopAll = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(retryIntervalRef.current);
  }, []);

  // ----------------------------------------------------
  // INITIALIZE
  // ----------------------------------------------------
  useEffect(() => {
    const init = async () => {
      if (!navigator.geolocation) {
        setLocationError(new Error("Geolocation not supported"));
        return;
      }

      if (navigator.permissions) {
        try {
          const p = await navigator.permissions.query({
            name: "geolocation",
          });

          setLocationPermission(p.state);

          p.onchange = () => {
            setLocationPermission(p.state);
          };
        } catch {}
      }

      const ok = await tryGetLocation(true);
      if (ok) startLocationUpdates();
      else startRetryAttempts();
    };

    if (accessToken) init();
    return stopAll;
  }, [accessToken]);

  // ----------------------------------------------------
  // RETURN API
  // ----------------------------------------------------
  return {
    isLocationEnabled,
    locationPermission,
    showLocationNotification,
    lastLocationUpdate,
    locationError,
    currentAccuracy,
    locationStatus,

    retryLocation: tryGetLocation,
    dismissNotification: () => setShowLocationNotification(false),

    getHighAccuracyLocation,
    getCurrentLocation,
  };
};

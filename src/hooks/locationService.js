import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import useRequest from "@/hooks/useRequest";


// Custom hook for location services
export const useLocationService = () => {
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [promptCount, setPromptCount] = useState(0);
  const [lastPromptTime, setLastPromptTime] = useState(null);
  const { data, error, loading, request, errorDetail } = useRequest();

  const intervalRef = useRef(null);
  const router = useRouter();
  const accessToken = useSelector((state) => state.user.accessToken);
  

  // Send location to server
  const sendLocationToServer = async (latitude, longitude) => {
    try {
      console.log('Sending location:', latitude, longitude);
      await request("/api/user", "POST", {
        lat:  latitude+"",
        lng:  longitude+"",
        role: "user",
        accessToken,
        apiType: "updateUser",
      });

      if (!error) {
        setLastLocationUpdate(new Date());
        console.log('Location updated successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to send location to server:", err);
      return false;
    }
  };

  // Get current position
const getCurrentLocation = useCallback(() => {
  return new Promise(async (resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported. Falling back to IP-based location.');
      return getFallbackLocation(resolve, reject);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Fallback to IP-based geolocation
        getFallbackLocation(resolve, reject);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}, []);


const getFallbackLocation = async (resolve, reject) => {

  console.log("fall back")
    console.log("fall back")
  console.log("fall back")
  console.log("fall back")
  console.log("fall back")
  console.log("fall back")
  console.log("fall back")
  console.log("fall back")

  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
     console.log(data)
    if (data && data.latitude && data.longitude) {
      resolve({
        latitude: data.latitude,
        longitude: data.longitude
      });
    } else {
      reject(new Error('Could not determine location from IP.'));
    }
  } catch (error) {
    console.error('IP-based location error:', error);
    reject(error);
  }
};


  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      // Check current permission status
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(permission.state);
        
        if (permission.state === 'granted') {
          const location = await getCurrentLocation();
          await sendLocationToServer(location.latitude, location.longitude);
          setIsLocationEnabled(true);
          setShowLocationPrompt(false);
          startLocationUpdates();
          return true;
        }
      }

      // Try to get location (this will trigger permission prompt if needed)
      const location = await getCurrentLocation();
      await sendLocationToServer(location.latitude, location.longitude);
      setIsLocationEnabled(true);
      setLocationPermission('granted');
      setShowLocationPrompt(false);
      startLocationUpdates();
      return true;

    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermission('denied');
      setIsLocationEnabled(false);
      return false;
    }
  }, [getCurrentLocation, accessToken]);

  // Start automatic location updates every 10 minutes
  const startLocationUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const location = await getCurrentLocation();
        await sendLocationToServer(location.latitude, location.longitude);
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes
  }, [getCurrentLocation]);

  // Stop location updates
  const stopLocationUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Check if we should show location prompt
  const shouldShowPrompt = useCallback(() => {
    if (isLocationEnabled || locationPermission === 'granted') {
      return false;
    }

    // Don't show prompt too frequently
    const now = Date.now();
    const timeSinceLastPrompt = lastPromptTime ? now - lastPromptTime : Infinity;
    const minTimeBetweenPrompts = 30 * 60 * 1000; // 30 minutes

    // Show prompt if:
    // 1. Never prompted before, OR
    // 2. Last prompt was more than 30 minutes ago AND we've prompted less than 3 times
    return !lastPromptTime || (timeSinceLastPrompt > minTimeBetweenPrompts && promptCount < 3);
  }, [isLocationEnabled, locationPermission, lastPromptTime, promptCount]);

  // Handle navigation - check if we should prompt for location
  const handleNavigation = useCallback(() => {
    if (shouldShowPrompt()) {
      setShowLocationPrompt(true);
      setLastPromptTime(Date.now());
      setPromptCount(prev => prev + 1);
    }
  }, [shouldShowPrompt]);

  // Initialize location service
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Check if permission was previously granted
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setLocationPermission(permission.state);
          
          if (permission.state === 'granted') {
            const location = await getCurrentLocation();
            await sendLocationToServer(location.latitude, location.longitude);
            setIsLocationEnabled(true);
            startLocationUpdates();
          }

          // Listen for permission changes
          permission.onchange = () => {
            setLocationPermission(permission.state);
            if (permission.state === 'granted') {
              setIsLocationEnabled(true);
              startLocationUpdates();
            } else {
              setIsLocationEnabled(false);
              stopLocationUpdates();
            }
          };
        }
      } catch (error) {
        console.error('Error initializing location service:', error);
      }
    };

    if (accessToken) {
      initializeLocation();
    }

    return () => {
      stopLocationUpdates();
    };
  }, [accessToken]);

  return {
    isLocationEnabled,
    locationPermission,
    showLocationPrompt,
    lastLocationUpdate,
    promptCount,
    requestLocationPermission,
    handleNavigation,
    dismissLocationPrompt: () => setShowLocationPrompt(false),
    getCurrentLocation,
    sendLocationToServer
  };
};
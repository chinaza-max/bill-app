// ==================================================
// BACKGROUND LOCATION SERVICE
// ==================================================
// Place this in: /services/backgroundLocationService.js

class BackgroundLocationService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.config = {
      updateInterval: 20 * 60 * 1000, // 20 minutes default
      simulationMode: false,
      onUpdate: null,
      onError: null,
    };
    
    // Simulation coordinates (various locations)
    this.simulationCoordinates = [
      { lat: 9.0765, lng: 7.3986, name: "Abuja Central" },
      { lat: 9.0820, lng: 7.4010, name: "Maitama" },
      { lat: 9.0574, lng: 7.4898, name: "Lugbe" },
      { lat: 9.1100, lng: 7.4165, name: "Kubwa" },
      { lat: 9.0403, lng: 7.4960, name: "Airport Road" },
      { lat: 9.0643, lng: 7.4750, name: "Gwarinpa" },
      { lat: 9.0415, lng: 7.3900, name: "Garki" },
      { lat: 9.1021, lng: 7.3986, name: "Wuse" },
      { lat: 9.0333, lng: 7.4833, name: "Kuje" },
      { lat: 9.1500, lng: 7.3500, name: "Bwari" },
    ];
    
    this.currentSimIndex = 0;
    this.locationFilter = new LocationFilter(5);
    this.lastGoodLocation = null;
  }

  // ----------------------------------------------------
  // INITIALIZE SERVICE
  // ----------------------------------------------------
  init(config = {}) {
    this.config = {
      ...this.config,
      ...config,
    };
    
    console.log("🚀 Background Location Service Initialized");
    console.log(`Mode: ${this.config.simulationMode ? "SIMULATION" : "REAL GPS"}`);
    console.log(`Update Interval: ${this.config.updateInterval / 60000} minutes`);
    
    return this;
  }

  // ----------------------------------------------------
  // START BACKGROUND UPDATES
  // ----------------------------------------------------
  start() {
    if (this.isRunning) {
      console.warn("⚠️ Service already running");
      return;
    }

    this.isRunning = true;
    console.log("▶️ Background location updates started");

    // Run immediately on start
    this.performUpdate();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.performUpdate();
    }, this.config.updateInterval);
  }

  // ----------------------------------------------------
  // STOP BACKGROUND UPDATES
  // ----------------------------------------------------
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log("⏹️ Background location updates stopped");
  }

  // ----------------------------------------------------
  // PERFORM LOCATION UPDATE
  // ----------------------------------------------------
  async performUpdate() {
    const timestamp = new Date().toISOString();
    console.log(`\n📍 [${timestamp}] Performing location update...`);

    try {
      let location;
      
      if (this.config.simulationMode) {
        location = await this.getSimulatedLocation();
      } else {
        location = await this.getRealLocation();
      }

      console.log(`✓ Location obtained:`, {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: Math.round(location.accuracy),
        mode: this.config.simulationMode ? "SIMULATED" : "REAL",
      });

      // Call update callback
      if (this.config.onUpdate) {
        await this.config.onUpdate(location);
      }

      return location;
    } catch (error) {
      console.error("❌ Location update failed:", error.message);
      
      if (this.config.onError) {
        this.config.onError(error);
      }
      
      throw error;
    }
  }

  // ----------------------------------------------------
  // GET SIMULATED LOCATION
  // ----------------------------------------------------
  async getSimulatedLocation() {
    // Cycle through coordinates
    const coord = this.simulationCoordinates[this.currentSimIndex];
    this.currentSimIndex = (this.currentSimIndex + 1) % this.simulationCoordinates.length;

    // Add small random variance for realism
    const variance = 0.0005; // ~50 meters
    const lat = coord.lat + (Math.random() - 0.5) * variance;
    const lng = coord.lng + (Math.random() - 0.5) * variance;

    // Simulate GPS accuracy (20-100 meters)
    const accuracy = 20 + Math.random() * 80;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return {
      latitude: lat,
      longitude: lng,
      accuracy: accuracy,
      timestamp: Date.now(),
      simulated: true,
      locationName: coord.name,
    };
  }

  // ----------------------------------------------------
  // GET REAL LOCATION (HIGH ACCURACY)
  // ----------------------------------------------------
  async getRealLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      let bestPosition = null;

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      };

      const fallbackTimer = setTimeout(() => {
        if (bestPosition) {
          resolve(this.formatPosition(bestPosition));
        } else {
          reject(new Error("Location timeout"));
        }
      }, 16000);

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { accuracy } = position.coords;

          if (accuracy > 500) return; // Ignore bad readings

          if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          // Got good accuracy, use it
          if (accuracy <= 70) {
            clearTimeout(fallbackTimer);
            navigator.geolocation.clearWatch(watchId);
            resolve(this.formatPosition(bestPosition));
          }
        },
        (error) => {
          clearTimeout(fallbackTimer);
          navigator.geolocation.clearWatch(watchId);
          reject(error);
        },
        options
      );
    });
  }

  // ----------------------------------------------------
  // FORMAT POSITION WITH SMOOTHING
  // ----------------------------------------------------
  formatPosition(position) {
    const { latitude, longitude, accuracy } = position.coords;

    const smoothed = this.locationFilter.add(latitude, longitude, accuracy);

    this.lastGoodLocation = {
      lat: smoothed.lat,
      lng: smoothed.lng,
    };

    return {
      latitude: smoothed.lat,
      longitude: smoothed.lng,
      accuracy: smoothed.accuracy,
      timestamp: position.timestamp,
      simulated: false,
    };
  }

  // ----------------------------------------------------
  // UPDATE CONFIGURATION
  // ----------------------------------------------------
  updateConfig(config) {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = {
      ...this.config,
      ...config,
    };

    console.log("⚙️ Configuration updated:", {
      interval: `${this.config.updateInterval / 60000} min`,
      mode: this.config.simulationMode ? "SIMULATION" : "REAL GPS",
    });

    if (wasRunning) {
      this.start();
    }
  }

  // ----------------------------------------------------
  // SET UPDATE INTERVAL
  // ----------------------------------------------------
  setInterval(minutes) {
    this.updateConfig({
      updateInterval: minutes * 60 * 1000,
    });
  }

  // ----------------------------------------------------
  // TOGGLE SIMULATION MODE
  // ----------------------------------------------------
  setSimulationMode(enabled) {
    this.updateConfig({
      simulationMode: enabled,
    });
  }

  // ----------------------------------------------------
  // GET STATUS
  // ----------------------------------------------------
  getStatus() {
    return {
      isRunning: this.isRunning,
      simulationMode: this.config.simulationMode,
      updateInterval: this.config.updateInterval,
      intervalMinutes: this.config.updateInterval / 60000,
      lastLocation: this.lastGoodLocation,
    };
  }
}

// Moving Average Filter (from your existing code)
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

// ==================================================
// SINGLETON INSTANCE ll
// ==================================================
const locationService = new BackgroundLocationService();

export default locationService;
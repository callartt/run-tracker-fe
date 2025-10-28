// src/utils/LocationSimulator.js

/**
 * An enhanced location simulator that forces significant position changes
 * to ensure route lines are drawn on the map
 */
class LocationSimulator {
    constructor(options = {}) {
      this.options = {
        // Starting position (defaults to London Bridge)
        startLat: 51.5079,
        startLng: -0.0877,
        // Speed in meters per second (increased for more noticeable movement)
        speed: 10.0, // Faster than normal walking speed
        // Update interval in milliseconds
        interval: 2000, // Longer interval to ensure bigger distance between points
        // Minimum movement distance in meters (must be much higher than minDistance in useGeolocation)
        minMoveDistance: 10, // Ensure we always move at least this far
        // How long simulation should run (ms), 0 for indefinite
        duration: 0,
        // Override with custom options
        ...options
      };
      
      this.isActive = false;
      this.intervalId = null;
      this.pointCount = 0;
      this.currentPosition = {
        latitude: this.options.startLat,
        longitude: this.options.startLng,
        accuracy: 3, // Very good accuracy (lower is better)
        altitude: 10,
        altitudeAccuracy: 1,
        heading: Math.random() * 360,
        speed: this.options.speed
      };
      
      // Conversion factors (approximate for London area)
      this.metersToLatitude = 0.000009;
      this.metersToLongitude = 0.000011;
    }
    
    // Start the simulation
    start() {
      if (this.isActive) return;
      
      this.isActive = true;
      console.log('🤖 Location simulation started');
      
      // Force clear any existing watches to prevent conflicts
      this._forceResetGeolocation();
      
      // Trigger first position update immediately
      this._moveToNextPosition();
      this._triggerPositionUpdate();
      
      // Set up interval for regular updates
      this.intervalId = setInterval(() => {
        // Generate new position
        this._moveToNextPosition();
        
        // Trigger position update event
        this._triggerPositionUpdate();
      }, this.options.interval);
      
      return true;
    }
    
    // Stop the simulation
    stop() {
      if (!this.isActive) return;
      
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isActive = false;
      
      console.log('🤖 Location simulation stopped');
      return true;
    }
    
    // Toggle simulation on/off
    toggle() {
      return this.isActive ? this.stop() : this.start();
    }
    
    // Force reset of geolocation to clear any existing watches
    _forceResetGeolocation() {
      if (navigator.geolocation._originalWatchPosition) {
        // We have access to the original methods, so we can reset
        if (navigator.geolocation._watchIds) {
          // Clear all existing watches
          Object.keys(navigator.geolocation._successCallbacks || {}).forEach(id => {
            try {
              navigator.geolocation.clearWatch(parseInt(id));
            } catch (e) {
              console.log(`Failed to clear watch ${id}`, e);
            }
          });
        }
        
        // Clear all callbacks
        navigator.geolocation._successCallbacks = {};
        navigator.geolocation._errorCallbacks = {};
      }
    }
    
    // Calculate next position based on speed and heading
    _moveToNextPosition() {
      this.pointCount++;
      
      // Calculate distance to move based on speed and time interval
      let distanceMeters = this.options.speed * (this.options.interval / 1000);
      
      // Make sure we move at least the minimum distance
      distanceMeters = Math.max(distanceMeters, this.options.minMoveDistance);
      
      // Current heading in radians
      const headingRad = (this.currentPosition.heading || 0) * Math.PI / 180;
      
      // Calculate new position - using larger multipliers to ensure significant movement
      const latChange = Math.cos(headingRad) * distanceMeters * this.metersToLatitude;
      const lngChange = Math.sin(headingRad) * distanceMeters * this.metersToLongitude;
      
      const newLatitude = this.currentPosition.latitude + latChange;
      const newLongitude = this.currentPosition.longitude + lngChange;
      
      // Slight random change in heading (max 30 degrees) for natural curves
      const headingChange = (Math.random() - 0.5) * 60;
      const newHeading = ((this.currentPosition.heading || 0) + headingChange) % 360;
      
      // Calculate actual distance moved for logging
      const distanceKm = Math.sqrt(
        Math.pow(latChange / this.metersToLatitude, 2) + 
        Math.pow(lngChange / this.metersToLongitude, 2)
      ) / 1000;
      
      // Update current position
      this.currentPosition = {
        latitude: newLatitude,
        longitude: newLongitude,
        accuracy: 3, // Very good accuracy to ensure points are added
        altitude: this.currentPosition.altitude + (Math.random() - 0.5),
        altitudeAccuracy: 1,
        heading: newHeading,
        speed: this.options.speed + (Math.random() - 0.5),
        timestamp: Date.now()
      };
      
      console.log(`🤖 Point #${this.pointCount}: [${newLatitude.toFixed(6)}, ${newLongitude.toFixed(6)}], moved: ${(distanceKm * 1000).toFixed(2)}m`);
    }
    
    // Trigger the Geolocation position update event to be caught by the app
    _triggerPositionUpdate() {
      // Create a position object that matches the Geolocation API format
      const position = {
        coords: {
          latitude: this.currentPosition.latitude,
          longitude: this.currentPosition.longitude,
          accuracy: this.currentPosition.accuracy,
          altitude: this.currentPosition.altitude,
          altitudeAccuracy: this.currentPosition.altitudeAccuracy,
          heading: this.currentPosition.heading,
          speed: this.currentPosition.speed
        },
        timestamp: this.currentPosition.timestamp
      };
      
      // Find all registered success callbacks for watchPosition
      if (navigator.geolocation._successCallbacks) {
        const callbacks = Object.values(navigator.geolocation._successCallbacks);
        
        if (callbacks.length > 0) {
          // Trigger all registered callbacks with the simulated position
          callbacks.forEach(callback => {
            if (typeof callback === 'function') {
              callback(position);
            }
          });
        } else {
          // No callbacks registered yet, let's trigger the geolocation position changed event
          this._directlyTriggerPositionEvent(position);
        }
      } else {
        // Fallback to direct event triggering
        this._directlyTriggerPositionEvent(position);
      }
      
      // Also trigger getCurrentPosition callback if set
      if (typeof navigator.geolocation._currentPositionCallback === 'function') {
        navigator.geolocation._currentPositionCallback(position);
        // Clear it after use
        navigator.geolocation._currentPositionCallback = null;
      }
    }
    
    // Directly trigger a geolocation position event as fallback
    _directlyTriggerPositionEvent(position) {
      // As a fallback, dispatch a custom event that library hooks might be listening for
      try {
        const event = new CustomEvent('geolocation:position-changed', { 
          detail: position,
          bubbles: true
        });
        document.dispatchEvent(event);
      } catch (e) {
        console.error('Failed to dispatch position event', e);
      }
    }
    
    // Monkey patch the geolocation API to capture callbacks
    static patchGeolocationAPI() {
      // Only patch once
      if (navigator.geolocation._patched) return;
      
      // Store original methods
      navigator.geolocation._originalWatchPosition = navigator.geolocation.watchPosition;
      navigator.geolocation._originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      navigator.geolocation._originalClearWatch = navigator.geolocation.clearWatch;
      
      // Create storage for callbacks
      navigator.geolocation._successCallbacks = {};
      navigator.geolocation._errorCallbacks = {};
      navigator.geolocation._watchIds = 0;
      navigator.geolocation._patched = true;
      
      // Override watchPosition to capture callbacks
      navigator.geolocation.watchPosition = function(success, error, options) {
        const watchId = ++navigator.geolocation._watchIds;
        
        // Store callbacks for later use
        if (typeof success === 'function') {
          navigator.geolocation._successCallbacks[watchId] = success;
        }
        
        if (typeof error === 'function') {
          navigator.geolocation._errorCallbacks[watchId] = error;
        }
        
        // Still call the original method to maintain normal functionality
        navigator.geolocation._originalWatchPosition.call(this, success, error, options);
        
        console.log(`🤖 Geolocation watchPosition registered (ID: ${watchId})`);
        return watchId;
      };
      
      // Override getCurrentPosition 
      navigator.geolocation.getCurrentPosition = function(success, error, options) {
        // Store callback temporarily
        if (typeof success === 'function') {
          navigator.geolocation._currentPositionCallback = success;
        }
        
        // Call original method
        navigator.geolocation._originalGetCurrentPosition.call(this, success, error, options);
        
        console.log(`🤖 Geolocation getCurrentPosition registered`);
      };
      
      // Override clearWatch to remove stored callbacks
      navigator.geolocation.clearWatch = function(watchId) {
        // Remove stored callbacks
        delete navigator.geolocation._successCallbacks[watchId];
        delete navigator.geolocation._errorCallbacks[watchId];
        
        // Call original method
        navigator.geolocation._originalClearWatch.call(this, watchId);
        
        console.log(`🤖 Geolocation watch cleared (ID: ${watchId})`);
      };
      
      console.log('🤖 Geolocation API patched for simulation');
    }
  }
  
  // Initialize the library immediately
  LocationSimulator.patchGeolocationAPI();
  
  // Export for use in other files
  export default LocationSimulator;
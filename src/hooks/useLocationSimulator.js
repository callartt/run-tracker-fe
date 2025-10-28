// src/hooks/useLocationSimulator.js
import { useState, useEffect, useRef } from 'react';

/**
 * A hook that simulates GPS movement
 * Can be used for testing the app without having to physically move
 */
const useLocationSimulator = (options = {}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedPosition, setSimulatedPosition] = useState(null);
  const [simulatedRoute, setSimulatedRoute] = useState([]);
  const [simulatedDistance, setSimulatedDistance] = useState(0);
  const simulationIntervalRef = useRef(null);
  
  // Default options
  const defaultOptions = {
    speedMetersPerSecond: 3.0, // Average walking/jogging speed
    updateIntervalMs: 1000, // Update every second
    jitterMeters: 2, // Random variation to simulate GPS noise
    startPosition: null, // Will use device location or default if not provided
    ...options
  };
  
  // Generate a new position based on the previous one
  const generateNextPosition = (prevPosition) => {
    if (!prevPosition) {
      // Default starting position if none provided
      return {
        latitude: 51.5074, // London
        longitude: -0.1278,
        accuracy: 5 + Math.random() * 5, // Between 5-10 meters
        altitude: 10 + Math.random() * 5,
        altitudeAccuracy: 5,
        heading: Math.random() * 360, // Random initial direction
        speed: defaultOptions.speedMetersPerSecond,
        timestamp: Date.now()
      };
    }
    
    // Convert meters to approximate latitude/longitude
    // This is a rough calculation that works for small distances
    const metersToLatitude = 0.000009;
    const metersToLongitude = 0.000011;
    
    // Calculate distance to move based on speed and time interval
    const distanceMeters = defaultOptions.speedMetersPerSecond * 
                        (defaultOptions.updateIntervalMs / 1000);
    
    // Current heading in radians
    const headingRad = (prevPosition.heading || 0) * Math.PI / 180;
    
    // Calculate new position
    let newLatitude = prevPosition.latitude + 
      (Math.cos(headingRad) * distanceMeters * metersToLatitude);
    
    let newLongitude = prevPosition.longitude + 
      (Math.sin(headingRad) * distanceMeters * metersToLongitude);
    
    // Add some random jitter for realism
    newLatitude += (Math.random() - 0.5) * defaultOptions.jitterMeters * metersToLatitude;
    newLongitude += (Math.random() - 0.5) * defaultOptions.jitterMeters * metersToLongitude;
    
    // Slight random change in heading to simulate natural path
    const headingChange = (Math.random() - 0.5) * 30;
    const newHeading = (prevPosition.heading + headingChange) % 360;
    
    // Return new position
    return {
      latitude: newLatitude,
      longitude: newLongitude,
      accuracy: 5 + Math.random() * 5, // Between 5-10 meters
      altitude: prevPosition.altitude + (Math.random() - 0.5) * 2, // Small altitude changes
      altitudeAccuracy: 5,
      heading: newHeading,
      speed: defaultOptions.speedMetersPerSecond + (Math.random() - 0.5), // Small speed variations
      timestamp: Date.now()
    };
  };
  
  // Calculate distance between two positions (using Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  };
  
  // Start simulation
  const startSimulation = (startingPosition = null) => {
    // Clear any existing simulation
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    
    // Use provided starting position or generate a new one
    const initialPosition = startingPosition || 
                          defaultOptions.startPosition || 
                          generateNextPosition(null);
    
    setSimulatedPosition(initialPosition);
    setSimulatedRoute([initialPosition]);
    setSimulatedDistance(0);
    setIsSimulating(true);
    
    console.log("Simulation started with initial position:", {
      lat: initialPosition.latitude.toFixed(6),
      lng: initialPosition.longitude.toFixed(6)
    });
    
    // Set up interval to generate new positions
    simulationIntervalRef.current = setInterval(() => {
      setSimulatedPosition(prevPosition => {
        const newPosition = generateNextPosition(prevPosition);
        
        // Calculate distance from previous point
        const distance = calculateDistance(
          prevPosition.latitude,
          prevPosition.longitude,
          newPosition.latitude,
          newPosition.longitude
        );
        
        // Update total distance
        setSimulatedDistance(prevDistance => prevDistance + distance);
        
        // Update route with new point
        setSimulatedRoute(prevRoute => [...prevRoute, newPosition]);
        
        console.log("Simulated movement:", {
          lat: newPosition.latitude.toFixed(6),
          lng: newPosition.longitude.toFixed(6),
          distance: distance.toFixed(2) + "m",
          heading: Math.round(newPosition.heading) + "°"
        });
        
        return newPosition;
      });
    }, defaultOptions.updateIntervalMs);
    
    return true;
  };
  
  // Stop simulation
  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setIsSimulating(false);
      console.log("Simulation stopped");
      return true;
    }
    return false;
  };
  
  // Reset simulation data
  const resetSimulation = () => {
    stopSimulation();
    setSimulatedPosition(null);
    setSimulatedRoute([]);
    setSimulatedDistance(0);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);
  
  return {
    isSimulating,
    simulatedPosition,
    simulatedRoute,
    simulatedDistance,
    startSimulation,
    stopSimulation,
    resetSimulation
  };
};

export default useLocationSimulator;
import { useState, useEffect, useRef } from 'react'
import { calculateDistance } from '../utils/calculations'

const useGeolocation = (options = {}) => {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [route, setRoute] = useState([])
  const [distance, setDistance] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  const [watchId, setWatchId] = useState(null)

  // Default options
  const defaultOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000, // Increased from 5000 to 10000 ms
    minDistance: 1, // Reduced from 5 to 1 meter
    ...options
  }

  // Start tracking location
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return false
    }

    try {
      // Clear any existing data
      setRoute([])
      setDistance(0)
      
      // Start watching position with highest accuracy settings
      const id = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handleError,
        {
          enableHighAccuracy: true, // Force high accuracy
          timeout: 15000, // Increased timeout
          maximumAge: 0   // Always get fresh position
        }
      )
      
      setWatchId(id)
      setIsTracking(true)
      console.log("📍 Location tracking started")
      return true
    } catch (err) {
      setError('Failed to start location tracking')
      return false
    }
  }

  // Stop tracking location
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsTracking(false)
      console.log("📍 Location tracking stopped")
      return true
    }
    return false
  }

 // Handle position updates
const handlePositionUpdate = (pos) => {
    const newPosition = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp
    }
    
    // Log position updates for debugging
    console.log("📍 GPS Update:", {
      lat: newPosition.latitude.toFixed(6),
      lng: newPosition.longitude.toFixed(6),
      accuracy: Math.round(newPosition.accuracy),
      speed: newPosition.speed
    });
    
    setPosition(newPosition)
    
    // IMPORTANT CHANGE: Increased accuracy threshold from 10m to 30m
    // This allows points to be added even with less accurate GPS indoors
    if (newPosition.accuracy <= 30) { 
      setRoute(prevRoute => {
        // Skip if this is the first point
        if (prevRoute.length === 0) {
          console.log("📍 First point added to route");
          return [newPosition]
        }
        
        // Calculate distance from last point
        const lastPoint = prevRoute[prevRoute.length - 1]
        const newDistance = calculateDistance(
          lastPoint.latitude, 
          lastPoint.longitude, 
          newPosition.latitude, 
          newPosition.longitude
        )
        
        // Log distance calculation
        console.log("📍 Distance from last point:", newDistance.toFixed(2), "meters");
        
        // IMPORTANT CHANGE: Reduced minimum distance to 1 meter
        // This ensures more points are added for better line drawing
        if (newDistance >= 1) {
          // Update total distance
          setDistance(prevDistance => {
            const updatedDistance = prevDistance + newDistance;
            console.log("📍 Total distance updated:", updatedDistance.toFixed(2), "meters");
            return updatedDistance;
          });
          
          console.log("📍 Adding new point to route. Total points:", prevRoute.length + 1);
          return [...prevRoute, newPosition]
        } else {
          console.log("📍 Point too close, not adding to route");
        }
        
        return prevRoute
      })
    } else {
      console.log("📍 GPS accuracy too low:", newPosition.accuracy, "meters (need ≤ 30m)");
    }
  }

  // Handle errors
  const handleError = (err) => {
    console.error('Geolocation error:', err)
    let errorMessage = 'Failed to get location'
    
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location access denied. Please enable location permissions.'
        break
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'Location information is unavailable. Check your device settings.'
        break
      case 3: // TIMEOUT
        errorMessage = 'Location request timed out. Please try again.'
        break
      default:
        errorMessage = `Location error: ${err.message}`
    }
    
    setError(errorMessage)
  }

  // Get current position once
  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return Promise.reject('Geolocation not supported')
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
          }
          setPosition(position)
          resolve(position)
        },
        (err) => {
          handleError(err)
          reject(err)
        },
        defaultOptions
      )
    })
  }

  // Clear tracking data
  const clearRoute = () => {
    setRoute([])
    setDistance(0)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return {
    position,
    error,
    route,
    distance,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentPosition,
    clearRoute
  }
}

export default useGeolocation
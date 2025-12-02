import { useState, useEffect, useRef, useCallback } from 'react'
import { calculateDistance } from '../utils/calculations'

const useGeolocation = (isRunning = true) => {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [route, setRoute] = useState([])
  const [distance, setDistance] = useState(0)
  const [isTracking, setIsTracking] = useState(false)
  
  const watchIdRef = useRef(null)
  const lastPositionRef = useRef(null)
  const isRunningRef = useRef(isRunning)
  const isSimulatingRef = useRef(false)

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])
  
  const normalizePosition = useCallback((pos) => {
    if (!pos) return null

    if (pos.coords) {
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 10,
        speed: pos.coords.speed,
        timestamp: pos.timestamp
      }
    }

    if (typeof pos.latitude === 'number') {
      return {
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy || 5,
        speed: pos.speed,
        timestamp: pos.timestamp || Date.now()
      }
    }

    return null
  }, [])

  const handlePositionUpdate = useCallback((rawPosition, isSimulationSource = false) => {
    if (!isSimulationSource && isSimulatingRef.current) return

    const newPosition = normalizePosition(rawPosition)
    if (!newPosition) return

    if (!isSimulationSource && newPosition.accuracy > 50) return

    setPosition(newPosition)

    if (!isRunningRef.current) return

    if (lastPositionRef.current) {
      const dist = calculateDistance(
        lastPositionRef.current.latitude,
        lastPositionRef.current.longitude,
        newPosition.latitude,
        newPosition.longitude
      )

      if (dist > 500) {
        if (isSimulationSource) {
           lastPositionRef.current = newPosition
           setRoute(prev => [...prev, newPosition])
        }
        return
      }

      if (isSimulationSource || dist >= 3) {
        setDistance(prev => prev + dist)
        
        lastPositionRef.current = newPosition
        
        setRoute(prevRoute => {
            if (prevRoute.length === 0) return [newPosition]
      
            const lastRoutePoint = prevRoute[prevRoute.length - 1]
            const distFromLastRoutePoint = calculateDistance(
              lastRoutePoint.latitude, 
              lastRoutePoint.longitude, 
              newPosition.latitude, 
              newPosition.longitude
            )
            
            const drawThreshold = isSimulationSource ? 2 : 5
            
            if (distFromLastRoutePoint >= drawThreshold) {
              return [...prevRoute, newPosition]
            }
            return prevRoute
          })
      }
    } else {
        lastPositionRef.current = newPosition
        setRoute([newPosition])
    }

  }, [normalizePosition])

  const startTracking = useCallback(() => {
    if (watchIdRef.current !== null) return

    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }

    setRoute([])
    setDistance(0)
    lastPositionRef.current = null
    isSimulatingRef.current = false

    setIsTracking(true)
    setError(null)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        handlePositionUpdate(pos, false)
      },
      (err) => {
        console.error(err)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
    
    watchIdRef.current = id
  }, [handlePositionUpdate])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setIsTracking(false)
      isSimulatingRef.current = false
    }
  }, [])

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const normalized = normalizePosition(pos)
        if (normalized) setPosition(normalized)
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [normalizePosition])

  useEffect(() => {
    const handleSimEvent = (event) => {
      isSimulatingRef.current = true
      handlePositionUpdate(event.detail, true)
    }

    window.addEventListener('geolocation-simulate', handleSimEvent)
    return () => window.removeEventListener('geolocation-simulate', handleSimEvent)
  }, [handlePositionUpdate])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    position,
    error,
    route,
    distance,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentPosition
  }
}

export default useGeolocation
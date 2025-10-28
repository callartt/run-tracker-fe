import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaLocationArrow,
  FaCrosshairs,
  FaHeartbeat
} from 'react-icons/fa'
import RunMap from '../components/map/RunMap'
import HeartRateMonitor from '../components/heartRate/HeartRateMonitor'
import { useWorkout } from '../context/WorkoutContext'
import { useUser } from '../context/UserContext'
import useGeolocation from '../hooks/useGeolocation'
import { formatDistance, formatDuration, calculatePace } from '../utils/calculations'

const ActiveRun = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { 
    startWorkout, 
    updateActiveWorkout, 
    addRoutePoint,
    addHeartRateData, 
    finishWorkout, 
    activeWorkout 
  } = useWorkout()
  
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(0)
  const [showHeartRate, setShowHeartRate] = useState(false)
  const [targetHeartRateZone, setTargetHeartRateZone] = useState(user.heartRateZones.aerobic)
  const timerRef = useRef(null)
  
  // Initialize geolocation hook
  const {
    position,
    error: locationError,
    route,
    distance,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentPosition
  } = useGeolocation({
    enableHighAccuracy: true,
    minDistance: 2 // Record points at least 2 meters apart
  })
  
  // Start or resume workout
  const handleStartRun = () => {
    if (!activeWorkout) {
      // Start new workout
      const workout = startWorkout()
      
      // Start location tracking
      startTracking()
    }
    
    // Start or resume timer
    setIsRunning(true)
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }
  
  // Pause workout
  const handlePauseRun = () => {
    setIsRunning(false)
    clearInterval(timerRef.current)
    timerRef.current = null
    
    // Keep tracking location at a lower frequency during pause
    // This is optional - you could also completely stop tracking
  }
  
  // Stop and save workout
  // Inside ActiveRun.jsx


  const handleStopRun = () => {
    if (window.confirm('Are you sure you want to finish this workout?')) {
      // First stop all tracking and timers
      setIsRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop location tracking
      stopTracking();
      
      // Save workout and capture its ID
      const savedWorkout = finishWorkout();
      console.log("Saved workout:", savedWorkout);
      
      if (savedWorkout && savedWorkout.id) {
        // Store the ID in a variable to ensure it doesn't get lost
        const workoutId = savedWorkout.id;
        
        // Use window.location for a "hard" navigation instead of React Router
        // This bypasses React's state management which might be causing the issue
        window.location.href = `/workout/${workoutId}`;
      } else {
        // Only fall back to history if we couldn't get a workout ID
        console.error("No valid workout returned from finishWorkout");
        window.location.href = '/history';
      }
    }
  };
  
  // Center map on current location
  const handleCenterMap = async () => {
    try {
      await getCurrentPosition()
    } catch (error) {
      console.error('Error getting current position:', error)
    }
  }
  
  // Handle heart rate changes
  const handleHeartRateChange = (bpm) => {
    addHeartRateData(bpm)
  }
  
  // Update active workout with current data
  useEffect(() => {
    if (activeWorkout && position) {
      // Add position to route
      addRoutePoint(position)
      
      // Update workout data
      updateActiveWorkout({
        duration,
        distance
      })
    }
  }, [position, duration, distance, activeWorkout, addRoutePoint, updateActiveWorkout])
  
  // Auto-start workout if it was already active
  useEffect(() => {
    if (activeWorkout && activeWorkout.isActive) {
      startTracking()
      handleStartRun()
      
      // Calculate elapsed time if reconnecting
      if (activeWorkout.startTime) {
        const startTime = new Date(activeWorkout.startTime)
        const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000)
        setDuration(elapsedSeconds)
      }
    }
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [activeWorkout])
  
  // Calculate current pace
  const getCurrentPace = () => {
    if (!position || !position.speed || position.speed <= 0) {
      return '--:--'
    }
    
    return calculatePace(position.speed, user.units)
  }
  
  return (
  <div className="pb-16">
    {/* Map */}
    <div className="relative">
      <RunMap 
        route={route} 
        currentPosition={position}
        isActive={isTracking}
        followPosition={isRunning}
        mapHeight="h-64 md:h-88"
      />
      
      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button 
          onClick={handleCenterMap}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md"
          aria-label="Center map on current location"
        >
          <FaCrosshairs className="text-primary" />
        </button>
      </div>
    </div>
    
    {/* Add this location waiting notification */}
    {!position && (
      <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg mb-4 mt-4">
        <p>Waiting for location... You can still track time and manually add distance later.</p>
        <button 
          onClick={getCurrentPosition}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    )}
    
    {/* Stats Panel */}
    <div className="card mt-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Distance */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
            <div className="text-2xl font-bold mt-1">
              {formatDistance(distance, user.units)}
            </div>
          </div>
          
          {/* Duration */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</h3>
            <div className="text-2xl font-bold mt-1">
              {formatDuration(duration)}
            </div>
          </div>
          
          {/* Pace */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Current Pace
            </h3>
            <div className="text-2xl font-bold mt-1">
              {getCurrentPace()}
              <span className="text-sm text-gray-500 ml-1">
                {user.units === 'metric' ? 'min/km' : 'min/mi'}
              </span>
            </div>
          </div>
          
          {/* Average Pace */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Average Pace
            </h3>
            <div className="text-2xl font-bold mt-1">
              {distance > 0 && duration > 0 
                ? calculatePace(distance / duration, user.units) 
                : '--:--'}
              <span className="text-sm text-gray-500 ml-1">
                {user.units === 'metric' ? 'min/km' : 'min/mi'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Heart Rate Toggle Button */}
      <button
        onClick={() => setShowHeartRate(!showHeartRate)}
        className="flex items-center justify-center space-x-2 mt-4 w-full py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <FaHeartbeat className="text-red-500" />
        <span>{showHeartRate ? 'Hide Heart Rate' : 'Show Heart Rate'}</span>
      </button>
      
      {/* Heart Rate Monitor */}
      {showHeartRate && (
        <div className="mt-4">
          <HeartRateMonitor 
            onHeartRateChange={handleHeartRateChange} 
            targetZone={targetHeartRateZone}
          />
        </div>
      )}
      
      {/* Location Error */}
      {locationError && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400 rounded-lg">
          {locationError}
        </div>
      )}
      
      {/* Controls */}
      <div className="fixed bottom-16 inset-x-0 bg-white dark:bg-gray-800 p-4 shadow-lg">
        <div className="flex justify-around max-w-md mx-auto">
          {isRunning ? (
            <>
              <button
                onClick={handlePauseRun}
                className="flex flex-col items-center justify-center p-4"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                  <FaPause className="text-white text-xl" />
                </div>
                <span className="text-sm mt-1">Pause</span>
              </button>
              
              <button
                onClick={handleStopRun}
                className="flex flex-col items-center justify-center p-4"
              >
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <FaStop className="text-white text-xl" />
                </div>
                <span className="text-sm mt-1">Finish</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleStartRun}
              className="flex flex-col items-center justify-center p-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <FaPlay className="text-white text-xl" />
              </div>
              <span className="text-sm mt-1">{activeWorkout ? 'Resume' : 'Start'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActiveRun
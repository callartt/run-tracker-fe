import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import useGeolocation from '../hooks/useGeolocation'
import GeoSimulator from '../utils/GeoSimulator'
import { calculatePace, calculateCalories } from '../utils/calculations'
import api from '../api/axios';

export const WorkoutContext = createContext(null)

export const WorkoutProvider = ({ children }) => {
  const [workouts, setWorkouts] = useState([])
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentHeartRate, setCurrentHeartRate] = useState(0)
  const [heartRateData, setHeartRateData] = useState([])

  const {
    position,
    route,
    distance,
    error: geoError,
    startTracking,
    stopTracking,
    getCurrentPosition
  } = useGeolocation(isRunning && !isPaused)

  const timerRef = useRef(null)

  // Load workouts from API
  const fetchWorkouts = async (filters = {}) => {
    setIsLoading(true);
    try {
      const params = {
        limit: 10000,
        ...filters
      };

      const response = await api.get('/runs/', { params });

      const fetchedWorkouts = response.data.runs.map(run => ({
        id: run.uuid,
        name: run.name,
        startTime: run.start_time,
        endTime: run.end_time,
        duration: run.duration * 60, // Convert minutes to seconds for frontend
        distance: run.distance * 1000, // Convert km to meters for frontend
        calories: run.calories,
        route: run.route || [],
        // Fields not supported by backend yet, set defaults
        isActive: false,
        heartRateData: [],
        avgHeartRate: 0,
        maxHeartRate: 0
      }));

      setWorkouts(fetchedWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    try {
      const storedWorkouts = localStorage.getItem('workouts')
      if (storedWorkouts) {
        setWorkouts(JSON.parse(storedWorkouts))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return

    try {
      const trimmedWorkouts = workouts.map(workout => ({
        ...workout,
        route: workout.route && workout.route.length > 100
          ? workout.route.filter((_, i) => i % Math.ceil(workout.route.length / 100) === 0)
          : workout.route || [],
      }))

      const workoutsJson = JSON.stringify(trimmedWorkouts)
      const currentStorage = localStorage.getItem('workouts')

      if (currentStorage !== workoutsJson) {
        localStorage.setItem('workouts', workoutsJson)
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        try {
          const reducedWorkouts = workouts.slice(0, 5).map(w => ({
            ...w,
            route: [],
          }))
          localStorage.setItem('workouts', JSON.stringify(reducedWorkouts))
        } catch (fallbackError) {
          console.error(fallbackError)
        }
      }
    }
  }, [workouts, isLoading])

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)

        const simulatedBpm = Math.floor(Math.random() * (150 - 130 + 1) + 130)
        setCurrentHeartRate(simulatedBpm)
        setHeartRateData(prev => [...prev, { bpm: simulatedBpm, timestamp: new Date().toISOString() }])

      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning, isPaused])

  const startWorkout = () => {
    const now = new Date()
    const newWorkoutId = uuidv4()

    const initialWorkoutData = {
      id: newWorkoutId,
      name: `Run ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      startTime: now.toISOString(),
    }

    setDuration(0)
    setHeartRateData([])
    setCurrentHeartRate(0)
    setIsRunning(true)
    setIsPaused(false)
    setActiveWorkout(initialWorkoutData)
    startTracking()

    return initialWorkoutData
  }

  const pauseWorkout = () => {
    setIsPaused(true)
  }

  const resumeWorkout = () => {
    setIsPaused(false)
  }

  const addHeartRateData = (bpm) => {
    setCurrentHeartRate(bpm)
    setHeartRateData(prev => [...prev, { bpm, timestamp: new Date().toISOString() }])
  }

  const finishWorkout = async () => {
    if (!activeWorkout) return null

    stopTracking()
    GeoSimulator.stop()
    setIsRunning(false)
    setIsPaused(false)

    const endTime = new Date().toISOString()

    let avgHeartRate = 0
    let maxHeartRate = 0

    if (heartRateData.length > 0) {
      const sum = heartRateData.reduce((acc, data) => acc + data.bpm, 0)
      avgHeartRate = Math.round(sum / heartRateData.length)
      maxHeartRate = Math.max(...heartRateData.map(data => data.bpm))
    }

    const finalCalories = calculateCalories(75, duration / 60, avgHeartRate || 140, 'male', 25)

    const finalWorkout = {
      ...activeWorkout,
      endTime,
      duration,
      distance,
      route,
      avgHeartRate,
      maxHeartRate,
      calories: finalCalories,
      heartRateData,
      isActive: false,
    }

    // Try to save to backend
    try {
      const payload = {
        name: activeWorkout.name,
        start_time: activeWorkout.startTime,
        end_time: endTime,
        duration: duration / 60, // Convert seconds to minutes
        distance: distance / 1000, // Convert meters to kilometers
        calories: finalCalories,
        route: route.length > 0 ? route : null,
      }

      const response = await api.post('/runs/', payload)

      // Update the workout with backend UUID
      const savedWorkout = {
        ...finalWorkout,
        id: response.data.uuid,
      }

      setWorkouts(prev => [savedWorkout, ...prev])
      setActiveWorkout(null)

      return savedWorkout
    } catch (error) {
      console.error('Error saving run to backend:', error)
      // Fallback to local-only save
      setWorkouts(prev => [finalWorkout, ...prev])
      setActiveWorkout(null)

      return finalWorkout
    }
  }

  const renameWorkout = (id, newName) => {
    setWorkouts(prev =>
      prev.map(workout =>
        workout.id === id ? { ...workout, name: newName } : workout
      )
    )
  }

  const deleteWorkout = id => {
    setWorkouts(prev => prev.filter(workout => workout.id !== id))
  }

  const shareWorkout = id => {
    const workout = workouts.find(w => w.id === id)
    if (!workout) return null
    const shareId = `share_${workout.id}`
    setWorkouts(prev => prev.map(w => (w.id === id ? { ...w, shareId } : w)))
    return shareId
  }

  const currentPace = position?.speed
    ? calculatePace(position.speed, 'metric')
    : calculatePace(distance / duration || 0, 'metric')

  const currentCalories = calculateCalories(75, duration / 60, currentHeartRate || 140, 'male', 25)

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        fetchWorkouts,
        activeWorkout,
        isLoading,
        isRunning,
        isPaused,
        duration,
        currentLocation: position,
        route,
        distance,
        currentPace,
        currentHeartRate,
        calories: currentCalories,
        error: geoError,
        startWorkout,
        pauseWorkout,
        resumeWorkout,
        finishWorkout,
        deleteWorkout,
        shareWorkout,
        renameWorkout,
        addHeartRateData,
        getCurrentPosition
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}

export default WorkoutContext
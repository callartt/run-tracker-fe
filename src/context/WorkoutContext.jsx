// src/context/WorkoutContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/axios';

const WorkoutContext = createContext(null);

export const WorkoutProvider = ({ children }) => {
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Start a new workout session
  const startWorkout = () => {
    const newWorkout = {
      id: uuidv4(), // Temporary ID until saved to backend
      name: `Run ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      startTime: new Date().toISOString(),
      isActive: true,
      route: [],
      heartRateData: [],
      distance: 0,
      duration: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      calories: 0,
    };

    setActiveWorkout(newWorkout);
    return newWorkout;
  };

  // Update the active workout with new data
  const updateActiveWorkout = (data) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => ({
      ...prev,
      ...data,
      lastUpdated: new Date().toISOString()
    }));
  };

  // Add a GPS point to the route
  const addRoutePoint = (position) => {
    if (!activeWorkout) return;

    const { latitude, longitude, accuracy, altitude, speed, timestamp } = position;

    setActiveWorkout(prev => ({
      ...prev,
      route: [
        ...(prev && prev.route ? prev.route : []),
        {
          lat: latitude,
          lng: longitude,
          accuracy,
          altitude,
          speed,
          timestamp
        }
      ]
    }));
  };

  // Add heart rate data point
  const addHeartRateData = (bpm) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => ({
      ...prev,
      heartRateData: [
        ...(prev.heartRateData || []),
        {
          bpm,
          timestamp: new Date().toISOString()
        }
      ],
      currentHeartRate: bpm
    }));
  };

  // Finish workout function
  const finishWorkout = async () => {
    if (!activeWorkout) return null;

    const endTime = new Date().toISOString();

    // Calculate summary stats
    const duration = Math.round((new Date(endTime) - new Date(activeWorkout.startTime)) / 1000); // in seconds

    // Calculate average heart rate if data exists
    let avgHeartRate = 0;
    let maxHeartRate = 0;

    if (activeWorkout.heartRateData && activeWorkout.heartRateData.length > 0) {
      const sum = activeWorkout.heartRateData.reduce((acc, data) => acc + data.bpm, 0);
      avgHeartRate = Math.round(sum / activeWorkout.heartRateData.length);
      maxHeartRate = Math.max(...activeWorkout.heartRateData.map(data => data.bpm));
    }

    // Make sure route is defined
    const route = activeWorkout.route || [];

    // Finalize the workout object for frontend state
    const finalWorkout = {
      ...activeWorkout,
      endTime,
      duration,
      avgHeartRate,
      maxHeartRate,
      distance: activeWorkout.distance || 0,
      route: route,
      heartRateData: activeWorkout.heartRateData || [],
      isActive: false
    };

    // Save to backend
    try {
      const payload = {
        name: activeWorkout.name,
        start_time: activeWorkout.startTime,
        end_time: endTime,
        duration: duration / 60, // Convert seconds to minutes
        distance: (activeWorkout.distance || 0) / 1000, // Convert meters to km
        calories: activeWorkout.calories,
        route: route
      };

      const response = await api.post('/runs/', payload);
      const savedRun = response.data;

      // Update with backend ID and data
      const workoutWithBackendData = {
        ...finalWorkout,
        id: savedRun.uuid
      };

      setWorkouts(prev => [workoutWithBackendData, ...prev]);
      setActiveWorkout(null);
      return workoutWithBackendData;
    } catch (error) {
      console.error('Error saving workout:', error);
      // Fallback: save locally to state so user doesn't lose it immediately, 
      // but warn or handle error appropriately in UI
      setWorkouts(prev => [finalWorkout, ...prev]);
      setActiveWorkout(null);
      return finalWorkout;
    }
  };

  // Rename a workout
  const renameWorkout = async (id, newName) => {
    // Optimistic update
    setWorkouts(prev =>
      prev.map(workout =>
        workout.id === id
          ? { ...workout, name: newName }
          : workout
      )
    );

    try {
      await api.patch(`/runs/${id}`, { name: newName });
    } catch (error) {
      console.error('Error renaming workout:', error);
      // Revert if needed, or just log error
    }
  };

  // Delete a workout
  const deleteWorkout = async (id) => {
    // Optimistic update
    setWorkouts(prev => prev.filter(workout => workout.id !== id));

    try {
      await api.delete(`/runs/${id}`);
    } catch (error) {
      console.error('Error deleting workout:', error);
      // Could revert here if needed
    }
  };

  // Create a shareable workout (returns share ID)
  const shareWorkout = (id) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return null;

    // In a real app, you would send this to a server and get a share ID
    const shareId = `share_${workout.id}`;

    // For now, we'll just add a shareId to the workout locally
    setWorkouts(prev =>
      prev.map(w => w.id === id ? { ...w, shareId } : w)
    );

    return shareId;
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        fetchWorkouts,
        activeWorkout,
        isLoading,
        startWorkout,
        updateActiveWorkout,
        addRoutePoint,
        addHeartRateData,
        finishWorkout,
        deleteWorkout,
        shareWorkout,
        renameWorkout
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);

  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }

  return context;
};
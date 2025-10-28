import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const WorkoutContext = createContext(null);

export const WorkoutProvider = ({ children }) => {
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load workouts from localStorage on initial render
  useEffect(() => {
    const loadWorkouts = () => {
      try {
        const storedWorkouts = localStorage.getItem('workouts');
        if (storedWorkouts) {
          setWorkouts(JSON.parse(storedWorkouts));
        }
      } catch (error) {
        console.error('Error loading workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadWorkouts();
  }, []);
  
  // Save workouts to localStorage with size limiting to prevent quota errors
  useEffect(() => {
    // Only save if not in loading state and there are workouts to save
    if (!isLoading && workouts.length > 0) {
      try {
        // Create a trimmed version of workouts to save space
        const trimmedWorkouts = workouts.map(workout => {
          // Create a copy with limited route points
          return {
            ...workout,
            // Limit route to at most 100 points to save space
            route: workout.route && workout.route.length > 100 
              ? workout.route.slice(0, 100) 
              : workout.route || []
          };
        });
        
        // First stringify to check size
        const workoutsJson = JSON.stringify(trimmedWorkouts);
        
        // Only update if content has actually changed
        const currentStorage = localStorage.getItem('workouts');
        if (currentStorage !== workoutsJson) {
          localStorage.setItem('workouts', workoutsJson);
        }
      } catch (error) {
        console.error('Error saving workouts:', error);
        // If quota exceeded, try saving fewer workouts
        if (error.name === 'QuotaExceededError') {
          try {
            // Keep only last 5 workouts
            const reducedWorkouts = workouts.slice(0, 5).map(w => ({
              ...w,
              route: [] // Remove routes entirely
            }));
            localStorage.setItem('workouts', JSON.stringify(reducedWorkouts));
          } catch (fallbackError) {
            console.error('Failed to save even with reduced data:', fallbackError);
          }
        }
      }
    }
  }, [workouts, isLoading]);

  // Start a new workout session
  const startWorkout = () => {
    const newWorkout = {
      id: uuidv4(),
      name: `Run ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, // Default name with date and time
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
  const finishWorkout = () => {
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
    
    // Finalize the workout - ensure all properties are properly initialized
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

    // Save the workout
    setWorkouts(prev => [finalWorkout, ...prev]);
    setActiveWorkout(null);

    return finalWorkout;
  };

  // NEW FUNCTION: Rename a workout
  const renameWorkout = (id, newName) => {
    setWorkouts(prev => 
      prev.map(workout => 
        workout.id === id 
          ? { ...workout, name: newName } 
          : workout
      )
    );
  };

  // Delete a workout
  const deleteWorkout = (id) => {
    setWorkouts(prev => prev.filter(workout => workout.id !== id));
  };

  // Create a shareable workout (returns share ID)
  const shareWorkout = (id) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return null;

    // In a real app, you would send this to a server and get a share ID
    const shareId = `share_${workout.id}`;
    
    // For now, we'll just add a shareId to the workout
    setWorkouts(prev => 
      prev.map(w => w.id === id ? { ...w, shareId } : w)
    );

    return shareId;
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        activeWorkout,
        isLoading,
        startWorkout,
        updateActiveWorkout,
        addRoutePoint,
        addHeartRateData,
        finishWorkout,
        deleteWorkout,
        shareWorkout,
        renameWorkout // Add the new function to the context
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
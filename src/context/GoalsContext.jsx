// src/context/GoalsContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkout } from './WorkoutContext';

const GoalsContext = createContext(null);

// Constants for storage keys - makes it easier to stay consistent
const STORAGE_KEYS = {
  GOALS: 'goals',
  ACHIEVEMENTS: 'achievements',
  GOALS_BACKUP: 'goals_backup',
  ACHIEVEMENTS_BACKUP: 'achievements_backup'
};

export const GoalTypes = {
  DISTANCE: 'distance',
  DURATION: 'duration',
  FREQUENCY: 'frequency'
};

export const GoalPeriods = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const GoalProvider = ({ children }) => {
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const { workouts } = useWorkout();
  
  // Load goals and achievements from localStorage or backup
  useEffect(() => {
    try {
      // Try to load from localStorage first
      const storedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      const storedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      
      // Try to load from sessionStorage backups if localStorage is empty
      const backupGoals = sessionStorage.getItem(STORAGE_KEYS.GOALS_BACKUP);
      const backupAchievements = sessionStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS_BACKUP);
      
      // Set goals from localStorage or backup
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        setGoals(parsedGoals);
        // Create a backup in sessionStorage
        sessionStorage.setItem(STORAGE_KEYS.GOALS_BACKUP, storedGoals);
      } else if (backupGoals) {
        // Restore from backup
        const parsedGoals = JSON.parse(backupGoals);
        setGoals(parsedGoals);
        localStorage.setItem(STORAGE_KEYS.GOALS, backupGoals);
        console.log('Goals restored from backup');
      }
      
      // Set achievements from localStorage or backup
      if (storedAchievements) {
        const parsedAchievements = JSON.parse(storedAchievements);
        setAchievements(parsedAchievements);
        // Create a backup in sessionStorage
        sessionStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS_BACKUP, storedAchievements);
      } else if (backupAchievements) {
        // Restore from backup
        const parsedAchievements = JSON.parse(backupAchievements);
        setAchievements(parsedAchievements);
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, backupAchievements);
        console.log('Achievements restored from backup');
      }
    } catch (error) {
      console.error('Error loading goals/achievements:', error);
    }
  }, []);
  
  // Listen for localStorage changes and handle potential data loss
  useEffect(() => {
    const handleStorageChange = (e) => {
      // If localStorage was cleared or goals were removed
      if (e.key === null || (e.key === STORAGE_KEYS.GOALS && !e.newValue)) {
        console.log('Goals may have been cleared, attempting to restore');
        
        // Try to restore from state if we have goals
        if (goals.length > 0) {
          try {
            const goalsJson = JSON.stringify(goals);
            localStorage.setItem(STORAGE_KEYS.GOALS, goalsJson);
            console.log('Goals restored from state');
          } catch (err) {
            console.error('Failed to restore goals from state:', err);
          }
        } 
        // If no goals in state, try to restore from backup
        else {
          const backupGoals = sessionStorage.getItem(STORAGE_KEYS.GOALS_BACKUP);
          if (backupGoals) {
            localStorage.setItem(STORAGE_KEYS.GOALS, backupGoals);
            setGoals(JSON.parse(backupGoals));
            console.log('Goals restored from backup');
          }
        }
      }
      
      // Same for achievements
      if (e.key === null || (e.key === STORAGE_KEYS.ACHIEVEMENTS && !e.newValue)) {
        if (achievements.length > 0) {
          try {
            localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
          } catch (err) {
            console.error('Failed to restore achievements:', err);
          }
        } else {
          const backupAchievements = sessionStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS_BACKUP);
          if (backupAchievements) {
            localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, backupAchievements);
            setAchievements(JSON.parse(backupAchievements));
          }
        }
      }
    };
    
    // Add event listener for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [goals, achievements]);
  
  // Save goals and achievements to localStorage when they change
  useEffect(() => {
    try {
      // Only proceed if we have goals to save
      if (goals.length > 0) {
        // Create JSON string once to avoid duplication
        const goalsJson = JSON.stringify(goals);
        
        // Save to both localStorage and sessionStorage backup
        localStorage.setItem(STORAGE_KEYS.GOALS, goalsJson);
        sessionStorage.setItem(STORAGE_KEYS.GOALS_BACKUP, goalsJson);
      }
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }, [goals]);
  
  // Separate effect for achievements to avoid unnecessary saves
  useEffect(() => {
    try {
      if (achievements.length > 0) {
        const achievementsJson = JSON.stringify(achievements);
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievementsJson);
        sessionStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS_BACKUP, achievementsJson);
      }
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }, [achievements]);
  
  // Create a new goal
  const addGoal = (type, target, period) => {
    const newGoal = {
      id: uuidv4(),
      type,
      target,
      period,
      createdAt: new Date().toISOString(),
      isCompleted: false
    };
    
    setGoals(prev => [newGoal, ...prev]);
    return newGoal;
  };
  
  // Update an existing goal
  const updateGoal = (id, updates) => {
    setGoals(prev => 
      prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal)
    );
  };
  
  // Delete a goal
  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };
  
  // Calculate progress for each goal
  const calculateGoalProgress = (goal) => {
    // Filter workouts that are within the goal period
    const now = new Date();
    let periodStart = new Date();
    
    switch (goal.period) {
      case GoalPeriods.WEEKLY:
        // Start of current week (Sunday)
        periodStart.setDate(now.getDate() - now.getDay());
        periodStart.setHours(0, 0, 0, 0);
        break;
      case GoalPeriods.MONTHLY:
        // Start of current month
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case GoalPeriods.YEARLY:
        // Start of current year
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        periodStart = new Date(0); // Start of epoch time
    }
    
    const periodWorkouts = workouts.filter(workout => {
      try {
        const workoutDate = new Date(workout.startTime);
        return workoutDate >= periodStart && !workout.isActive;
      } catch (e) {
        console.error('Error parsing workout date:', e);
        return false;
      }
    });
    
    let progress = 0;
    
    switch (goal.type) {
      case GoalTypes.DISTANCE:
        // Sum up the total distance
        progress = periodWorkouts.reduce((sum, workout) => sum + (workout.distance || 0), 0);
        break;
      case GoalTypes.DURATION:
        // Sum up the total duration in seconds
        progress = periodWorkouts.reduce((sum, workout) => sum + (workout.duration || 0), 0);
        break;
      case GoalTypes.FREQUENCY:
        // Count the number of workouts
        progress = periodWorkouts.length;
        break;
      default:
        progress = 0;
    }
    
    // Calculate percentage of completion
    const percentage = Math.min(100, Math.round((progress / goal.target) * 100));
    
    // Check if goal is completed and not already marked as completed
    if (percentage >= 100 && !goal.isCompleted) {
      // Mark goal as completed
      updateGoal(goal.id, { isCompleted: true });
      
      // Add achievement
      const achievement = {
        id: uuidv4(),
        goalId: goal.id,
        type: goal.type,
        value: goal.target,
        period: goal.period,
        achievedAt: new Date().toISOString()
      };
      
      setAchievements(prev => [achievement, ...prev]);
    }
    
    return {
      value: progress,
      percentage,
      target: goal.target
    };
  };
  
  // Get statistics
  const getStatistics = () => {
    if (!workouts.length) return null;
    
    // Filter out active workouts
    const completedWorkouts = workouts.filter(w => !w.isActive);
    
    if (!completedWorkouts.length) return null;
    
    // Total stats
    const totalDistance = completedWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    const totalDuration = completedWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalWorkouts = completedWorkouts.length;
    
    // Find personal records
    const fastestPace = completedWorkouts.reduce((fastest, w) => {
      if (w.distance && w.duration && w.distance > 0 && w.duration > 0) {
        const pace = w.duration / (w.distance / 1000); // seconds per km
        return !fastest || pace < fastest ? pace : fastest;
      }
      return fastest;
    }, null);
    
    const longestDistance = completedWorkouts.reduce((longest, w) => {
      return (!longest || (w.distance > longest)) ? w.distance : longest;
    }, 0);
    
    // Streak calculation
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Sort workouts by date
    const sortedWorkouts = [...completedWorkouts].sort((a, b) => {
      try {
        return new Date(b.startTime) - new Date(a.startTime);
      } catch (e) {
        console.error('Error sorting workouts by date:', e);
        return 0;
      }
    });
    
    if (sortedWorkouts.length > 0) {
      // Check if there's a workout today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      try {
        const latestWorkout = new Date(sortedWorkouts[0].startTime);
        latestWorkout.setHours(0, 0, 0, 0);
        
        // If the latest workout is from today, start the streak count
        if (latestWorkout.getTime() === today.getTime()) {
          currentStreak = 1;
          
          // Check consecutive days before today
          let prevDate = new Date(today);
          prevDate.setDate(prevDate.getDate() - 1);
          
          for (let i = 1; i < sortedWorkouts.length; i++) {
            const workoutDate = new Date(sortedWorkouts[i].startTime);
            workoutDate.setHours(0, 0, 0, 0);
            
            if (workoutDate.getTime() === prevDate.getTime()) {
              currentStreak++;
              prevDate.setDate(prevDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      } catch (e) {
        console.error('Error calculating streak:', e);
      }
      
      // Calculate max streak (historical)
      maxStreak = currentStreak;
    }
    
    return {
      totalDistance,
      totalDuration,
      totalWorkouts,
      fastestPace,
      longestDistance,
      currentStreak,
      maxStreak
    };
  };
  
  return (
    <GoalsContext.Provider
      value={{
        goals,
        achievements,
        addGoal,
        updateGoal,
        deleteGoal,
        calculateGoalProgress,
        getStatistics
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  
  if (!context) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  
  return context;
};
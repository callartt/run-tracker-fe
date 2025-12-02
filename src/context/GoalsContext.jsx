import { createContext, useContext, useState, useEffect } from 'react';
import { useWorkout } from './WorkoutContext';
import api from '../api/axios';

const GoalsContext = createContext(null);

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

// Mappings for API communication
const API_GOAL_TYPES = {
  [GoalTypes.DISTANCE]: 'DISTANCE',
  [GoalTypes.DURATION]: 'DURATION',
  [GoalTypes.FREQUENCY]: 'NUMBER_OF_RUNS'
};

const API_GOAL_PERIODS = {
  [GoalPeriods.WEEKLY]: 'WEEKLY',
  [GoalPeriods.MONTHLY]: 'MONTHLY',
  [GoalPeriods.YEARLY]: 'YEARLY'
};

const FROM_API_GOAL_TYPES = {
  'DISTANCE': GoalTypes.DISTANCE,
  'DURATION': GoalTypes.DURATION,
  'NUMBER_OF_RUNS': GoalTypes.FREQUENCY
};

const FROM_API_GOAL_PERIODS = {
  'WEEKLY': GoalPeriods.WEEKLY,
  'MONTHLY': GoalPeriods.MONTHLY,
  'YEARLY': GoalPeriods.YEARLY
};

export const GoalProvider = ({ children }) => {
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { workouts } = useWorkout();

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals/');
      const fetchedGoals = response.data.goals.map(goal => ({
        id: goal.uuid,
        type: FROM_API_GOAL_TYPES[goal.goal_type],
        target: goal.target,
        period: FROM_API_GOAL_PERIODS[goal.time_period],
        createdAt: goal.created_at,
        isCompleted: false // Logic for completion will be handled by calculateGoalProgress
      }));
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/achievements/');
      // Map backend achievements to frontend structure if necessary
      // Backend: uuid, title, description, earned_at, achievement_type, meta_data
      // Frontend expects: id, type, value, period, achievedAt (based on previous code)
      // We'll adapt the frontend component to use the new structure, but for now let's store them as is
      // or map them if we can extract the info.

      // Let's assume meta_data contains the goal info if it's a goal achievement
      const fetchedAchievements = response.data.achievements.map(ach => ({
        id: ach.uuid,
        title: ach.title,
        description: ach.description,
        achievedAt: ach.earned_at,
        type: ach.meta_data?.goal_type ? FROM_API_GOAL_TYPES[ach.meta_data.goal_type] : 'unknown',
        value: ach.meta_data?.target || 0,
        period: ach.meta_data?.time_period ? FROM_API_GOAL_PERIODS[ach.meta_data.time_period] : 'unknown',
        // Keep original for flexibility
        original: ach
      }));
      setAchievements(fetchedAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchGoals(), fetchAchievements()]);
      setLoading(false);
    };
    init();
  }, []);

  // Create a new goal
  const addGoal = async (type, target, period) => {
    try {
      const payload = {
        goal_type: API_GOAL_TYPES[type],
        target: parseInt(target),
        time_period: API_GOAL_PERIODS[period]
      };

      const response = await api.post('/goals/', payload);
      const newGoalData = response.data;

      const newGoal = {
        id: newGoalData.uuid,
        type: FROM_API_GOAL_TYPES[newGoalData.goal_type],
        target: newGoalData.target,
        period: FROM_API_GOAL_PERIODS[newGoalData.time_period],
        createdAt: newGoalData.created_at,
        isCompleted: false
      };

      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  // Update an existing goal - API doesn't seem to have update endpoint for goals based on router check
  // So we'll keep this local only or remove it if not used. 
  // The previous code had updateGoal but it was mostly used for marking completion locally.
  const updateGoal = (id, updates) => {
    setGoals(prev =>
      prev.map(goal => goal.id === id ? { ...goal, ...updates } : goal)
    );
  };

  // Delete a goal
  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
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

    // Check if goal is completed
    // Note: We are not creating achievements here anymore as the backend should handle that
    // when runs are synced/created. However, for visual feedback, we can still mark it.
    if (percentage >= 100 && !goal.isCompleted) {
      // We can update local state to show completion effect
      // But we don't persist this "isCompleted" state to backend as backend computes it dynamically or via achievements
      // For now, let's just return the progress. The UI uses isCompleted for styling.
      // We can infer isCompleted from percentage.
    }

    return {
      value: progress,
      percentage,
      target: goal.target,
      isCompleted: percentage >= 100
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
        loading,
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
// src/pages/Goals.jsx
import { useState } from 'react';
import { 
  FaRunning, 
  FaClock, 
  FaCalendarAlt, 
  FaPlus, 
  FaTimes, 
  FaTrophy 
} from 'react-icons/fa';
import { useGoals, GoalTypes, GoalPeriods } from '../context/GoalsContext';
import { useUser } from '../context/UserContext';
import { formatDistance, formatDuration } from '../utils/calculations';
import Achievements from '../components/goals/Achievements';


const Goals = () => {
  const { user } = useUser();
  const { goals, addGoal, deleteGoal, calculateGoalProgress } = useGoals();
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: GoalTypes.DISTANCE,
    target: '',
    period: GoalPeriods.WEEKLY
  });
  
  const handleCreateGoal = (e) => {
    e.preventDefault();
    
    // Validate input
    if (!newGoal.target || isNaN(Number(newGoal.target)) || Number(newGoal.target) <= 0) {
      alert('Please enter a valid target value greater than zero.');
      return;
    }
    
    // Convert target to appropriate units
    let target = Number(newGoal.target);
    
    // For distance, convert km/mi to meters
    if (newGoal.type === GoalTypes.DISTANCE) {
      target = user.units === 'metric' 
        ? target * 1000  // km to meters
        : target * 1609.34;  // miles to meters
    }
    
    // For duration, convert minutes to seconds
    if (newGoal.type === GoalTypes.DURATION) {
      target = target * 60;  // minutes to seconds
    }
    
    // Add the goal
    addGoal(newGoal.type, target, newGoal.period);
    
    // Reset form
    setNewGoal({
      type: GoalTypes.DISTANCE,
      target: '',
      period: GoalPeriods.WEEKLY
    });
    
    setShowNewGoalForm(false);
  };
  
  const formatGoalTarget = (goal) => {
    switch (goal.type) {
      case GoalTypes.DISTANCE:
        return formatDistance(goal.target, user.units);
      case GoalTypes.DURATION:
        return formatDuration(goal.target);
      case GoalTypes.FREQUENCY:
        return `${goal.target} runs`;
      default:
        return goal.target.toString();
    }
  };
  
  const formatGoalProgress = (goal, progress) => {
    switch (goal.type) {
      case GoalTypes.DISTANCE:
        return formatDistance(progress.value, user.units);
      case GoalTypes.DURATION:
        return formatDuration(progress.value);
      case GoalTypes.FREQUENCY:
        return `${progress.value} runs`;
      default:
        return progress.value.toString();
    }
  };
  
  const getGoalIcon = (type) => {
    switch (type) {
      case GoalTypes.DISTANCE:
        return <FaRunning />;
      case GoalTypes.DURATION:
        return <FaClock />;
      case GoalTypes.FREQUENCY:
        return <FaCalendarAlt />;
      default:
        return <FaRunning />;
    }
  };
  
  const getGoalPeriodText = (period) => {
    switch (period) {
      case GoalPeriods.WEEKLY:
        return 'Weekly';
      case GoalPeriods.MONTHLY:
        return 'Monthly';
      case GoalPeriods.YEARLY:
        return 'Yearly';
      default:
        return 'Custom';
    }
  };
  
  return (
    <div className="pb-16">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold pr-5">Goals</h1>
        <button
          onClick={() => setShowNewGoalForm(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-1" />
          <span>New Goal</span>
        </button>
      </div>
      
      {showNewGoalForm && (
        <div className="card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Create New Goal</h2>
            <button
              onClick={() => setShowNewGoalForm(false)}
              className="text-gray-500"
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={handleCreateGoal}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Goal Type</label>
              <select
                value={newGoal.type}
                onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value }))}
                className="input w-full"
              >
                <option value={GoalTypes.DISTANCE}>Distance</option>
                <option value={GoalTypes.DURATION}>Duration</option>
                <option value={GoalTypes.FREQUENCY}>Number of Runs</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {newGoal.type === GoalTypes.DISTANCE 
                  ? `Target (${user.units === 'metric' ? 'km' : 'mi'})`
                  : newGoal.type === GoalTypes.DURATION
                    ? 'Target (minutes)'
                    : 'Target (runs)'
                }
              </label>
              <input
                type="number"
                min="1"
                step={newGoal.type === GoalTypes.DISTANCE ? '0.1' : '1'}
                value={newGoal.target}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                className="input w-full"
                placeholder="Enter target"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Time Period</label>
              <select
                value={newGoal.period}
                onChange={(e) => setNewGoal(prev => ({ ...prev, period: e.target.value }))}
                className="input w-full"
              >
                <option value={GoalPeriods.WEEKLY}>Weekly</option>
                <option value={GoalPeriods.MONTHLY}>Monthly</option>
                <option value={GoalPeriods.YEARLY}>Yearly</option>
              </select>
            </div>
            
            <button type="submit" className="btn-primary w-full">
              Create Goal
            </button>
          </form>
        </div>
      )}
      
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <FaTrophy className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-medium">No Goals Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Set some goals to track your progress!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.filter(goal => true).map(goal => {
            const progress = calculateGoalProgress(goal);
            
            return (
              <div 
                key={goal.id} 
                className={`card p-4 ${goal.isCompleted ? 'border-2 border-green-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 
                      ${goal.isCompleted 
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                        : 'bg-primary-100 dark:bg-primary-900 text-primary'}`}
                    >
                      {goal.isCompleted ? <FaTrophy /> : getGoalIcon(goal.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {formatGoalTarget(goal)}
                        {' '}
                        {goal.type === GoalTypes.DURATION ? 'minutes' : ''}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getGoalPeriodText(goal.period)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="mb-1 flex justify-between text-sm">
                  <span>{formatGoalProgress(goal, progress)}</span>
                  <span>{formatGoalTarget(goal)}</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      goal.isCompleted 
                        ? 'bg-green-500' 
                        : progress.percentage > 75 
                          ? 'bg-primary' 
                          : progress.percentage > 50 
                            ? 'bg-yellow-500' 
                            : progress.percentage > 25 
                              ? 'bg-orange-500' 
                              : 'bg-red-500'
                    }`} 
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                
                <p className="text-right text-sm mt-1 text-gray-600 dark:text-gray-400">
                  {progress.percentage}%
                  {goal.isCompleted && ' Complete!'}
                </p>
              </div>
            );
          })}
        </div>
      )}
        <Achievements />
    </div>
  );
};

export default Goals;
// src/pages/Statistics.jsx
import { useState, useEffect } from 'react';
import { 
  FaRunning, 
  FaClock, 
  FaTrophy, 
  FaFire,
  FaCalendarAlt,
  FaChartLine
} from 'react-icons/fa';
import { useGoals } from '../context/GoalsContext';
import { useWorkout } from '../context/WorkoutContext';
import { useUser } from '../context/UserContext';
import { 
  formatDistance, 
  formatDuration, 
  calculatePace 
} from '../utils/calculations';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Statistics = () => {
  const { getStatistics } = useGoals();
  const { workouts } = useWorkout();
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    setStats(getStatistics());
  }, [workouts, getStatistics]);
  
  // Prepare chart data based on workouts
  useEffect(() => {
    if (!workouts.length) {
      setChartData([]);
      return;
    }
    
    // Filter out active workouts
    const filteredWorkouts = workouts.filter(w => !w.isActive);
    
    if (!filteredWorkouts.length) {
      setChartData([]);
      return;
    }
    
    // Apply period filter
    let startDate = new Date(0); // Start of epoch time
    
    if (periodFilter !== 'all') {
      startDate = new Date();
      
      switch (periodFilter) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }
    }
    
    const periodWorkouts = filteredWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime);
      return workoutDate >= startDate;
    });
    
    // Group by day for the chart
    const workoutsByDay = {};
    
    periodWorkouts.forEach(workout => {
      const date = new Date(workout.startTime).toLocaleDateString();
      
      if (!workoutsByDay[date]) {
        workoutsByDay[date] = {
          date,
          distance: 0,
          duration: 0,
          count: 0
        };
      }
      
      workoutsByDay[date].distance += workout.distance || 0;
      workoutsByDay[date].duration += workout.duration || 0;
      workoutsByDay[date].count += 1;
    });
    
    // Convert to array and sort by date
    const chartDataArray = Object.values(workoutsByDay).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    setChartData(chartDataArray);
  }, [workouts, periodFilter]);
  
  if (!stats) {
    return (
      <div className="text-center py-12">
        <FaChartLine className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4" />
        <h3 className="text-xl font-medium">No Statistics Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Complete some runs to see your statistics!
        </p>
      </div>
    );
  }
  
  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Your Statistics</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-2">
              <FaRunning className="text-primary" />
            </div>
            <h3 className="text-sm font-medium">Total Distance</h3>
          </div>
          <p className="text-2xl font-bold">
            {formatDistance(stats.totalDistance, user.units)}
          </p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-2">
              <FaClock className="text-primary" />
            </div>
            <h3 className="text-sm font-medium">Total Duration</h3>
          </div>
          <p className="text-2xl font-bold">
            {formatDuration(stats.totalDuration)}
          </p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-2">
              <FaCalendarAlt className="text-primary" />
            </div>
            <h3 className="text-sm font-medium">Total Workouts</h3>
          </div>
          <p className="text-2xl font-bold">
            {stats.totalWorkouts}
          </p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-2">
              <FaFire className="text-primary" />
            </div>
            <h3 className="text-sm font-medium">Current Streak</h3>
          </div>
          <p className="text-2xl font-bold">
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
      
      {/* Personal Records */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <FaTrophy className="text-yellow-500 mr-2" />
          Personal Records
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Fastest Pace</span>
            <span className="font-medium">
              {stats.fastestPace 
                ? calculatePace(1000 / stats.fastestPace, user.units) // Convert seconds/km to m/s
                : '--:--'}
              {' '}
              <span className="text-sm text-gray-500">
                {user.units === 'metric' ? 'min/km' : 'min/mi'}
              </span>
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Longest Distance</span>
            <span className="font-medium">
              {formatDistance(stats.longestDistance, user.units)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Longest Streak</span>
            <span className="font-medium">
              {stats.maxStreak} {stats.maxStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium">Progress Over Time</h2>
          
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="text-sm p-1 bg-gray-100 dark:bg-gray-800 rounded"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        
        {chartData.length > 0 ? (
          <div className="card p-4">
            <h3 className="text-md font-medium mb-4">Distance Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString(undefined, { 
                        month: 'short',
                        day: 'numeric'
                      });
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (user.units === 'metric') {
                        return `${(value / 1000).toFixed(1)} km`;
                      } else {
                        return `${(value / 1609.34).toFixed(1)} mi`;
                      }
                    }}
                    />
                <Tooltip 
                  formatter={(value) => [
                    formatDistance(value, user.units),
                    'Distance'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="distance" 
                  stroke="#3B82F6" 
                  activeDot={{ r: 8 }} 
                  name="Distance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <h3 className="text-md font-medium mb-4 mt-8">Workout Frequency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString(undefined, { 
                      month: 'short',
                      day: 'numeric'
                    });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value)} // Ensure integers
                />
                <Tooltip 
                  formatter={(value) => [
                    Math.round(value),
                    'Workouts'
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="#10B981" 
                  name="Workouts" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card p-4 text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            Not enough data to display charts for the selected period.
          </p>
        </div>
      )}
    </div>
  </div>
);
};

export default Statistics;
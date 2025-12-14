import { useState, useEffect } from 'react';
import {
  FaRunning,
  FaClock,
  FaTrophy,
  FaFire,
  FaCalendarAlt,
  FaChartLine
} from 'react-icons/fa';
import { useUser } from '../context/UserContext';
import {
  formatDistance,
  formatDuration,
  calculatePace
} from '../utils/calculations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../api/axios';

const Statistics = () => {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('LAST_7_DAYS');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch overall statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/statistics/');
        setStats(response.data);
      } catch (err) {
        console.error("Failed to fetch statistics", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch visualization data
  useEffect(() => {
    const fetchVisualization = async () => {
      try {
        const response = await api.get('/statistics/visualization', {
          params: { period: periodFilter }
        });
        setChartData(response.data.data);
      } catch (err) {
        console.error("Failed to fetch visualization data", err);
      }
    };

    fetchVisualization();
  }, [periodFilter]);

  if (loading) {
    return <div className="flex justify-center py-12">Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

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
            {formatDistance(stats.totals.total_distance)}
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
            {formatDuration(stats.totals.total_duration)}
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
            {stats.totals.total_workouts}
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
            {stats.streaks.current_streak} {stats.streaks.current_streak === 1 ? 'day' : 'days'}
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
              {stats.personal_records.fastest_pace.toFixed(2) || '--:--'}
              {' '}
              <span className="text-sm text-gray-500">
                min/km
              </span>
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Longest Distance</span>
            <span className="font-medium">
              {formatDistance(stats.personal_records.longest_distance)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Longest Streak</span>
            <span className="font-medium">
              {stats.streaks.longest_streak} {stats.streaks.longest_streak === 1 ? 'day' : 'days'}
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
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="LAST_YEAR">Last Year</option>
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
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      return `${(value).toFixed(1)} km`;
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatDistance(value),
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
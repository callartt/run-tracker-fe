import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FaRunning,
  FaMapMarkerAlt,
  FaHeartbeat,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaTimes,
  FaEdit,
  FaSave,
  FaCheck
} from 'react-icons/fa'
import { useWorkout } from '../context/WorkoutContext'
import { useUser } from '../context/UserContext'
import { formatDistance, formatDuration } from '../utils/calculations'

const History = () => {
  const { workouts, isLoading, renameWorkout, fetchWorkouts } = useWorkout()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [newWorkoutName, setNewWorkoutName] = useState('')
  const [filters, setFilters] = useState({
    period: 'all', // 'all', 'week', 'month', 'year'
    minDistance: '',
    maxDistance: '',
    sortBy: 'date', // 'date', 'distance', 'duration'
    sortOrder: 'desc' // 'asc', 'desc'
  })

  // Group workouts by month
  const groupWorkoutsByMonth = (workoutList) => {
    const groups = {}

    workoutList.forEach(workout => {
      const date = new Date(workout.startTime)
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`

      if (!groups[monthYear]) {
        groups[monthYear] = []
      }

      groups[monthYear].push(workout)
    })

    return Object.entries(groups)
  }

  // Apply filters and search via backend
  useEffect(() => {
    // Debounce search term if needed, but for now just fetch on change
    const backendFilters = {};

    // Map period
    if (filters.period !== 'all') {
      switch (filters.period) {
        case 'week':
          backendFilters.period = 'LAST_7_DAYS';
          break;
        case 'month':
          backendFilters.period = 'LAST_30_DAYS';
          break;
        case 'year':
          backendFilters.period = 'LAST_YEAR';
          break;
      }
    }

    // Map distance (convert km to backend units if needed, but backend expects float km, frontend input is km)
    if (filters.minDistance) {
      backendFilters.min_distance = parseFloat(filters.minDistance);
    }
    if (filters.maxDistance) {
      backendFilters.max_distance = parseFloat(filters.maxDistance);
    }

    // Map sorting
    switch (filters.sortBy) {
      case 'distance':
        backendFilters.sort_by = 'DISTANCE';
        break;
      case 'duration':
        backendFilters.sort_by = 'DURATION';
        break;
      case 'date':
      default:
        backendFilters.sort_by = 'DATE';
        break;
    }

    backendFilters.order = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    fetchWorkouts(backendFilters);

  }, [filters]); // Re-fetch when filters change

  // Client-side search filtering (since backend doesn't support name search yet)
  const filteredWorkouts = workouts.filter(workout => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const workoutName = workout.name ? workout.name.toLowerCase() : '';
    const date = new Date(workout.startTime).toLocaleDateString();
    return workoutName.includes(term) || date.toLowerCase().includes(term);
  });

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      period: 'all',
      minDistance: '',
      maxDistance: '',
      sortBy: 'date',
      sortOrder: 'desc'
    })
    setSearchTerm('')
  }

  // Handle rename workout
  const handleRenameWorkout = (id) => {
    setEditingWorkout(id);
    const workout = workouts.find(w => w.id === id);
    setNewWorkoutName(workout?.name || `Run ${new Date(workout?.startTime).toLocaleString()}`);
  }

  // Save new workout name
  const saveWorkoutName = (id) => {
    if (newWorkoutName.trim()) {
      renameWorkout(id, newWorkoutName.trim());
      setEditingWorkout(null);
      setNewWorkoutName('');
    }
  }

  // Cancel renaming
  const cancelRenaming = () => {
    setEditingWorkout(null);
    setNewWorkoutName('');
  }

  // Group workouts for display
  const groupedWorkouts = groupWorkoutsByMonth(filteredWorkouts)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Your Run History</h1>

      {/* Search and Filter */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search runs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-2 p-3 rounded-lg border 
              ${showFilters
                ? 'border-primary text-primary'
                : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}
          >
            <FaFilter />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card p-4 mb-4">
            <h3 className="font-medium mb-3">Filter Runs</h3>

            <div className="space-y-3">
              {/* Time Period */}
              <div>
                <label className="block text-sm font-medium mb-1">Time Period</label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="input"
                >
                  <option value="all">All Time</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>

              {/* Distance Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Distance (km)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minDistance}
                    onChange={(e) => handleFilterChange('minDistance', e.target.value)}
                    className="input"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Distance (km)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
                    className="input"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input"
                  >
                    <option value="date">Date</option>
                    <option value="distance">Distance</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="input"
                  >
                    <option value="desc">Newest/Highest First</option>
                    <option value="asc">Oldest/Lowest First</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={clearFilters}
                  className="btn-outline"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workouts List */}
      {filteredWorkouts.length === 0 ? (
        <div className="text-center py-8">
          <FaRunning className="text-gray-300 dark:text-gray-600 text-5xl mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">No runs found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {workouts.length === 0
              ? "You haven't recorded any runs yet. Start tracking your first run now!"
              : "No runs match your current filters. Try adjusting the criteria."}
          </p>

          {workouts.length === 0 && (
            <Link to="/" className="btn-primary mt-4 inline-block">
              Start a Run
            </Link>
          )}

          {filteredWorkouts.length === 0 && workouts.length > 0 && (
            <button
              onClick={clearFilters}
              className="btn-outline mt-4"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedWorkouts.map(([month, monthWorkouts]) => (
            <div key={month}>
              <h3 className="font-medium text-lg mb-3 flex items-center">
                <FaCalendarAlt className="mr-2 text-gray-500" />
                {month}
              </h3>

              <div className="space-y-3">
                {monthWorkouts.map(workout => (
                  <div key={workout.id} className="card p-4">
                    {editingWorkout === workout.id ? (
                      // Editing mode
                      <div className="flex items-center mb-2">
                        <input
                          type="text"
                          value={newWorkoutName}
                          onChange={(e) => setNewWorkoutName(e.target.value)}
                          className="input flex-grow mr-2"
                          placeholder="Run name"
                          autoFocus
                        />
                        <button
                          onClick={() => saveWorkoutName(workout.id)}
                          className="p-2 text-green-500 hover:text-green-600"
                          aria-label="Save workout name"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={cancelRenaming}
                          className="p-2 text-red-500 hover:text-red-600 ml-1"
                          aria-label="Cancel renaming"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium flex items-center">
                          <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                            <FaRunning className="text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span>{workout.name || new Date(workout.startTime).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                              <button
                                onClick={() => handleRenameWorkout(workout.id)}
                                className="ml-2 text-gray-400 hover:text-primary"
                                aria-label="Rename workout"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(workout.startTime).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Workout stats */}
                    <div className="pl-12">
                      <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap">
                        <span className="flex items-center mr-3">
                          <FaMapMarkerAlt className="mr-1 text-xs" />
                          {formatDistance(workout.distance, user.units)}
                        </span>

                        <span className="flex items-center mr-3">
                          <FaRunning className="mr-1 text-xs" />
                          {formatDuration(workout.duration)}
                        </span>

                        {workout.avgHeartRate > 0 && (
                          <span className="flex items-center">
                            <FaHeartbeat className="mr-1 text-xs text-red-500" />
                            {workout.avgHeartRate} bpm
                          </span>
                        )}
                      </div>

                      {/* View details button */}
                      <div className="mt-3">
                        <Link
                          to={`/workout/${workout.id}`}
                          className="btn-outline text-sm py-1 px-3"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default History
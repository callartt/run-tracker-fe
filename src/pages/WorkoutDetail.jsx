import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FaRunning, 
  FaMapMarkerAlt, 
  FaHeartbeat, 
  FaCalendarAlt,
  FaStopwatch,
  FaFire,
  FaShareAlt,
  FaTrash,
  FaChevronLeft,
  FaEdit
} from 'react-icons/fa'
import { useWorkout } from '../context/WorkoutContext'
import { useUser } from '../context/UserContext'
import { 
  formatDistance, 
  formatDuration, 
  calculatePace,
  calculateCalories
} from '../utils/calculations'
import RunMap from '../components/map/RunMap'
import SocialShare from '../components/sharing/SocialShare'

const WorkoutDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts, deleteWorkout, shareWorkout, renameWorkout } = useWorkout()
  const { user } = useUser()
  const [workout, setWorkout] = useState(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editNameMode, setEditNameMode] = useState(false)
  const [workoutName, setWorkoutName] = useState('')

  useEffect(() => {
    if (workouts && workouts.length > 0) {
      const foundWorkout = workouts.find(w => w.id === id);
      
      if (foundWorkout) {
        setWorkout(foundWorkout);
        setWorkoutName(foundWorkout.name || '');
      } else {
        navigate('/history');
      }
    }
  }, [id, workouts, navigate]);
  
  // Calculate additional stats
  const calculateStats = () => {
    if (!workout) return {}
    
    const averageSpeed = workout.distance > 0 && workout.duration > 0
      ? workout.distance / workout.duration
      : 0
      
    const pace = calculatePace(averageSpeed, user.units)
    
    const calories = calculateCalories(
      user.weight, 
      workout.duration / 60, // convert to minutes
      workout.avgHeartRate,
      user.gender,
      user.age
    )
    
    return {
      averageSpeed,
      pace,
      calories
    }
  }
  
  // Format route data for the map
  const getRouteData = () => {
    if (!workout) return [];
    if (!workout.route) return [];
    
    // Check if route is an array before mapping
    if (!Array.isArray(workout.route)) {
      console.error("Route is not an array:", workout.route);
      return [];
    }
    
    return workout.route.map(point => {
      // Make sure point has lat and lng properties
      if (!point || typeof point !== 'object' || !('lat' in point) || !('lng' in point)) {
        console.error("Invalid point in route:", point);
        return {
          latitude: 0,
          longitude: 0
        };
      }
      
      return {
        latitude: point.lat,
        longitude: point.lng,
        ...point
      };
    });
  };
  
  // Share workout (open social share modal)
  const handleShare = () => {
    // Just open the share modal - the actual sharing happens in the SocialShare component
    setShareModalOpen(true);
  }
  
  // Delete workout
  const handleDelete = () => {
    deleteWorkout(id)
    setDeleteModalOpen(false)
    navigate('/history')
  }

  // Rename workout
  const handleRename = () => {
    if (workoutName.trim()) {
      renameWorkout(id, workoutName.trim());
      setEditNameMode(false);
    }
  }
  
  // Go back to history
  const goBack = () => {
    navigate('/history')
  }
  
  if (!workout) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  const { averageSpeed, pace, calories } = calculateStats()
  const route = getRouteData()
  
  return (
    <div className="pb-16">
      {/* Header */}
      <div className="flex items-center mb-4">
        <button
          onClick={goBack}
          className="mr-2 p-2 rounded-full bg-gray-100 dark:bg-gray-700"
          aria-label="Go back"
        >
          <FaChevronLeft />
        </button>
        <h1 className="text-xl font-bold">Workout Details</h1>
      </div>
      
      {/* Workout Name/Title with Edit Option */}
      <div className="mb-4">
        {editNameMode ? (
          <div className="flex items-center">
            <input 
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="input flex-grow mr-2"
              placeholder="Workout name"
              autoFocus
            />
            <button
              onClick={handleRename}
              className="btn-primary px-3 py-1"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {workout.name || 'Unnamed Run'}
            </h2>
            <button
              onClick={() => setEditNameMode(true)}
              className="text-gray-500 p-1"
              aria-label="Rename workout"
            >
              <FaEdit />
            </button>
          </div>
        )}
      </div>
      
      {/* Date and Time */}
      <div className="flex items-center mb-4 text-gray-600 dark:text-gray-300">
        <FaCalendarAlt className="mr-2" />
        <span>
          {new Date(workout.startTime).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          {' at '}
          {new Date(workout.startTime).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
     
     
      {/* Map */}
      {route.length > 0 && (
        <RunMap 
          route={route} 
          mapHeight="h-64 md:h-88" 
          showMarkers={true}
        />
      )}
      
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Distance */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
            <FaMapMarkerAlt className="text-primary text-sm" />
          </div>
          <div className="text-2xl font-bold">
            {formatDistance(workout.distance, user.units)}
          </div>
        </div>
        
        {/* Duration */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</h3>
            <FaStopwatch className="text-primary text-sm" />
          </div>
          <div className="text-2xl font-bold">
            {formatDuration(workout.duration)}
          </div>
        </div>
        
        {/* Pace */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Pace</h3>
            <FaRunning className="text-primary text-sm" />
          </div>
          <div className="text-2xl font-bold">
            {pace}
            <span className="text-sm text-gray-500 ml-1">
              {user.units === 'metric' ? 'min/km' : 'min/mi'}
            </span>
          </div>
        </div>
        
        {/* Calories */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Calories</h3>
            <FaFire className="text-orange-500 text-sm" />
          </div>
          <div className="text-2xl font-bold">
            {calories}
            <span className="text-sm text-gray-500 ml-1">
              kcal
            </span>
          </div>
        </div>
      </div>
      
      {/* Heart Rate Data */}
      {workout.avgHeartRate > 0 && (
        <div className="card p-4 mt-4">
          <h3 className="text-lg font-medium mb-3">Heart Rate</h3>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Average</div>
              <div className="flex items-center">
                <FaHeartbeat className="text-red-500 mr-1" />
                <span className="text-xl font-bold">{workout.avgHeartRate}</span>
                <span className="text-gray-500 ml-1">bpm</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Max</div>
              <div className="flex items-center">
                <FaHeartbeat className="text-red-500 mr-1" />
                <span className="text-xl font-bold">{workout.maxHeartRate}</span>
                <span className="text-gray-500 ml-1">bpm</span>
              </div>
            </div>
            
            {/* Simple heart rate visualization could go here */}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex mt-6 space-x-2">
        <button
          onClick={handleShare}
          className="btn-primary flex-1 flex items-center justify-center"
        >
          <FaShareAlt className="mr-2" />
          Share
        </button>
        
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="btn bg-red-500 hover:bg-red-600 text-white flex items-center justify-center px-4"
        >
          <FaTrash />
        </button>
      </div>
      
      {/* Social Share Modal */}
      {shareModalOpen && (
        <SocialShare 
          workout={workout}
          onClose={() => setShareModalOpen(false)}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-xs mx-4 shadow-lg">
            <h3 className="text-lg font-medium mb-3">Delete Workout</h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              
              <button
                onClick={handleDelete}
                className="btn bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutDetail
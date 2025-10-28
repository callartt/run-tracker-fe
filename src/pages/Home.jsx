import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaRunning,
  FaHeartbeat,
  FaMapMarkerAlt,
  FaShareAlt,
  FaChevronRight,
  FaInfoCircle,
  FaTrophy,
  FaChartLine
} from 'react-icons/fa'
import { formatDistance, formatDuration } from '../utils/calculations'
import { useWorkout } from '../context/WorkoutContext'
import { useUser } from '../context/UserContext'
import RunMap from '../components/map/RunMap'
import { useGoals } from '../context/GoalsContext'

const Home = () => {
  const navigate = useNavigate()
  const { workouts, activeWorkout } = useWorkout()
  const { user } = useUser()
  const { goals, calculateGoalProgress } = useGoals()
  const [hasLocationPermission, setHasLocationPermission] = useState(null)
  const [recentWorkouts, setRecentWorkouts] = useState([])
  
  // Check if user has granted location permission
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        setHasLocationPermission(result.state === 'granted')
        
        // Add listener for permission changes
        result.addEventListener('change', () => {
          setHasLocationPermission(result.state === 'granted')
        })
      } catch (error) {
        console.error('Error checking location permission:', error)
        setHasLocationPermission(false)
      }
    }
    
    checkLocationPermission()
  }, [])
  
  // Get recent workouts
  useEffect(() => {
    if (workouts && workouts.length > 0) {
      const recent = workouts.slice(0, 3)
      setRecentWorkouts(recent)
    }
  }, [workouts])
  
  // Calculate total stats
  const totalStats = workouts.reduce((stats, workout) => {
    return {
      totalRuns: stats.totalRuns + 1,
      totalDistance: stats.totalDistance + (workout.distance || 0),
      totalDuration: stats.totalDuration + (workout.duration || 0)
    }
  }, { totalRuns: 0, totalDistance: 0, totalDuration: 0 })
  
  // Handle start run button
  const handleStartRun = () => {
    if (activeWorkout) {
      navigate('/run')
    } else {
      // Check location permission
      if (hasLocationPermission === false) {
        if (window.confirm('This app needs access to your location to track your run. Please enable location services.')) {
          // Try to request permission again
          navigator.geolocation.getCurrentPosition(
            () => navigate('/run'),
            (error) => console.error('Location permission denied:', error)
          )
        }
      } else {
        navigate('/run')
      }
    }
  }
  
  return (
    <div>
      {/* Hero Section */}
      <div className="card p-6 text-center">
        <FaRunning className="text-primary text-5xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Track Your Run</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Record your outdoor runs with GPS tracking and heart rate monitoring
        </p>
        
        <button
          onClick={handleStartRun}
          className="btn-primary w-full py-3 text-lg font-medium"
        >
          {activeWorkout ? 'Continue Run' : 'Start New Run'}
        </button>
      </div>
      
      {/* Stats Overview */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Your Activity</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="text-xl font-bold">
              {totalStats.totalRuns}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Runs</div>
          </div>
          
          <div className="card p-3 text-center">
            <div className="text-xl font-bold">
              {formatDistance(totalStats.totalDistance, user.units).split(' ')[0]}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.units === 'metric' ? 'km' : 'mi'}
            </div>
          </div>
          
          <div className="card p-3 text-center">
            <div className="text-xl font-bold">
              {Math.floor(totalStats.totalDuration / 60)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Minutes</div>
          </div>
        </div>
      </div>
      
      {/* Goals Progress Section */}
      {goals && goals.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Current Goals</h2>
            <Link 
              to="/goals" 
              className="text-primary text-sm flex items-center"
            >
              <span>View all</span>
              <FaChevronRight className="ml-1 text-xs" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {goals
              .filter(goal => !goal.isCompleted)
              .slice(0, 2)
              .map(goal => {
                const progress = calculateGoalProgress(goal);
                
                return (
                  <Link key={goal.id} to="/goals" className="block">
                    <div className="card p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <FaTrophy className="text-primary mr-2 text-sm" />
                          <div>
                            <span className="text-sm font-medium">
                              {goal.type === 'distance' 
                                ? 'Distance Goal' 
                                : goal.type === 'duration' 
                                  ? 'Time Goal' 
                                  : 'Runs Goal'}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({goal.period})
                            </span>
                          </div>
                        </div>
                        <span className="text-sm">
                          {progress.percentage}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-primary" 
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
            {goals.filter(goal => !goal.isCompleted).length === 0 && (
              <Link to="/goals" className="block">
                <div className="card p-4 text-center">
                  <div className="flex flex-col items-center">
                    <FaTrophy className="text-primary mb-2" />
                    <p className="text-sm">Set your first goal</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* Recent Workouts */}
    {recentWorkouts.length > 0 && (
  <div className="mt-6">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-lg font-semibold">Recent Runs</h2>
      <Link 
        to="/history" 
        className="text-primary text-sm flex items-center"
      >
        <span>View all</span>
        <FaChevronRight className="ml-1 text-xs" />
      </Link>
    </div>
    
    <div className="space-y-3">
      {recentWorkouts.map(workout => (
        <Link
          key={workout.id}
          to={`/workout/${workout.id}`}
          className="card p-4 flex items-center"
        >
          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-4">
            <FaRunning className="text-primary text-lg" />
          </div>
          
          <div className="flex-1">
            <div className="font-medium">
              {/* Use workout name if available, otherwise show date */}
              {workout.name || new Date(workout.startTime).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            
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
          </div>
          
          <FaChevronRight className="text-gray-400" />
        </Link>
      ))}
    </div>
  </div>
    )}
      
      {/* Stats Dashboard Link - New Section */}
      <div className="mt-6">
        <Link to="/stats" className="card p-4 flex items-center">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mr-4">
            <FaChartLine className="text-indigo-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Statistics Dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              View your running trends and personal records
            </p>
          </div>
          <FaChevronRight className="text-gray-400" />
        </Link>
      </div>
      
      {/* App Features */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Features</h2>
        
        <div className="space-y-3">
          <div className="card p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                <FaMapMarkerAlt className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">GPS Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Track your route, distance, and pace in real-time
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-4">
                <FaHeartbeat className="text-red-500" />
              </div>
              <div>
                <h3 className="font-medium">Heart Rate Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect to Bluetooth heart rate monitors to track your intensity
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-4">
                <FaTrophy className="text-yellow-500" />
              </div>
              <div>
                <h3 className="font-medium">Goal Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Set and achieve your running goals and earn achievements
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                <FaShareAlt className="text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">Share & Challenge</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share your runs and challenge friends to beat your time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bluetooth Compatibility Info */}
      <div className="mt-6 mb-8 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg">
        <div className="flex items-start">
          <FaInfoCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
              Device Compatibility
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
              Heart rate monitoring works on Android devices with Chrome browser. 
              GPS tracking works on all modern mobile browsers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
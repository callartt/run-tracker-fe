import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FaRunning, 
  FaTrophy, 
  FaMapMarkerAlt, 
  FaStopwatch, 
  FaHeartbeat,
  FaUserFriends,
  FaExclamationTriangle,
  FaCheck,
  FaChevronLeft,
  FaPlay
} from 'react-icons/fa'
import { useWorkout } from '../context/WorkoutContext'
import { useUser } from '../context/UserContext'
import { formatDistance, formatDuration, calculatePace } from '../utils/calculations'
import RunMap from '../components/map/RunMap'

const Challenge = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts } = useWorkout()
  const { user } = useUser()
  const [challengeWorkout, setChallengeWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // In a real app, we would fetch the shared workout from a server
  // For this demo, we'll find it in local workouts by its share ID
  useEffect(() => {
    if (!workouts || workouts.length === 0) return
    
    setTimeout(() => {
      try {
        // Find workout with matching share ID
        const workout = workouts.find(w => w.shareId === id)
        
        if (workout) {
          setChallengeWorkout(workout)
        } else {
          setError('Challenge not found or has expired.')
        }
      } catch (err) {
        setError('Error loading challenge data.')
      } finally {
        setLoading(false)
      }
    }, 1000) // Simulate API delay
  }, [id, workouts])
  
  // Format route data for the map
  const getRouteData = () => {
    if (!challengeWorkout || !challengeWorkout.route) return []
    
    return challengeWorkout.route.map(point => ({
      latitude: point.lat,
      longitude: point.lng,
      ...point
    }))
  }
  
  // Accept challenge and start a new run
  const acceptChallenge = () => {
    navigate('/run')
  }
  
  // Go back
  const goBack = () => {
    navigate(-1)
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p>Loading challenge data...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="py-8">
        <div className="card p-6 text-center">
          <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Challenge Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <button
            onClick={goBack}
            className="btn-primary w-full"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }
  
  if (!challengeWorkout) return null
  
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
        <h1 className="text-xl font-bold">Challenge</h1>
      </div>
      
      {/* Challenge Card */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <FaTrophy className="text-yellow-500 text-2xl" />
          </div>
        </div>
        
        <h2 className="text-lg font-bold text-center mb-1">
          You've Been Challenged!
        </h2>
        
        <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
          Someone has challenged you to beat their run.
          Can you complete this distance in a faster time?
        </p>
        
        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Distance */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
              <div className="flex items-center justify-center mt-1">
                <FaMapMarkerAlt className="text-primary mr-1" />
                <span className="text-xl font-bold">
                  {formatDistance(challengeWorkout.distance, user.units)}
                </span>
              </div>
            </div>
            
            {/* Time to Beat */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time to Beat</h3>
              <div className="flex items-center justify-center mt-1">
                <FaStopwatch className="text-primary mr-1" />
                <span className="text-xl font-bold">
                  {formatDuration(challengeWorkout.duration)}
                </span>
              </div>
            </div>
            
            {/* Pace */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pace</h3>
              <div className="flex items-center justify-center mt-1">
                <FaRunning className="text-primary mr-1" />
                <span className="text-xl font-bold">
                  {challengeWorkout.distance > 0 && challengeWorkout.duration > 0 
                    ? calculatePace(challengeWorkout.distance / challengeWorkout.duration, user.units) 
                    : '--:--'}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  {user.units === 'metric' ? 'min/km' : 'min/mi'}
                </span>
              </div>
            </div>
            
            {/* Heart Rate */}
            {challengeWorkout.avgHeartRate > 0 && (
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Heart Rate</h3>
                <div className="flex items-center justify-center mt-1">
                  <FaHeartbeat className="text-red-500 mr-1" />
                  <span className="text-xl font-bold">
                    {challengeWorkout.avgHeartRate}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    bpm
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center mb-4">
          <FaUserFriends className="text-gray-500 mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Completed on {new Date(challengeWorkout.endTime).toLocaleDateString()}
          </span>
        </div>
        
        <button
          onClick={acceptChallenge}
          className="btn-primary w-full py-3 flex items-center justify-center"
        >
          <FaPlay className="mr-2" />
          Accept Challenge
        </button>
      </div>
      
      {/* Route Map */}
      {route.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Challenge Route</h3>
          <RunMap 
            route={route} 
            mapHeight="h-64" 
            showMarkers={true}
          />
        </div>
      )}
    </div>
  )
}

export default Challenge
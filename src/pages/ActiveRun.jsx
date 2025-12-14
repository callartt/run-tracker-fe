import { useEffect } from 'react'
import { FaPlay, FaPause, FaStop, FaCrosshairs } from 'react-icons/fa'
import RunMap from '../components/map/RunMap'
import { useWorkout } from '../context/WorkoutContext'
import { useUser } from '../context/UserContext'
import { formatDistance, formatDuration } from '../utils/calculations'
import { useNavigate } from 'react-router-dom'

const ActiveRun = () => {
  const navigate = useNavigate()
  const { user } = useUser()

  const {
    isRunning,
    isPaused,
    duration,
    distance,
    currentPace,
    currentLocation,
    route,
    error: locationError,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    finishWorkout,
    getCurrentPosition,
    activeWorkout
  } = useWorkout()

  useEffect(() => {
    if (!activeWorkout && !isRunning && duration === 0) {
      // navigate('/') 
    }
  }, [activeWorkout, isRunning, duration, navigate])

  const handleTogglePlay = () => {
    if (isRunning && !isPaused) {
      pauseWorkout()
    } else if (isPaused) {
      resumeWorkout()
    } else {
      startWorkout()
    }
  }

  const handleStopRun = async () => {
    if (window.confirm('Finish workout?')) {
      const saved = await finishWorkout()
      if (saved?.id) {
        navigate(`/workout/${saved.id}`)
      } else {
        navigate('/history')
      }
    }
  }

  const handleCenterMap = () => {
    getCurrentPosition()
  }

  const displayPosition = currentLocation || (route.length > 0 ? route[route.length - 1] : null)

  return (
    <div className="pb-16">
      <div className="relative">
        <RunMap
          route={route}
          currentPosition={displayPosition}
          isActive={isRunning && !isPaused}
          followPosition={true}
          mapHeight="h-64 md:h-88"
        />
        <div className="absolute bottom-4 right-4 z-[400]">
          <button
            onClick={handleCenterMap}
            className="p-3 bg-white rounded-full shadow-lg text-gray-700 hover:text-blue-600 active:scale-95 transition-all"
            aria-label="Center map"
          >
            <FaCrosshairs size={20} />
          </button>
        </div>
      </div>

      <div className="card mt-4 p-4 grid grid-cols-2 gap-4 text-center dark:bg-gray-800">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Distance</div>
          <div className="text-2xl font-bold">
            {formatDistance(distance / 1000)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
          <div className="text-2xl font-bold">
            {formatDuration(duration)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pace</div>
          <div className="text-2xl font-bold">
            {currentPace}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
          <div className="text-xl font-bold text-blue-500">
            {isPaused ? 'PAUSED' : isRunning ? 'RUNNING' : 'READY'}
          </div>
        </div>
      </div>

      {locationError && (
        <div className="mt-4 text-red-500 text-center text-sm p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          {locationError}
        </div>
      )}

      <div className="fixed bottom-20 inset-x-0 flex justify-center gap-8 items-center p-4 bg-transparent pointer-events-none">
        <div className="pointer-events-auto flex gap-6">
          <button
            onClick={handleTogglePlay}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl text-white text-3xl transition-transform active:scale-95 ${isRunning && !isPaused ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
              }`}
          >
            {isRunning && !isPaused ? <FaPause /> : <FaPlay className="pl-1" />}
          </button>

          {(isRunning || isPaused || duration > 0) && (
            <button
              onClick={handleStopRun}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-xl text-white text-3xl transition-transform active:scale-95 hover:bg-red-600"
            >
              <FaStop />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActiveRun
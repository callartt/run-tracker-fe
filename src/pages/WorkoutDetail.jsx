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
  FaEdit,
  FaTrophy
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
import { createChallenge } from '../api/challenges'

const WorkoutDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts, deleteWorkout, renameWorkout } = useWorkout()
  const { user } = useUser()
  const [workout, setWorkout] = useState(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [editNameMode, setEditNameMode] = useState(false)
  const [workoutName, setWorkoutName] = useState('')

  // Challenge form state
  const [challengeName, setChallengeName] = useState('')
  const [challengeDesc, setChallengeDesc] = useState('')
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false)
  const [existingChallenge, setExistingChallenge] = useState(null)

  useEffect(() => {
    if (workouts && workouts.length > 0) {
      const foundWorkout = workouts.find(w => w.id === id);

      if (foundWorkout) {
        setWorkout(foundWorkout);
        setWorkoutName(foundWorkout.name || '');
        setChallengeName(`Beat my ${formatDistance(foundWorkout.distance)} run!`)

        // Check if challenge exists
        checkExistingChallenge(foundWorkout.id);
      } else {
        navigate('/history');
      }
    }
  }, [id, workouts, navigate]);

  const checkExistingChallenge = async (runId) => {
    try {
      const { getChallengeByRunId } = await import('../api/challenges');
      const response = await getChallengeByRunId(runId);
      if (response.data) {
        setExistingChallenge(response.data);
      }
    } catch (error) {
      // Ignore 404s or other errors, just means no challenge or failed check
      console.log("No existing challenge found or check failed", error);
    }
  }

  const calculateStats = () => {
    if (!workout) return {}

    console.log("workout:", workout)

    const averageSpeed = workout.distance > 0 && workout.duration > 0
      ? workout.distance * 1000 / workout.duration
      : 0

    const pace = calculatePace(averageSpeed)
    const calories = workout.calories

    return {
      averageSpeed,
      pace,
      calories
    }
  }

  const getRouteData = () => {
    if (!workout || !workout.route || !Array.isArray(workout.route)) {
      return [];
    }

    return workout.route.map(point => {

      const lat = point.latitude || point.lat;
      const lng = point.longitude || point.lng;

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return null;
      }

      return {
        latitude: lat,
        longitude: lng,
        ...point
      };
    }).filter(point => point !== null);
  };

  const handleShare = () => {
    setShareModalOpen(true);
  }

  const handleDelete = () => {
    deleteWorkout(id)
    setDeleteModalOpen(false)
    navigate('/history')
  }

  const handleRename = () => {
    if (workoutName.trim()) {
      renameWorkout(id, workoutName.trim());
      setEditNameMode(false);
    }
  }

  const handleCreateChallenge = async () => {
    if (!challengeName.trim()) return;

    setIsCreatingChallenge(true);
    try {
      await createChallenge({
        source_run_id: workout.id,
        name: challengeName,
        description: challengeDesc
      });
      setChallengeModalOpen(false);
      // Optionally show success message
      alert("Challenge created successfully!");
    } catch (error) {
      console.error("Failed to create challenge", error);
      alert("Failed to create challenge. Please try again.");
    } finally {
      setIsCreatingChallenge(false);
    }
  }

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

  const { pace, calories } = calculateStats()
  const route = getRouteData()

  return (
    <div className="pb-16">
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


      {route.length > 0 && (
        <RunMap
          route={route}
          mapHeight="h-64 md:h-88"
          showMarkers={true}
        />
      )}


      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
            <FaMapMarkerAlt className="text-primary text-sm" />
          </div>
          <div className="text-2xl font-bold">
            {formatDistance(workout.distance)}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</h3>
            <FaStopwatch className="text-primary text-sm" />
          </div>
          <div className="text-2xl font-bold">
            {formatDuration(workout.duration)}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Pace</h3>
            <FaRunning className="text-primary text-sm" />
          </div>
          <div className="text-2xl font-bold">
            {pace}
            <span className="text-sm text-gray-500 ml-1">
              min/km
            </span>
          </div>
        </div>

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

      <div className="flex mt-6 space-x-2">
        <button
          onClick={handleShare}
          className="btn-primary flex-1 flex items-center justify-center"
        >
          <FaShareAlt className="mr-2" />
          Share
        </button>

        {existingChallenge ? (
          <button
            onClick={() => navigate(`/challenge/${existingChallenge.uuid}`)}
            className="btn bg-green-500 hover:bg-green-600 text-white flex-1 flex items-center justify-center"
          >
            <FaTrophy className="mr-2" />
            Challenge
          </button>
        ) : (
          <button
            onClick={() => setChallengeModalOpen(true)}
            className="btn bg-yellow-500 hover:bg-yellow-600 text-white flex-1 flex items-center justify-center"
          >
            <FaTrophy className="mr-2" />
            Challenge
          </button>
        )}

        <button
          onClick={() => setDeleteModalOpen(true)}
          className="btn bg-red-500 hover:bg-red-600 text-white flex items-center justify-center px-4"
        >
          <FaTrash />
        </button>
      </div>

      {shareModalOpen && (
        <SocialShare
          workout={workout}
          onClose={() => setShareModalOpen(false)}
        />
      )}

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

      {challengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-sm mx-4 shadow-lg">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <FaTrophy className="text-yellow-500 mr-2" />
              Create Challenge
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Challenge Name</label>
              <input
                type="text"
                className="input w-full"
                value={challengeName}
                onChange={(e) => setChallengeName(e.target.value)}
                placeholder="e.g. Beat my 5k"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <textarea
                className="input w-full h-20 resize-none"
                value={challengeDesc}
                onChange={(e) => setChallengeDesc(e.target.value)}
                placeholder="Add some trash talk..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setChallengeModalOpen(false)}
                className="btn-outline"
                disabled={isCreatingChallenge}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateChallenge}
                className="btn-primary"
                disabled={isCreatingChallenge}
              >
                {isCreatingChallenge ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutDetail
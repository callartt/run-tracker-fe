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
  FaChevronLeft,
  FaPlay
} from 'react-icons/fa'
import { formatDistance, formatDuration, calculatePace } from '../utils/calculations'
import RunMap from '../components/map/RunMap'
import { getChallenge, getChallengeAttempts } from '../api/challenges'

import { useAuth } from '../context/AuthContext'

const Challenge = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengeResponse = await getChallenge(id)
        setChallenge(challengeResponse.data)

        // Fetch attempts for this challenge
        const attemptsResponse = await getChallengeAttempts(id)
        setAttempts(attemptsResponse.data)
      } catch (err) {
        console.error(err)
        setError('Challenge not found or error loading data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Format route data for the map
  const getRouteData = () => {
    if (!challenge || !challenge.source_run || !challenge.source_run.route) return []

    return challenge.source_run.route.map(point => ({
      latitude: point.lat,
      longitude: point.lng,
      ...point
    }))
  }

  // Accept challenge and start a new run
  const acceptChallenge = () => {
    // Navigate to ActiveRun with challenge data
    navigate('/run', {
      state: {
        challengeId: challenge.uuid,
        ghostRoute: challenge.source_run.route,
        targetDistance: challenge.source_run.distance,
        targetDuration: challenge.source_run.duration
      }
    })
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
          <h2 className="text-xl font-bold mb-2">Error</h2>
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

  if (!challenge) return null

  const route = getRouteData()
  const { source_run } = challenge
  const isCreator = user && challenge.creator_id === user.uuid

  console.log("source_run:", source_run)

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
        <h1 className="text-xl font-bold">Challenge Details</h1>
      </div>

      {/* Challenge Card */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <FaTrophy className="text-yellow-500 text-2xl" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-center mb-1">
          {challenge.name}
        </h2>

        <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
          {challenge.description || "Can you beat this run?"}
        </p>

        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Distance */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</h3>
              <div className="flex items-center justify-center mt-1">
                <FaMapMarkerAlt className="text-primary mr-1" />
                <span className="text-xl font-bold">
                  {formatDistance(source_run.distance)}
                </span>
              </div>
            </div>

            {/* Time to Beat */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time to Beat</h3>
              <div className="flex items-center justify-center mt-1">
                <FaStopwatch className="text-primary mr-1" />
                <span className="text-xl font-bold">
                  {formatDuration(source_run.duration * 60)}
                </span>
              </div>
            </div>

            {/* Pace */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pace</h3>
              <div className="flex items-center justify-center mt-1">
                <FaRunning className="text-primary mr-1" />
                <span className="text-xl font-bold">
                  {source_run.distance > 0 && source_run.duration > 0
                    ? calculatePace(source_run.distance * 1000 / (source_run.duration * 60))
                    : '--:--'}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  min/km
                </span>
              </div>
            </div>

            {/* Creator */}
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Challenger</h3>
              <div className="flex items-center justify-center mt-1">
                <FaUserFriends className="text-blue-500 mr-1" />
                <span className="text-xl font-bold">
                  {challenge.creator?.username || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isCreator ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
            <p className="font-medium">This is your challenge!</p>
            <p className="text-sm">Share it with friends to see if they can beat it.</p>
          </div>
        ) : (
          <button
            onClick={acceptChallenge}
            className="btn-primary w-full py-3 flex items-center justify-center"
          >
            <FaPlay className="mr-2" />
            Accept Challenge
          </button>
        )}
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

      {/* Attempts Section */}
      {attempts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Attempts ({attempts.length})</h3>
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <div
                key={attempt.uuid}
                className={`card p-4 ${attempt.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FaUserFriends className="text-blue-500 mr-2" />
                    <span className="font-medium">{attempt.user?.username || 'Unknown'}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${attempt.success
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                    {attempt.success ? 'Success!' : 'Failed'}
                  </span>
                </div>

                {attempt.run && (
                  <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Distance</div>
                      <div className="font-medium">{formatDistance(attempt.run.distance)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Time</div>
                      <div className="font-medium">{formatDuration(attempt.run.duration * 60)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Pace</div>
                      <div className="font-medium">
                        {attempt.run.distance > 0 && attempt.run.duration > 0
                          ? calculatePace(attempt.run.distance * 1000 / (attempt.run.duration * 60))
                          : '--:--'} min/km
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(attempt.created_at).toLocaleDateString()} at {new Date(attempt.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Challenge
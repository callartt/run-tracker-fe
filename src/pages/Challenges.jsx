import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaTrophy, FaUser, FaRunning, FaClock } from 'react-icons/fa'
import { getChallenges } from '../api/challenges'
import { formatDistance, formatDuration } from '../utils/calculations'

const Challenges = () => {
    const [challenges, setChallenges] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const response = await getChallenges({ limit: 50 })
                setChallenges(response.data.items)
            } catch (err) {
                console.error("Failed to fetch challenges", err)
                setError("Failed to load challenges")
            } finally {
                setLoading(false)
            }
        }

        fetchChallenges()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="pb-16">
            <h1 className="text-2xl font-bold mb-6">Challenges</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {challenges.length === 0 ? (
                <div className="text-center py-12 card p-8">
                    <FaTrophy className="text-gray-300 text-6xl mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Challenges Available</h3>
                    <p className="text-gray-500">
                        Your friends haven't created any challenges yet.
                        <br />
                        Go to your History and create one to challenge them!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {challenges.map(challenge => (
                        <Link
                            key={challenge.uuid}
                            to={`/challenge/${challenge.uuid}`}
                            className="card p-4 hover:border-primary transition-colors block"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{challenge.name}</h3>
                                <span className="bg-primary bg-opacity-10 text-primary text-xs px-2 py-1 rounded-full">
                                    Challenge
                                </span>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                                {challenge.description || "No description provided."}
                            </p>

                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center">
                                    <FaUser className="mr-1" />
                                    <span>{challenge.creator?.username || 'Unknown'}</span>
                                </div>

                                {challenge.source_run && (
                                    <div className="flex space-x-3">
                                        <span className="flex items-center">
                                            <FaRunning className="mr-1" />
                                            {formatDistance(challenge.source_run.distance)}
                                        </span>
                                        <span className="flex items-center">
                                            <FaClock className="mr-1" />
                                            {formatDuration(challenge.source_run.duration)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Challenges

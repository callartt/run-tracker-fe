import { useState, useEffect } from 'react'
import { FaUserPlus, FaUserFriends, FaCheck, FaTimes, FaEnvelope } from 'react-icons/fa'
import api from '../api/axios'
import { useUser } from '../context/UserContext'

const Friends = () => {
    const { user } = useUser()
    const [activeTab, setActiveTab] = useState('friends')
    const [friends, setFriends] = useState([])
    const [requests, setRequests] = useState({ incoming: [], outgoing: [] })
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)

    useEffect(() => {
        fetchFriends()
        fetchRequests()
    }, [])

    const fetchFriends = async () => {
        try {
            const response = await api.get('/friendships/')
            setFriends(response.data.friends)
        } catch (err) {
            console.error('Error fetching friends:', err)
        }
    }

    const fetchRequests = async () => {
        try {
            const response = await api.get('/friendships/requests')
            setRequests(response.data)
        } catch (err) {
            console.error('Error fetching requests:', err)
        }
    }

    const handleSendRequest = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMsg(null)

        try {
            await api.post('/friendships/request', { email })
            setSuccessMsg(`Friend request sent to ${email}`)
            setEmail('')
            fetchRequests()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send request')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRespond = async (requestId, action) => {
        try {
            await api.post(`/friendships/${requestId}/respond`, { action })
            fetchRequests()
            if (action === 'ACCEPT') {
                fetchFriends()
            }
        } catch (err) {
            console.error('Error responding to request:', err)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Friends</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    className={`pb-2 px-4 font-medium ${activeTab === 'friends'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    onClick={() => setActiveTab('friends')}
                >
                    My Friends ({friends.length})
                </button>
                <button
                    className={`pb-2 px-4 font-medium ${activeTab === 'add'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    onClick={() => setActiveTab('add')}
                >
                    Add Friend
                </button>
                <button
                    className={`pb-2 px-4 font-medium ${activeTab === 'requests'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    onClick={() => setActiveTab('requests')}
                >
                    Requests ({requests.incoming.length})
                </button>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {activeTab === 'friends' && (
                    <div>
                        {friends.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FaUserFriends className="text-4xl mx-auto mb-3 opacity-50" />
                                <p>No friends yet. Go to "Add Friend" to connect!</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {friends.map((friend) => (
                                    <li key={friend.uuid} className="py-4 flex items-center">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                            <span className="font-bold text-gray-600">
                                                {friend.username?.[0]?.toUpperCase() || friend.email[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{friend.username || 'User'}</p>
                                            <p className="text-sm text-gray-500">{friend.email}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === 'add' && (
                    <div>
                        <form onSubmit={handleSendRequest} className="max-w-md mx-auto">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Friend's Email
                                </label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="friend@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                                    {successMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-2 flex items-center justify-center"
                            >
                                {isLoading ? 'Sending...' : (
                                    <>
                                        <FaUserPlus className="mr-2" /> Send Request
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-3">Incoming Requests</h3>
                            {requests.incoming.length === 0 ? (
                                <p className="text-gray-500 text-sm">No pending requests.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {requests.incoming.map((req) => (
                                        <li key={req.uuid} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                                                    <FaUserPlus />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{req.requester?.email}</p>
                                                    <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleRespond(req.uuid, 'ACCEPT')}
                                                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                                                    title="Accept"
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    onClick={() => handleRespond(req.uuid, 'DECLINE')}
                                                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                                    title="Decline"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold mb-3">Sent Requests</h3>
                            {requests.outgoing.length === 0 ? (
                                <p className="text-gray-500 text-sm">No sent requests.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {requests.outgoing.map((req) => (
                                        <li key={req.uuid} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mr-3">
                                                    <FaEnvelope />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{req.addressee?.email || 'User'}</p>
                                                    <p className="text-xs text-gray-500">Pending</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRespond(req.uuid, 'DECLINE')}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Cancel
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Friends

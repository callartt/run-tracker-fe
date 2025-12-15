import { useState, useEffect } from 'react';
import { FaTrophy, FaMedal, FaUser } from 'react-icons/fa';
import { getLeaderboard } from '../api/leaderboard';
import { formatDistance, formatDuration } from '../utils/calculations';

const Leaderboard = () => {
    const [leaderboardData, setLeaderboardData] = useState({ entries: [], current_user_entry: null });
    const [metric, setMetric] = useState('distance');
    const [period, setPeriod] = useState('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const data = await getLeaderboard(metric, period);
                setLeaderboardData(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
                setError("Failed to load leaderboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [metric, period]);

    const formatValue = (value, metricType) => {
        if (metricType === 'distance') return formatDistance(value);
        if (metricType === 'duration') return formatDuration(value);
        return `${value} runs`;
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <FaTrophy className="text-yellow-500 text-xl" />;
        if (rank === 2) return <FaMedal className="text-gray-400 text-xl" />;
        if (rank === 3) return <FaMedal className="text-amber-700 text-xl" />;
        return <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
    };

    return (
        <div className="pb-16">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
                <FaTrophy className="mr-3 text-primary" />
                Leaderboard
            </h1>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Metric
                        </label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {['distance', 'duration', 'runs'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMetric(m)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${metric === m
                                            ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Period
                        </label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {[
                                { id: 'week', label: 'This Week' },
                                { id: 'month', label: 'This Month' },
                                { id: 'all_time', label: 'All Time' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${period === p.id
                                            ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
            ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
            ) : (
                <div className="space-y-4">
                    {/* Current User Rank (if not in view or just to highlight) */}
                    {leaderboardData.current_user_entry && (
                        <div className="bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-xl p-4 flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0 w-8 text-center font-bold text-primary">
                                    #{leaderboardData.current_user_entry.rank}
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                                        <FaUser />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">You</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {leaderboardData.current_user_entry.username || 'Anonymous'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold text-lg text-primary pl-3">
                                {formatValue(leaderboardData.current_user_entry.value, metric)}
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        {leaderboardData.entries.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No data available for this period.</div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {leaderboardData.entries.map((entry) => (
                                    <div
                                        key={entry.user_uuid}
                                        className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${entry.is_current_user ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                            }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0 w-8 flex justify-center">
                                                {getRankIcon(entry.rank)}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.is_current_user ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                                    }`}>
                                                    <FaUser />
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${entry.is_current_user ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                                        {entry.is_current_user ? 'You' : (entry.username || 'Anonymous')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-700 dark:text-gray-300 pl-3">
                                            {formatValue(entry.value, metric)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import geoSimulator from '../utils/GeoSimulator'

const STORAGE_KEY_SPEED = 'simulation_speed'
const STORAGE_KEY_ROUTE = 'simulation_route'

export default function SimulationConfigModal({ isOpen, onClose }) {
    const routes = geoSimulator.getRoutes()

    // Load route from localStorage, default to first route if not found
    const [selectedRoute, setSelectedRoute] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_ROUTE)
        return saved || 'KHRESHCHATYK_PEIZAZHNA'
    })

    // Load speed from localStorage, default to 10 if not found
    const [speed, setSpeed] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_SPEED)
        return saved ? Number(saved) : 10
    })

    // Save route to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_ROUTE, selectedRoute)
    }, [selectedRoute])

    // Save speed to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SPEED, speed.toString())
    }, [speed])

    if (!isOpen) return null

    const handleConfigure = () => {
        // Configure the simulator
        geoSimulator.configure(selectedRoute, speed)
        // Close modal
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Simulation Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Route Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Route
                        </label>
                        <select
                            value={selectedRoute}
                            onChange={(e) => setSelectedRoute(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {routes.map((route) => (
                                <option key={route.key} value={route.key}>
                                    {route.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Speed Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Average Speed (km/h)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Recommended: 8-12 km/h for running
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfigure}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        Configure Simulation
                    </button>
                </div>
            </div>
        </div>
    )
}

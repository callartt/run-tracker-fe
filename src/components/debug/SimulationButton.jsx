import { useState, useEffect } from 'react'
import { FaRobot } from 'react-icons/fa'
import GeoSimulator from '../../utils/GeoSimulator'

const SimulationButton = () => {
  const [isActive, setIsActive] = useState(false)

  const toggleSimulation = () => {
    const newState = GeoSimulator.toggle()
    setIsActive(newState)
  }

  useEffect(() => {
    setIsActive(GeoSimulator.isActive)
  }, [])

  return (
    <button
      onClick={toggleSimulation}
      className={`fixed top-20 right-4 z-[9999] p-3 rounded-full shadow-lg transition-all duration-300 ${
        isActive 
          ? 'bg-purple-600 text-white animate-pulse shadow-purple-500/50' 
          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
      }`}
      title="Toggle GPS Simulation"
    >
      <FaRobot size={24} />
      {isActive && (
        <span className="absolute -bottom-8 right-0 text-xs bg-black text-white px-2 py-1 rounded opacity-75 whitespace-nowrap">
          Simulating...
        </span>
      )}
    </button>
  )
}

export default SimulationButton
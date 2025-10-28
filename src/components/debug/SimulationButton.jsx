// src/components/debug/SimulationButton.jsx
import { useState, useEffect } from 'react';
import { FaRobot } from 'react-icons/fa';

// Import the simulator (will be placed in src/utils)
import LocationSimulator from '../../utils/LocationSimulator';

const SimulationButton = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulator, setSimulator] = useState(null);
  
  // Initialize simulator on component mount
  useEffect(() => {
    // Create the simulator with London Bridge as default location
    const sim = new LocationSimulator({
      startLat: 51.5079,
      startLng: -0.0877,
      speed: 3.0, // Slightly faster than walking pace
      interval: 1000, // Update every second
      jitter: 2 // Small random variations
    });
    
    setSimulator(sim);
    
    // Clean up on unmount
    return () => {
      if (sim.isActive) {
        sim.stop();
      }
    };
  }, []);
  
  // Toggle simulation on/off
  const toggleSimulation = () => {
    if (!simulator) return;
    
    if (isSimulating) {
      simulator.stop();
    } else {
      simulator.start();
    }
    
    setIsSimulating(!isSimulating);
  };
  
  return (
    <div className="fixed bottom-32 right-4 z-50">
      <button
        onClick={toggleSimulation}
        className={`p-3 rounded-full shadow-lg flex items-center justify-center ${
          isSimulating ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        aria-label={isSimulating ? 'Stop simulation' : 'Start simulation'}
        title={isSimulating ? 'Stop simulation' : 'Start GPS simulation'}
      >
        <FaRobot className="text-xl" />
      </button>
      
      {isSimulating && (
        <div className="absolute bottom-full right-0 mb-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          Simulating...
        </div>
      )}
    </div>
  );
};

export default SimulationButton;
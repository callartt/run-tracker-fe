import { useState } from 'react'
import { 
  FaSun, 
  FaMoon, 
  FaRuler, 
  FaWeight,
  FaHeartbeat,
  FaBell,
  FaInfoCircle,
  FaCheck
} from 'react-icons/fa'
import { useUser } from '../context/UserContext'

const Settings = () => {
  const { user, updateUserProfile, updateHeartRateZones, toggleTheme, toggleUnits } = useUser()
  const [formData, setFormData] = useState({
    name: user.name || '',
    age: user.age || 30,
    weight: user.weight || 70,
    height: user.height || 175,
    gender: user.gender || 'not specified',
    maxHeartRate: user.maxHeartRate || 190,
  })
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  const handleSaveProfile = (e) => {
    e.preventDefault()
    
    const updatedProfile = {
      ...formData,
      age: Number(formData.age),
      weight: Number(formData.weight),
      height: Number(formData.height),
      maxHeartRate: Number(formData.maxHeartRate)
    }
    
    updateUserProfile(updatedProfile)
    
    updateHeartRateZones(updatedProfile.maxHeartRate)
    
    setShowSaveConfirmation(true)
    setTimeout(() => setShowSaveConfirmation(false), 3000)
  }
  
  const calculateMaxHR = () => {
    if (!formData.age) return
    
    const estimatedMaxHR = 220 - Number(formData.age)
    
    setFormData(prev => ({
      ...prev,
      maxHeartRate: estimatedMaxHR
    }))
  }
  
  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      
      {/* Display Settings */}
      <div className="card p-4 mb-4">
        <h2 className="text-lg font-medium mb-3">Display</h2>
        
        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {user.theme === 'dark' ? <FaMoon className="mr-3 text-blue-400" /> : <FaSun className="mr-3 text-yellow-500" />}
              <span>Theme</span>
            </div>
            
            <button
              onClick={toggleTheme}
              className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              style={{ backgroundColor: user.theme === 'dark' ? '#3B82F6' : '#D1D5DB' }}
            >
              <span
                className={`${
                  user.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
              />
            </button>
          </div>
          
          {/* Units Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaRuler className="mr-3 text-gray-500" />
              <span>Distance Units</span>
            </div>
            
            <button
              onClick={toggleUnits}
              className="btn-outline text-sm py-1"
            >
              {user.units === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
            </button>
          </div>
          
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaBell className="mr-3 text-gray-500" />
              <span>Notifications</span>
            </div>
            
            <button
              onClick={() => {
                const updated = !user.notificationsEnabled
                updateUserProfile({ notificationsEnabled: updated })
              }}
              className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              style={{ backgroundColor: user.notificationsEnabled ? '#3B82F6' : '#D1D5DB' }}
            >
              <span
                className={`${
                  user.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* User Profile Form */}
      <form onSubmit={handleSaveProfile}>
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-medium mb-3">Profile</h2>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="Your name"
              />
            </div>
            
            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium mb-1">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="input"
                min="1"
                max="120"
              />
            </div>
            
            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="not specified">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Height */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="height" className="block text-sm font-medium mb-1">
                  Height ({user.units === 'metric' ? 'cm' : 'in'})
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="input"
                  min="1"
                  max="300"
                />
              </div>
              
              {/* Weight */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium mb-1">
                  Weight ({user.units === 'metric' ? 'kg' : 'lb'})
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input"
                  min="1"
                  max="500"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Heart Rate Settings */}
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-medium mb-3">Heart Rate</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <FaHeartbeat className="text-red-500 mr-2" />
              <span className="text-sm">These settings help calculate your heart rate zones and calories burned.</span>
            </div>
            
            <div>
              <label htmlFor="maxHeartRate" className="block text-sm font-medium mb-1">
                Maximum Heart Rate (bpm)
              </label>
              <div className="flex">
                <input
                  type="number"
                  id="maxHeartRate"
                  name="maxHeartRate"
                  value={formData.maxHeartRate}
                  onChange={handleChange}
                  className="input rounded-r-none"
                  min="100"
                  max="220"
                />
                <button
                  type="button"
                  onClick={calculateMaxHR}
                  className="btn-outline border-l-0 rounded-l-none whitespace-nowrap text-sm"
                >
                  Estimate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Typical max HR is calculated as 220 - age
              </p>
            </div>
            
            {/* Heart Rate Zones Info */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <FaInfoCircle className="text-primary mr-2" />
                <h3 className="font-medium">Your Heart Rate Zones</h3>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-500">Recovery</span>
                  <span>{user.heartRateZones.recovery.min}-{user.heartRateZones.recovery.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-500">Aerobic</span>
                  <span>{user.heartRateZones.aerobic.min}-{user.heartRateZones.aerobic.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-500">Tempo</span>
                  <span>{user.heartRateZones.tempo.min}-{user.heartRateZones.tempo.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-500">Threshold</span>
                  <span>{user.heartRateZones.threshold.min}-{user.heartRateZones.threshold.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500">Anaerobic</span>
                  <span>{user.heartRateZones.anaerobic.min}-{user.heartRateZones.anaerobic.max} bpm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <button
          type="submit"
          className="btn-primary w-full py-3"
        >
          Save Settings
        </button>
        
        {/* Save Confirmation */}
        {showSaveConfirmation && (
          <div className="fixed bottom-20 inset-x-0 flex justify-center">
            <div className="bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg flex items-center">
              <FaCheck className="mr-2" />
              <span>Settings saved successfully!</span>
            </div>
          </div>
        )}
      </form>
      
      {/* App Info */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div>Run Tracker App</div>
        <div>Version 1.0.0</div>
      </div>
    </div>
  )
}

export default Settings
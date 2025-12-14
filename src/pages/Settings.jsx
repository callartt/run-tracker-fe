import { useState, useEffect } from 'react'
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
import { useAuth } from '../context/AuthContext'

const Settings = () => {
  const { user: localUser, updateHeartRateZones, toggleTheme, updateUserProfile: updateLocalUserProfile } = useUser()
  const { user: authUser, updateUser } = useAuth()

  const [formData, setFormData] = useState({
    username: localUser.username || '',
    age: localUser.age || 30,
    weight: localUser.weight || 70,
    height: localUser.height || 175,
    gender: localUser.gender || 'not specified',
    maxHeartRate: localUser.maxHeartRate || 190,
  })
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form data from authUser when available
  useEffect(() => {
    if (authUser) {
      setFormData(prev => ({
        ...prev,
        username: authUser.username || '',
        age: authUser.age || 30,
        weight: authUser.weight || 70,
        height: authUser.height || 175,
        gender: authUser.gender || 'not specified',
        // These might not be in backend yet, so fallback to local or default
        maxHeartRate: localUser.maxHeartRate || 190,
      }))
    }
  }, [authUser, localUser.maxHeartRate])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    // Convert string inputs to appropriate types
    const updatedProfile = {
      username: formData.username,
      age: Number(formData.age),
      weight: Number(formData.weight),
      height: Number(formData.height),
      gender: formData.gender,
    }

    // Update backend
    const success = await updateUser(updatedProfile)

    if (success) {
      // Update local context for things not yet in backend or for immediate UI feedback if needed
      // We also update maxHeartRate locally as it's not in backend yet
      updateLocalUserProfile({
        ...updatedProfile,
        maxHeartRate: Number(formData.maxHeartRate),
      })

      // Update heart rate zones based on max heart rate (local calculation)
      updateHeartRateZones(Number(formData.maxHeartRate))

      // Show confirmation
      setShowSaveConfirmation(true)
      setTimeout(() => setShowSaveConfirmation(false), 3000)
    }
    setIsSaving(false)
  }
  
  // Calculate estimated max heart rate
  const calculateMaxHR = () => {
    if (!formData.age) return
    
    // Use the common 220 - age formula
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
              {localUser.theme === 'dark' ? <FaMoon className="mr-3 text-blue-400" /> : <FaSun className="mr-3 text-yellow-500" />}
              <span>Theme</span>
            </div>

            <button
              onClick={toggleTheme}
              className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              style={{ backgroundColor: localUser.theme === 'dark' ? '#3B82F6' : '#D1D5DB' }}
            >
              <span
                className={`${localUser.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
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
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="Your username"
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
                  Height (cm)
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
                  Weight (kg)
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
                  <span>{localUser.heartRateZones.recovery.min}-{localUser.heartRateZones.recovery.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-500">Aerobic</span>
                  <span>{localUser.heartRateZones.aerobic.min}-{localUser.heartRateZones.aerobic.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-500">Tempo</span>
                  <span>{localUser.heartRateZones.tempo.min}-{localUser.heartRateZones.tempo.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-500">Threshold</span>
                  <span>{localUser.heartRateZones.threshold.min}-{localUser.heartRateZones.threshold.max} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500">Anaerobic</span>
                  <span>{localUser.heartRateZones.anaerobic.min}-{localUser.heartRateZones.anaerobic.max} bpm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary w-full py-3 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
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
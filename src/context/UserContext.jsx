import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: '',
    age: 30,
    weight: 70, // kg
    height: 175, // cm
    gender: 'not specified',
    maxHeartRate: 190,
    heartRateZones: {
      recovery: { min: 0, max: 123 },      // 50-65% of max
      aerobic: { min: 124, max: 142 },     // 65-75% of max
      tempo: { min: 143, max: 161 },       // 75-85% of max
      threshold: { min: 162, max: 180 },   // 85-95% of max
      anaerobic: { min: 181, max: 200 }    // 95-100% of max
    },
    units: 'metric',  // 'metric' or 'imperial'
    theme: 'light',   // 'light' or 'dark'
    notificationsEnabled: true
  })
  
  // Load user preferences from localStorage on initial render
  useEffect(() => {
    const loadUserPreferences = () => {
      try {
        const storedUser = localStorage.getItem('userPreferences')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Error loading user preferences:', error)
      }
    }

    loadUserPreferences()
  }, [])

  // Save user preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(user))
    
    // Apply theme
    document.documentElement.classList.toggle('dark', user.theme === 'dark')
  }, [user])

  // Update user profile
  const updateUserProfile = (newProfileData) => {
    setUser(prev => ({ ...prev, ...newProfileData }))
  }

  // Calculate and update heart rate zones based on max heart rate
  const updateHeartRateZones = (maxHeartRate) => {
    const newZones = {
      recovery: { 
        min: 0, 
        max: Math.round(maxHeartRate * 0.65) 
      },
      aerobic: { 
        min: Math.round(maxHeartRate * 0.65) + 1, 
        max: Math.round(maxHeartRate * 0.75) 
      },
      tempo: { 
        min: Math.round(maxHeartRate * 0.75) + 1, 
        max: Math.round(maxHeartRate * 0.85) 
      },
      threshold: { 
        min: Math.round(maxHeartRate * 0.85) + 1, 
        max: Math.round(maxHeartRate * 0.95) 
      },
      anaerobic: { 
        min: Math.round(maxHeartRate * 0.95) + 1, 
        max: maxHeartRate 
      }
    }

    setUser(prev => ({
      ...prev,
      maxHeartRate,
      heartRateZones: newZones
    }))
  }

  // Toggle theme
  const toggleTheme = () => {
    setUser(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }))
  }

  // Toggle units
  const toggleUnits = () => {
    setUser(prev => ({
      ...prev,
      units: prev.units === 'metric' ? 'imperial' : 'metric'
    }))
  }

  // Get current heart rate zone
  const getHeartRateZone = (heartRate) => {
    if (!heartRate) return null
    
    for (const [zone, range] of Object.entries(user.heartRateZones)) {
      if (heartRate >= range.min && heartRate <= range.max) {
        return zone
      }
    }
    
    return 'unknown'
  }

  return (
    <UserContext.Provider
      value={{
        user,
        updateUserProfile,
        updateHeartRateZones,
        toggleTheme,
        toggleUnits,
        getHeartRateZone
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  
  return context
}

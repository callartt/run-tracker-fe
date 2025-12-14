import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

const DEFAULT_USER_STATE = {
  name: '',
  age: 30,
  weight: 70,
  height: 175,
  gender: 'not specified',
  maxHeartRate: 190,
  heartRateZones: {
    recovery: { min: 0, max: 123 },
    aerobic: { min: 124, max: 142 },
    tempo: { min: 143, max: 161 },
    threshold: { min: 162, max: 180 },
    anaerobic: { min: 181, max: 200 }  
  },
  theme: 'light',
}

const loadInitialState = () => {
  try {
    const storedUser = localStorage.getItem('userPreferences')
    if (storedUser) {
      return { ...DEFAULT_USER_STATE, ...JSON.parse(storedUser) }
    }
  } catch (error) {
    console.error('Error loading user preferences:', error)
  }
  return DEFAULT_USER_STATE
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(loadInitialState)
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(user))
    document.documentElement.classList.toggle('dark', user.theme === 'dark')
  }, [user])

  const updateUserProfile = (newProfileData) => {
    setUser(prev => ({ ...prev, ...newProfileData }))
  }

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

  const toggleTheme = () => {
    setUser(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }))
  }

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
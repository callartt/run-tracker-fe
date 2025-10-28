import { useState, useEffect } from 'react'
import { FaHeartbeat } from 'react-icons/fa'
import { useUser } from '../../context/UserContext'
import HeartRateZone from './HeartRateZone'
import ConnectDevice from './ConnectDevice'
import useHeartRateMonitor from '../../hooks/useHeartRateMonitor'

const HeartRateMonitor = ({ onHeartRateChange = null, targetZone = null }) => {
  const { user, getHeartRateZone } = useUser()
  const [showConnect, setShowConnect] = useState(false)
  const [zoneAlert, setZoneAlert] = useState(null)
  
  // Initialize heart rate monitor with zone change callback
  const heartRateMonitor = useHeartRateMonitor({
    targetZone,
    onZoneChange: (inZone, heartRate, zone) => {
      if (!inZone && heartRate > 0) {
        // Alert if heart rate is out of zone
        const message = heartRate < zone.min 
          ? 'Heart rate below target zone' 
          : 'Heart rate above target zone'
        
        setZoneAlert({
          message,
          type: heartRate < zone.min ? 'low' : 'high',
          heartRate
        })
        
        // Clear alert after 5 seconds
        setTimeout(() => setZoneAlert(null), 5000)
      } else {
        setZoneAlert(null)
      }
    }
  })
  
  const {
    heartRate,
    isConnected,
    isConnecting,
    error,
    isBluetoothAvailable,
    connectToDevice,
    disconnect
  } = heartRateMonitor

  // Send heart rate changes to parent component
  useEffect(() => {
    if (onHeartRateChange && heartRate !== null) {
      onHeartRateChange(heartRate)
    }
  }, [heartRate, onHeartRateChange])

  // Update target zone if changed
  useEffect(() => {
    if (targetZone) {
      heartRateMonitor.setHeartRateZone(targetZone.min, targetZone.max)
    }
  }, [targetZone])

  // Determine heart rate zone color
  const getHeartRateColor = () => {
    if (!heartRate) return 'text-gray-400'
    
    const zone = getHeartRateZone(heartRate)
    
    switch(zone) {
      case 'recovery':
        return 'text-blue-400'
      case 'aerobic':
        return 'text-green-500'
      case 'tempo':
        return 'text-yellow-500'
      case 'threshold':
        return 'text-orange-500'
      case 'anaerobic':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  // Handle connection to heart rate monitor
  const handleConnect = async () => {
    const success = await connectToDevice()
    setShowConnect(false)
  }

  // Handle disconnection
  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <div className="relative">
      {/* Heart Rate Display */}
      <div className="flex flex-col items-center justify-center p-4 card">
        <div className="flex items-center justify-between w-full mb-2">
          <h3 className="text-lg font-semibold">Heart Rate</h3>
          {isBluetoothAvailable && (
            <button
              onClick={() => setShowConnect(!showConnect)}
              className="btn-outline text-sm py-1 px-2"
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          )}
        </div>
        
        {/* Heart Rate Value */}
        <div className="flex items-center justify-center space-x-2 my-3">
          <FaHeartbeat className={`text-2xl ${getHeartRateColor()} ${heartRate ? 'heart-pulse' : ''}`} />
          <span className={`text-3xl font-bold ${getHeartRateColor()}`}>
            {heartRate || '--'}
          </span>
          <span className="text-gray-500">BPM</span>
        </div>
        
        {/* Heart Rate Zone */}
        {heartRate && (
          <HeartRateZone 
            heartRate={heartRate} 
            zones={user.heartRateZones} 
            targetZone={targetZone}
          />
        )}
        
        {/* Status Messages */}
        {!isBluetoothAvailable && (
          <div className="text-red-500 text-sm mt-2">
            Bluetooth not available in this browser.
            Please use Chrome on Android.
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}
        
        {/* Zone Alert */}
        {zoneAlert && (
          <div className={`mt-2 py-2 px-3 rounded-lg text-sm 
            ${zoneAlert.type === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
            {zoneAlert.message}
          </div>
        )}
      </div>
      
      {/* Connect Device Modal */}
      {showConnect && (
        <ConnectDevice
          onClose={() => setShowConnect(false)}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isConnected={isConnected}
          isConnecting={isConnecting}
          error={error}
        />
      )}
    </div>
  )
}

export default HeartRateMonitor
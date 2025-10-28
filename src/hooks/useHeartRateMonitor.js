import { useState, useEffect, useCallback } from 'react'

const useHeartRateMonitor = (options = {}) => {
  const [device, setDevice] = useState(null)
  const [heartRate, setHeartRate] = useState(null)
  const [heartRateData, setHeartRateData] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [targetZone, setTargetZone] = useState(options.targetZone || null)

  // Check if Web Bluetooth API is available
  const isBluetoothAvailable = typeof navigator !== 'undefined' && 
                               navigator.bluetooth !== undefined

  // Connect to a heart rate monitor device
  const connectToDevice = useCallback(async () => {
    if (!isBluetoothAvailable) {
      setError('Web Bluetooth API is not available in your browser')
      return false
    }

    try {
      setIsConnecting(true)
      setError(null)

      // Request the device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      })

      // Disconnect event listener
      device.addEventListener('gattserverdisconnected', handleDisconnect)

      // Connect to GATT server
      const server = await device.gatt.connect()

      // Get the heart rate service
      const service = await server.getPrimaryService('heart_rate')

      // Get the heart rate measurement characteristic
      const characteristic = await service.getCharacteristic('heart_rate_measurement')

      // Start notifications
      await characteristic.startNotifications()

      // Set up the notification listener
      characteristic.addEventListener('characteristicvaluechanged', handleHeartRateChange)

      // Update state
      setDevice(device)
      setIsConnected(true)
      setIsConnecting(false)
      return true
    } catch (err) {
      console.error('Error connecting to heart rate monitor:', err)
      setError(err.message || 'Failed to connect to heart rate device')
      setIsConnecting(false)
      return false
    }
  }, [isBluetoothAvailable])

  // Handle heart rate measurement changes
  const handleHeartRateChange = (event) => {
    const dataView = event.target.value
    
    // Heart Rate Measurement is specified in the Bluetooth GATT specification
    // The first byte contains flags including sensor contact status and value format
    const flags = dataView.getUint8(0)
    const rate16Bits = flags & 0x1
    
    // Get heart rate value (either uint8 or uint16 based on the flags)
    let heartRate
    if (rate16Bits) {
      heartRate = dataView.getUint16(1, true) // true = littleEndian
    } else {
      heartRate = dataView.getUint8(1)
    }
    
    // Update heart rate state
    setHeartRate(heartRate)
    
    // Add to historical data
    const timestamp = new Date()
    setHeartRateData(prev => [...prev, { bpm: heartRate, timestamp }])
    
    // Check if user is in target zone and notify if necessary
    if (targetZone && options.onZoneChange) {
      const inZone = heartRate >= targetZone.min && heartRate <= targetZone.max
      options.onZoneChange(inZone, heartRate, targetZone)
    }
  }

  // Handle device disconnection
  const handleDisconnect = () => {
    setIsConnected(false)
    setError('Heart rate monitor disconnected')
  }

  // Disconnect from device
  const disconnect = useCallback(() => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect()
      setIsConnected(false)
      setDevice(null)
      return true
    }
    return false
  }, [device])

  // Set a target heart rate zone
  const setHeartRateZone = (min, max) => {
    setTargetZone({ min, max })
  }

  // Clear heart rate data
  const clearHeartRateData = () => {
    setHeartRateData([])
  }

  // Get average heart rate
  const getAverageHeartRate = () => {
    if (heartRateData.length === 0) return 0
    
    const sum = heartRateData.reduce((acc, data) => acc + data.bpm, 0)
    return Math.round(sum / heartRateData.length)
  }

  // Get maximum heart rate
  const getMaxHeartRate = () => {
    if (heartRateData.length === 0) return 0
    
    return Math.max(...heartRateData.map(data => data.bpm))
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (device && device.gatt.connected) {
        device.gatt.disconnect()
      }
    }
  }, [device])

  return {
    heartRate,
    heartRateData,
    isConnected,
    isConnecting,
    error,
    isBluetoothAvailable,
    connectToDevice,
    disconnect,
    setHeartRateZone,
    clearHeartRateData,
    getAverageHeartRate,
    getMaxHeartRate
  }
}

export default useHeartRateMonitor
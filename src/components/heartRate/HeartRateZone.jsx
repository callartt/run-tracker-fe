import { useEffect, useRef } from 'react'
import { useUser } from '../../context/UserContext'

const HeartRateZone = ({ heartRate, targetZone = null }) => {
  const { user, getHeartRateZone } = useUser()
  const canvasRef = useRef(null)
  
  // Get current heart rate zone
  const currentZone = getHeartRateZone(heartRate)
  
  // Colors for different zones
  const zoneColors = {
    recovery: '#3B82F6', // Blue
    aerobic: '#10B981',  // Green
    tempo: '#FBBF24',    // Yellow
    threshold: '#F97316', // Orange
    anaerobic: '#EF4444', // Red
    unknown: '#9CA3AF'   // Gray
  }
  
  // Draw the heart rate zone visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !heartRate) return
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Get zones from user context
    const zones = user.heartRateZones
    
    // Calculate max for scaling
    const maxHR = user.maxHeartRate || 200
    
    // Draw background zones
    const zoneHeight = height - 10
    const zoneNames = Object.keys(zones)
    
    zoneNames.forEach((zoneName, index) => {
      const zone = zones[zoneName]
      const startX = Math.floor((zone.min / maxHR) * width)
      const endX = Math.floor((zone.max / maxHR) * width)
      const zoneWidth = endX - startX
      
      // Draw zone background
      ctx.fillStyle = `${zoneColors[zoneName]}33` // Add transparency
      ctx.fillRect(startX, 5, zoneWidth, zoneHeight)
      
      // Draw zone borders
      ctx.strokeStyle = `${zoneColors[zoneName]}88`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(startX, 5)
      ctx.lineTo(startX, zoneHeight + 5)
      ctx.stroke()
    })
    
    // Draw current heart rate indicator
    if (heartRate > 0) {
      const hrX = Math.floor((heartRate / maxHR) * width)
      
      // Draw vertical line
      ctx.strokeStyle = zoneColors[currentZone || 'unknown']
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(hrX, 0)
      ctx.lineTo(hrX, height)
      ctx.stroke()
      
      // Draw circle indicator
      ctx.fillStyle = zoneColors[currentZone || 'unknown']
      ctx.beginPath()
      ctx.arc(hrX, height / 2, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    
    // Draw target zone if provided
    if (targetZone) {
      const targetStartX = Math.floor((targetZone.min / maxHR) * width)
      const targetEndX = Math.floor((targetZone.max / maxHR) * width)
      
      // Draw target zone indicator
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      
      // Top line
      ctx.beginPath()
      ctx.moveTo(targetStartX, 2)
      ctx.lineTo(targetEndX, 2)
      ctx.stroke()
      
      // Bottom line
      ctx.beginPath()
      ctx.moveTo(targetStartX, height - 2)
      ctx.lineTo(targetEndX, height - 2)
      ctx.stroke()
      
      ctx.setLineDash([])
    }
  }, [heartRate, currentZone, targetZone, user.heartRateZones, user.maxHeartRate])
  
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>0</span>
        <span>{user.maxHeartRate || 200}</span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-8 rounded"
        width={300} 
        height={30}
      />
      <div className="mt-1 text-center text-sm">
        <span className={`font-medium ${zoneColors[currentZone] ? `text-${currentZone}-500` : 'text-gray-500'}`}>
          {currentZone ? currentZone.charAt(0).toUpperCase() + currentZone.slice(1) : 'Unknown'} Zone
        </span>
      </div>
    </div>
  )
}
export default HeartRateZone
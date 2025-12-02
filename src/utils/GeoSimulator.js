const START_LAT = 50.4501 
const START_LNG = 30.5234

class GeoSimulator {
  constructor() {
    this.intervalId = null
    this.angle = 0
    this.isActive = false
    
    this.radius = 0.0025
    this.baseSpeedKmh = 10
    this.updateInterval = 1000
  }

  start() {
    if (this.isActive) return
    this.isActive = true
    console.log('SIMULATION STARTED')

    this.intervalId = setInterval(() => {
      const randomFluctuation = (Math.random() - 0.5) * 1.6 
      const currentSpeedKmh = this.baseSpeedKmh + randomFluctuation
      
      const step = (currentSpeedKmh * 1000 / 3600) / (this.radius * 111000) * (360 / (2 * Math.PI)) 
      
      this.angle += step
      
      const lat = START_LAT + (this.radius * Math.cos(this.angle * Math.PI / 180))
      const lng = START_LNG + (this.radius * 1.5 * Math.sin(this.angle * Math.PI / 180))

      const mockPosition = {
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: 5,
          altitude: 100 + (Math.random() * 2),
          heading: this.angle,
          speed: currentSpeedKmh / 3.6
        },
        timestamp: Date.now()
      }

      const event = new CustomEvent('geolocation-simulate', { 
        detail: mockPosition 
      })
      window.dispatchEvent(event)

    }, this.updateInterval)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isActive = false
    console.log('SIMULATION STOPPED')
  }

  toggle() {
    if (this.isActive) {
      this.stop()
      return false
    } else {
      this.start()
      return true
    }
  }
}

const geoSimulatorInstance = new GeoSimulator()

export default geoSimulatorInstance
// Simulation routes in Kyiv
const ROUTES = {
  KHRESHCHATYK_PEIZAZHNA: {
    name: 'Khreshchatyk - Peizazhna Aleya',
    path: [
      { lat: 50.442601795194236, lng: 30.5201383312014 },
      { lat: 50.44494900814769, lng: 30.520896482032448 },
      { lat: 50.44610238553621, lng: 30.513555309336578 },
      { lat: 50.44839058324258, lng: 30.51419997231882 },
      { lat: 50.448716541586585, lng: 30.51235005824927 },
      { lat: 50.4492510231102, lng: 30.512513870195303 },
      { lat: 50.44931418598067, lng: 30.512148774919297 },
      { lat: 50.45212075106863, lng: 30.508549050380285 },
      { lat: 50.45277449439065, lng: 30.509447094480745 },
      { lat: 50.454037271951066, lng: 30.511095376918963 },
      { lat: 50.45531707970836, lng: 30.511591201796953 },
      { lat: 50.4557550504094, lng: 30.511644804491112 },
      { lat: 50.45625859973631, lng: 30.511495172277403 },
      { lat: 50.456415748705815, lng: 30.512179519340208 },
    ]
  },
  MAIDAN_KONTRACTOVA: {
    name: 'Maidan Nezalezhnosti - Kontractova',
    path: [
      { lat: 50.45036652557739, lng: 30.52399312452294 },
      { lat: 50.45301761495805, lng: 30.527694938058588 },
      { lat: 50.454381836360426, lng: 30.527500525603475 },
      { lat: 50.45595749935229, lng: 30.528004405268167 },
      { lat: 50.4575987152932, lng: 30.526785856820048 },
      { lat: 50.46115287870685, lng: 30.52163725662364 },
      { lat: 50.46291509846378, lng: 30.51901517693397 },
      { lat: 50.46348068720411, lng: 30.519484567323723 },
    ]
  },
  KONTRACTOVA_PARKOVYI_MIST: {
    name: 'Kontractova - Parkovyi Mist',
    path: [
      { lat: 50.46369970384063, lng: 30.519325714145452 },
      { lat: 50.462893036365905, lng: 30.519017177382644 },
      { lat: 50.45905359066983, lng: 30.524667016954925 },
      { lat: 50.4591804253323, lng: 30.52494396413249 },
      { lat: 50.45882410682564, lng: 30.52542304409286 },
      { lat: 50.459035331348396, lng: 30.526688523985683 },
      { lat: 50.45863344317211, lng: 30.527096648591485 },
      { lat: 50.458738712971574, lng: 30.5276096822773 },
      { lat: 50.45784233411939, lng: 30.5283977069594 },
      { lat: 50.457748869700254, lng: 30.528432940738316 },
      { lat: 50.456247452313306, lng: 30.531105670547657 },
      { lat: 50.45561107283065, lng: 30.532492715064066 },
      { lat: 50.45537637797396, lng: 30.53212435037414 },
      { lat: 50.455067194361746, lng: 30.53180774667679 },
      { lat: 50.45486107083095, lng: 30.53232431060404 },
      { lat: 50.45485803959586, lng: 30.532319549646182 },
      { lat: 50.45690326216931, lng: 30.534428012872404 },
    ]
  }
}

class GeoSimulator {
  constructor() {
    this.intervalId = null
    this.isActive = false

    this.currentPointIndex = 0
    this.currentLat = null
    this.currentLng = null

    // Load from localStorage or use defaults
    const savedRoute = localStorage.getItem('simulation_route')
    const savedSpeed = localStorage.getItem('simulation_speed')

    this.selectedRoute = savedRoute && ROUTES[savedRoute] ? savedRoute : 'KHRESHCHATYK_PEIZAZHNA'
    this.baseSpeedKmh = savedSpeed ? Number(savedSpeed) : 10
    this.updateInterval = 1000
  }

  // Configure simulation before starting
  configure(routeKey, speedKmh) {
    // Allow speed updates anytime
    if (speedKmh && speedKmh > 0) {
      this.baseSpeedKmh = speedKmh
    }

    // Only allow route updates when not active to avoid jumps
    if (this.isActive) {
      if (routeKey && routeKey !== this.selectedRoute) {
        console.warn('Cannot change route while simulation is running')
      }
      return true
    }

    if (routeKey && ROUTES[routeKey]) {
      this.selectedRoute = routeKey
    }

    return true
  }

  // Get available routes
  getRoutes() {
    return Object.keys(ROUTES).map(key => ({
      key,
      name: ROUTES[key].name
    }))
  }

  start() {
    if (this.isActive) return

    const route = ROUTES[this.selectedRoute]
    if (!route || !route.path || route.path.length === 0) {
      console.error('Invalid route selected')
      return
    }

    this.isActive = true
    this.currentPointIndex = 0
    this.currentLat = route.path[0].lat
    this.currentLng = route.path[0].lng
    console.log(`SIMULATION STARTED: ${route.name} at ${this.baseSpeedKmh} km/h`)

    this.intervalId = setInterval(() => {
      const route = ROUTES[this.selectedRoute]

      // Random speed fluctuation for realism
      const randomFluctuation = (Math.random() - 0.5) * 1.6
      const currentSpeedKmh = this.baseSpeedKmh + randomFluctuation
      const currentSpeedMs = currentSpeedKmh / 3.6 // Convert to m/s

      // Check if we've reached the end
      if (this.currentPointIndex >= route.path.length - 1) {
        // Stop simulation at the end instead of looping
        console.log('SIMULATION: Reached end of route, stopping')
        this.stop()
        return
      }

      const targetPoint = route.path[this.currentPointIndex + 1]

      // Calculate distance to target point (in meters, approximate)
      const latDiff = targetPoint.lat - this.currentLat
      const lngDiff = targetPoint.lng - this.currentLng
      const distance = Math.sqrt(
        Math.pow(latDiff * 111000, 2) +
        Math.pow(lngDiff * 111000 * Math.cos(this.currentLat * Math.PI / 180), 2)
      )

      // Calculate how far we move in this update (distance = speed * time)
      const moveDistance = currentSpeedMs * (this.updateInterval / 1000)

      if (moveDistance >= distance) {
        // We've reached the target point, move to it and advance to next
        this.currentLat = targetPoint.lat
        this.currentLng = targetPoint.lng
        this.currentPointIndex++
      } else {
        // Move towards target point
        const ratio = moveDistance / distance
        this.currentLat += latDiff * ratio
        this.currentLng += lngDiff * ratio
      }

      // Calculate heading (bearing) to target
      const heading = Math.atan2(lngDiff, latDiff) * (180 / Math.PI)

      const mockPosition = {
        coords: {
          latitude: this.currentLat,
          longitude: this.currentLng,
          accuracy: 5,
          altitude: 100 + (Math.random() * 2),
          heading: heading >= 0 ? heading : heading + 360,
          speed: currentSpeedMs
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
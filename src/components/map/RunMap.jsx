import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useUser } from '../../context/UserContext'
import { calculateDistance } from '../../utils/calculations'

const defaultMapSettings = {
  center: [50.4501, 30.5234],
  zoom: 16,
}

const getCoords = (point) => {
  if (!point) return null
  if (Array.isArray(point) && point.length >= 2) return { lat: point[0], lng: point[1] }
  if (typeof point.lat === 'number') return { lat: point.lat, lng: point.lng }
  if (typeof point.latitude === 'number') return { lat: point.latitude, lng: point.longitude }
  return null
}

const RunMap = ({ 
  route = [], 
  currentPosition = null, 
  isActive = false,
  followPosition = true,
  showMarkers = true,
  mapHeight = 'h-64',
}) => {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const routeLayerRef = useRef(null)
  const markersLayerRef = useRef(null)
  const positionMarkerRef = useRef(null)
  const { user } = useUser()

  useEffect(() => {
    if (!mapRef.current) return

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, { 
        ...defaultMapSettings, 
        zoomControl: false, 
        attributionControl: false 
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMapRef.current)

      routeLayerRef.current = L.layerGroup().addTo(leafletMapRef.current)
      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current)
    }

    if (currentPosition && !isActive) {
      const c = getCoords(currentPosition)
      if (c) {
        leafletMapRef.current.setView([c.lat, c.lng], defaultMapSettings.zoom)
      }
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!leafletMapRef.current || !routeLayerRef.current) return

    routeLayerRef.current.clearLayers()

    if (route && route.length > 0) {
      const validPoints = route.map(p => getCoords(p)).filter(p => p !== null)
      if (validPoints.length === 0) return

      const segments = []
      let currentSegment = []

      for (let i = 0; i < validPoints.length; i++) {
        const point = validPoints[i]

        if (currentSegment.length === 0) {
          currentSegment.push([point.lat, point.lng])
          continue
        }

        const last = currentSegment[currentSegment.length - 1]
        const dist = calculateDistance(last[0], last[1], point.lat, point.lng)

        if (dist > 1000) {
          if (currentSegment.length > 1) segments.push(currentSegment)
          currentSegment = [[point.lat, point.lng]]
        } else {
          currentSegment.push([point.lat, point.lng])
        }
      }
      if (currentSegment.length > 1) segments.push(currentSegment)

      if (segments.length > 0) {
        L.polyline(segments, { 
          color: user.theme === 'dark' ? '#3B82F6' : '#2563EB', 
          weight: 5,
          opacity: 0.8,
          lineCap: 'round'
        }).addTo(routeLayerRef.current)

        if (!isActive) {
          const allPoints = validPoints.map(p => [p.lat, p.lng])
          if (allPoints.length > 1) {
            leafletMapRef.current.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] })
          }
        }
      }

      if (showMarkers && markersLayerRef.current) {
        markersLayerRef.current.clearLayers()
        if (validPoints.length > 0) {
          L.circleMarker([validPoints[0].lat, validPoints[0].lng], {
            radius: 6, color: 'white', fillColor: '#10B981', fillOpacity: 1, weight: 2
          }).addTo(markersLayerRef.current)

          if (!isActive) {
            const last = validPoints[validPoints.length - 1]
            L.circleMarker([last.lat, last.lng], {
              radius: 6, color: 'white', fillColor: '#EF4444', fillOpacity: 1, weight: 2
            }).addTo(markersLayerRef.current)
          }
        }
      }
    }
  }, [route, isActive, showMarkers, user.theme])

  useEffect(() => {
    if (!leafletMapRef.current || !currentPosition) return

    const c = getCoords(currentPosition)
    if (!c) return

    if (!positionMarkerRef.current) {
      positionMarkerRef.current = L.circleMarker([c.lat, c.lng], {
        radius: 8,
        fillColor: '#3B82F6',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(leafletMapRef.current)
    } else {
      positionMarkerRef.current.setLatLng([c.lat, c.lng])
    }

    if (isActive && followPosition) {
      leafletMapRef.current.panTo([c.lat, c.lng], { animate: true, duration: 1 })
    }
  }, [currentPosition, isActive, followPosition])

  return (
    <div className={`w-full ${mapHeight} rounded-xl overflow-hidden shadow-inner my-2 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 relative z-0`}>
      <div ref={mapRef} className="h-full w-full" style={{ minHeight: '100%' }} />
    </div>
  )
}

export default RunMap
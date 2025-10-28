// RunMap.jsx
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useUser } from '../../context/UserContext'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const defaultMapSettings = {
  center: [51.505, -0.09],
  zoom: 16,
  maxZoom: 19,
  minZoom: 3
}

const RunMap = ({ 
  route = [], 
  currentPosition = null, 
  isActive = false,
  followPosition = true,
  showMarkers = true,
  mapHeight = 'h-64',
  onPositionClick = null
}) => {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const routeLayerRef = useRef(null)
  const markersLayerRef = useRef(null)
  const positionMarkerRef = useRef(null)
  const startPositionRef = useRef(null)
  const { user } = useUser()

  useEffect(() => {
    if (!mapRef.current) return

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, {
        ...defaultMapSettings,
        zoomControl: false,
        attributionControl: false
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMapRef.current)

      L.control.zoom({ position: 'topright' }).addTo(leafletMapRef.current)
      L.control.attribution({ position: 'bottomright' }).addTo(leafletMapRef.current)

      routeLayerRef.current = L.layerGroup().addTo(leafletMapRef.current)
      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current)
    }

    if (currentPosition) {
      const { latitude, longitude } = currentPosition
      leafletMapRef.current.setView([latitude, longitude], defaultMapSettings.zoom)
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        routeLayerRef.current = null
        markersLayerRef.current = null
        positionMarkerRef.current = null
        startPositionRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!leafletMapRef.current || !routeLayerRef.current) return

    routeLayerRef.current.eachLayer(layer => {
      if (layer instanceof L.Polyline && !(layer instanceof L.Circle)) {
        routeLayerRef.current.removeLayer(layer)
      }
    })

    if (route.length > 0) {
      console.log(`Drawing route with ${route.length} points`)
      const points = route
        .filter(point => point && typeof point.latitude === 'number' && typeof point.longitude === 'number')
        .map(point => [point.latitude, point.longitude]);

      console.log("📍 Drawing polyline with points:", points)

      if (!startPositionRef.current && route.length > 0) {
        startPositionRef.current = [route[0].latitude, route[0].longitude]
      }

      const routeLine = L.polyline(points, {
        color: user.theme === 'dark' ? '#3B82F6' : '#2563EB',
        weight: 4,
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(routeLayerRef.current)

      if (showMarkers && markersLayerRef.current) {
        markersLayerRef.current.clearLayers()

        const startPoint = startPositionRef.current
        if (startPoint) {
          const startIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="marker-pin bg-green-500 rounded-full w-4 h-4 border-2 border-white shadow-md"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })

          L.marker(startPoint, { icon: startIcon })
            .addTo(markersLayerRef.current)
            .bindTooltip('Start', { permanent: false, direction: 'top' })
        }

        if (!isActive && points.length > 1) {
          const endPoint = points[points.length - 1]
          const endIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="marker-pin bg-red-500 rounded-full w-4 h-4 border-2 border-white shadow-md"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })

          L.marker(endPoint, { icon: endIcon })
            .addTo(markersLayerRef.current)
            .bindTooltip('End', { permanent: false, direction: 'top' })
        }
      }

      if ((!isActive && route.length > 5) || route.length < 3) {
        try {
          leafletMapRef.current.fitBounds(routeLine.getBounds(), {
            padding: [50, 50],
            maxZoom: 18
          })
        } catch (err) {
          console.error("Error fitting bounds:", err)
        }
      }
    }
  }, [route, isActive, showMarkers, user.theme])

  useEffect(() => {
    if (!leafletMapRef.current || !currentPosition) return

    const { latitude, longitude, accuracy } = currentPosition

    if (!positionMarkerRef.current) {
      positionMarkerRef.current = L.circleMarker([latitude, longitude], {
        radius: 8,
        fillColor: '#3B82F6',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(leafletMapRef.current)

      if (accuracy) {
        positionMarkerRef.current.accuracyCircle = L.circle([latitude, longitude], {
          radius: accuracy,
          weight: 1,
          color: '#3B82F6',
          fillColor: '#93C5FD',
          fillOpacity: 0.15
        }).addTo(leafletMapRef.current)
      }
    } else {
      positionMarkerRef.current.setLatLng([latitude, longitude])
      if (positionMarkerRef.current.accuracyCircle && accuracy) {
        positionMarkerRef.current.accuracyCircle.setLatLng([latitude, longitude])
        positionMarkerRef.current.accuracyCircle.setRadius(accuracy)
      }
    }

    if (isActive && followPosition) {
      leafletMapRef.current.setView([latitude, longitude], leafletMapRef.current.getZoom())
    }
  }, [currentPosition, isActive, followPosition])

  useEffect(() => {
    if (!leafletMapRef.current || !onPositionClick) return

    const handleMapClick = (e) => {
      onPositionClick({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    }

    leafletMapRef.current.on('click', handleMapClick)

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.off('click', handleMapClick)
      }
    }
  }, [onPositionClick])

  return (
    <div className={`w-full ${mapHeight} rounded-lg overflow-hidden shadow-md my-2`}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}

export default RunMap;

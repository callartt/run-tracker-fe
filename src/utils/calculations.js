export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export const calculatePace = (speedMps) => {
  if (!speedMps || speedMps <= 0) return '--:--'

  const minsPerUnit = 16.6667 / speedMps

  const mins = Math.floor(minsPerUnit)
  const secs = Math.floor((minsPerUnit - mins) * 60)

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const calculateCalories = (weightKg, durationMins, avgHeartRate, gender, age) => {
  if (!weightKg || !durationMins || !avgHeartRate) return 0

  const weight = weightKg || 70
  const hr = avgHeartRate || 130
  const userAge = age || 30

  let calories

  if (gender === 'female') {
    calories = ((0.4472 * hr) - (0.1263 * weight) + (0.074 * userAge) - 20.4022) * (durationMins / 4.184)
  } else {
    calories = ((0.6309 * hr) + (0.1988 * weight) + (0.2017 * userAge) - 55.0969) * (durationMins / 4.184)
  }

  return Math.max(0, Math.round(calories))
}

export const formatDistance = (kilometers) => {
  if (kilometers === undefined || kilometers === null) return '0'

  if (kilometers < 1) {
    return `${(kilometers * 1000).toFixed(0)} m`
  } else {
    return `${kilometers.toFixed(2)} km`
  }
}

export const formatDuration = (seconds) => {
  if (!seconds) return '00:00'

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}
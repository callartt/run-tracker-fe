/**
 * Calculate distance between two points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
  
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
             Math.cos(φ1) * Math.cos(φ2) *
             Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // Distance in meters
  };
  
  /**
   * Calculate pace from speed
   * @param {number} speedMps - Speed in meters per second
   * @param {string} units - 'metric' (min/km) or 'imperial' (min/mile)
   * @returns {string} Pace in min:sec per km or mile
   */
  export const calculatePace = (speedMps, units = 'metric') => {
    if (!speedMps || speedMps <= 0) return '--:--';
    
    // Convert speed to minutes per unit distance
    const minsPerUnit = units === 'metric' 
      ? 16.6667 / speedMps  // mins per km (1000m / speed in m/s / 60)
      : 26.8224 / speedMps; // mins per mile (1609.34m / speed in m/s / 60)
    
    // Convert to minutes and seconds
    const mins = Math.floor(minsPerUnit);
    const secs = Math.floor((minsPerUnit - mins) * 60);
    
    // Format as mm:ss
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  /**
   * Calculate calories burned during a workout
   * @param {number} weightKg - Weight in kilograms
   * @param {number} durationMins - Duration in minutes
   * @param {number} avgHeartRate - Average heart rate in BPM
   * @param {string} gender - 'male' or 'female'
   * @param {number} age - Age in years
   * @returns {number} Calories burned
   */
  export const calculateCalories = (weightKg, durationMins, avgHeartRate, gender, age) => {
    if (!weightKg || !durationMins || !avgHeartRate) return 0;
    
    // Default to average values if not provided
    const weight = weightKg || 70;
    const hr = avgHeartRate || 130;
    const userAge = age || 30;
    
    // Calories calculation based on heart rate
    // Using gender-specific formula
    let calories;
    
    if (gender === 'female') {
      calories = ((0.4472 * hr) - (0.1263 * weight) + (0.074 * userAge) - 20.4022) * (durationMins / 4.184);
    } else {
      calories = ((0.6309 * hr) + (0.1988 * weight) + (0.2017 * userAge) - 55.0969) * (durationMins / 4.184);
    }
    
    return Math.max(0, Math.round(calories));
  };
  
  /**
   * Convert meters to a human-readable distance
   * @param {number} meters - Distance in meters
   * @param {string} units - 'metric' or 'imperial'
   * @returns {string} Formatted distance string
   */
  export const formatDistance = (meters, units = 'metric') => {
    if (meters === undefined || meters === null) return '0';
    
    if (units === 'metric') {
      if (meters < 1000) {
        return `${meters.toFixed(0)} m`;
      } else {
        return `${(meters / 1000).toFixed(2)} km`;
      }
    } else {
      const feet = meters * 3.28084;
      if (feet < 1000) {
        return `${feet.toFixed(0)} ft`;
      } else {
        const miles = meters / 1609.34;
        return `${miles.toFixed(2)} mi`;
      }
    }
  };
  
  /**
   * Format seconds to a human-readable duration
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string (hh:mm:ss or mm:ss)
   */
  export const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };
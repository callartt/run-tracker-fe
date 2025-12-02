// src/components/sharing/WorkoutImageGenerator.jsx
import React, { useRef, useEffect, useState } from 'react';
import { formatDistance, formatDuration, calculatePace } from '../../utils/calculations';

const WorkoutImageGenerator = ({ workout, user, onImageGenerated }) => {
  const canvasRef = useRef(null);
  const mapImageRef = useRef(null);
  const [mapImageLoaded, setMapImageLoaded] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!mapImageLoaded) {
        console.log("Map image loading timed out");
        setMapImageLoaded(true); // Force continue even without map
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [mapImageLoaded]);

  useEffect(() => {
    // We need to load the map as an image first
    if (workout && workout.route && workout.route.length > 0) {
      // Get the map URL - in a real app, this would be a snapshot of your route map
      // For now, we'll use a placeholder map image
      const bounds = getBounds(workout.route);
      const mapUrl = getStaticMapUrl(bounds, workout.route);
      
      const img = new Image();
      img.crossOrigin = "Anonymous"; // This allows us to draw the image to canvas
      img.onload = () => {
        mapImageRef.current = img;
        setMapImageLoaded(true);
      };
      img.onerror = (err) => {
        console.error("Error loading map image:", err);
        setMapImageLoaded(true); // Continue without map
      };
      img.src = mapUrl;
    } else {
      // If no route, we still want to generate an image
      setMapImageLoaded(true);
    }
  }, [workout]);

  useEffect(() => {
    if (mapImageLoaded) {
      generateImage();
    }
  }, [mapImageLoaded]);

  // Calculate bounds of the route for the map
  const getBounds = (route) => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    
    route.forEach(point => {
      const lat = point.lat || point.latitude;
      const lng = point.lng || point.longitude;
      
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
    
    // Add some padding
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;
    
    return {
      south: minLat - latPadding,
      north: maxLat + latPadding,
      west: minLng - lngPadding,
      east: maxLng + lngPadding
    };
  };

  // Replace the existing getStaticMapUrl function with this:
  const getStaticMapUrl = (bounds, route) => {
    // If no route data, return a default map
    if (!route || route.length === 0) {
      return 'https://via.placeholder.com/600x300/EAEAEA/999999?text=No+Route+Data';
    }
    
    // Instead of using OpenStreetMap's static API (which might be unreliable),
    // use a placeholder image for testing
    return 'https://via.placeholder.com/600x300/EAEAEA/999999?text=Route+Map';
    
    // In a production app, you would use a stable API like MapBox or Google Maps:
    // return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/...?access_token=YOUR_TOKEN`;
  };

  const generateImage = async () => {
    if (generatingImage) return;
    setGeneratingImage(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas not available");
        onImageGenerated(null);
        setGeneratingImage(false);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Canvas context not available");
        onImageGenerated(null);
        setGeneratingImage(false);
        return;
      }
      
      // Set canvas dimensions
      canvas.width = 1200;
      canvas.height = 630;
      
      // Background
      ctx.fillStyle = user?.theme === 'dark' ? '#1F2937' : '#F9FAFB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw border
      ctx.strokeStyle = user?.theme === 'dark' ? '#374151' : '#E5E7EB';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // App name and logo
      ctx.fillStyle = user?.theme === 'dark' ? '#FFFFFF' : '#111827';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('RunTracker', 50, 80);
      
      // Workout name
      const workoutName = workout.name || `Run on ${new Date(workout.startTime).toLocaleDateString()}`;
      ctx.fillStyle = user?.theme === 'dark' ? '#FFFFFF' : '#111827';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(workoutName, 50, 150);
      
      // Date
      ctx.fillStyle = user?.theme === 'dark' ? '#9CA3AF' : '#6B7280';
      ctx.font = '24px Arial';
      ctx.fillText(new Date(workout.startTime).toLocaleString(), 50, 190);
      
      // Draw map if available
      if (mapImageRef.current) {
        try {
          ctx.drawImage(mapImageRef.current, 50, 220, 700, 350);
        } catch (error) {
          console.error("Error drawing map image:", error);
          // Draw placeholder if map fails
          ctx.fillStyle = user?.theme === 'dark' ? '#374151' : '#E5E7EB';
          ctx.fillRect(50, 220, 700, 350);
          ctx.fillStyle = user?.theme === 'dark' ? '#6B7280' : '#9CA3AF';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Map unavailable', 400, 390);
          ctx.textAlign = 'left';
        }
      } else {
        // Placeholder if no map
        ctx.fillStyle = user?.theme === 'dark' ? '#374151' : '#E5E7EB';
        ctx.fillRect(50, 220, 700, 350);
        ctx.fillStyle = user?.theme === 'dark' ? '#6B7280' : '#9CA3AF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No route data available', 400, 390);
        ctx.textAlign = 'left';
      }
      
      // Stats section
      const statsX = 800;
      const statsY = 240;
      const statsSpacing = 100;
      
      // Distance
      ctx.fillStyle = '#3B82F6'; // Blue for distance
      ctx.font = '36px Arial';
      ctx.fillText('📍', statsX, statsY); // Using emoji as fallback for Font Awesome
      
      ctx.fillStyle = user?.theme === 'dark' ? '#FFFFFF' : '#111827';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(formatDistance(workout.distance, user?.units || 'metric'), statsX + 60, statsY);
      
      ctx.fillStyle = user?.theme === 'dark' ? '#9CA3AF' : '#6B7280';
      ctx.font = '24px Arial';
      ctx.fillText('Distance', statsX + 60, statsY + 30);
      
      // Duration
      ctx.fillStyle = '#3B82F6'; // Blue for time
      ctx.font = '36px Arial';
      ctx.fillText('⏱️', statsX, statsY + statsSpacing); // Using emoji as fallback
      
      ctx.fillStyle = user?.theme === 'dark' ? '#FFFFFF' : '#111827';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(formatDuration(workout.duration), statsX + 60, statsY + statsSpacing);
      
      ctx.fillStyle = user?.theme === 'dark' ? '#9CA3AF' : '#6B7280';
      ctx.font = '24px Arial';
      ctx.fillText('Duration', statsX + 60, statsY + statsSpacing + 30);
      
      // Pace
      ctx.fillStyle = '#3B82F6'; // Blue for pace
      ctx.font = '36px Arial';
      ctx.fillText('🏃', statsX, statsY + statsSpacing * 2); // Using emoji as fallback
      
      const averageSpeed = workout.distance > 0 && workout.duration > 0
        ? workout.distance / workout.duration
        : 0;
      
      const pace = calculatePace(averageSpeed, user?.units || 'metric');
      
      ctx.fillStyle = user?.theme === 'dark' ? '#FFFFFF' : '#111827';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(pace, statsX + 60, statsY + statsSpacing * 2);
      
      ctx.fillStyle = user?.theme === 'dark' ? '#9CA3AF' : '#6B7280';
      ctx.font = '24px Arial';
      ctx.fillText('Pace', statsX + 60, statsY + statsSpacing * 2 + 30);
      
      // Footer with app URL
      ctx.fillStyle = user?.theme === 'dark' ? '#9CA3AF' : '#6B7280';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Track your runs with RunTracker', canvas.width / 2, canvas.height - 30);
      
      // Generate image data URL
      try {
        const imageData = canvas.toDataURL('image/png');
        onImageGenerated(imageData);
      } catch (error) {
        console.error('Error generating image:', error);
        onImageGenerated(null);
      }
    } catch (error) {
      console.error("Error in image generation:", error);
      onImageGenerated(null);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="hidden">
      <canvas ref={canvasRef} width="1200" height="630"></canvas>
    </div>
  );
};

export default WorkoutImageGenerator;
// src/components/debug/RouteDebug.jsx
import React from 'react';

const RouteDebug = ({ position, route, isTracking }) => {
  // Only show the last 5 points to keep it compact
  const lastPoints = route.slice(-5);
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3 text-xs">
      <h3 className="font-bold flex items-center mb-2">
        <span className="text-primary mr-1">🐞</span> Route Debug
      </h3>
      
      <div className="space-y-2">
        <div>
          <p className="font-medium">Status: 
            <span className={`ml-1 ${isTracking ? 'text-green-500' : 'text-red-500'}`}>
              {isTracking ? 'Tracking Active' : 'Not Tracking'}
            </span>
          </p>
          <p>Total Points: <strong>{route.length}</strong></p>
        </div>
        
        {position && (
          <div>
            <p className="font-medium">Current Position:</p>
            <div className="grid grid-cols-3 gap-1">
              <div>Lat: <strong>{position.latitude.toFixed(6)}</strong></div>
              <div>Lng: <strong>{position.longitude.toFixed(6)}</strong></div>
              <div>Acc: <strong>{position.accuracy ? `${Math.round(position.accuracy)}m` : 'N/A'}</strong></div>
            </div>
          </div>
        )}
        
        {lastPoints.length > 0 && (
          <div>
            <p className="font-medium">Last {lastPoints.length} Route Points:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left pr-2">#</th>
                    <th className="text-left pr-2">Latitude</th>
                    <th className="text-left pr-2">Longitude</th>
                    <th className="text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {lastPoints.map((point, index) => {
                    // Calculate the actual index in the full route
                    const actualIndex = route.length - lastPoints.length + index;
                    
                    // Format timestamp if available
                    let timeString = 'N/A';
                    if (point.timestamp) {
                      const date = new Date(point.timestamp);
                      timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    }
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="pr-2">{actualIndex}</td>
                        <td className="pr-2">{point.latitude.toFixed(6)}</td>
                        <td className="pr-2">{point.longitude.toFixed(6)}</td>
                        <td>{timeString}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteDebug;
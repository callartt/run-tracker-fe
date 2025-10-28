// src/components/sharing/SocialShare.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaShareAlt, 
  FaTwitter, 
  FaFacebook, 
  FaWhatsapp, 
  FaLink,
  FaTimes,
  FaCheck,
  FaImage,
  FaSpinner,
  FaDownload
} from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import WorkoutImageGenerator from './WorkoutImageGenerator';

const SocialShare = ({ workout, onClose }) => {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [workoutImage, setWorkoutImage] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('link'); // Default to link tab which is more reliable

  // Handle workout image generated
  const handleImageGenerated = (imageData) => {
    setWorkoutImage(imageData);
    setGeneratingImage(false);
  };

  // Generate share text
  const getShareText = () => {
    const distance = workout.distance ? 
      `${(workout.distance / 1000).toFixed(2)} km` : 
      '0 km';
    
    const duration = workout.duration ? 
      formatDuration(workout.duration) : 
      '00:00';
    
    const name = workout.name || 
      `Run on ${new Date(workout.startTime).toLocaleDateString()}`;
    
    return `I just completed ${name} with RunTracker! ${distance} in ${duration}. Check out my progress! #RunTracker #Fitness`;
  };

  // Format duration (seconds to MM:SS or HH:MM:SS)
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate share URL
  const getShareUrl = () => {
    // In a real app, this would be a link to your sharing endpoint
    // For now, we'll use a dummy URL
    return `https://runtracker.app/share/${workout.id || 'demo'}`;
  };

  // Handle share to Twitter
  const shareToTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    
    showSuccess('Shared to Twitter!');
  };

  // Handle share to Facebook
  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    
    showSuccess('Shared to Facebook!');
  };

  // Handle share to WhatsApp
  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()} ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    
    showSuccess('Shared to WhatsApp!');
  };

  // Handle native sharing (for mobile devices) - simplified version
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        // Simple sharing without files to avoid errors
        await navigator.share({
          title: 'My RunTracker Workout',
          text: getShareText(),
          url: getShareUrl(),
        });
        showSuccess('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback for desktop
      copyToClipboard();
    }
  };

  // Copy share link to clipboard
  const copyToClipboard = () => {
    const shareText = `${getShareText()} ${getShareUrl()}`;
    navigator.clipboard.writeText(shareText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showSuccess('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Download workout image
  const downloadImage = () => {
    if (!workoutImage) return;
    
    try {
      const a = document.createElement('a');
      a.href = workoutImage;
      a.download = `runtracker-workout-${workout.id || 'share'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showSuccess('Image downloaded!');
    } catch (error) {
      console.error('Error downloading image:', error);
      showSuccess('Failed to download image', false);
    }
  };

  // Show success message
  const showSuccess = (message, isSuccess = true) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2000);
  };

  // Load image generator when image tab is active
  useEffect(() => {
    if (activeTab === 'image' && !workoutImage && !generatingImage) {
      setGeneratingImage(true);
    }
  }, [activeTab, workoutImage]);
  
  // Add timeout to prevent infinite loading state
  useEffect(() => {
    let timeoutId;
    
    if (generatingImage) {
      timeoutId = setTimeout(() => {
        if (generatingImage) {
          setGeneratingImage(false);
          console.log("Image generation timed out");
        }
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [generatingImage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md mx-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Share Your Run</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center py-2 px-4 ${activeTab === 'link' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500'}`}
          >
            <FaLink className="mr-2" />
            <span>Link</span>
          </button>
          
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center py-2 px-4 ${activeTab === 'image' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500'}`}
          >
            <FaImage className="mr-2" />
            <span>Image</span>
          </button>
        </div>
        
        {/* Link Sharing Tab */}
        {activeTab === 'link' && (
          <>
            {/* Share Preview */}
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4">
              <p className="text-sm">{getShareText()}</p>
            </div>
            
            {/* Share Options */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {/* Native Share Button */}
              <button 
                onClick={nativeShare}
                className="flex flex-col items-center justify-center p-3 bg-primary text-white rounded-lg"
              >
                <FaShareAlt className="text-xl mb-1" />
                <span className="text-xs">Share</span>
              </button>
              
              {/* Twitter */}
              <button 
                onClick={shareToTwitter}
                className="flex flex-col items-center justify-center p-3 bg-blue-400 text-white rounded-lg"
              >
                <FaTwitter className="text-xl mb-1" />
                <span className="text-xs">Twitter</span>
              </button>
              
              {/* Facebook */}
              <button 
                onClick={shareToFacebook}
                className="flex flex-col items-center justify-center p-3 bg-blue-600 text-white rounded-lg"
              >
                <FaFacebook className="text-xl mb-1" />
                <span className="text-xs">Facebook</span>
              </button>
              
              {/* WhatsApp */}
              <button 
                onClick={shareToWhatsApp}
                className="flex flex-col items-center justify-center p-3 bg-green-500 text-white rounded-lg"
              >
                <FaWhatsapp className="text-xl mb-1" />
                <span className="text-xs">WhatsApp</span>
              </button>
            </div>
            
            {/* Copy Link */}
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={getShareUrl()}
                readOnly
                className="input flex-grow mr-2 text-sm bg-gray-100 dark:bg-gray-700"
              />
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg ${copied ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                {copied ? <FaCheck /> : <FaLink />}
              </button>
            </div>
          </>
        )}
        
        {/* Image Sharing Tab */}
        {activeTab === 'image' && (
          <div>
            {/* Generate workout image only when image tab is active */}
            {!workoutImage && generatingImage && (
              <WorkoutImageGenerator 
                workout={workout} 
                user={user} 
                onImageGenerated={handleImageGenerated} 
              />
            )}
            
            {generatingImage ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FaSpinner className="animate-spin text-3xl text-primary mb-4" />
                <p>Generating shareable image...</p>
              </div>
            ) : workoutImage ? (
              <div className="space-y-4">
                {/* Preview */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={workoutImage} 
                    alt="Workout Summary" 
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Download button */}
                <button
                  onClick={downloadImage}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <FaDownload className="mr-2" />
                  Download Image
                </button>
                
                {/* Share options */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Native Share Button */}
                  <button 
                    onClick={nativeShare}
                    className="flex flex-col items-center justify-center p-3 bg-primary text-white rounded-lg"
                  >
                    <FaShareAlt className="text-xl mb-1" />
                    <span className="text-xs">Share</span>
                  </button>
                  
                  {/* Twitter */}
                  <button 
                    onClick={shareToTwitter}
                    className="flex flex-col items-center justify-center p-3 bg-blue-400 text-white rounded-lg"
                  >
                    <FaTwitter className="text-xl mb-1" />
                    <span className="text-xs">Twitter</span>
                  </button>
                  
                  {/* Facebook */}
                  <button 
                    onClick={shareToFacebook}
                    className="flex flex-col items-center justify-center p-3 bg-blue-600 text-white rounded-lg"
                  >
                    <FaFacebook className="text-xl mb-1" />
                    <span className="text-xs">Facebook</span>
                  </button>
                  
                  {/* WhatsApp */}
                  <button 
                    onClick={shareToWhatsApp}
                    className="flex flex-col items-center justify-center p-3 bg-green-500 text-white rounded-lg"
                  >
                    <FaWhatsapp className="text-xl mb-1" />
                    <span className="text-xs">WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p>Couldn't generate image. Please try again or use link sharing instead.</p>
                <button
                  onClick={() => {
                    setGeneratingImage(true);
                  }}
                  className="btn-primary mt-3"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mt-3 py-2 px-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-lg text-center">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialShare;
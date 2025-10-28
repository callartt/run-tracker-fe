import { FaBluetooth, FaCheck, FaSpinner, FaTimes } from 'react-icons/fa'

const ConnectDevice = ({ 
  onClose, 
  onConnect,
  onDisconnect,
  isConnected = false,
  isConnecting = false,
  error = null
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 w-full max-w-xs mx-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Heart Rate Monitor</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <FaBluetooth className="text-blue-500 text-4xl" />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {isConnected 
              ? 'Heart rate monitor connected!'
              : 'Connect to a Bluetooth heart rate monitor to track your heart rate during your run.'}
          </p>
          
          {error && (
            <div className="text-red-500 text-sm mb-4 p-2 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          {isConnected ? (
            <button
              onClick={onDisconnect}
              className="btn bg-red-500 hover:bg-red-600 text-white flex items-center justify-center space-x-2"
            >
              <FaTimes />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <FaBluetooth />
                  <span>Connect</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>
            Make sure your heart rate monitor is in pairing mode and nearby.
            This feature works best on Android devices with Chrome.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConnectDevice
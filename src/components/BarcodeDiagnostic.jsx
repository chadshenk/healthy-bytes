import React, { useState } from 'react';

function BarcodeDiagnostic() {
  const [diagnosticLog, setDiagnosticLog] = useState([]);
  const [testingCameraPerm, setTestingCameraPerm] = useState(false);

  // Log message with timestamp
  const logMessage = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticLog(prev => [
      { message, timestamp, type },
      ...prev.slice(0, 9) // Keep last 10 messages
    ]);
  };

  // Test camera permission
  const testCameraPermission = async () => {
    setTestingCameraPerm(true);
    logMessage('Testing camera access...', 'info');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      logMessage('✅ Camera permission granted!', 'success');
      
      // Log device details
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        logMessage(`Camera: ${videoTrack.label}`, 'info');
        logMessage(`Resolution: ${settings.width}x${settings.height}`, 'info');
      }
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      logMessage(`❌ Camera error: ${error.message}`, 'error');
    } finally {
      setTestingCameraPerm(false);
    }
  };
  
  // Test API with sample barcode
  const testAPI = async () => {
    const barcode = '5000159461122'; // Snickers bar
    logMessage(`Testing API with barcode: ${barcode}`, 'info');
    
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1) {
        logMessage(`✅ API test successful: ${data.product.product_name}`, 'success');
      } else {
        logMessage(`❌ API returned no product`, 'error');
      }
    } catch (error) {
      logMessage(`❌ API error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mt-8">
      <div className="p-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
        <h2 className="font-medium text-sm">Scanner Diagnostics</h2>
        <button 
          onClick={() => setDiagnosticLog([])}
          className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-0.5 rounded"
        >
          Clear Log
        </button>
      </div>
      
      <div className="p-3 grid grid-cols-2 gap-2">
        <button
          onClick={testCameraPermission}
          disabled={testingCameraPerm}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded disabled:opacity-50"
        >
          {testingCameraPerm ? 'Testing...' : 'Test Camera'}
        </button>
        
        <button
          onClick={testAPI}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 px-3 rounded"
        >
          Test API
        </button>
      </div>
      
      <div className="max-h-40 overflow-y-auto p-2 bg-gray-900">
        {diagnosticLog.length === 0 ? (
          <div className="text-gray-500 text-center text-xs py-2">
            No diagnostic information yet
          </div>
        ) : (
          <div className="space-y-1.5">
            {diagnosticLog.map((log, index) => (
              <div key={index} className={`text-xs px-2 py-1 rounded ${
                log.type === 'error' ? 'bg-red-900/30 text-red-300' : 
                log.type === 'success' ? 'bg-green-900/30 text-green-300' : 
                'bg-gray-800/60 text-gray-300'
              }`}>
                <span className="text-gray-500 mr-1">[{log.timestamp}]</span>
                {log.message}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Environment Info */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <h3 className="text-xs font-medium text-gray-400 mb-1">Environment</h3>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
          <div>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}</div>
          <div>HTTPS: {window.location.protocol === 'https:' ? '✅' : '❌'}</div>
          <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
          <div>Mobile: {/Mobi|Android/i.test(navigator.userAgent) ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
}

export default BarcodeDiagnostic;
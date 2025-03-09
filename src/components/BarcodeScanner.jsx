import React, { useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';

function BarcodeScanner({ onBarcodeDetected, onClose }) {
  const scannerRef = useRef(null);
  const lastScannedCode = useRef(null);
  const successCount = useRef(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initScanner();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, []);

  const initScanner = async () => {
    try {
      stopScanner();

      if (!scannerRef.current) {
        console.error("Scanner element is not available in the DOM");
        return;
      }

      console.log("Initializing Quagga...");
      
      // Configure Quagga with fixed, constrained dimensions
      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment",
            // Fixed, modest dimensions to prevent layout issues
            width: 640,
            height: 480,
          },
          // No area restriction - let visual guide match where Quagga scans
          singleChannel: false
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
          ]
        },
        locate: true
      });

      console.log("Quagga initialized successfully");
      
      // Register detection handler
      Quagga.onDetected(handleDetected);
      
      // Start scanner
      await Quagga.start();
      console.log("Quagga started successfully");
      
      // Fix the video element styles to ensure it doesn't break layout
      fixVideoElementStyles();
      
    } catch (error) {
      console.error("Error initializing scanner:", error);
    }
  };
  
  // Fix video element styling directly to prevent it from breaking layout
  const fixVideoElementStyles = () => {
    try {
      // Fix the Quagga generated video element styles
      if (scannerRef.current) {
        const videoElements = scannerRef.current.getElementsByTagName('video');
        if (videoElements.length > 0) {
          const video = videoElements[0];
          
          // Apply constrained styling
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.maxHeight = '300px';
          
          // Apply the same to canvas elements
          const canvasElements = scannerRef.current.getElementsByTagName('canvas');
          for (let canvas of canvasElements) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxHeight = '300px';
            canvas.style.objectFit = 'cover';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
          }
          
          // Fix viewport if it exists
          const viewport = scannerRef.current.querySelector('#interactive.viewport');
          if (viewport) {
            viewport.style.width = '100%';
            viewport.style.height = '100%';
            viewport.style.maxHeight = '300px';
            viewport.style.position = 'relative';
          }
        }
      }
    } catch (error) {
      console.error("Error fixing video styles:", error);
    }
  };

  const stopScanner = () => {
    try {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
      console.log("Scanner stopped");
    } catch (error) {
      // Ignore errors when stopping
    }
  };

  const handleDetected = (result) => {
    if (!result || !result.codeResult) return;
    
    const code = result.codeResult.code;
    console.log("Detected code:", code, "confidence:", result.codeResult.confidence);
    
    if (result.codeResult.confidence < 0.7) {
      console.log("Low confidence detection, ignoring");
      return;
    }
    
    if (code === lastScannedCode.current) {
      successCount.current++;
      
      if (successCount.current >= 2) {
        console.log("Successfully confirmed code:", code);
        
        stopScanner();
        
        setTimeout(() => {
          onBarcodeDetected(code);
        }, 300);
      }
    } else {
      lastScannedCode.current = code;
      successCount.current = 1;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="relative bg-gray-800 w-11/12 max-w-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-2">
              <path d="M2 6H4V18H2V6Z" fill="#00e676"/>
              <path d="M5 6H6V18H5V6Z" fill="#00e676"/>
              <path d="M7 6H10V18H7V6Z" fill="#00e676"/>
              <path d="M11 6H12V18H11V6Z" fill="#00e676"/>
              <path d="M14 6H16V18H14V6Z" fill="#00e676"/>
              <path d="M17 6H18V18H17V6Z" fill="#00e676"/>
              <path d="M19 6H22V18H19V6Z" fill="#00e676"/>
            </svg>
            Scan Barcode
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Scanner container with FIXED HEIGHT */}
        <div className="relative bg-black" style={{ height: '300px' }}>
          {/* Important: We're constraining this with explicit max-height */}
          <div 
            className="scanner-container" 
            style={{ 
              position: 'relative',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <div 
              ref={scannerRef} 
              style={{ 
                width: '100%',
                height: '100%',
                maxHeight: '300px',
                position: 'relative'
              }}
            ></div>
            
            {/* Center Scanning guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-2/3 h-1/2 border-2 border-dashed border-green-500/70 rounded-lg">
                {/* Add targeting corners for better visual guide */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-800">
          <div className="mb-4 p-3 bg-yellow-500/10 border-l-2 border-yellow-500 rounded">
            <h3 className="text-sm font-medium text-yellow-400 mb-1">Scanning Tips</h3>
            <ul className="text-xs text-gray-300 list-disc pl-4 space-y-1">
              <li>Position barcode in the highlighted box</li>
              <li>Hold camera 4-8 inches from barcode</li>
              <li>Ensure good lighting</li>
              <li>Hold steady while scanning</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={initScanner}
              className="bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-medium transition-colors"
            >
              Reset Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScanner;
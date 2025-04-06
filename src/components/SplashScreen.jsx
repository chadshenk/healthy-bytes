import React, { useState, useRef, useEffect } from 'react';

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [bgColor, setBgColor] = useState('oklch(13% 0.028 261.692)');
  const screenRef = useRef(null);
  
  // Colors to pulse between
  const colors = [
    'rgb(24, 8, 116)',   // Deep purple
    'rgb(15, 63, 146)',  // Deep blue
    'rgb(12, 104, 67)',  // Deep green
    'rgb(63, 10, 106)',  // Purple
    'rgb(24, 8, 116)'    // Back to deep purple
  ];
  
  // Prevent scrolling when splash screen is active
  useEffect(() => {
    if (visible) {
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when splash screen is dismissed
      document.body.style.overflow = '';
    }
    
    return () => {
      // Clean up
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Calculate how much to translate the element
  const getTranslateY = () => {
    if (!isDragging) return 0;
    const dragDistance = startY - currentY;
    // Only allow upward movement (positive distance)
    return dragDistance > 0 ? -dragDistance : 0;
  };

  // Touch Events
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    const swipeDistance = startY - currentY;
    // Dismiss if swiped up more than 100px
    if (swipeDistance > 100) {
      setVisible(false);
    }
    setIsDragging(false);
  };

  // Mouse Events (for testing on desktop)
  const handleMouseDown = (e) => {
    setStartY(e.clientY);
    setCurrentY(e.clientY);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setCurrentY(e.clientY);
    }
  };

  const handleMouseUp = () => {
    const swipeDistance = startY - currentY;
    // Dismiss if swiped up more than 100px
    if (swipeDistance > 100) {
      setVisible(false);
    }
    setIsDragging(false);
  };

  if (!visible) return null;

  return (
    <div 
      ref={screenRef}
      className="fixed inset-0 flex items-center justify-center z-50 animate-pulse-bg"
      style={{ 
        transform: `translateY(${getTranslateY()}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        backgroundColor: bgColor,
        transition: isDragging ? 'none' : 'all 2.5s ease-in-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-2 tracking-wide font-sans">Healthy Bytes</h1>
        <p className="text-white text-lg my-2 max-w-xs mx-auto">Scan, analyze, and improve your nutrition with Healthy Bytes.</p>
        <p className="text-green-500 text-sm my-2">INSTRUCTIONS</p>
        <p className="text-gray-400 text-xl my-2">Tap 'Scan Food'</p>
        <p className="text-gray-400 text-xl my-2">Point your camera at the barcode</p>
        <p className="text-gray-400 text-xl my-2">Success!</p>
        <p className="bg-green-500 text-white px-4 py-2 rounded-full inline-block mt-4">
          ↑ Swipe up to continue ↑
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
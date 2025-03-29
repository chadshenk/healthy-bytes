import React, { useState, useRef, useEffect } from 'react';

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [bgColor, setBgColor] = useState('#3b82f6'); // Start with blue-500
  const screenRef = useRef(null);
  
  // Colors to pulse between - from your CSS
  const colors = [
    'rgb(24, 8, 116)',   // Deep purple
    'rgb(15, 63, 146)',  // Deep blue
    'rgb(12, 104, 67)',  // Deep green
    'rgb(63, 10, 106)',  // Purple
    'rgb(24, 8, 116)'    // Back to deep purple
  ];
  
  // Set up the color pulsing effect with longer duration
  useEffect(() => {
    let colorIndex = 0;
    const intervalId = setInterval(() => {
      colorIndex = (colorIndex + 1) % colors.length;
      setBgColor(colors[colorIndex]);
    }, 2500); // Longer interval to match your 10s total cycle (10s ÷ 4 transitions)
    
    return () => clearInterval(intervalId);
  }, []);

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
        <h1 className="text-5xl font-semibold text-white mb-2 tracking-wide font-sans">Healthy Bytes</h1>
        <p className="text-white text-lg mb-6 max-w-xs mx-auto">Scan, analyze, and improve your nutrition with Healthy Bytes.</p>
        <p className="mt-64 bg-white bg-opacity-20 text-white px-4 py-2 rounded-full inline-block mt-4">
          ↑ Swipe up to continue ↑
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
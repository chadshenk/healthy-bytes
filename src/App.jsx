import React, { useState, useEffect } from 'react';
import FoodList from './components/FoodList';
import NutritionSummary from './components/NutritionSummary';
import BarcodeScanner from './components/BarcodeScanner';
import SplashScreen from './components/SplashScreen';

function App() {
  const [foodItems, setFoodItems] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        stream.getTracks().forEach(track => track.stop());
        console.log("Camera permission granted");
      } catch (error) {
        console.warn('Could not get camera permission:', error);
      }
    };

    requestCameraPermission();
  }, []);

  /// Fetch product info when barcode is detected
const handleBarcodeDetected = async (barcode) => {
  console.log("Barcode detected:", barcode);
  setShowScanner(false);
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    console.log("API response for barcode:", barcode, data);
    
    if (data.status === 1) {
      const product = data.product;
      
      // Get serving size information
      const servingSize = product.serving_size || null;
      console.log("Serving size:", servingSize);
      
      // Prioritize serving size values over 100g values
      
      // Calculate calories
      let calories = product.nutriments?.energy_serving;
      if (!calories && product.nutriments?.energy_value) {
        calories = product.nutriments.energy_value;
      } else if (!calories && product.nutriments?.energy_100g) {
        calories = product.nutriments.energy_100g;
      } else if (!calories) {
        calories = 0;
      }
      
      // Adjust energy units if needed (kJ to kcal conversion)
      if (product.nutriments?.energy_unit === 'kJ') {
        calories = calories / 4.184; // Convert kJ to kcal
      }
      
      // Calculate protein with serving size priority
      let protein = product.nutriments?.proteins_serving;
      if (!protein && product.nutriments?.proteins_100g) {
        protein = product.nutriments.proteins_100g;
      } else if (!protein) {
        protein = 0;
      }
      
      // Calculate carbs with serving size priority
      let carbs = product.nutriments?.carbohydrates_serving;
      if (!carbs && product.nutriments?.carbohydrates_100g) {
        carbs = product.nutriments.carbohydrates_100g;
      } else if (!carbs) {
        carbs = 0;
      }
      
      // Calculate fat with serving size priority
      let fat = product.nutriments?.fat_serving;
      if (!fat && product.nutriments?.fat_100g) {
        fat = product.nutriments.fat_100g;
      } else if (!fat) {
        fat = 0;
      }
      
      // Create new food item
      const newItem = {
        id: 'item-' + Date.now(),
        name: product.product_name || 'Unknown Product',
        brand: product.brands || 'Unknown Brand',
        calories,
        protein,
        carbs,
        fat,
        image: product.image_url || null,
        servingSize: servingSize || 'unknown'
      };
      
      console.log("Adding food item with nutrition info:", newItem);
      setFoodItems(prevItems => [...prevItems, newItem]);
    } else {
      setError(`Product not found for barcode: ${barcode}`);
    }
  } catch (error) {
    console.error("API error:", error);
    setError(`Error fetching product: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

  // Handle manual barcode entry
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode) {
      handleBarcodeDetected(manualBarcode);
      setShowManualEntry(false);
    }
  };

  // Remove food item from list
  const removeItem = (itemId) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Clear all food items
  const clearAllItems = () => {
    if (window.confirm('Are you sure you want to clear all items?')) {
      setFoodItems([]);
    }
  };

  // For debugging - test a specific barcode
  const testBarcode = () => {
    handleBarcodeDetected('03448005'); // Snickers bar
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SplashScreen />
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* App Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold flex items-center justify-center mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mr-2">
              <path d="M2 6H4V18H2V6Z" fill="#00e676"/>
              <path d="M5 6H6V18H5V6Z" fill="#00e676"/>
              <path d="M7 6H10V18H7V6Z" fill="#00e676"/>
              <path d="M11 6H12V18H11V6Z" fill="#00e676"/>
              <path d="M14 6H16V18H14V6Z" fill="#00e676"/>
              <path d="M17 6H18V18H17V6Z" fill="#00e676"/>
              <path d="M19 6H22V18H19V6Z" fill="#00e676"/>
            </svg>
            Healthy Bytes
          </h1>
          <p className="text-gray-400 text-sm">Track your calories with a simple scan</p>
        </header>

        {/* Nutrition Summary */}
        <NutritionSummary foodItems={foodItems} />

        {/* Food List */}
        <FoodList 
          foodItems={foodItems} 
          onRemoveItem={removeItem} 
          onClearAll={clearAllItems} 
        />
        
        {/* Scan Buttons */}
        <div className="mt-4 space-y-2">
          <button 
            onClick={() => setShowScanner(true)}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-lg flex items-center justify-center transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 6H4V18H2V6Z" />
              <path d="M5 6H6V18H5V6Z" />
              <path d="M7 6H10V18H7V6Z" />
              <path d="M11 6H12V18H11V6Z" />
              <path d="M14 6H16V18H14V6Z" />
              <path d="M17 6H18V18H17V6Z" />
              <path d="M19 6H22V18H19V6Z" />
            </svg>
            Scan Food Item
          </button>
          
          {/* Manual Entry Button */}
          <button 
            onClick={() => setShowManualEntry(true)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
          >
            Enter Barcode Manually
          </button>
          
          {/* Debug Test Button - Comment out in production */}
          <button 
            onClick={testBarcode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm"
          >
            Test with Sample Barcode
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 text-center p-4 bg-gray-800 rounded-lg animate-pulse">
            <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin mr-2"></div>
            <span>Looking up product...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 text-center p-4 bg-gray-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Manual Entry Form */}
        {showManualEntry && (
          <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center">
            <div className="bg-gray-800 w-11/12 max-w-md rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Enter Barcode</h2>
              </div>
              
              <form onSubmit={handleManualSubmit} className="p-4">
                <div className="mb-4">
                  <label htmlFor="barcode" className="block text-gray-400 text-sm mb-2">Barcode Number</label>
                  <input 
                    type="text" 
                    id="barcode"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-green-500"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="e.g. 5449000000996"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(false)}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!manualBarcode}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Scanner Modal */}
        {showScanner && (
          <BarcodeScanner 
            onBarcodeDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
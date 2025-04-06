import React, { useState, useEffect } from 'react';
import FoodList from './components/FoodList';
import NutritionSummary from './components/NutritionSummary';
import BarcodeScanner from './components/BarcodeScanner';
import SplashScreen from './components/SplashScreen';

function App() {
  // Initialize state from localStorage or empty array if nothing saved
  const [foodItems, setFoodItems] = useState(() => {
    const savedItems = localStorage.getItem('foodItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Update localStorage whenever foodItems changes
  useEffect(() => {
    localStorage.setItem('foodItems', JSON.stringify(foodItems));
  }, [foodItems]);

// Store a flag in localStorage to indicate we've already attempted permission
useEffect(() => {
  const hasAttemptedPermission = localStorage.getItem('hasAttemptedCameraPermission') === 'true';
  
  if (!hasAttemptedPermission) {
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        stream.getTracks().forEach(track => track.stop());
        console.log("Camera permission granted");
        localStorage.setItem('hasAttemptedCameraPermission', 'true');
      } catch (error) {
        console.warn('Could not get camera permission:', error);
        localStorage.setItem('hasAttemptedCameraPermission', 'true');
      }
    };

    requestCameraPermission();
  }
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

        // Get serving size information and parse it
        const servingSizeText = product.serving_size || null;
        const servingSizeValue = parseServingSize(servingSizeText);
        console.log("Serving size text:", servingSizeText, "Parsed value:", servingSizeValue);

        // Get nutriments
        const nutriments = product.nutriments || {};
        console.log("Raw nutriment data:", nutriments);

        // First, determine calories properly
        const calories = determineCalories(nutriments, servingSizeValue);

        // Get other macronutrients with proper serving size handling
        const protein = getNutrientValue('proteins', nutriments, servingSizeValue);
        const carbs = getNutrientValue('carbohydrates', nutriments, servingSizeValue);
        const fat = getNutrientValue('fat', nutriments, servingSizeValue);

        // Make sure all values are numbers and rounded to 1 decimal place
        const roundToOneDecimal = (value) => {
          // Handle NaN, undefined or null
          if (value === undefined || value === null || isNaN(value)) return 0;
          return parseFloat(parseFloat(value).toFixed(1));
        };

        const caloriesRounded = roundToOneDecimal(calories);
        const proteinRounded = roundToOneDecimal(protein);
        const carbsRounded = roundToOneDecimal(carbs);
        const fatRounded = roundToOneDecimal(fat);

        console.log("Final calculated nutrition values:", {
          calories: caloriesRounded,
          protein: proteinRounded,
          carbs: carbsRounded,
          fat: fatRounded,
          servingSize: servingSizeText,
          servingSizeValue
        });

        // Create new food item
        const newItem = {
          id: 'item-' + Date.now(),
          name: product.product_name || 'Unknown Product',
          brand: product.brands || 'Unknown Brand',
          calories: caloriesRounded,
          protein: proteinRounded,
          carbs: carbsRounded,
          fat: fatRounded,
          image: product.image_url || product.image_front_url || product.image_front_small_url || null,
          servingSize: servingSizeText || 'Unknown serving size',
          servingSizeValue: servingSizeValue || null,
          barcode
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

  // Helper function to determine calories with extensive sanity checks
  function determineCalories(nutriments, servingSizeValue) {
    console.log("Determining calories with these inputs:", { nutriments, servingSizeValue });

    // Helper function to safely parse numeric values
    const parseNumber = (value) => {
      if (value === undefined || value === null) return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };

    // Check if we have explicit kcal values (most reliable)
    const kcalServing = parseNumber(nutriments.energy_kcal_serving);
    const kcal100g = parseNumber(nutriments.energy_kcal_100g);

    // Check for energy values that might need conversion
    const energyServing = parseNumber(nutriments.energy_serving);
    const energy100g = parseNumber(nutriments.energy_100g);
    const energyUnit = (nutriments.energy_unit || '').toLowerCase();

    // Also check for calories fields (sometimes used in US products)
    const caloriesServing = parseNumber(nutriments.calories_serving);
    const calories100g = parseNumber(nutriments.calories_100g);

    console.log("Energy values found:", {
      kcalServing,
      kcal100g,
      energyServing,
      energy100g,
      energyUnit,
      caloriesServing,
      calories100g
    });

    // Determine if values need kJ to kcal conversion
    // IMPROVED: Consider all energy values as potentially kJ regardless of unit labeling
    const isKilojoules = energyUnit === 'kj';
    const likelyKilojoules = isKilojoules ||
      // If no unit specified but values are suspiciously high
      (energyUnit === '' && (
        (energyServing !== null && energyServing > 400) ||
        (energy100g !== null && energy100g > 1000)
      ));

    console.log("Energy conversion analysis:", {
      energyUnit,
      isKilojoules,
      likelyKilojoules,
      energyServing,
      energy100g
    });

    // Helper to convert kJ to kcal if needed
    const convertIfNeeded = (value) => {
      if (value === null) return null;
      return (isKilojoules || likelyKilojoules) ? value * 0.239 : value;
    };

    // Implementation of sanity check for calorie values
    // Many products have unreasonably high calorie counts, especially if
    // kJ values are incorrectly treated as kcal
    const isReasonableCalorieCount = (calories) => {
      // For reference:
      // - Most single servings of food are under 1000 calories
      // - Most 100g portions are under 900 calories (even pure fat is ~900 kcal/100g)
      // - Most values over 1000 are likely kJ values or errors

      if (calories === null) return false;

      // Basic sanity check for any calorie value
      if (calories <= 0) return false;

      // For per-serving values, we're more permissive when we have actual serving size info
      if (servingSizeValue) {
        // Very small servings (under 10g) - allow up to 100 kcal
        if (servingSizeValue < 10) return calories < 100;

        // Small servings (10-30g) - allow up to 200 kcal
        if (servingSizeValue < 30) return calories < 200;

        // Medium servings (30-70g) - allow up to 400 kcal
        if (servingSizeValue < 70) return calories < 400;

        // Large servings (70-150g) - allow up to 700 kcal
        if (servingSizeValue < 150) return calories < 700;

        // Very large servings (150g+) - allow up to 1200 kcal
        return calories < 1200;
      }

      // Without serving size info, be more conservative
      return calories > 0 && calories < 800;
    };

    // Try to find the most reasonable calorie value in this priority order
    let calories = null;
    let source = "";

    // 1. First, use explicit kcal per serving if available and reasonable
    if (kcalServing !== null && isReasonableCalorieCount(kcalServing)) {
      calories = kcalServing;
      source = "kcal_serving";
    }
    // 2. Next try calories_serving (US style)
    else if (caloriesServing !== null && isReasonableCalorieCount(caloriesServing)) {
      calories = caloriesServing;
      source = "calories_serving";
    }
    // 3. Try energy_serving with conversion if needed
    else if (energyServing !== null) {
      const convertedValue = convertIfNeeded(energyServing);

      // If the converted value seems reasonable, use it
      if (isReasonableCalorieCount(convertedValue)) {
        calories = convertedValue;
        source = "energy_serving_converted";
      }
      // Special case: sometimes kJ values are incorrectly not marked as kJ
      // If unconverted value is too high but converted would be reasonable, use converted
      else if (!isKilojoules && !isReasonableCalorieCount(energyServing) &&
        isReasonableCalorieCount(energyServing * 0.239)) {
        calories = energyServing * 0.239;
        source = "energy_serving_force_converted";
      }
    }

    // 4. If we have serving size and per-100g values, calculate per-serving
    if (calories === null && servingSizeValue && servingSizeValue > 0) {
      // Try kcal_100g first
      if (kcal100g !== null) {
        const calculated = kcal100g * (servingSizeValue / 100);
        if (isReasonableCalorieCount(calculated)) {
          calories = calculated;
          source = "kcal_100g_calculated";
        }
      }
      // Then calories_100g
      else if (calories100g !== null) {
        const calculated = calories100g * (servingSizeValue / 100);
        if (isReasonableCalorieCount(calculated)) {
          calories = calculated;
          source = "calories_100g_calculated";
        }
      }
      // Finally energy_100g
      else if (energy100g !== null) {
        const convertedPer100g = convertIfNeeded(energy100g);
        const calculated = convertedPer100g * (servingSizeValue / 100);

        if (isReasonableCalorieCount(calculated)) {
          calories = calculated;
          source = "energy_100g_calculated";
        }
        // Special case: force convert if it gives reasonable values
        else if (!isKilojoules && !isReasonableCalorieCount(calculated) &&
          isReasonableCalorieCount(energy100g * 0.239 * (servingSizeValue / 100))) {
          calories = energy100g * 0.239 * (servingSizeValue / 100);
          source = "energy_100g_force_converted";
        }
      }
    }

    // 5. Final fallbacks to per-100g values if no serving size info
    if (calories === null) {
      if (kcal100g !== null && isReasonableCalorieCount(kcal100g)) {
        calories = kcal100g;
        source = "kcal_100g_as_is";
      }
      else if (calories100g !== null && isReasonableCalorieCount(calories100g)) {
        calories = calories100g;
        source = "calories_100g_as_is";
      }
      else if (energy100g !== null) {
        const converted = convertIfNeeded(energy100g);
        if (isReasonableCalorieCount(converted)) {
          calories = converted;
          source = "energy_100g_converted";
        }
        // Special case again
        else if (!isKilojoules && isReasonableCalorieCount(energy100g * 0.239)) {
          calories = energy100g * 0.239;
          source = "energy_100g_force_converted";
        }
      }
    }

    // 6. Improved: If we still have no reasonable value but have energy values,
    // attempt to convert them assuming they're kJ (even if not marked as such)
    if (calories === null) {
      // Check energy_serving first - if it's in the range that could be kJ, convert it
      if (energyServing !== null && energyServing >= 400 && energyServing <= 3000) {
        const converted = energyServing * 0.239;
        if (isReasonableCalorieCount(converted)) {
          calories = converted;
          source = "energy_serving_assume_kj";
        }
      }

      // Next try energy_100g if we have a serving size
      if (calories === null && energy100g !== null && servingSizeValue) {
        const convertedPer100g = energy100g * 0.239;
        const calculated = convertedPer100g * (servingSizeValue / 100);

        if (isReasonableCalorieCount(calculated)) {
          calories = calculated;
          source = "energy_100g_assume_kj";
        }
      }

      // Last resort: use energy_100g directly
      if (calories === null && energy100g !== null) {
        const converted = energy100g * 0.239;
        if (isReasonableCalorieCount(converted)) {
          calories = converted;
          source = "energy_100g_assume_kj_as_is";
        }
      }
    }

    // If all else fails, default to 0
    if (calories === null) {
      calories = 0;
      source = "default_zero";
    }

    console.log("Calculated calories:", calories, "Source:", source);
    return calories;
  }

  // Helper function to get nutrient values with proper serving size handling
  function getNutrientValue(nutrient, nutriments, servingSizeValue) {
    const servingKey = `${nutrient}_serving`;
    const per100gKey = `${nutrient}_100g`;

    // Helper function to safely parse numeric values
    const parseNumber = (value) => {
      if (value === undefined || value === null) return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };

    // Get values if they exist
    const servingValue = parseNumber(nutriments[servingKey]);
    const per100gValue = parseNumber(nutriments[per100gKey]);

    console.log(`Getting ${nutrient} value:`, { servingValue, per100gValue, servingSizeValue });

    // Implement sanity checks for nutrients
    const isReasonableAmount = (value, nutrient) => {
      if (value === null) return false;

      // Most nutrients are under these amounts per serving
      const maxReasonableValues = {
        proteins: 100, // g
        carbohydrates: 150, // g
        fat: 100, // g
        sugar: 100, // g
        fiber: 50, // g
        salt: 10, // g
        sodium: 5000 // mg
      };

      const maxValue = maxReasonableValues[nutrient] || 100;
      return value >= 0 && value <= maxValue;
    };

    // Try to find the most reasonable value
    let value = null;

    // 1. First priority: use serving value if available and reasonable
    if (servingValue !== null && isReasonableAmount(servingValue, nutrient)) {
      value = servingValue;
    }
    // 2. Calculate from per-100g if we have serving size
    else if (per100gValue !== null && servingSizeValue && servingSizeValue > 0) {
      const calculated = per100gValue * (servingSizeValue / 100);
      if (isReasonableAmount(calculated, nutrient)) {
        value = calculated;
      }
    }
    // 3. Fall back to per-100g value if necessary
    else if (per100gValue !== null && isReasonableAmount(per100gValue, nutrient)) {
      value = per100gValue;
    }

    // 4. Special case: if serving value is unreasonably high but would be reasonable 
    // if it were per 100g and adjusted to serving size
    if (value === null && servingValue !== null && servingSizeValue && servingSizeValue > 0 &&
      !isReasonableAmount(servingValue, nutrient)) {
      // Check if this might actually be the per-100g value mistakenly put in the per-serving field
      const adjustedValue = servingValue * (servingSizeValue / 100);
      if (isReasonableAmount(adjustedValue, nutrient)) {
        value = adjustedValue;
      }
    }

    // If all else fails, default to 0
    return value !== null ? value : 0;
  }

  // Helper function to parse serving size text into a numeric value in grams
  function parseServingSize(servingSizeText) {
    if (!servingSizeText) return null;

    // Convert to lowercase for consistent matching
    const text = servingSizeText.toLowerCase();

    // Match patterns like "100g", "100 g", "100 gram", "100 grams"
    const gramMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|gr)/);
    if (gramMatch) return parseFloat(gramMatch[1]);

    // Match patterns like "100ml", "100 ml", "100 milliliter", "100 milliliters"
    // Roughly convert ml to g (assuming density of 1g/ml like water)
    const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliter|milliliters)/);
    if (mlMatch) return parseFloat(mlMatch[1]);

    // Match patterns like "100 oz", convert to grams (1 oz ≈ 28.35g)
    const ozMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounce|ounces)/);
    if (ozMatch) return parseFloat(ozMatch[1]) * 28.35;

    // Match patterns like "2.5 oz (70g)" - extract the part in parentheses if it contains 'g'
    const parenthesesMatch = text.match(/\((\d+(?:\.\d+)?)\s*g\)/);
    if (parenthesesMatch) return parseFloat(parenthesesMatch[1]);

    // Match "x pieces" pattern, but can't convert to grams without more info
    const piecesMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:piece|pieces)/);
    if (piecesMatch) return null; // Can't convert pieces to grams generically

    return null;
  }

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
              <path d="M2 6H4V18H2V6Z" fill="#00e676" />
              <path d="M5 6H6V18H5V6Z" fill="#00e676" />
              <path d="M7 6H10V18H7V6Z" fill="#00e676" />
              <path d="M11 6H12V18H11V6Z" fill="#00e676" />
              <path d="M14 6H16V18H14V6Z" fill="#00e676" />
              <path d="M17 6H18V18H17V6Z" fill="#00e676" />
              <path d="M19 6H22V18H19V6Z" fill="#00e676" />
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
            Scan Food
          </button>

          {/* Manual Entry Button */}
          {/* <button
            onClick={() => setShowManualEntry(true)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
          >
            Enter Barcode Manually
          </button> */}

          {/* Debug Test Button - Comment out in production */}
          {/* <button
            onClick={testBarcode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm"
          >
            Test with Sample Barcode
          </button> */}
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
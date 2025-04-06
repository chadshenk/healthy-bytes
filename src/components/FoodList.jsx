import React from 'react';

function FoodList({ foodItems, onRemoveItem, onClearAll }) {
  if (foodItems.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-medium">Food List</h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
          </svg>
          <p>No food scanned yet</p>
          <p className="text-sm opacity-70 mt-1">Tap the scan button to add items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium">Food Items</h2>
        <button 
          onClick={onClearAll}
          className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-white transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {foodItems.map(item => (
          <FoodItem 
            key={item.id} 
            item={item} 
            onRemove={() => onRemoveItem(item.id)} 
          />
        ))}
      </div>
    </div>
  );
}

// Food Item subcomponent
// Update the FoodItem component in your FoodList.jsx file

function FoodItem({ item, onRemove }) {
    return (
      <div className="flex p-3 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
        {/* Item image or placeholder */}
        <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden mr-3 flex-shrink-0">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Item details */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          <div className="text-green-400 text-xs">{item.brand}</div>
          
          {/* Add serving size display */}
          {item.servingSize && (
            <div className="text-gray-400 text-xs mt-0.5">
              Serving: {item.servingSize}
            </div>
          )}
          
          <div className="text-gray-400 text-xs flex justify-between mt-1">
            <div>
              <span className="mr-2">{Math.round(item.calories)} cal</span>
              <span className="text-xs opacity-75">P:{Math.round(item.protein)}g</span>
              <span className="mx-1 text-xs opacity-75">C:{Math.round(item.carbs)}g</span>
              <span className="text-xs opacity-75">F:{Math.round(item.fat)}g</span>
            </div>
          </div>
        </div>
        
        {/* Remove button */}
        <button 
          onClick={onRemove}
          className="ml-2 self-center p-1 text-gray-400 hover:text-red-400 transition-colors"
          aria-label="Remove item"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>
    );
  }

export default FoodList;
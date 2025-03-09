import React from 'react';

function NutritionSummary({ foodItems }) {
  // Calculate nutrition totals
  const nutritionTotals = foodItems.reduce((totals, item) => {
    return {
      calories: totals.calories + (Number(item.calories) || 0),
      protein: totals.protein + (Number(item.protein) || 0),
      carbs: totals.carbs + (Number(item.carbs) || 0),
      fat: totals.fat + (Number(item.fat) || 0)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 mb-4">
      <div className="text-center mb-3">
        <div className="text-gray-400 text-sm mb-1">Total Calories</div>
        <div className="text-3xl font-bold text-green-400 relative inline-block">
          {Math.round(nutritionTotals.calories)}
          <span className="absolute text-xs text-gray-400 bottom-1 -right-7">kcal</span>
        </div>
      </div>
      
      <div className="flex justify-center gap-3">
        <MacroNutrient
          label="Protein"
          value={Math.round(nutritionTotals.protein)}
          unit="g"
        />
        <MacroNutrient
          label="Carbs"
          value={Math.round(nutritionTotals.carbs)}
          unit="g"
        />
        <MacroNutrient
          label="Fat"
          value={Math.round(nutritionTotals.fat)}
          unit="g"
        />
      </div>
    </div>
  );
}

// Helper component for each macronutrient pill
function MacroNutrient({ label, value, unit }) {
  return (
    <div className="bg-gray-700 px-3 py-2 rounded-full flex flex-col items-center min-w-16">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium">
        {value}{unit}
      </span>
    </div>
  );
}

export default NutritionSummary;
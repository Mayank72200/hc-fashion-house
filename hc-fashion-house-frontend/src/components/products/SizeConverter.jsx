/**
 * SizeConverter Component
 * Displays size conversion toggle for IND, UK, and EU sizes on PDP
 */
import { useState } from 'react';
import { convertSize, getSizeSystems } from '@/utils/sizeConversion';

export default function SizeConverter({ 
  sizes = [], 
  sizeChartType = 'IND', 
  gender = 'men',
  selectedSize,
  onSizeSelect,
  className = '' 
}) {
  const [activeSizeSystem, setActiveSizeSystem] = useState('IND');
  const sizeSystems = getSizeSystems();

  // Convert sizes to the active size system
  const getConvertedSize = (sizeObj) => {
    const originalSize = sizeObj.originalSize || sizeObj.ind;
    const originalSystem = sizeObj.sizeChartType || sizeChartType;
    
    const converted = convertSize(originalSize, originalSystem, activeSizeSystem, gender);
    return converted || originalSize;
  };

  // Check if a size is selected
  const isSizeSelected = (sizeObj) => {
    if (!selectedSize) return false;
    const convertedSize = getConvertedSize(sizeObj);
    return String(convertedSize) === String(selectedSize);
  };

  return (
    <div className={`size-converter ${className}`}>
      {/* Size System Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Size System:</span>
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {sizeSystems.map((system) => (
            <button
              key={system.value}
              onClick={() => setActiveSizeSystem(system.value)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeSizeSystem === system.value
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {system.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection Grid */}
      <div className="grid grid-cols-5 gap-2">
        {sizes.map((sizeObj, index) => {
          const convertedSize = getConvertedSize(sizeObj);
          const isInStock = sizeObj.inStock;
          const isSelected = isSizeSelected(sizeObj);
          
          return (
            <button
              key={`${convertedSize}-${index}`}
              onClick={() => isInStock && onSizeSelect && onSizeSelect(convertedSize)}
              disabled={!isInStock}
              className={`
                relative px-4 py-3 text-sm font-medium rounded-md border-2 transition-all
                ${isSelected
                  ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                  : isInStock
                  ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600'
                }
              `}
            >
              {convertedSize}
              {!isInStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gray-400 dark:bg-gray-600 rotate-45 transform origin-center"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Size Chart Info */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> Sizes are displayed in {activeSizeSystem} format. 
          {activeSizeSystem === 'IND' && ' UK sizes are the same as IND sizes.'}
          {activeSizeSystem === 'UK' && ' UK sizes are the same as IND sizes.'}
          {activeSizeSystem === 'EU' && ' EU sizes follow European sizing standards.'}
        </p>
      </div>
    </div>
  );
}

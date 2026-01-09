/**
 * Universal Size Chart Conversion Utility
 * Handles conversion between IND, UK, and EU sizes for men's, women's, and kids' footwear
 * 
 * Note: UK size = IND size (same values)
 */

// Men's Size Chart
// IND/UK -> EU conversion
const MEN_SIZE_CHART = {
  // IND/UK: EU
  6: 40,
  7: 41,
  8: 42,
  9: 43,
  10: 44,
  11: 45,
  12: 46,
  13: 47,
  14: 48,
};

// Women's Size Chart
// IND/UK -> EU conversion
const WOMEN_SIZE_CHART = {
  // IND/UK: EU
  3: 36,
  4: 37,
  5: 38,
  6: 39,
  7: 40,
  8: 41,
  9: 42,
  10: 43,
};

// Kids/Boys/Girls Size Chart
// IND/UK -> EU conversion
const KIDS_SIZE_CHART = {
  // IND/UK: EU
  1: 17,
  2: 18,
  3: 19,
  4: 20,
  5: 21,
  6: 23,
  7: 24,
  8: 25,
  9: 27,
  10: 28,
  11: 29,
  12: 30,
  13: 31,
  15: 33,
  16: 34,
  17: 35,
  18: 36,
  19: 37,
  20: 38,
};

// Reverse lookup maps (EU -> IND/UK)
const MEN_EU_TO_IND = Object.fromEntries(
  Object.entries(MEN_SIZE_CHART).map(([ind, eu]) => [eu, parseInt(ind)])
);

const WOMEN_EU_TO_IND = Object.fromEntries(
  Object.entries(WOMEN_SIZE_CHART).map(([ind, eu]) => [eu, parseInt(ind)])
);

const KIDS_EU_TO_IND = Object.fromEntries(
  Object.entries(KIDS_SIZE_CHART).map(([ind, eu]) => [eu, parseInt(ind)])
);

/**
 * Get the appropriate size chart based on gender
 * @param {string} gender - 'men', 'women', 'boys', 'girls', or 'unisex'
 * @returns {object} Size chart mapping
 */
function getSizeChart(gender) {
  const normalizedGender = gender?.toLowerCase();
  if (normalizedGender === 'women') return WOMEN_SIZE_CHART;
  if (normalizedGender === 'boys' || normalizedGender === 'girls') return KIDS_SIZE_CHART;
  return MEN_SIZE_CHART;
}

/**
 * Get the reverse size chart (EU to IND/UK) based on gender
 * @param {string} gender - 'men', 'women', 'boys', 'girls', or 'unisex'
 * @returns {object} Reverse size chart mapping
 */
function getReverseSizeChart(gender) {
  const normalizedGender = gender?.toLowerCase();
  if (normalizedGender === 'women') return WOMEN_EU_TO_IND;
  if (normalizedGender === 'boys' || normalizedGender === 'girls') return KIDS_EU_TO_IND;
  return MEN_EU_TO_IND;
}

/**
 * Convert a size from one system to another
 * @param {number|string} size - The size to convert
 * @param {string} fromSystem - Source system: 'IND', 'UK', or 'EU'
 * @param {string} toSystem - Target system: 'IND', 'UK', or 'EU'
 * @param {string} gender - 'men' or 'women'
 * @returns {number|null} Converted size or null if not found
 */
export function convertSize(size, fromSystem, toSystem, gender = 'men') {
  const numSize = typeof size === 'string' ? parseFloat(size) : size;
  
  // If converting to same system, return as is
  if (fromSystem === toSystem) {
    return numSize;
  }

  // UK and IND are the same
  if ((fromSystem === 'IND' && toSystem === 'UK') || (fromSystem === 'UK' && toSystem === 'IND')) {
    return numSize;
  }

  const sizeChart = getSizeChart(gender);
  const reverseSizeChart = getReverseSizeChart(gender);

  // Converting from IND/UK to EU
  if ((fromSystem === 'IND' || fromSystem === 'UK') && toSystem === 'EU') {
    return sizeChart[numSize] || null;
  }

  // Converting from EU to IND/UK
  if (fromSystem === 'EU' && (toSystem === 'IND' || toSystem === 'UK')) {
    return reverseSizeChart[numSize] || null;
  }

  return null;
}

/**
 * Convert an array of sizes from one system to another
 * @param {array} sizes - Array of sizes to convert
 * @param {string} fromSystem - Source system: 'IND', 'UK', or 'EU'
 * @param {string} toSystem - Target system: 'IND', 'UK', or 'EU'
 * @param {string} gender - 'men' or 'women'
 * @returns {array} Array of converted sizes
 */
export function convertSizes(sizes, fromSystem, toSystem, gender = 'men') {
  if (!sizes || !Array.isArray(sizes)) return [];
  
  return sizes
    .map(size => convertSize(size, fromSystem, toSystem, gender))
    .filter(size => size !== null);
}

/**
 * Convert sizes to IND (for display on cards and listings)
 * @param {array} sizes - Array of sizes
 * @param {string} sizeChartType - Original size system: 'IND', 'UK', or 'EU'
 * @param {string} gender - 'men' or 'women'
 * @returns {array} Array of sizes in IND format
 */
export function toIndianSizes(sizes, sizeChartType, gender = 'men') {
  if (!sizeChartType || sizeChartType === 'IND') {
    return sizes;
  }
  return convertSizes(sizes, sizeChartType, 'IND', gender);
}

/**
 * Get all available size systems for conversion
 * @returns {array} Array of size system objects
 */
export function getSizeSystems() {
  return [
    { value: 'IND', label: 'IND' },
    { value: 'UK', label: 'UK' },
    { value: 'EU', label: 'EU' },
  ];
}

/**
 * Get size conversion display for PDP
 * Shows the size in all three systems
 * @param {number|string} size - The size in original system
 * @param {string} originalSystem - Original size system
 * @param {string} gender - 'men' or 'women'
 * @returns {object} Object with IND, UK, and EU sizes
 */
export function getSizeConversions(size, originalSystem, gender = 'men') {
  const numSize = typeof size === 'string' ? parseFloat(size) : size;
  
  return {
    IND: convertSize(numSize, originalSystem, 'IND', gender),
    UK: convertSize(numSize, originalSystem, 'UK', gender),
    EU: convertSize(numSize, originalSystem, 'EU', gender),
  };
}

/**
 * Format size for display
 * @param {number|string} size - The size value
 * @param {string} system - Size system: 'IND', 'UK', or 'EU'
 * @returns {string} Formatted size string
 */
export function formatSize(size, system = 'IND') {
  if (!size) return '';
  return `${system} ${size}`;
}

/**
 * Check if a size chart type is valid
 * @param {string} sizeChartType - Size chart type to validate
 * @returns {boolean} True if valid
 */
export function isValidSizeChartType(sizeChartType) {
  return ['IND', 'UK', 'EU'].includes(sizeChartType);
}

export default {
  convertSize,
  convertSizes,
  toIndianSizes,
  getSizeSystems,
  getSizeConversions,
  formatSize,
  isValidSizeChartType,
};

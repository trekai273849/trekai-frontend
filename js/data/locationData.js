// js/data/locationData.js

// Major cities mapped to their continent and country
export const cityMappings = {
  // United Kingdom
  'london': { continent: 'europe', country: 'uk' },
  'manchester': { continent: 'europe', country: 'uk' },
  'birmingham': { continent: 'europe', country: 'uk' },
  'edinburgh': { continent: 'europe', country: 'uk' },
  'glasgow': { continent: 'europe', country: 'uk' },
  'bristol': { continent: 'europe', country: 'uk' },
  'liverpool': { continent: 'europe', country: 'uk' },
  'leeds': { continent: 'europe', country: 'uk' },
  'sheffield': { continent: 'europe', country: 'uk' },
  'newcastle': { continent: 'europe', country: 'uk' },
  'cardiff': { continent: 'europe', country: 'uk' },
  'belfast': { continent: 'europe', country: 'uk' },
  
  // France
  'paris': { continent: 'europe', country: 'france' },
  'lyon': { continent: 'europe', country: 'france' },
  'marseille': { continent: 'europe', country: 'france' },
  'toulouse': { continent: 'europe', country: 'france' },
  'nice': { continent: 'europe', country: 'france' },
  'chamonix': { continent: 'europe', country: 'france' },
  'grenoble': { continent: 'europe', country: 'france' },
  
  // Germany
  'berlin': { continent: 'europe', country: 'germany' },
  'munich': { continent: 'europe', country: 'germany' },
  'frankfurt': { continent: 'europe', country: 'germany' },
  'hamburg': { continent: 'europe', country: 'germany' },
  'cologne': { continent: 'europe', country: 'germany' },
  'stuttgart': { continent: 'europe', country: 'germany' },
  
  // Switzerland
  'zurich': { continent: 'europe', country: 'switzerland' },
  'geneva': { continent: 'europe', country: 'switzerland' },
  'basel': { continent: 'europe', country: 'switzerland' },
  'bern': { continent: 'europe', country: 'switzerland' },
  'interlaken': { continent: 'europe', country: 'switzerland' },
  
  // Italy
  'rome': { continent: 'europe', country: 'italy' },
  'milan': { continent: 'europe', country: 'italy' },
  'turin': { continent: 'europe', country: 'italy' },
  'florence': { continent: 'europe', country: 'italy' },
  'venice': { continent: 'europe', country: 'italy' },
  'naples': { continent: 'europe', country: 'italy' },
  
  // Spain
  'madrid': { continent: 'europe', country: 'spain' },
  'barcelona': { continent: 'europe', country: 'spain' },
  'valencia': { continent: 'europe', country: 'spain' },
  'seville': { continent: 'europe', country: 'spain' },
  'bilbao': { continent: 'europe', country: 'spain' },
  
  // USA
  'new york': { continent: 'americas', country: 'usa' },
  'los angeles': { continent: 'americas', country: 'usa' },
  'chicago': { continent: 'americas', country: 'usa' },
  'san francisco': { continent: 'americas', country: 'usa' },
  'seattle': { continent: 'americas', country: 'usa' },
  'denver': { continent: 'americas', country: 'usa' },
  'portland': { continent: 'americas', country: 'usa' },
  'boston': { continent: 'americas', country: 'usa' },
  'washington': { continent: 'americas', country: 'usa' },
  'atlanta': { continent: 'americas', country: 'usa' },
  'miami': { continent: 'americas', country: 'usa' },
  'dallas': { continent: 'americas', country: 'usa' },
  'houston': { continent: 'americas', country: 'usa' },
  'phoenix': { continent: 'americas', country: 'usa' },
  'philadelphia': { continent: 'americas', country: 'usa' },
  'san diego': { continent: 'americas', country: 'usa' },
  'austin': { continent: 'americas', country: 'usa' },
  'nashville': { continent: 'americas', country: 'usa' },
  'salt lake city': { continent: 'americas', country: 'usa' },
  'las vegas': { continent: 'americas', country: 'usa' },
  
  // Canada
  'toronto': { continent: 'americas', country: 'canada' },
  'vancouver': { continent: 'americas', country: 'canada' },
  'montreal': { continent: 'americas', country: 'canada' },
  'calgary': { continent: 'americas', country: 'canada' },
  'ottawa': { continent: 'americas', country: 'canada' },
  'edmonton': { continent: 'americas', country: 'canada' },
  'winnipeg': { continent: 'americas', country: 'canada' },
  
  // Australia
  'sydney': { continent: 'oceania', country: 'australia' },
  'melbourne': { continent: 'oceania', country: 'australia' },
  'brisbane': { continent: 'oceania', country: 'australia' },
  'perth': { continent: 'oceania', country: 'australia' },
  'adelaide': { continent: 'oceania', country: 'australia' },
  'canberra': { continent: 'oceania', country: 'australia' },
  'hobart': { continent: 'oceania', country: 'australia' },
  'darwin': { continent: 'oceania', country: 'australia' },
  'cairns': { continent: 'oceania', country: 'australia' },
  
  // New Zealand
  'auckland': { continent: 'oceania', country: 'new_zealand' },
  'wellington': { continent: 'oceania', country: 'new_zealand' },
  'christchurch': { continent: 'oceania', country: 'new_zealand' },
  'queenstown': { continent: 'oceania', country: 'new_zealand' },
  'dunedin': { continent: 'oceania', country: 'new_zealand' },
  
  // Asia
  'tokyo': { continent: 'asia', country: 'japan' },
  'osaka': { continent: 'asia', country: 'japan' },
  'kyoto': { continent: 'asia', country: 'japan' },
  'singapore': { continent: 'asia', country: 'singapore' },
  'hong kong': { continent: 'asia', country: 'hong_kong' },
  'seoul': { continent: 'asia', country: 'south_korea' },
  'beijing': { continent: 'asia', country: 'china' },
  'shanghai': { continent: 'asia', country: 'china' },
  'bangkok': { continent: 'asia', country: 'thailand' },
  'kuala lumpur': { continent: 'asia', country: 'malaysia' },
  'jakarta': { continent: 'asia', country: 'indonesia' },
  'delhi': { continent: 'asia', country: 'india' },
  'mumbai': { continent: 'asia', country: 'india' },
  'bangalore': { continent: 'asia', country: 'india' },
  'kathmandu': { continent: 'asia', country: 'nepal' },
  
  // Add more cities as needed...
};

// Common aliases and abbreviations
export const cityAliases = {
  'nyc': 'new york',
  'ny': 'new york',
  'sf': 'san francisco',
  'la': 'los angeles',
  'dc': 'washington',
  'philly': 'philadelphia',
  'vegas': 'las vegas',
  // Add more aliases...
};

// Keywords that indicate proximity
export const proximityKeywords = ['near', 'around', 'close to', 'by', 'outside', 'from'];

// Function to normalize city names (lowercase, trim, remove common words)
export function normalizeLocation(location) {
  return location
    .toLowerCase()
    .trim()
    .replace(/^(the|in|at)\s+/i, '') // Remove common prefixes
    .replace(/\s+city$/i, '') // Remove "city" suffix
    .replace(/\s+/g, ' '); // Normalize spaces
}
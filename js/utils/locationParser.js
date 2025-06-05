import { cityMappings, cityAliases, proximityKeywords } from '../data/locationData.js';

export function normalizeLocation(location) {
  return location
    .toLowerCase()
    .trim()
    .replace(/^(the|in|at)\s+/i, '')
    .replace(/\s+city$/i, '')
    .replace(/\s+/g, ' ');
}

export function detectLocationFromCity(input) {
  const lowerInput = input.toLowerCase();
  
  // Check for proximity keywords + city pattern
  for (const keyword of proximityKeywords) {
    const pattern = new RegExp(`${keyword}\\s+([\\w\\s]+?)(?:\\s+|$)`, 'i');
    const match = lowerInput.match(pattern);
    
    if (match) {
      const potentialCity = normalizeLocation(match[1]);
      
      // Check direct city mapping
      if (cityMappings[potentialCity]) {
        return {
          city: potentialCity,
          continent: cityMappings[potentialCity].continent,
          country: cityMappings[potentialCity].country
        };
      }
      
      // Check aliases
      if (cityAliases[potentialCity]) {
        const actualCity = cityAliases[potentialCity];
        if (cityMappings[actualCity]) {
          return {
            city: actualCity,
            continent: cityMappings[actualCity].continent,
            country: cityMappings[actualCity].country
          };
        }
      }
    }
  }
  
  return null;
}

export function parseUserInput(input) {
  const parsed = {
    trekType: null,
    duration: null,
    location: null,
    difficulty: null,
    season: null,
    accommodation: null
  };
  
  const lowerInput = input.toLowerCase();
  
  // First try city detection
  const cityResult = detectLocationFromCity(lowerInput);
  if (cityResult) {
    parsed.location = cityResult.continent;
    parsed.detectedCity = cityResult.city;
    parsed.detectedCountry = cityResult.country;
  }
  
  // Add all your existing parsing logic here...
  // (duration detection, difficulty detection, etc.)
  
  return parsed;
}
// Utility functions for cleaning and formatting trek titles

export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Enhanced trek title cleanup function
export function cleanTrekTitle(title, isPopularTrek = false) {
  if (!title) return 'Custom Itinerary';
  
  // For popular treks, preserve the original title
  if (isPopularTrek) {
    return title;
  }
  
  // Common patterns to remove from custom trek titles
  const patternsToRemove = [
    // Remove descriptive phrases about altitude and facilities
    /\s*in\s+low\s+altitude\s+with\s+the\s+ability\s+to\s+shower\s+most\s+nights?\s*/gi,
    /\s*with\s+the\s+ability\s+to\s+shower\s+most\s+nights?\s*/gi,
    /\s*in\s+low\s+altitude\s*/gi,
    
    // Remove duration patterns
    /\s*\d+\s*day\s*(trek|hike|trail|tour|trip|walk|itinerary)?\s*/gi,
    /\s*\(\s*\d+\s*days?\s*\)\s*/gi,
    
    // Remove generic trek/hike words at the end
    /\s*(trek|hike|trail|tour|trip|walk|itinerary)\s*$/gi,
    
    // Remove "in the" patterns
    /\s*in\s+the\s*/gi,
    
    // Remove extra whitespace
    /\s+/g
  ];
  
  let cleanedTitle = title;
  
  // Apply all removal patterns
  patternsToRemove.forEach(pattern => {
    cleanedTitle = cleanedTitle.replace(pattern, ' ');
  });
  
  // Trim and handle edge cases
  cleanedTitle = cleanedTitle.trim();
  
  // If we've removed everything or left with just articles, return a default
  if (!cleanedTitle || cleanedTitle.match(/^(the|a|an)$/i)) {
    // Try to extract location from original title
    const locationMatch = title.match(/(?:in\s+)?([\w\s]+?)(?:\s+in\s+|\s+with\s+|\s+trek|\s+hike|$)/i);
    if (locationMatch && locationMatch[1]) {
      return locationMatch[1].trim();
    }
    return 'Custom Trek';
  }
  
  return cleanedTitle;
}

// Extract subtitle from title (for view-itinerary page)
export function extractTrekSubtitle(title) {
  if (!title) return null;
  
  // Check for patterns that indicate a subtitle
  const subtitlePatterns = [
    /in\s+low\s+altitude\s+with\s+the\s+ability\s+to\s+shower\s+most\s+nights?/i,
    /with\s+the\s+ability\s+to\s+shower\s+most\s+nights?/i,
    /\d+\s*day\s*(trek|hike|trail|tour|trip|walk)/i
  ];
  
  for (const pattern of subtitlePatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}
// Utility functions for cleaning and formatting trek titles

export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Enhanced trek title cleanup function with structured format
export function cleanTrekTitle(title, isPopularTrek = false) {
  if (!title) return 'Custom Itinerary';
  
  // For popular treks, preserve the original title
  if (isPopularTrek) {
    return title;
  }
  
  // Extract location from title
  let location = '';
  
  // Try to extract location using various patterns
  // Pattern 1: "X Day Trek in [Location]"
  let match = title.match(/\d+\s*day\s*(?:trek|hike|trail|tour|trip|walk|itinerary)?\s*(?:in|to|at|near)?\s*(.+?)(?:\s+in\s+low\s+altitude|\s+with\s+the\s+ability|\s+trek|\s+hike|$)/i);
  
  if (!match) {
    // Pattern 2: "[Location] X Day Trek"
    match = title.match(/^(.+?)\s+\d+\s*day\s*(?:trek|hike|trail|tour|trip|walk|itinerary)?/i);
  }
  
  if (!match) {
    // Pattern 3: "Trek in [Location]"
    match = title.match(/(?:trek|hike|trail|tour|trip|walk)\s+(?:in|to|at)\s+(.+?)(?:\s+in\s+low\s+altitude|\s+with\s+the\s+ability|$)/i);
  }
  
  if (!match) {
    // Pattern 4: Just extract the main location words, removing common trek-related words
    const cleanedTitle = title
      .replace(/\s*in\s+low\s+altitude\s+with\s+the\s+ability\s+to\s+shower\s+most\s+nights?\s*/gi, '')
      .replace(/\s*with\s+the\s+ability\s+to\s+shower\s+most\s+nights?\s*/gi, '')
      .replace(/\s*\d+\s*day\s*/gi, '')
      .replace(/\s*(trek|hike|trail|tour|trip|walk|itinerary)\s*/gi, '')
      .replace(/\s+in\s+the\s*/gi, ' ')
      .replace(/\s+in\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    location = cleanedTitle;
  } else {
    location = match[1].trim();
  }
  
  // Clean up the location further
  location = location
    .replace(/\s*in\s+low\s+altitude.*/i, '')
    .replace(/\s*with\s+the\s+ability.*/i, '')
    .replace(/\s*(trek|hike|trail|tour|trip|walk|itinerary)\s*$/i, '')
    .replace(/^(in|to|at|the)\s+/i, '')
    .trim();
  
  // If we still don't have a location or it's too short, use a default
  if (!location || location.length < 3) {
    location = 'Custom Trek';
  }
  
  // Apply title case to location
  return toTitleCase(location);
}

// Extract duration and format as "X Day Adventure"
export function extractTrekSubtitle(title) {
  if (!title) return null;
  
  // Extract number of days from title
  const daysMatch = title.match(/(\d+)\s*day/i);
  
  if (daysMatch && daysMatch[1]) {
    const days = daysMatch[1];
    return `${days} Day Adventure`;
  }
  
  // If no days found, return null (no subtitle)
  return null;
}

// New function to get both title and subtitle in one call
export function getStructuredTrekTitle(title, isPopularTrek = false) {
  const mainTitle = cleanTrekTitle(title, isPopularTrek);
  const subtitle = extractTrekSubtitle(title);
  
  return {
    title: mainTitle,
    subtitle: subtitle
  };
}
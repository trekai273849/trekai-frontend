// Utility functions for cleaning and formatting trek titles

export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function cleanTrekTitle(title, isPopularTrek) {
  if (!title || isPopularTrek) return title;
  
  let cleaned = title;
  
  // Handle repetitive patterns like "Trek in X that is Y" or "Trek in X for a week Y"
  const patterns = [
    /^(.+?)\s+(?:that\s+is|which\s+is)\s+(.+)$/i,
    /^(.+?)\s+(?:for\s+a\s+week|for\s+\d+\s+days?)\s+(.+)$/i
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      cleaned = match[1];
      break;
    }
  }
  
  // Remove common prefixes and suffixes
  cleaned = cleaned
    .replace(/^trek\s+in\s+the\s+/i, '')
    .replace(/^trek\s+in\s+/i, '')
    .replace(/^hike\s+in\s+the\s+/i, '')
    .replace(/^hike\s+in\s+/i, '')
    .replace(/\s+trek$/i, '')
    .replace(/\s+hike$/i, '')
    .trim();
  
  // Extract location-based title if it matches pattern
  const locationMatch = cleaned.match(/\d+\s*day\s*(?:trek|hike)\s*(?:in|near)\s*(?:the\s+)?(.+)/i);
  if (locationMatch && locationMatch[1]) {
    // Return just the location part with "Trek" appended
    cleaned = locationMatch[1];
  }
  
  // Ensure we have a valid title
  if (!cleaned || cleaned.length < 3) {
    return 'Custom Trek';
  }
  
  // Add "Trek" suffix if it doesn't already have it
  if (!cleaned.toLowerCase().includes('trek') && !cleaned.toLowerCase().includes('hike')) {
    cleaned = cleaned + ' Trek';
  }
  
  return toTitleCase(cleaned);
}

export function extractTrekSubtitle(title) {
  if (!title) return null;
  
  // Check for repetitive patterns that might contain a subtitle
  const repetitivePattern = /^(.+?)\s+(?:that\s+is|which\s+is|for\s+a\s+week)\s+(.+)$/i;
  const match = title.match(repetitivePattern);
  
  if (match) {
    const mainTitle = match[1];
    const subtitle = match[2];
    
    // Only return subtitle if it's meaningful and different from main title
    if (subtitle && 
        !subtitle.toLowerCase().includes(mainTitle.toLowerCase()) &&
        subtitle.length > 5) {
      return toTitleCase(subtitle);
    }
  }
  
  return null;
}
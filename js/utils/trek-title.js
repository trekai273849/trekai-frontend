// js/utils/trek-title.js
// Shared utility for cleaning and formatting trek titles across the application

export function toTitleCase(str) {
  if (!str) return str;
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function cleanTrekTitle(title, isPopularTrek) {
  if (!title || isPopularTrek) return title;
  
  // Remove redundant "Trek" at the end
  let cleanTitle = title.replace(/\s+Trek$/i, '');
  
  // Try to extract key information (location, duration, type)
  let location = null;
  let duration = null;
  let trekType = null;
  
  // Pattern 1: "Trek in [location] for [duration]"
  const pattern1 = cleanTitle.match(/trek\s+in\s+(?:the\s+)?([^for]+?)(?:\s+for\s+(.+))?/i);
  if (pattern1) {
    location = pattern1[1].trim();
    duration = pattern1[2] ? pattern1[2].trim() : null;
  }
  
  // Pattern 2: "[duration] trek/hike in [location]"
  if (!location) {
    const pattern2 = cleanTitle.match(/(\d+\s*(?:day|week|month))s?\s*(?:trek|hike)\s*(?:in|near|at|through)\s*(?:the\s+)?(.+)/i);
    if (pattern2) {
      duration = pattern2[1];
      location = pattern2[2].trim();
    }
  }
  
  // Pattern 3: Extract location from phrases containing known location indicators
  if (!location) {
    const locationMatch = cleanTitle.match(/(?:in|at|near|through|around|across)\s+(?:the\s+)?([A-Z][^\s,]+(?:\s+[A-Z][^\s,]+)*)/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }
  }
  
  // Pattern 4: Look for duration anywhere in the title
  if (!duration) {
    const durationMatch = cleanTitle.match(/(\d+\s*(?:day|week|month))s?/i);
    if (durationMatch) {
      duration = durationMatch[1];
    }
  }
  
  // Clean up extracted location
  if (location) {
    // Remove common trailing phrases
    location = location.replace(/\s*(that\s+is|with|for\s+a|trek|hike).*$/i, '').trim();
    
    // Handle specific cases
    location = location.replace(/^the\s+/i, ''); // Remove leading "the"
    location = location.replace(/\s+for\s+.+$/i, ''); // Remove "for..." phrases
    
    // Title case the location
    location = toTitleCase(location);
  }
  
  // Convert duration phrases
  if (duration) {
    // Convert "a week" or "one week" to "7 Day"
    duration = duration.replace(/(?:a|one)\s+week/i, '7 day');
    // Convert "two weeks" to "14 Day"
    duration = duration.replace(/two\s+weeks?/i, '14 day');
    // Normalize format
    duration = duration.replace(/(\d+)\s*days?/i, '$1 Day');
  }
  
  // Build the clean title
  if (location) {
    let finalTitle = location + ' Trek';
    
    // Include duration if it's clean and numeric
    if (duration && duration.match(/^\d+\s*Day/i)) {
      const days = duration.match(/(\d+)/)[1];
      finalTitle = location + ' ' + days + ' Day Trek';
    }
    
    return finalTitle;
  }
  
  // Fallback: if no patterns match, try to make it more concise
  // Remove common verbose phrases
  cleanTitle = cleanTitle.replace(/that\s+is\s+day\s+hikes?\s+with.*/i, '');
  cleanTitle = cleanTitle.replace(/for\s+a\s+week/i, '7 Day');
  cleanTitle = cleanTitle.replace(/\s+hike/i, ' Trek');
  
  // Last resort: if still too long, truncate intelligently
  if (cleanTitle.length > 40) {
    const words = cleanTitle.split(' ');
    if (words.length > 5) {
      // Keep first few important words
      cleanTitle = words.slice(0, 4).join(' ') + ' Trek';
    }
  }
  
  return toTitleCase(cleanTitle);
}

// Extract subtitle from original title (for trek pages)
export function extractTrekSubtitle(originalTitle, cleanedTitle) {
  if (!originalTitle || originalTitle === cleanedTitle) return null;
  
  // Try to extract meaningful subtitle information
  const dayMatch = originalTitle.match(/(\d+)[-\s]*day/i);
  const hikeTypeMatch = originalTitle.match(/day\s+hikes?/i);
  const restDayMatch = originalTitle.match(/(\d+)\s+rest\s+days?/i);
  
  let subtitle = '';
  
  if (dayMatch) {
    subtitle = `${dayMatch[1]} Day`;
  }
  
  if (hikeTypeMatch) {
    subtitle += subtitle ? ' Hike' : 'Day Hikes';
  }
  
  if (restDayMatch) {
    subtitle += ` with ${restDayMatch[1]} Rest Day${parseInt(restDayMatch[1]) > 1 ? 's' : ''}`;
  }
  
  // If we extracted a subtitle, add location context
  if (subtitle && !subtitle.toLowerCase().includes(cleanedTitle.toLowerCase().replace(' trek', ''))) {
    const location = cleanedTitle.replace(' Trek', '');
    subtitle += ` in ${location}`;
  }
  
  return subtitle || null;
}
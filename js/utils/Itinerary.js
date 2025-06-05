// js/utils/itinerary.js - Updated with extractDays export for map functionality
// This file contains utility functions for processing and displaying itineraries

/**
 * Process raw itinerary content for display
 * @param {string} content - The raw itinerary content
 * @param {HTMLElement} container - The container element to render into
 */
export function processItineraryContent(content, container) {
  if (!content || !container) return;

  // Add the necessary CSS styles if not already present
  addRequiredStyles();

  // Clean up the content by removing any extra markdown or formatting issues
  const cleanedContent = preprocessRawText(content);

  // Extract sections
  const intro = extractIntroduction(cleanedContent);
  const days = extractDays(cleanedContent);
  const packingList = extractSection(cleanedContent, 'Packing List');
  const localInsights = extractSection(cleanedContent, 'Local Insights');
  const practicalInfo = extractSection(cleanedContent, 'Practical Information');

  // Render the content into the container
  renderContent(intro, days, packingList, localInsights, practicalInfo, container);
}

/**
 * Add required CSS styles for proper accordion functionality
 */
function addRequiredStyles() {
  // Check if styles are already added
  if (document.getElementById('itinerary-accordion-styles')) return;

  const style = document.createElement('style');
  style.id = 'itinerary-accordion-styles';
  style.textContent = `
    .bg-earthy-green {
      background-color: #e8f0e5; /* Subtle sage green */
    }
    .bg-earthy-tan {
      background-color: #f2efe9; /* Warm stone/sand color */
    }
    .bg-earthy-blue {
      background-color: #e6eef2; /* Muted sky blue */
    }
    .text-earthy-green {
      color: #3c6e47; /* Darker green for text */
    }
    .text-earthy-tan {
      color: #7d6c54; /* Darker tan for text */
    }
    .text-earthy-blue {
      color: #496a81; /* Darker blue for text */
    }
    .bg-mountain-blue {
      background-color: #e6eef2; /* Light mountain blue for day headers */
    }
    
    /* Accordion specific styles */
    .accordion-toggle {
      transition: background-color 0.2s ease;
      border: none;
      cursor: pointer;
    }
    
    .accordion-toggle:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .accordion-body {
      transition: max-height 0.3s ease-out;
      overflow: hidden;
    }
    
    .accordion-body.expanded {
      max-height: 1000px; /* Large enough to accommodate content */
    }
    
    .rotate-180 {
      transform: rotate(180deg);
    }
    
    /* Override any conflicting styles */
    .accordion-body.max-h-0 {
      max-height: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Preprocesses the raw text to normalize formatting issues
 * @param {string} text 
 * @returns {string}
 */
export function preprocessRawText(text) {
  if (!text) return '';
  
  let processed = text;
  
  // Fix fields preceded by newlines and dashes
  const fieldNames = [
    'Start:', 'End:', 'Distance:', 'Elevation gain:', 'Elevation gain/loss:', 'Elevation:',
    'Terrain:', 'Difficulty:', 'Highlights:', 'Lunch:', 'Accommodation:',
    'Water sources:', 'Tips:'
  ];

  fieldNames.forEach(field => {
    // Replace any pattern of newline + optional whitespace + optional dash + whitespace + field
    const regex = new RegExp(`\\n\\s*-?\\s*(${field.replace(':', '\\:')})`, 'g');
    processed = processed.replace(regex, `\n- ${field}`);
  });

  // Normalize day headers
  processed = processed.replace(/### Day \d+\s*:?\s*/g, match => {
    // Ensure the colon is present and format is consistent
    return match.endsWith(':') ? match : match + ': ';
  });
  
  // Fix merged Tips and Packing List sections
  processed = processed.replace(/(Tips:.+?)(\*Essentials:\*)/gs, '$1\n\n### Packing List\n$2');
  
  // Fix any Tips field that contains "Packing List"
  processed = processed.replace(/(Tips:.+?)(Packing List)/gs, '$1\n\n### $2');
  
  // Remove standalone ### markers
  processed = processed.replace(/^###\s*$/gm, '');
  processed = processed.replace(/\n###\s*$/gm, '');
  processed = processed.replace(/###\s*$/, '');
  
  // Remove trailing ### from any line
  processed = processed.replace(/(.+?)###\s*$/gm, '$1');
  
  return processed;
}

/**
 * Extracts the introduction text from the content
 * @param {string} text 
 * @returns {string}
 */
function extractIntroduction(text) {
  const introRegex = /^([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+:|$)/i;
  const introMatch = text.match(introRegex);
  const intro = introMatch && introMatch[1].trim();
  
  if (intro && intro.length > 10) {
    return intro.replace(/#{1,3}/g, '').trim();
  }
  return '';
}

/**
 * Extracts the day sections from the content - NOW EXPORTED FOR MAP FUNCTIONALITY
 * @param {string} text 
 * @returns {Array<Object>}
 */
export function extractDays(text) {
  const days = [];
  const dayRegex = /(?:(?:\*\*\*|\#{1,3}|\*\*|\*)?\s*Day\s+(\d+)[:\s]+([^\n]*?)(?:\*\*\*|\*\*|\*)?)(?:\n)([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+[:\s]|#{1,3}\s*Packing List|#{1,3}\s*Local Insights|#{1,3}\s*Practical Information|$)/gi;
  
  let dayMatch;
  while ((dayMatch = dayRegex.exec(text)) !== null) {
    const dayNum = dayMatch[1];
    const title = dayMatch[2].trim();
    const bodyText = dayMatch[3].trim().replace(/#{1,3}/g, '');
    
    // Parse fields from the body text
    const fields = {};
    const knownFields = [
      'Start', 'End', 'Distance', 'Elevation gain', 'Elevation gain/loss', 'Elevation',
      'Terrain', 'Difficulty', 'Highlights', 'Lunch', 'Accommodation',
      'Water sources', 'Tips'
    ];
    
    knownFields.forEach(field => {
      const fieldPattern = new RegExp(`(?:^|\\n)\\s*-?\\s*${field}:\\s*([\\s\\S]*?)(?=(?:\\n\\s*-?\\s*(?:${knownFields.join('|')}):|\\n\\n\\*|$))`, 'i');
      const match = bodyText.match(fieldPattern);
      if (match) {
        let content = match[1].trim();
        
        // Special handling for Tips field
        if (field === 'Tips' && content.includes('Packing List')) {
          content = content.split(/Packing List|\*/)[0].trim();
        }
        
        fields[field] = content.replace(/\*.*?\*/g, '').replace(/#{1,3}/g, '');
      }
    });
    
    days.push({
      dayNum,
      title,
      bodyText,
      fields,
      // Add structured data for map functionality
      start: fields.Start || null,
      end: fields.End || null,
      distance: fields.Distance || null,
      elevation: fields['Elevation gain'] || fields['Elevation gain/loss'] || fields.Elevation || null
    });
  }
  
  return days.sort((a, b) => parseInt(a.dayNum) - parseInt(b.dayNum));
}

/**
 * Extracts a specific section from the content
 * @param {string} text 
 * @param {string} header 
 * @returns {string}
 */
export function extractSection(text, header) {
  // Special case for Packing List which might be merged with Tips
  if (header === 'Packing List') {
    const tipsPackingMergeCheck = text.match(/Tips:[\s\S]*?\*Essentials:\*/);
    if (tipsPackingMergeCheck) {
      const packingContent = text.match(/\*Essentials:\*[\s\S]*?(?=\n#{1,3}\s|$)/);
      if (packingContent) {
        return packingContent[0].trim();
      }
    }
  }
  
  // Standard section extraction
  const regex = new RegExp(`#{1,3}\\s*${header}[\\s\\S]*?(?=\\n#{1,3}\\s|$)`, 'i');
  const match = text.match(regex);
  if (match) {
    return match[0].replace(new RegExp(`#{1,3}\\s*${header}`, 'i'), '').replace(/#{1,3}/g, '').trim();
  }
  
  // Try alternate format (without ### but with header)
  const altRegex = new RegExp(`${header}[\\s\\S]*?(?=\\n#{1,3}\\s|$)`, 'i');
  const altMatch = text.match(altRegex);
  return altMatch ? altMatch[0].replace(new RegExp(`${header}:?`, 'i'), '').replace(/#{1,3}/g, '').trim() : '';
}

/**
 * Processes subsections with enhanced formatting
 * @param {string} content 
 * @returns {string}
 */
export function processSubsections(content) {
  if (!content) return '';
  
  // Format subsection headers
  let formatted = content.replace(/\*(.*?):\*/g, '<h4 class="font-bold text-gray-800 mt-3 mb-2">$1</h4>');
  
  // Format bold text
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Remove any markdown characters
  formatted = formatted.replace(/#{1,3}/g, '');
  
  // Process bullet points and convert to a better-looking list
  const lines = formatted.split('\n');
  let htmlContent = '';
  let inList = false;
  
  lines.forEach(line => {
    line = line.trim();
    
    if (line.startsWith('<h4')) {
      // Close any open list before starting a new section
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      htmlContent += line;
    } else if (line.startsWith('-')) {
      if (!inList) {
        htmlContent += '<ul class="list-disc pl-5 mb-4 text-gray-700">';
        inList = true;
      }
      htmlContent += `<li class="mb-1">${line.substring(1).trim()}</li>`;
    } else if (line) {
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      htmlContent += `<p class="mb-2 text-gray-700">${line}</p>`;
    }
  });
  
  // Close any open list
  if (inList) {
    htmlContent += '</ul>';
  }
  
  return htmlContent;
}

/**
 * Renders the processed content into the container
 * @param {string} intro 
 * @param {Array<Object>} days 
 * @param {string} packingList 
 * @param {string} localInsights 
 * @param {string} practicalInfo 
 * @param {HTMLElement} container 
 */
function renderContent(intro, days, packingList, localInsights, practicalInfo, container) {
  // Clear the container
  container.innerHTML = '';
  
  // Render intro if available
  if (intro) {
    const introBlock = document.createElement('div');
    introBlock.className = 'mb-6 text-gray-700';
    introBlock.innerHTML = `<p class="mb-4">${intro.replace(/\n/g, '<br>')}</p>`;
    container.appendChild(introBlock);
  }
  
  // Render days
  if (days && days.length > 0) {
    const daysHeader = document.createElement('h2');
    daysHeader.className = 'text-2xl font-bold text-gray-800 mb-4 mt-6';
    daysHeader.innerText = 'Itinerary';
    container.appendChild(daysHeader);
    
    days.forEach(day => {
      const card = createAccordionCard(
        `Day ${day.dayNum}: ${day.title}`,
        renderDayContent(day),
        false,
        'bg-mountain-blue'
      );
      container.appendChild(card);
    });
  }
  
  // Render additional sections
  if (packingList || localInsights || practicalInfo) {
    const extrasHeader = document.createElement('h2');
    extrasHeader.className = 'text-2xl font-bold text-gray-800 mb-4 mt-10';
    extrasHeader.innerText = 'Additional Information';
    container.appendChild(extrasHeader);
    
    // Render packing list
    if (packingList) {
      const formattedPackingList = processSubsections(packingList);
      container.appendChild(createAccordionCard('Packing List', formattedPackingList, false, 'bg-earthy-green'));
    }
    
    // Render local insights
    if (localInsights) {
      const formattedInsights = processSubsections(localInsights);
      container.appendChild(createAccordionCard('Local Insights', formattedInsights, false, 'bg-earthy-tan'));
    }
    
    // Render practical information
    if (practicalInfo) {
      const formattedInfo = processSubsections(practicalInfo);
      container.appendChild(createAccordionCard('Practical Information', formattedInfo, false, 'bg-earthy-blue'));
    }
  }
}

/**
 * Creates an accordion card with proper event handling
 * @param {string} title 
 * @param {string} content 
 * @param {boolean} open 
 * @param {string} bgColor 
 * @returns {HTMLElement}
 */
function createAccordionCard(title, content, open = false, bgColor = 'bg-mountain-blue') {
  const card = document.createElement('div');
  card.className = 'mb-4 border border-gray-200 rounded shadow-sm';

  card.innerHTML = `
    <button class="w-full flex justify-between items-center px-4 py-3 ${bgColor} text-left font-semibold text-gray-800 focus:outline-none accordion-toggle">
      <span>${title}</span>
      <svg class="w-5 h-5 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div class="accordion-body ${open ? 'expanded' : 'max-h-0'} bg-white px-4">
      <div class="py-3">${content}</div>
    </div>
  `;

  const toggle = card.querySelector('.accordion-toggle');
  const body = card.querySelector('.accordion-body');
  const icon = card.querySelector('svg');

  // Add click event listener with proper debugging
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Accordion clicked:', title); // Debug log
    
    // Toggle the accordion state
    const isCurrentlyOpen = !body.classList.contains('max-h-0');
    
    if (isCurrentlyOpen) {
      // Close the accordion
      body.classList.remove('expanded');
      body.classList.add('max-h-0');
      icon.classList.remove('rotate-180');
    } else {
      // Open the accordion
      body.classList.remove('max-h-0');
      body.classList.add('expanded');
      icon.classList.add('rotate-180');
    }
  });

  return card;
}

/**
 * Renders the content for a day card
 * @param {Object} day 
 * @returns {string}
 */
function renderDayContent(day) {
  if (!day || !day.fields) return '';

  const fieldItems = [];
  const knownFields = [
    'Start', 'End', 'Distance', 'Elevation gain', 'Elevation gain/loss', 'Elevation',
    'Terrain', 'Difficulty', 'Highlights', 'Lunch', 'Accommodation',
    'Water sources', 'Tips'
  ];
  
  knownFields.forEach(field => {
    if (day.fields[field]) {
      // Style fields based on their type
      if (field === 'Highlights' || field === 'Terrain' || field === 'Water sources') {
        fieldItems.push(`<li class="mb-2"><strong class="text-earthy-green">${field}:</strong> <span class="text-gray-700">${day.fields[field]}</span></li>`);
      } else if (field === 'Difficulty') {
        let difficultyClass = 'text-green-600';
        const difficultyValue = day.fields[field].toLowerCase();
        if (difficultyValue.includes('moderate')) {
          difficultyClass = 'text-yellow-600';
        } else if (difficultyValue.includes('challenging') || difficultyValue.includes('difficult')) {
          difficultyClass = 'text-red-600';
        }
        fieldItems.push(`<li class="mb-2"><strong>${field}:</strong> <span class="${difficultyClass}">${day.fields[field]}</span></li>`);
      } else {
        fieldItems.push(`<li class="mb-2"><strong>${field}:</strong> ${day.fields[field]}</li>`);
      }
    }
  });
  
  if (fieldItems.length > 0) {
    return `<ul class="list-none py-2">${fieldItems.join('')}</ul>`;
  } else {
    // If no structured fields were found, return the raw body text
    return `<p>${day.bodyText}</p>`;
  }
}

/**
 * Enhanced version of processSubsections specifically for the customize page
 * @param {string} content 
 * @returns {string}
 */
export function processSubsectionsEnhanced(content) {
  const lines = content.split('\n');
  let html = '';
  let currentSubsection = null;
  let currentItems = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^\*(.+?):\*$/) || trimmedLine.match(/^(.+?):$/)) {
      if (currentSubsection) {
        html += createSubsection(currentSubsection, currentItems);
      }
      
      currentSubsection = trimmedLine.replace(/^\*|\*$/g, '').replace(/:$/, '');
      currentItems = [];
    } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
      currentItems.push(trimmedLine.substring(1).trim());
    } else if (trimmedLine) {
      if (currentSubsection) {
        currentItems.push(trimmedLine);
      } else {
        html += `<p style="margin-bottom: 15px; line-height: 1.8;">${trimmedLine}</p>`;
      }
    }
  });

  if (currentSubsection) {
    html += createSubsection(currentSubsection, currentItems);
  }

  return html || `<div style="white-space: pre-wrap; line-height: 1.8;">${content}</div>`;
}

/**
 * Helper to create subsection HTML for enhanced version
 * @param {string} title 
 * @param {Array} items 
 * @returns {string}
 */
function createSubsection(title, items) {
  return `
    <div style="margin-bottom: 25px;">
      <h4 style="font-weight: 600; color: var(--text-dark); margin-bottom: 15px; font-size: 1.1em;">${title}</h4>
      <ul style="list-style: none; padding: 0;">
        ${items.map(item => `
          <li style="padding: 8px 0; padding-left: 20px; position: relative; color: var(--text-light);">
            <span style="position: absolute; left: 0; color: var(--primary);">•</span>
            ${item}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}
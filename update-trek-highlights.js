const fs = require('fs');
const path = require('path');

// Configuration
const TREKS_FOLDER = './output/treks';
const JSON_DATA_PATH = './data/all-treks-combined.json'; // Adjust path to your JSON file

// Generate highlights for a specific trek
function generateTrekHighlights(trekData) {
  const highlights = [];
  
  // 1. Cultural Highlight
  if (trekData.cultural_information) {
    const ethnicGroups = trekData.cultural_information.ethnic_groups;
    const primaryGroup = ethnicGroups[0];
    const religion = trekData.cultural_information.primary_religion;
    
    highlights.push({
      icon: '🏛️',
      title: `${primaryGroup} Culture`,
      description: `Experience ${religion} traditions and ${ethnicGroups.slice(0, 3).join(', ')} communities`
    });
  }
  
  // 2. Natural/Elevation Highlight
  const elevationIcon = trekData.max_elevation_m > 5000 ? '🏔️' : '⛰️';
  const elevationTitle = trekData.max_elevation_m > 5000 ? 'High Altitude Trek' : 'Mountain Journey';
  
  highlights.push({
    icon: elevationIcon,
    title: elevationTitle,
    description: `Reach ${trekData.max_elevation_m.toLocaleString()}m with ${extractKeyView(trekData)}`
  });
  
  // 3. Unique Feature
  highlights.push(extractUniqueFeature(trekData));
  
  // 4. Activity/Experience
  highlights.push(extractExperienceHighlight(trekData));
  
  return highlights;
}

// Helper function to extract key views
function extractKeyView(trekData) {
  const allHighlights = trekData.detailed_itinerary
    .flatMap(day => day.highlights || [])
    .join(' ').toLowerCase();
  
  // Trek-specific views
  const viewPatterns = [
    { pattern: 'everest', result: 'views of Everest and surrounding peaks' },
    { pattern: 'annapurna', result: 'Annapurna massif panoramas' },
    { pattern: 'glacier', result: 'dramatic glacier landscapes' },
    { pattern: 'lake', result: 'pristine mountain lakes' },
    { pattern: 'volcano', result: 'volcanic landscapes' },
    { pattern: 'torres', result: 'iconic granite towers' },
    { pattern: 'mont blanc', result: 'Alpine giant views' },
    { pattern: 'inca', result: 'ancient Incan sites' }
  ];
  
  for (const { pattern, result } of viewPatterns) {
    if (allHighlights.includes(pattern)) return result;
  }
  
  return 'spectacular mountain vistas';
}

// Extract unique feature for each trek
function extractUniqueFeature(trekData) {
  // Map specific features by trek slug
  const featureMap = {
    'everest-base-camp-trek': { 
      icon: '⛺', 
      title: 'Everest Base Camp', 
      description: 'Stand at 5,364m at the base of the world\'s highest peak' 
    },
    'annapurna-circuit-trek': { 
      icon: '🎯', 
      title: 'Thorong La Pass', 
      description: 'Conquer the challenging 5,416m mountain pass' 
    },
    'langtang-valley-trek': { 
      icon: '🧀', 
      title: 'Kyanjin Gompa', 
      description: 'Visit traditional yak cheese factory and monastery' 
    },
    'classic-inca-trail': { 
      icon: '🏛️', 
      title: 'Machu Picchu', 
      description: 'Arrive at the Lost City through the Sun Gate' 
    },
    'torres-del-paine-w-circuit': { 
      icon: '🏔️', 
      title: 'Las Torres', 
      description: 'Witness the iconic granite towers at sunrise' 
    },
    'tour-du-mont-blanc': { 
      icon: '🌍', 
      title: 'Three Countries', 
      description: 'Trek through France, Italy, and Switzerland' 
    },
    'kungsleden-kings-trail': { 
      icon: '☀️', 
      title: 'Midnight Sun', 
      description: 'Experience 24-hour daylight in Arctic summer' 
    },
    'lofoten-islands-trek': { 
      icon: '🏔️', 
      title: 'Arctic Peaks', 
      description: 'Dramatic mountains rising from the sea' 
    },
    'gr20-corsica': { 
      icon: '⛰️', 
      title: 'Europe\'s Toughest', 
      description: 'Tackle the most challenging GR trail' 
    },
    'haute-route-chamonix-zermatt': { 
      icon: '🏔️', 
      title: 'Glacier Traverse', 
      description: 'Cross high Alpine passes between two iconic towns' 
    },
    'dolomites-alta-via-1': { 
      icon: '🏔️', 
      title: 'Via Ferrata', 
      description: 'Option for protected climbing routes' 
    },
    'huayhuash-circuit': { 
      icon: '🏔️', 
      title: 'Remote Wilderness', 
      description: 'One of Peru\'s most spectacular and isolated treks' 
    },
    'salkantay-trek': { 
      icon: '🏔️', 
      title: 'Salkantay Pass', 
      description: 'Cross 4,630m pass below sacred Apu Salkantay' 
    },
    'santa-cruz-trek': { 
      icon: '🏔️', 
      title: 'Cordillera Blanca', 
      description: 'Trek through Peru\'s highest mountain range' 
    },
    'fitz-roy-trek': { 
      icon: '🏔️', 
      title: 'Cerro Fitz Roy', 
      description: 'Iconic jagged peaks of Patagonia' 
    },
    'huemul-circuit': { 
      icon: '🧊', 
      title: 'Southern Ice Field', 
      description: 'Views of massive Patagonian glaciers' 
    },
    'gokyo-lakes-trek': { 
      icon: '💎', 
      title: 'Turquoise Lakes', 
      description: 'Chain of sacred high-altitude lakes' 
    },
    'annapurna-base-camp-trek': { 
      icon: '♨️', 
      title: 'Natural Hot Springs', 
      description: 'Relax at Jhinu Danda hot springs' 
    },
    'upper-mustang-trek': { 
      icon: '🏜️', 
      title: 'Forbidden Kingdom', 
      description: 'Ancient Tibetan kingdom preserved in time' 
    },
    'jotunheimen-traverse': { 
      icon: '🏔️', 
      title: 'Giants\' Home', 
      description: 'Norway\'s highest peaks including Galdhøpiggen' 
    }
  };
  
  // Return specific feature or generate from data
  if (featureMap[trekData.slug]) {
    return featureMap[trekData.slug];
  }
  
  // Fallback: extract from itinerary highlights
  const highlights = trekData.detailed_itinerary.flatMap(day => day.highlights || []);
  
  if (highlights.some(h => h.toLowerCase().includes('monastery'))) {
    const monastery = highlights.find(h => h.toLowerCase().includes('monastery'));
    return { icon: '🏛️', title: 'Buddhist Monasteries', description: monastery };
  }
  
  if (highlights.some(h => h.toLowerCase().includes('pass'))) {
    const pass = highlights.find(h => h.toLowerCase().includes('pass'));
    return { icon: '⛰️', title: 'Mountain Pass', description: pass };
  }
  
  return { 
    icon: '🌄', 
    title: 'Scenic Journey', 
    description: `${trekData.duration.recommended_days}-day adventure through stunning landscapes` 
  };
}

// Extract experience highlight
function extractExperienceHighlight(trekData) {
  // Check for sunrise/sunset experiences
  const sunriseHighlights = trekData.detailed_itinerary
    .flatMap(day => day.highlights || [])
    .filter(h => h.toLowerCase().includes('sunrise'));
  
  if (sunriseHighlights.length > 0) {
    return {
      icon: '🌅',
      title: 'Sunrise Views',
      description: sunriseHighlights[0]
    };
  }
  
  // Check for wildlife
  if (trekData.special_considerations?.wildlife) {
    const wildlife = trekData.special_considerations.wildlife;
    const animals = wildlife.match(/([a-z]+ ?[a-z]*(?:,|and))/gi);
    if (animals) {
      return {
        icon: '🦌',
        title: 'Wildlife Spotting',
        description: `Chance to see ${animals.slice(0, 2).join(' ')}`
      };
    }
  }
  
  // Check for local foods
  if (trekData.cultural_information?.local_foods?.length > 0) {
    const food = trekData.cultural_information.local_foods[0];
    return {
      icon: '🍲',
      title: 'Local Cuisine',
      description: `Try ${food.name} - ${food.description}`
    };
  }
  
  // Default based on region
  const regionDefaults = {
    'Nepal/Himalayas': { icon: '👥', title: 'Sherpa Hospitality', description: 'Stay in traditional tea houses with local families' },
    'Peru/Andes': { icon: '🦙', title: 'Andean Wildlife', description: 'Spot llamas, alpacas, and condors' },
    'Patagonia': { icon: '🌬️', title: 'Patagonian Winds', description: 'Experience the raw power of nature' },
    'Alps': { icon: '🏔️', title: 'Alpine Culture', description: 'Mountain huts and local traditions' },
    'Scandinavia': { icon: '🦌', title: 'Arctic Wildlife', description: 'Reindeer herds and pristine wilderness' }
  };
  
  for (const [region, defaultHighlight] of Object.entries(regionDefaults)) {
    if (trekData.region?.includes(region)) {
      return defaultHighlight;
    }
  }
  
  return { 
    icon: '🥾', 
    title: 'Trekking Experience', 
    description: `${trekData.difficulty} trek through diverse landscapes` 
  };
}

// Generate HTML for highlights
function generateHighlightHTML(highlights) {
  const highlightItems = highlights.map(highlight => `
                    <div class="highlight-item">
                        <span class="highlight-icon">${highlight.icon}</span>
                        <div class="highlight-text">
                            <h4>${highlight.title}</h4>
                            <p>${highlight.description}</p>
                        </div>
                    </div>`).join('');
  
  return highlightItems;
}

// Update a single HTML file
function updateHTMLFile(filePath, trekData) {
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Generate new highlights
  const highlights = generateTrekHighlights(trekData);
  const highlightHTML = generateHighlightHTML(highlights);
  
  // First, fix the structure by finding the entire overview section
  // This regex captures from <div class="highlights-list"> through ALL duplicate content
  const fixStructurePattern = /<div class="highlights-list">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="highlight-item">[\s\S]*?<\/div>\s*<\/div>\s*<div class="flex justify-center/;
  
  if (fixStructurePattern.test(html)) {
    // Replace with clean structure
    html = html.replace(
      fixStructurePattern,
      `<div class="highlights-list">${highlightHTML}
                </div>

                <div class="flex justify-center`
    );
    
    // Also ensure the overview-main div is properly closed
    const overviewMainPattern = /(<div class="overview-main">[\s\S]*?<div class="highlights-list">[\s\S]*?<\/div>)\s*<\/div>\s*<\/div>/;
    if (!overviewMainPattern.test(html)) {
      // Add missing closing div for overview-main if needed
      const saveButtonPattern = /(<\/div>\s*<div class="flex justify-center)/;
      html = html.replace(saveButtonPattern, '</div>\n\n$1');
    }
    
    fs.writeFileSync(filePath, html);
    console.log(`✅ Fixed structure and updated: ${path.basename(filePath)}`);
  } else {
    // Try simpler pattern if the complex one doesn't match
    const simplePattern = /<div class="highlights-list">[\s\S]*?<\/div>(?=\s*<\/div>)/;
    
    if (simplePattern.test(html)) {
      html = html.replace(
        simplePattern,
        `<div class="highlights-list">${highlightHTML}
                </div>`
      );
      
      // Remove any duplicate highlight items that appear after
      const duplicatePattern = /<div class="highlight-item">[\s\S]*?Cultural Experience[\s\S]*?Local Communities[\s\S]*?<\/div>\s*<\/div>/;
      html = html.replace(duplicatePattern, '');
      
      fs.writeFileSync(filePath, html);
      console.log(`✅ Updated with simple pattern: ${path.basename(filePath)}`);
    } else {
      console.log(`⚠️  Could not find highlights section in: ${path.basename(filePath)}`);
    }
  }
}

// Main function to update all trek pages
async function updateAllTrekPages() {
  try {
    // Read JSON data
    const jsonData = JSON.parse(fs.readFileSync(JSON_DATA_PATH, 'utf8'));
    
    // Get all HTML files
    const htmlFiles = fs.readdirSync(TREKS_FOLDER)
      .filter(file => file.endsWith('.html') && file !== 'index.html');
    
    console.log(`Found ${htmlFiles.length} trek HTML files to update\n`);
    
    // Process each file
    htmlFiles.forEach(htmlFile => {
      const slug = htmlFile.replace('.html', '');
      const trekData = jsonData.find(trek => trek.slug === slug);
      
      if (trekData) {
        const filePath = path.join(TREKS_FOLDER, htmlFile);
        updateHTMLFile(filePath, trekData);
      } else {
        console.log(`❌ No JSON data found for: ${htmlFile}`);
      }
    });
    
    console.log('\n✨ Update complete!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
updateAllTrekPages();
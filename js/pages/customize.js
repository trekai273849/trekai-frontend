// js/pages/customize.js - Updated for Quiz Interface with Location Fixes and Enhanced Packing Section
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { preprocessRawText, extractSection, processSubsections, extractDays } from '../utils/itinerary.js';
// import { RouteMapManager } from '../components/routeMap.js'; // Commented out for now

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD48TPwzdcYiD6AfVgh6PX1P86OQ7qgPHg",
  authDomain: "smarttrailsauth.firebaseapp.com",
  projectId: "smarttrailsauth",
  storageBucket: "smarttrailsauth.firebasestorage.app",
  messagingSenderId: "763807584090",
  appId: "1:763807584090:web:822fb9109f7be5d432ed63",
  measurementId: "G-M6N5V4TDX6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Store Firebase in a global variable for easier access
let firebase = {
  app,
  auth
};

// Store quiz data globally
let currentQuizData = null;

document.addEventListener('DOMContentLoaded', () => {
  let cachedPackingList = '';
  let cachedInsights = '';
  let cachedPracticalInfo = '';
  let rawItineraryText = '';
  let parsedDays = []; // Added to store parsed days globally

  // Function to get location-specific tips
  function getLocationTip(location) {
    const tips = {
      'europe': 'The Alps contain Mont Blanc, Western Europe\'s highest peak at 4,809m!',
      'asia': 'The Himalayas contain 14 peaks over 8,000m, formed by tectonic plate collision.',
      'americas': 'The Andes stretch 7,000km - longer than the distance from New York to Paris!',
      'oceania': 'New Zealand was the last landmass on Earth to be discovered by humans.',
      'africa': 'Kilimanjaro has three distinct climate zones: tropical, temperate, and arctic.',
      'default': 'Mountain air contains less oxygen, which is why you might feel breathless at first.'
    };
    
    if (!location) return tips.default;
    
    const locationLower = location.toLowerCase();
    
    // Find matching tip
    for (const [key, tip] of Object.entries(tips)) {
      if (key !== 'default' && locationLower.includes(key)) {
        return tip;
      }
    }
    
    return tips.default;
  }

  // Enhanced progressive loading function
  function showProgressiveLoading(container, location) {
    const stages = [
      { 
        message: "🗺️ Analyzing your preferences...", 
        tip: getLocationTip(location),
        duration: 4000
      },
      { 
        message: "🥾 Planning optimal routes...", 
        tip: "The best trekking routes balance scenic beauty with safety, avoiding steep drop-offs and unstable terrain.",
        duration: 5000
      },
      { 
        message: "🏔️ Selecting scenic highlights...", 
        tip: "Dawn and dusk provide the most dramatic mountain lighting - photographers call it 'alpenglow'.",
        duration: 4500
      },
      { 
        message: "🎒 Customizing your experience...", 
        tip: "Every 1000m of elevation gain requires an extra day for proper acclimatization.",
        duration: 4000
      },
      { 
        message: "📋 Finalizing your itinerary...", 
        tip: "The 'leave no trace' principle helps preserve these incredible landscapes for future generations.",
        duration: 3000
      }
    ];
    
    let currentStage = 0;
    
    container.innerHTML = `
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <h3 id="loading-message" style="font-size: 1.3em; color: var(--text-dark); margin-bottom: 15px;">
          ${stages[0].message}
        </h3>
        <p id="loading-tip" style="color: var(--text-light); max-width: 500px; margin: 0 auto;">
          ${stages[0].tip}
        </p>
      </div>
    `;
    
    // Update stages
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += 100;
      
      // Update stage
      let cumulative = 0;
      for (let i = 0; i < stages.length; i++) {
        cumulative += stages[i].duration;
        if (elapsed < cumulative) {
          if (i !== currentStage) {
            currentStage = i;
            document.getElementById('loading-message').textContent = stages[i].message;
            document.getElementById('loading-tip').textContent = stages[i].tip;
          }
          break;
        }
      }
      
      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 100);
    
    container.dataset.loadingInterval = interval;
  }

  // Clear loading intervals
  function clearLoadingIntervals(container) {
    const interval = container.dataset.loadingInterval;
    if (interval) {
      clearInterval(interval);
      container.removeAttribute('data-loadingInterval');
    }
  }

  // Make generateItinerary available globally for the quiz - WITH LOCATION FIXES
  window.generateItineraryFromQuiz = async function(quizData) {
    currentQuizData = quizData; // Store for later use
    
    // CRITICAL FIX: Use specificLocation if available
    let location = quizData.specificLocation || quizData.location;
    if (location === 'any' || location === 'anywhere') {
        location = 'a beautiful mountain region';
    }
    
    let duration = quizData.trekType === 'day-hike' ? 'day hike' : `${quizData.trekLength} day trek`;
    
    // Build comprehensive prompt with specific location instructions
    let prompt = `Create a ${duration} itinerary specifically for ${location}. 
IMPORTANT: The itinerary MUST be in ${location}, not any other location.

Preferences:
- Difficulty: ${quizData.difficulty}
- Season: ${quizData.season}`;
    
    if (quizData.trekType === 'multi-day') {
      prompt += `\n- Accommodation: ${quizData.accommodation}`;
    }
    
    if (quizData.interests && quizData.interests.length > 0) {
      prompt += `\n- Interests: ${quizData.interests.join(', ')}`;
    }
    
    // Add location context if we have it
    if (quizData.locationDetails) {
      if (quizData.locationDetails.specificArea) {
        prompt += `\n- Specific area: ${quizData.locationDetails.specificArea}`;
      }
      if (quizData.locationDetails.originalInput) {
        prompt += `\n- User specified: "${quizData.locationDetails.originalInput}"`;
      }
    }
    
    if (quizData.details) {
      prompt += `\n- Special requirements: ${quizData.details}`;
    }
    
    // Add specific format requirements
    prompt += `\n\nPlease format the itinerary with:
    - Day-by-day breakdown with clear titles
    - Distance, elevation gain/loss, terrain, difficulty, accommodation for each day
    - Highlights, tips, water sources, and lunch suggestions
    - A packing list section
    - Local insights section
    - Practical information section`;

    const outputDiv = document.getElementById('itinerary-cards');
    
    // Show enhanced loading with the specific location
    showProgressiveLoading(outputDiv, location);

    try {
      let useMockData = false;
      let data = null;
      
      try {
        const response = await fetch('https://trekai-api.onrender.com/api/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: location, // Use the specific location
            filters: {
              difficulty: quizData.difficulty,
              accommodation: quizData.accommodation || 'Not applicable',
              technical: 'None',
              altitude: "2000–3000m"
            },
            comments: prompt,
            title: `${location} ${duration}`
          })
        });

        if (!response.ok) {
          console.warn(`Server returned status ${response.status}. Using mock data instead.`);
          useMockData = true;
        } else {
          data = await response.json();
          
          if (!data || !data.reply) {
            console.warn('API returned empty response. Using mock data instead.');
            useMockData = true;
          }
        }
      } catch (apiError) {
        console.warn('API request failed:', apiError);
        useMockData = true;
      }
      
      // Mock data fallback based on quiz selections
      if (useMockData) {
        console.log("Using mock data for development");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const dayCount = quizData.trekType === 'day-hike' ? 1 : 
                        parseInt(quizData.trekLength.split('-')[0]) || 3;
        
        let mockItinerary = `# ${location} ${duration} Itinerary\n\n`;
        
        // Generate mock days based on quiz data
        for (let i = 1; i <= dayCount; i++) {
          mockItinerary += `### Day ${i}: ${i === 1 ? 'Starting Point' : 'Continuing Journey'} to ${i === dayCount ? 'Final Destination' : `Camp ${i}`}
- Start: Village at 1,200m - End: ${quizData.accommodation || 'Scenic viewpoint'} at ${1200 + (i * 400)}m
- **Distance**: ${8 + (i * 2)} km (${5 + (i * 1.2)} miles)
- **Elevation Gain**: ${400 + (i * 100)}m
- **Terrain**: ${quizData.difficulty === 'easy' ? 'Well-marked paths' : quizData.difficulty === 'challenging' ? 'Rocky alpine terrain' : 'Mixed forest and meadow trails'}
- **Accommodation**: ${quizData.accommodation || 'Not applicable'}
- **Difficulty**: ${quizData.difficulty}
- **Highlights**: ${quizData.interests.includes('wildlife') ? 'Wildlife viewing opportunities, ' : ''}${quizData.interests.includes('photography') ? 'Stunning photo spots, ' : ''}panoramic mountain views
- **Lunch**: Pack lunch with local specialties
- **Water Sources**: Stream at ${Math.floor(i * 2.5)}km mark
- **Tips**: ${quizData.season === 'winter' ? 'Check snow conditions before departure' : quizData.season === 'summer' ? 'Start early to avoid afternoon heat' : 'Layer clothing for changing conditions'}

Begin your adventure in ${location} with gradual elevation gain through beautiful landscapes.

`;
        }
        
        // Add other sections
        mockItinerary += `
### Packing List
*Essentials:*
- Hiking boots${quizData.season === 'winter' ? ' (waterproof)' : ''}
- Backpack (${quizData.trekType === 'day-hike' ? '20-30L' : '40-60L'})
- Trekking poles
- First aid kit

*Clothing:*
- Quick-dry layers
- ${quizData.season === 'winter' ? 'Insulated jacket' : quizData.season === 'summer' ? 'Sun protection clothing' : 'Waterproof jacket'}
- Hat and gloves${quizData.season === 'summer' ? ' (for high altitude)' : ''}

### Local Insights
*Culture:*
- Respect local customs in ${location}
- Learn basic greetings in local language

*Food:*
- Try regional mountain specialties
- Carry energy snacks

### Practical Information
*Best Season:*
- ${quizData.season} offers ${quizData.season === 'spring' ? 'wildflowers and mild weather' : quizData.season === 'summer' ? 'long days and warm conditions' : quizData.season === 'autumn' ? 'stunning fall colors' : 'snow-covered landscapes'}

*Permits:*
- Check local requirements for ${location}
- Book accommodations in advance for ${quizData.season} season`;
        
        data = { reply: mockItinerary };
      }
      
      clearLoadingIntervals(outputDiv);
      
      rawItineraryText = data.reply;
      const preprocessedText = preprocessRawText(rawItineraryText);

      // Extract sections
      cachedPackingList = extractSection(preprocessedText, 'Packing List');
      cachedInsights = extractSection(preprocessedText, 'Local Insights');
      cachedPracticalInfo = extractSection(preprocessedText, 'Practical Information');

      // Show results after a brief delay
      setTimeout(() => {
        outputDiv.classList.add('show');
        processAndRenderEnhancedItinerary(preprocessedText);
      }, 500);

    } catch (error) {
      clearLoadingIntervals(outputDiv);
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
      console.error('Error generating itinerary:', error);
    }
  };

  // Helper function to create individual detail items
  function createDetailItem(icon, label, content, className = '', customStyle = '') {
    // Check if content contains "Not applicable" (case insensitive)
    if (content && content.toString().toLowerCase().includes('not applicable')) {
      return ''; // Return empty string instead of the HTML
    }
    
    return `
      <div class="detail-item ${className}">
        <div class="detail-header">
          <span class="detail-icon">${icon}</span>
          <span class="detail-label">${label}</span>
        </div>
        <div class="detail-content" ${customStyle ? `style="color: ${customStyle};"` : ''}>
          ${content}
        </div>
      </div>
    `;
  }

  // Helper function to get difficulty color
  function getDifficultyColor(difficulty) {
    if (!difficulty) return '#F39C12';
    const difficultyLevel = difficulty.toLowerCase();
    if (difficultyLevel.includes('easy')) return '#27AE60';
    if (difficultyLevel.includes('challenging') || difficultyLevel.includes('difficult')) return '#E74C3C';
    return '#F39C12'; // moderate
  }

  // Fixed function to create properly grouped detail sections
  function createGroupedDetailSections(details) {
    console.log('Creating grouped sections with details:', details);
    
    let essentialHTML = '';
    let trailTipsHTML = '';
    
    // Group 1: Essential Information
    // Elevation
    if (details.elevationGain || details.elevationLoss) {
      const elevText = [];
      if (details.elevationGain) elevText.push(`Gain: ${details.elevationGain}`);
      if (details.elevationLoss) elevText.push(`Loss: ${details.elevationLoss}`);
      essentialHTML += createDetailItem('📈', 'Elevation', elevText.join(' • '));
    }
    
    // Difficulty
    if (details.difficulty) {
      const difficultyColor = getDifficultyColor(details.difficulty);
      essentialHTML += createDetailItem('💪', 'Difficulty', details.difficulty, 'difficulty', difficultyColor);
    }
    
    // Terrain
    if (details.terrain) {
      essentialHTML += createDetailItem('🏔️', 'Terrain', details.terrain);
    }
    
    // Route & Accommodation
    if (details.start || details.end || details.accommodation) {
      const routeParts = [];
      if (details.start) routeParts.push(`Start: ${details.start}`);
      if (details.end) routeParts.push(`End: ${details.end}`);
      if (details.accommodation) routeParts.push(`Stay: ${details.accommodation}`);
      essentialHTML += createDetailItem('📍', 'Route & Accommodation', routeParts.join(' → '));
    }
    
    // Group 2: Trail Tips
    // Highlights
    if (details.highlights) {
      trailTipsHTML += createDetailItem('⭐', 'Highlights', details.highlights, 'highlights');
    }
    
    // Lunch
    if (details.lunch) {
      trailTipsHTML += createDetailItem('🍽️', 'Lunch', details.lunch);
    }
    
    // Water Sources
    if (details.waterSources) {
      trailTipsHTML += createDetailItem('💧', 'Water Sources', details.waterSources);
    }
    
    // Tips
    if (details.tips) {
      trailTipsHTML += createDetailItem('💡', 'Tips', details.tips, 'tips');
    }
    
    // Build the final HTML
    let html = '';
    
    if (essentialHTML) {
      html += `
        <div class="detail-group">
          <h4 class="detail-group-title">Essential Information</h4>
          <div class="detail-group-content">
            ${essentialHTML}
          </div>
        </div>
      `;
    }
    
    if (trailTipsHTML) {
      html += `
        <div class="detail-group">
          <h4 class="detail-group-title">Trail Tips</h4>
          <div class="detail-group-content">
            ${trailTipsHTML}
          </div>
        </div>
      `;
    }
    
    console.log('Generated grouped HTML with', essentialHTML ? 'Essential Info' : 'NO Essential', 'and', trailTipsHTML ? 'Trail Tips' : 'NO Tips');
    return html;
  }

  // Parse packing list text into structured categories
  function parsePackingList(packingListText) {
    const categories = {
      essentials: { icon: '🎯', name: 'Essentials', items: [] },
      clothing: { icon: '👕', name: 'Clothing', items: [] },
      footwear: { icon: '🥾', name: 'Footwear', items: [] },
      camping: { icon: '🏕️', name: 'Camping Gear', items: [] },
      navigation: { icon: '🧭', name: 'Navigation', items: [] },
      safety: { icon: '⛑️', name: 'Safety & First Aid', items: [] },
      personal: { icon: '🧴', name: 'Personal Care', items: [] },
      food: { icon: '🍲', name: 'Food & Water', items: [] },
      optional: { icon: '✨', name: 'Optional', items: [] }
    };

    // Split text into lines and categorize items
    const lines = packingListText.split('\n');
    let currentCategory = 'essentials';
    
    // Define keywords for categorization
    const categoryKeywords = {
      clothing: ['clothing', 'wear', 'shirt', 'pants', 'jacket', 'layer', 'socks', 'underwear', 'hat', 'gloves'],
      footwear: ['boots', 'shoes', 'footwear', 'sandals', 'gaiters'],
      camping: ['tent', 'sleeping', 'backpack', 'camping', 'stove', 'mat', 'pad'],
      navigation: ['map', 'compass', 'gps', 'headlamp', 'flashlight', 'battery'],
      safety: ['first aid', 'medication', 'sunscreen', 'emergency', 'whistle', 'knife'],
      personal: ['toiletries', 'soap', 'towel', 'toilet', 'sanitizer'],
      food: ['food', 'water', 'snacks', 'meals', 'energy', 'hydration'],
      optional: ['camera', 'book', 'optional', 'extra']
    };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and headers
      if (!trimmedLine || trimmedLine.includes(':') && trimmedLine.endsWith(':')) {
        // Check if it's a category header
        const headerLower = trimmedLine.toLowerCase();
        Object.keys(categoryKeywords).forEach(cat => {
          if (headerLower.includes(cat)) {
            currentCategory = cat;
          }
        });
        return;
      }
      
      // Extract item (remove bullets, dashes, asterisks)
      const item = trimmedLine.replace(/^[-•*]\s*/, '').trim();
      if (item) {
        // Try to categorize based on keywords
        let itemCategory = currentCategory;
        const itemLower = item.toLowerCase();
        
        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => itemLower.includes(keyword))) {
            itemCategory = cat;
            break;
          }
        }
        
        categories[itemCategory].items.push(item);
      }
    });
    
    // If essentials is empty, distribute items to other categories
    if (categories.essentials.items.length === 0) {
      delete categories.essentials;
    }
    
    return categories;
  }

  // Render packing categories with checkboxes
  function renderPackingCategories(categories) {
    let html = '';
    let itemIndex = 0;
    
    Object.entries(categories).forEach(([catKey, category]) => {
      if (category.items.length === 0) return;
      
      const categoryColors = {
        essentials: 'background: #FEF3C7; border-color: #FDE68A;',
        clothing: 'background: #EFF6FF; border-color: #DBEAFE;',
        footwear: 'background: #FFFBEB; border-color: #FEF3C7;',
        camping: 'background: #F0FDF4; border-color: #D1FAE5;',
        navigation: 'background: #FAF5FF; border-color: #F3E8FF;',
        safety: 'background: #FEF2F2; border-color: #FEE2E2;',
        personal: 'background: #EEF2FF; border-color: #E0E7FF;',
        food: 'background: #FFF7ED; border-color: #FED7AA;',
        optional: 'background: #F9FAFB; border-color: #F3F4F6;'
      };
      
      html += `
        <div style="border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px; ${categoryColors[catKey] || ''}">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--text-dark);">
            <span style="font-size: 24px;">${category.icon}</span>
            <span>${category.name}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
      `;
      
      category.items.forEach(item => {
        const itemId = `pack-item-${itemIndex++}`;
        html += `
          <label style="display: flex; align-items: flex-start; background: white; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" 
                 onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'" 
                 onmouseout="this.style.boxShadow='none'">
            <input type="checkbox" id="${itemId}" data-item="${item}" 
                   style="width: 18px; height: 18px; margin-right: 12px; margin-top: 2px; cursor: pointer;"
                   onchange="updatePackingProgress(this)">
            <span class="packing-item-text" style="flex: 1; color: var(--text-dark); transition: all 0.2s ease;">${item}</span>
          </label>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    // Count total items for progress tracking
    window.packingListState.totalItems = itemIndex;
    
    return html;
  }

  // Initialize packing list event listeners
  function initializePackingListeners() {
    updatePackingProgress();
  }

  // Update packing progress
  window.updatePackingProgress = function(checkbox) {
    const item = checkbox.dataset.item;
    
    if (checkbox.checked) {
      window.packingListState.checkedItems.add(item);
      checkbox.nextElementSibling.style.textDecoration = 'line-through';
      checkbox.nextElementSibling.style.opacity = '0.6';
    } else {
      window.packingListState.checkedItems.delete(item);
      checkbox.nextElementSibling.style.textDecoration = 'none';
      checkbox.nextElementSibling.style.opacity = '1';
    }
    
    const progress = Math.round((window.packingListState.checkedItems.size / window.packingListState.totalItems) * 100);
    document.getElementById('packing-progress').textContent = `${progress}%`;
    document.getElementById('packing-progress-bar').style.width = `${progress}%`;
  };

  // Reset packing checklist
  window.resetPackingList = function() {
    document.querySelectorAll('#packing-categories input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
      checkbox.nextElementSibling.style.textDecoration = 'none';
      checkbox.nextElementSibling.style.opacity = '1';
    });
    
    window.packingListState.checkedItems.clear();
    document.getElementById('packing-progress').textContent = '0%';
    document.getElementById('packing-progress-bar').style.width = '0%';
  };

  // Copy packing list to clipboard
  window.copyPackingList = function() {
    let listText = `PACKING LIST\n${'='.repeat(50)}\n`;
    listText += `Trek: ${currentQuizData?.specificLocation || currentQuizData?.location || 'Trek'}\n`;
    listText += `Duration: ${currentQuizData?.trekLength || 'Multi-day'}\n`;
    listText += `Season: ${currentQuizData?.season || 'All season'}\n`;
    listText += `Difficulty: ${currentQuizData?.difficulty || 'Moderate'}\n`;
    listText += `${'='.repeat(50)}\n\n`;
    
    Object.entries(window.packingListState.categories).forEach(([catKey, category]) => {
      if (category.items.length > 0) {
        listText += `${category.name.toUpperCase()}:\n`;
        category.items.forEach(item => {
          const isChecked = window.packingListState.checkedItems.has(item);
          listText += `${isChecked ? '☑' : '☐'} ${item}\n`;
        });
        listText += '\n';
      }
    });
    
    navigator.clipboard.writeText(listText).then(() => {
      // Show a temporary success message
      const button = event.target.closest('button');
      const originalHTML = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>Copied!';
      button.style.background = 'var(--success)';
      
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.background = 'var(--primary)';
      }, 2000);
    });
  };

  // Enhanced render function with grouped layout
  function processAndRenderEnhancedItinerary(text) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    // Create main results container
    const resultsWrapper = document.createElement('div');
    resultsWrapper.className = 'results-wrapper';

    // Add section header
    const sectionHeader = document.createElement('h2');
    sectionHeader.className = 'section-header';
    sectionHeader.innerText = 'Your Custom Itinerary';
    resultsWrapper.appendChild(sectionHeader);

    const sectionSubtitle = document.createElement('p');
    sectionSubtitle.className = 'section-subtitle';
    sectionSubtitle.innerText = 'Explore your personalized adventure with day-by-day details';
    resultsWrapper.appendChild(sectionSubtitle);

    // Create navigation tabs
    const navTabs = document.createElement('div');
    navTabs.className = 'results-nav-tabs';
    navTabs.innerHTML = `
       <div class="results-nav-container">
    <button class="results-nav-tab active" data-section="itinerary">Itinerary</button>
    <button class="results-nav-tab" data-section="map">Route Map</button>
    <button class="results-nav-tab" data-section="packing">What to Pack</button>
    <button class="results-nav-tab" data-section="insights">Local Insights</button>
    <button class="results-nav-tab" data-section="practical">Practical Info</button>
  </div>
    `;
    resultsWrapper.appendChild(navTabs);

    // Create content sections container
    const contentSections = document.createElement('div');
    contentSections.className = 'content-sections';

    // ITINERARY SECTION
    const itinerarySection = document.createElement('div');
    itinerarySection.className = 'content-section-result active';
    itinerarySection.id = 'itinerary-section';

    // Extract intro text
    const introRegex = /^([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+:|$)/i;
    const introMatch = text.match(introRegex);
    const intro = introMatch && introMatch[1].trim();
    
    if (intro && intro.length > 10) {
      const cleanedIntro = intro.replace(/#{1,3}/g, '').trim();
      const introCard = document.createElement('div');
      introCard.className = 'info-card';
      introCard.innerHTML = `
        <h3><span class="info-card-icon">🏔️</span> Overview</h3>
        <p style="line-height: 1.8; color: var(--text-light);">${cleanedIntro.replace(/\n/g, '<br>')}</p>
      `;
      itinerarySection.appendChild(introCard);
    }

    // Create timeline container
    const timeline = document.createElement('div');
    timeline.className = 'itinerary-timeline';

    // Extract days
    const dayRegex = /(?:(?:\*\*\*|\#{1,3}|\*\*|\*)?\s*Day\s+(\d+)[:\s]+([^\n]*?)(?:\*\*\*|\*\*|\*)?)(?:\n)([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+[:\s]|#{1,3}\s*Packing List|#{1,3}\s*Local Insights|#{1,3}\s*Practical Information|$)/gi;
    
    let dayMatch;
    let dayCount = 0;

    // Extract and store days globally
    const days = extractDays(text);
    parsedDays = days;

    while ((dayMatch = dayRegex.exec(text)) !== null) {
      dayCount++;
      const dayNum = dayMatch[1];
      const title = dayMatch[2].trim();
      let bodyText = dayMatch[3].trim();
      
      bodyText = bodyText.replace(/#{1,3}/g, '');

      // Create enhanced day card
      const dayCard = document.createElement('div');
      dayCard.className = 'itinerary-day-card';

      const details = parseDayDetails(bodyText);
      
      // Debug: Log the details to see what we're working with
      console.log('Day details:', details);
      
      // Updated day card HTML with grouped sections
      dayCard.innerHTML = `
        <!-- Card Header -->
        <div class="day-card-header">
          <div class="day-number">Day ${dayNum}</div>
          <h3 class="day-title-enhanced">${title}</h3>
          <button class="day-card-toggle" onclick="toggleDayCard(this)" aria-label="Toggle day details">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
        
        <!-- Main Content -->
        <div class="day-card-content">
          ${details.description ? `
            <div class="day-description-box">
              <p class="day-description-enhanced">${details.description}</p>
            </div>
          ` : ''}
          
          <!-- Distance at the top with better spacing - Only show if not "Not applicable" -->
          ${details.distance && !details.distance.toLowerCase().includes('not applicable') ? `
            <div class="distance-section">
              <span class="distance-icon">📏</span>
              <span class="distance-text">${details.distance}</span>
            </div>
          ` : ''}
          
          <!-- Grouped Details -->
          <div class="grouped-details-container">
            ${createGroupedDetailSections(details)}
          </div>
        </div>
      `;

      timeline.appendChild(dayCard);
    }

    itinerarySection.appendChild(timeline);
    contentSections.appendChild(itinerarySection);

    // MAP SECTION - Updated with placeholder image
    const mapSection = document.createElement('div');
    mapSection.className = 'content-section-result';
    mapSection.id = 'map-section';

    const mapCard = document.createElement('div');
    mapCard.className = 'info-card';
    mapCard.innerHTML = `
      <h3><span class="info-card-icon">🗺️</span> Route Map</h3>
      <div id="route-map-container" style="margin-top: 20px; text-align: center;">
        <img src="images/illustrations/maps-coming-soon.png" 
             alt="Maps coming soon" 
             style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <p style="margin-top: 20px; color: var(--text-secondary); font-size: 0.95em; line-height: 1.6;">
          Interactive route maps are coming soon! We're working on bringing you detailed trail maps with waypoints, 
          elevation profiles, and GPS coordinates for your adventures.
        </p>
      </div>
    `;

    mapSection.appendChild(mapCard);
    contentSections.appendChild(mapSection);

    // PACKING SECTION - Enhanced with interactive checklist
    if (cachedPackingList) {
      const packingSection = document.createElement('div');
      packingSection.className = 'content-section-result';
      packingSection.id = 'packing-section';

      const packingCard = document.createElement('div');
      packingCard.className = 'info-card';
      
      // Create structured packing list from the text
      const packingData = parsePackingList(cachedPackingList);
      
      packingCard.innerHTML = `
        <h3><span class="info-card-icon">🎒</span> Packing List</h3>
        
        <!-- Progress Section -->
        <div style="background: linear-gradient(135deg, #D1FAE5 0%, #DBEAFE 100%); border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 600; color: var(--text-dark);">Packing Progress</span>
            <span style="font-weight: 700; color: var(--primary);" id="packing-progress">0%</span>
          </div>
          <div style="width: 100%; height: 12px; background: white; border-radius: 9999px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);">
            <div id="packing-progress-bar" style="height: 100%; background: linear-gradient(to right, var(--primary), var(--primary-light)); border-radius: 9999px; transition: width 0.5s ease-out; width: 0%;"></div>
          </div>
        </div>
        
        <!-- Packing Categories -->
        <div id="packing-categories" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 24px;">
          ${renderPackingCategories(packingData)}
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;">
          <button onclick="resetPackingList()" style="padding: 12px 24px; border-radius: 8px; border: 2px solid var(--primary); background: white; color: var(--primary); font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            <i class="fas fa-redo" style="margin-right: 8px;"></i>Reset Checklist
          </button>
          <button onclick="copyPackingList()" style="padding: 12px 24px; border-radius: 8px; border: none; background: var(--primary); color: white; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            <i class="fas fa-copy" style="margin-right: 8px;"></i>Copy List
          </button>
        </div>
      `;
      
      packingSection.appendChild(packingCard);
      contentSections.appendChild(packingSection);
      
      // Initialize packing list state
      window.packingListState = {
        totalItems: 0,
        checkedItems: new Set(),
        categories: packingData
      };
      
      // Add checkbox listeners after DOM is ready
      setTimeout(() => {
        initializePackingListeners();
      }, 100);
    }

    // INSIGHTS SECTION
    if (cachedInsights) {
      const insightsSection = createEnhancedSection('insights-section', 'Local Insights', '🌍', cachedInsights);
      contentSections.appendChild(insightsSection);
    }

    // PRACTICAL INFO SECTION
    if (cachedPracticalInfo) {
      const practicalSection = createEnhancedSection('practical-section', 'Practical Information', '📋', cachedPracticalInfo);
      contentSections.appendChild(practicalSection);
    }

    resultsWrapper.appendChild(contentSections);
    container.appendChild(resultsWrapper);

    // Add navigation functionality
    setupResultsNavigation();

    // Add action buttons
    addEnhancedActionButtons(container);
    
    // Initialize tab position (center the active tab)
    setTimeout(() => {
      const activeTab = document.querySelector('.results-nav-tab.active');
      const navContainer = document.querySelector('.results-nav-container');
      if (activeTab && navContainer) {
        centerTabInView(activeTab, navContainer);
      }
    }, 100);
  }

  // Enhanced helper function to parse day details
  function parseDayDetails(bodyText) {
    const details = {
      distance: null,
      elevationGain: null,
      elevationLoss: null,
      terrain: null,
      difficulty: null,
      accommodation: null,
      highlights: null,
      lunch: null,
      tips: null,
      waterSources: null,
      description: null,
      start: null,
      end: null
    };

    console.log('Parsing body text:', bodyText);

    // Enhanced field patterns - handle both with and without ** markers
    const fieldPatterns = {
      distance: /(?:-\s*)?(?:\*\*)?(?:Distance|Trek)(?:\*\*)?:\s*([^\n]+)/i,
      elevationGain: /(?:-\s*)?(?:\*\*)?Elevation\s+(?:gain|Gain)(?:\*\*)?:\s*([^\n]+)/i,
      elevationLoss: /(?:-\s*)?(?:\*\*)?Elevation\s+(?:loss|Loss)(?:\*\*)?:\s*([^\n]+)/i,
      terrain: /(?:-\s*)?(?:\*\*)?Terrain(?:\*\*)?:\s*([^\n]+)/i,
      difficulty: /(?:-\s*)?(?:\*\*)?Difficulty(?:\*\*)?:\s*([^\n]+)/i,
      accommodation: /(?:-\s*)?(?:\*\*)?Accommodation(?:\*\*)?:\s*([^\n]+)/i,
      highlights: /(?:-\s*)?(?:\*\*)?Highlights?(?:\*\*)?:\s*([^\n]+)/i,
      lunch: /(?:-\s*)?(?:\*\*)?Lunch(?:\*\*)?:\s*([^\n]+)/i,
      tips: /(?:-\s*)?(?:\*\*)?Tips?(?:\*\*)?:\s*([^\n]+)/i,
      waterSources: /(?:-\s*)?(?:\*\*)?Water\s+sources?(?:\*\*)?:\s*([^\n]+)/i,
      start: /(?:-\s*)?(?:\*\*)?Start(?:\*\*)?:\s*([^\n\-]+)/i,
      end: /(?:-\s*)?(?:\*\*)?End(?:\*\*)?:\s*([^\n\-]+)/i
    };

    // Extract all fields - remove ** markers from captured content
    Object.keys(fieldPatterns).forEach(field => {
      const match = bodyText.match(fieldPatterns[field]);
      if (match) {
        const value = match[1].trim().replace(/\*\*/g, '');
        // Only set the value if it's not "Not applicable"
        if (!value.toLowerCase().includes('not applicable')) {
          details[field] = value;
          console.log(`Found ${field}:`, details[field]);
        }
      }
    });

    // Try to extract start/end from combined format like "- Start: X - End: Y"
    if (!details.start || !details.end) {
      const startEndMatch = bodyText.match(/-\s*(?:\*\*)?Start(?:\*\*)?:\s*([^-]+)\s*-\s*(?:\*\*)?End(?:\*\*)?:\s*([^\n-]+)/i);
      if (startEndMatch) {
        const startValue = startEndMatch[1].trim().replace(/\*\*/g, '');
        const endValue = startEndMatch[2].trim().replace(/\*\*/g, '');
        
        if (!startValue.toLowerCase().includes('not applicable')) {
          details.start = startValue;
        }
        if (!endValue.toLowerCase().includes('not applicable')) {
          details.end = endValue;
        }
        console.log('Found combined start/end:', details.start, details.end);
      }
    }

    // Extract description (remaining text) - more robust regex
    const fieldsRegex = /(?:-\s*)?(?:\*\*)?(?:Distance|Trek|Elevation\s+(?:gain|loss)|Terrain|Difficulty|Accommodation|Highlights?|Lunch|Tips?|Water\s+sources?|Start|End)(?:\*\*)?:\s*[^\n]+/gi;
    const remainingText = bodyText
      .replace(fieldsRegex, '')
      .replace(/-\s*(?:\*\*)?Start(?:\*\*)?:.*?(?:\*\*)?End(?:\*\*)?:[^\n]+/i, '')
      .trim();
      
    if (remainingText && remainingText.length > 20) {
      details.description = remainingText;
      console.log('Found description:', details.description);
    }

    return details;
  }

  // Helper function to create enhanced sections
  function createEnhancedSection(id, title, icon, content) {
    const section = document.createElement('div');
    section.className = 'content-section-result';
    section.id = id;

    const card = document.createElement('div');
    card.className = 'info-card';
    
    const processedContent = processSubsectionsEnhanced(content);
    
    card.innerHTML = `
      <h3><span class="info-card-icon">${icon}</span> ${title}</h3>
      <div class="enhanced-content">${processedContent}</div>
    `;
    
    section.appendChild(card);
    return section;
  }

  // Enhanced subsection processing
  function processSubsectionsEnhanced(content) {
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

  // Helper to create subsection HTML
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

  // Setup navigation for results tabs - Simplified version
  function setupResultsNavigation() {
    const tabs = document.querySelectorAll('.results-nav-tab');
    const sections = document.querySelectorAll('.content-section-result');
    const navContainer = document.querySelector('.results-nav-container');
    const navTabs = document.querySelector('.results-nav-tabs');

    // Update scroll indicators
    function updateScrollIndicators() {
      if (!navContainer || !navTabs) return;
      
      const scrollLeft = navContainer.scrollLeft;
      const scrollWidth = navContainer.scrollWidth;
      const clientWidth = navContainer.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      
      // Remove all classes first
      navTabs.classList.remove('scroll-start', 'scroll-middle', 'scroll-end', 'has-scroll');
      
      // Check if scrolling is needed
      if (scrollWidth > clientWidth) {
        navTabs.classList.add('has-scroll');
        
        // Add appropriate class based on scroll position
        if (scrollLeft <= 10) {
          navTabs.classList.add('scroll-start');
        } else if (scrollLeft >= maxScroll - 10) {
          navTabs.classList.add('scroll-end');
        } else {
          navTabs.classList.add('scroll-middle');
        }
      }
    }

    // Add scroll listener for indicators
    if (navContainer) {
      navContainer.addEventListener('scroll', updateScrollIndicators);
      // Initial check
      setTimeout(updateScrollIndicators, 100);
    }

    // Simplified tab click handler
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        tab.classList.add('active');

        const targetSection = tab.dataset.section;
        const section = document.getElementById(`${targetSection}-section`);
        if (section) {
          section.classList.add('active');
        }

        // Center the clicked tab in the viewport
        if (navContainer) {
          centerTabInView(tab, navContainer);
        }
      });
    });
    
    // Add touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (navContainer) {
      navContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });
      
      navContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      });
    }
    
    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        const activeTab = document.querySelector('.results-nav-tab.active');
        const tabs = Array.from(document.querySelectorAll('.results-nav-tab'));
        const currentIndex = tabs.indexOf(activeTab);
        
        if (diff > 0 && currentIndex < tabs.length - 1) {
          // Swipe left - go to next tab
          tabs[currentIndex + 1].click();
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe right - go to previous tab
          tabs[currentIndex - 1].click();
        }
      }
    }
  }

  // Function to center a tab in the scrollable container
  function centerTabInView(tab, container) {
    // Get dimensions
    const containerWidth = container.offsetWidth;
    const containerScrollWidth = container.scrollWidth;
    const tabWidth = tab.offsetWidth;
    const tabOffsetLeft = tab.offsetLeft;
    
    // Calculate the center position
    let scrollPosition = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);
    
    // Adjust to show next tab on the right (offset by 30% to the left)
    scrollPosition = scrollPosition - (containerWidth * 0.15);
    
    // Ensure we don't scroll past boundaries
    const maxScroll = containerScrollWidth - containerWidth;
    scrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
    
    // Smooth scroll to the calculated position
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    
    // Update indicators after scroll
    setTimeout(() => {
      const navTabs = document.querySelector('.results-nav-tabs');
      if (navTabs) {
        const event = new Event('scroll');
        container.dispatchEvent(event);
      }
    }, 300);
  }

  // Enhanced action buttons
  function addEnhancedActionButtons(container) {
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.innerHTML = `
      <div style="margin-top: 20px;">
        <label for="feedback" style="font-weight: 600; color: var(--text-dark); display: block; margin-bottom: 10px;">
          Refine your itinerary
        </label>
        <input type="text" id="feedback" placeholder="Add feedback to adjust your itinerary (e.g., 'make it easier', 'add more cultural experiences')" 
          style="width: 100%; padding: 15px; border: 2px solid #E0E0E0; border-radius: 12px; font-size: 1em; transition: border-color 0.3s ease;">
      </div>
      
      <div class="action-buttons-container">
        <button id="regenerate-itinerary" class="action-btn action-btn-primary">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Update Itinerary
        </button>
        <button id="save-itinerary" class="action-btn action-btn-secondary">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save My Adventure
        </button>
      </div>
    `;
    
    container.appendChild(buttonsWrapper);

    // Re-attach event listeners
    document.getElementById('regenerate-itinerary')?.addEventListener('click', () => {
      const feedback = document.getElementById('feedback').value;
      if (feedback && currentQuizData) {
        // Modify the quiz data with feedback
        const updatedQuizData = {
          ...currentQuizData,
          details: (currentQuizData.details || '') + ' ' + feedback
        };
        window.generateItineraryFromQuiz(updatedQuizData);
      }
    });

    document.getElementById('save-itinerary')?.addEventListener('click', async () => {
      await handleSaveItinerary();
    });
  }

  // Handle save itinerary
  async function handleSaveItinerary() {
    try {
      if (!auth || !auth.currentUser) {
        storeItineraryForLater();
        showAuthModal();
        return;
      }

      const token = await auth.currentUser.getIdToken();
      
      const location = currentQuizData?.specificLocation || currentQuizData?.location || 'Trek Location';
      const title = `${location} Trek`;
      const itineraryData = {
        title,
        location,
        content: rawItineraryText,
        comments: currentQuizData?.details || '',
        filters: {
          difficulty: currentQuizData?.difficulty || 'Moderate',
          accommodation: currentQuizData?.accommodation || 'Not applicable',
          trekType: currentQuizData?.trekType || 'multi-day',
          season: currentQuizData?.season || 'Summer'
        }
      };
      
      const response = await fetch('https://trekai-api.onrender.com/api/itineraries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itineraryData)
      });
      
      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      
      const data = await response.json();
      showSuccessModal();
      
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary. Please try again.');
    }
  }

  // Store itinerary for later saving
  function storeItineraryForLater() {
    const location = currentQuizData?.specificLocation || currentQuizData?.location || 'Trek Location';
    const title = `${location} Trek`;
    const itineraryData = {
      title,
      location,
      content: rawItineraryText,
      comments: currentQuizData?.details || '',
      filters: {
        difficulty: currentQuizData?.difficulty || 'Moderate',
        accommodation: currentQuizData?.accommodation || 'Not applicable',
        trekType: currentQuizData?.trekType || 'multi-day',
        season: currentQuizData?.season || 'Summer'
      }
    };
    
    localStorage.setItem('pendingItinerary', JSON.stringify(itineraryData));
    localStorage.setItem('returnToCustomize', 'true');
  }

  // Modal functions
  function showAuthModal() {
    const modal = document.getElementById('auth-required-modal');
    modal.style.display = 'flex';
  }

  function showSuccessModal() {
    const modal = document.getElementById('itinerary-success-modal');
    modal.style.display = 'flex';
  }

  function showWelcomeModal() {
    const modal = document.getElementById('welcome-back-modal');
    modal.style.display = 'flex';
  }

  // Handle pending itinerary after auth
  async function handlePendingItinerary() {
    const pendingItinerary = localStorage.getItem('pendingItinerary');
    const returnToCustomize = localStorage.getItem('returnToCustomize');
    
    if (pendingItinerary && returnToCustomize && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        const itineraryData = JSON.parse(pendingItinerary);
        
        const response = await fetch('https://trekai-api.onrender.com/api/itineraries', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(itineraryData)
        });
        
        if (response.ok) {
          localStorage.removeItem('pendingItinerary');
          localStorage.removeItem('returnToCustomize');
          
          setTimeout(() => {
            showWelcomeModal();
          }, 1000);
        }
      } catch (error) {
        console.error('Error auto-saving itinerary:', error);
        localStorage.removeItem('pendingItinerary');
        localStorage.removeItem('returnToCustomize');
      }
    }
  }

  // Check for pending itinerary on auth state change
  setTimeout(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        handlePendingItinerary();
      }
    });
  }, 2000);

  // Make functions globally available
  window.showSuccessModal = showSuccessModal;
  window.showAuthModal = showAuthModal;
  window.showWelcomeModal = showWelcomeModal;
  window.centerTabInView = centerTabInView;
  window.toggleDayCard = function(button) {
    const dayCard = button.closest('.itinerary-day-card');
    dayCard.classList.toggle('collapsed');
  };
});
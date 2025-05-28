// js/pages/customize.js - Final Complete Version with Fixed Grouped Layout
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { preprocessRawText, extractSection, processSubsections } from '../utils/itinerary.js';

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

document.addEventListener('DOMContentLoaded', () => {
  // Update location in greeting
  const location = localStorage.getItem('userLocation') || 'the mountains';
  document.getElementById('greeting').innerText = `Design a personalized adventure in ${location}`;

  let cachedPackingList = '';
  let cachedInsights = '';
  let cachedPracticalInfo = '';
  let rawItineraryText = '';

  // Fix mobile filter spacing immediately on load
  function fixMobileFilterSpacing() {
    const isMobile = window.innerWidth <= 768;
    
    // Try multiple selectors to find button containers
    const selectors = [
      '.filter-buttons-container',
      '.filter-group .flex',
      '.filter-group div:has(.enhanced-filter-btn)',
      'div.flex.gap-3:has(.enhanced-filter-btn)'
    ];
    
    let filterContainers = [];
    for (const selector of selectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        filterContainers = found;
        console.log(`Found button containers using selector: ${selector}`);
        break;
      }
    }
    
    filterContainers.forEach(container => {
      if (isMobile) {
        // Apply mobile styles
        container.style.cssText = `
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          width: 100% !important;
        `;
        
        // Style all buttons in this container
        container.querySelectorAll('.enhanced-filter-btn, button[data-category]').forEach(btn => {
          btn.style.cssText = `
            width: 100% !important;
            min-height: 48px !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 16px 20px !important;
          `;
        });
      } else {
        // Reset desktop styles
        container.style.cssText = '';
        container.querySelectorAll('.enhanced-filter-btn, button[data-category]').forEach(btn => {
          btn.style.cssText = '';
        });
      }
    });
    
    // Also ensure filter groups have proper spacing
    if (isMobile) {
      document.querySelectorAll('.filter-group').forEach((group, index, groups) => {
        group.style.marginBottom = '24px';
        group.style.paddingBottom = '24px';
        group.style.borderBottom = index < groups.length - 1 ? '1px solid #e5e7eb' : 'none';
        if (index === groups.length - 1) {
          group.style.marginBottom = '0';
          group.style.paddingBottom = '0';
        }
      });
    } else {
      document.querySelectorAll('.filter-group').forEach(group => {
        group.style.marginBottom = '';
        group.style.paddingBottom = '';
        group.style.borderBottom = '';
      });
    }
  }

  // Inject critical mobile CSS if needed
  function injectMobileCSSFix() {
    const styleId = 'mobile-filter-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      
      // Check if browser supports :has() selector
      const supportsHas = CSS.supports('selector(:has(*))');
      
      style.textContent = `
        @media (max-width: 768px) {
          .filter-group .flex,
          .filter-buttons-container,
          .filter-group > div:has(.enhanced-filter-btn)${!supportsHas ? ', .filter-group > div' : ''} {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            width: 100% !important;
          }
          
          .enhanced-filter-btn,
          button[data-category],
          .filter-group button {
            width: 100% !important;
            min-height: 48px !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 16px 20px !important;
          }
          
          .filter-group {
            margin-bottom: 24px !important;
            padding-bottom: 24px !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
          
          .filter-group:last-child {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            border-bottom: none !important;
          }
          
          /* Override Tailwind gap utilities */
          .gap-3 {
            gap: 10px !important;
          }
        }
      `;
      document.head.appendChild(style);
      console.log('Injected mobile CSS fix' + (!supportsHas ? ' (without :has() selector)' : ''));
    }
  }

  // Nuclear option: Force fix by removing conflicting classes and applying inline styles
  function forceFixMobileSpacing() {
    console.log('Applying force fix for mobile spacing...');
    const isMobile = window.innerWidth <= 768;
    
    document.querySelectorAll('.filter-group').forEach((group, groupIndex, groups) => {
      // Find the button container
      let container = group.querySelector('.flex');
      if (!container) {
        container = group.querySelector('div:has(button), div:has(.enhanced-filter-btn)');
      }
      if (!container) {
        // Find div that contains buttons
        const buttons = group.querySelectorAll('button, .enhanced-filter-btn');
        if (buttons.length > 0) {
          container = buttons[0].parentElement;
        }
      }
      
      if (container && isMobile) {
        // Remove Tailwind classes that might interfere
        container.classList.remove('flex', 'gap-3', 'gap-2', 'gap-4', 'flex-row', 'flex-wrap');
        
        // Apply inline styles with !important
        container.setAttribute('style', `
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
          width: 100% !important;
          align-items: stretch !important;
        `);
        
        // Fix all buttons in this container
        const buttons = container.querySelectorAll('button, .enhanced-filter-btn');
        buttons.forEach(btn => {
          // Remove any width-limiting classes
          btn.classList.remove('w-auto', 'w-fit', 'flex-1', 'flex-none');
          
          btn.setAttribute('style', `
            width: 100% !important;
            min-height: 50px !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 16px 24px !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
          `);
        });
        
        // Fix group spacing
        group.setAttribute('style', `
          margin-bottom: ${groupIndex < groups.length - 1 ? '28px' : '0'} !important;
          padding-bottom: ${groupIndex < groups.length - 1 ? '28px' : '0'} !important;
          border-bottom: ${groupIndex < groups.length - 1 ? '1px solid #e5e7eb' : 'none'} !important;
        `);
      } else if (!isMobile) {
        // Reset for desktop
        if (container) {
          container.removeAttribute('style');
          container.classList.add('flex', 'gap-3');
        }
        group.removeAttribute('style');
        const buttons = group.querySelectorAll('button, .enhanced-filter-btn');
        buttons.forEach(btn => {
          btn.removeAttribute('style');
        });
      }
    });
    
    console.log('Force fix applied!');
  }
  
  // Apply all fixes
  injectMobileCSSFix();
  fixMobileFilterSpacing();
  
  // Apply force fix after a delay to ensure DOM is ready
  if (window.innerWidth <= 768) {
    setTimeout(forceFixMobileSpacing, 200);
  }

  // Apply fix after a short delay to ensure DOM is fully rendered
  setTimeout(fixMobileFilterSpacing, 100);

  // Re-apply on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      fixMobileFilterSpacing();
      if (window.innerWidth <= 768) {
        forceFixMobileSpacing();
      }
      
      // Update tab scroll indicators on resize
      const navContainer = document.querySelector('.results-nav-container');
      if (navContainer) {
        const event = new Event('scroll');
        navContainer.dispatchEvent(event);
      }
    }, 250);
  });

  // Function to get location-specific tips
  function getLocationTip(location) {
    const tips = {
      'french alps': 'The French Alps contain Mont Blanc, Western Europe\'s highest peak at 4,809m!',
      'italian alps': 'The Dolomites\' unique pale rock formations are made of ancient coral reefs.',
      'alps': 'Alpine glaciers carved these valleys over millions of years, creating dramatic landscapes.',
      'himalayas': 'The Himalayas contain 14 peaks over 8,000m, formed by tectonic plate collision.',
      'himalaya': 'The Himalayas are still growing about 1cm per year due to continental drift.',
      'andes': 'The Andes stretch 7,000km - longer than the distance from New York to Paris!',
      'patagonia': 'Patagonia\'s weather can change from sun to snow in minutes due to its unique geography.',
      'kilimanjaro': 'Kilimanjaro has three distinct climate zones: tropical, temperate, and arctic.',
      'norway': 'Norwegian fjords were carved by glaciers that were over 1km thick.',
      'scotland': 'Scotland\'s highlands were formed 400 million years ago during mountain-building events.',
      'switzerland': 'Switzerland generates 60% of its electricity from hydropower thanks to alpine geography.',
      'japan': 'Japan sits on four tectonic plates, creating its mountainous terrain and hot springs.',
      'new zealand': 'New Zealand was the last landmass on Earth to be discovered by humans.',
      'rockies': 'The Rocky Mountains contain ecosystems ranging from prairie to alpine tundra.',
      'appalachian': 'The Appalachian Mountains are among Earth\'s oldest, formed 480 million years ago.',
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
        message: "🗺️ Analyzing your destination...", 
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

  // Diagnostic function to check the DOM structure
  function debugFilterStructure() {
    console.log('=== Filter Structure Debug ===');
    
    // Check filter groups
    const filterGroups = document.querySelectorAll('.filter-group');
    console.log(`Found ${filterGroups.length} filter groups`);
    
    filterGroups.forEach((group, index) => {
      const heading = group.querySelector('h3');
      const buttonContainer = group.querySelector('.flex, .filter-buttons-container, div');
      const buttons = group.querySelectorAll('.enhanced-filter-btn, button');
      
      console.log(`\nGroup ${index + 1}: ${heading?.textContent || 'No heading'}`);
      console.log(`  Container classes: ${buttonContainer?.className || 'No container found'}`);
      console.log(`  Container HTML: ${buttonContainer?.outerHTML.substring(0, 100)}...`);
      console.log(`  Number of buttons: ${buttons.length}`);
      
      buttons.forEach((btn, btnIndex) => {
        console.log(`    Button ${btnIndex + 1}: "${btn.textContent.trim()}" - Classes: ${btn.className}`);
      });
    });
    
    console.log('\n=== Current Styles Applied ===');
    const firstContainer = document.querySelector('.filter-group .flex, .filter-group > div');
    if (firstContainer) {
      console.log('Container computed styles:');
      const styles = window.getComputedStyle(firstContainer);
      console.log(`  display: ${styles.display}`);
      console.log(`  flex-direction: ${styles.flexDirection}`);
      console.log(`  gap: ${styles.gap}`);
      console.log(`  width: ${styles.width}`);
    }
    
    const firstButton = document.querySelector('.enhanced-filter-btn, .filter-group button');
    if (firstButton) {
      console.log('\nFirst button computed styles:');
      const styles = window.getComputedStyle(firstButton);
      console.log(`  width: ${styles.width}`);
      console.log(`  min-height: ${styles.minHeight}`);
      console.log(`  display: ${styles.display}`);
    }
  }
  
  // Run debug after page loads
  setTimeout(() => {
    debugFilterStructure();
    console.log('\nTo manually fix spacing, run: fixMobileFilterSpacing()');
  }, 500);

  // Initialize filter buttons
  const setupFilterButtons = () => {
    document.querySelectorAll('.enhanced-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.category;
        document.querySelectorAll(`.enhanced-filter-btn[data-category="${group}"]`).forEach(el => {
          el.classList.remove('active');
        });
        btn.classList.add('active');
      });
    });
  };

  setupFilterButtons();
  
  // Ensure mobile spacing is maintained after any DOM changes
  const observer = new MutationObserver(() => {
    if (window.innerWidth <= 768) {
      fixMobileFilterSpacing();
    }
  });
  
  // Observe the filter containers for any changes
  const filtersContainer = document.querySelector('.filters-container');
  if (filtersContainer) {
    observer.observe(filtersContainer, { childList: true, subtree: true });
  }

  document.getElementById('customization-form').addEventListener('submit', function (e) {
    e.preventDefault();
    generateItinerary();
  });

  async function generateItinerary(additionalFeedback = '') {
    const location = localStorage.getItem('userLocation') || 'Mountains';
    if (!location) {
      console.error('No location specified');
      return;
    }

    // Get selected filters
    const filters = {};
    document.querySelectorAll('.enhanced-filter-btn.active').forEach(btn => {
      const category = btn.dataset.category;
      filters[category] = btn.dataset.value;
    });

    // Provide defaults if no filters selected
    if (Object.keys(filters).length === 0) {
      const defaultDifficultyBtn = document.querySelector('.enhanced-filter-btn[data-category="difficulty"][data-value="Moderate"]');
      const defaultAccommodationBtn = document.querySelector('.enhanced-filter-btn[data-category="accommodation"][data-value="Camping"]');
      
      if (defaultDifficultyBtn) {
        defaultDifficultyBtn.classList.add('active');
        filters.difficulty = 'Moderate';
      }
      
      if (defaultAccommodationBtn) {
        defaultAccommodationBtn.classList.add('active');
        filters.accommodation = 'Camping';
      }
      
      filters.technical = 'None';
    }

    let userComment = document.getElementById('comments').value.trim();
    let baseText = `${userComment} ${location}`;

    const dayMatch = baseText.match(/(\d+)[-\s]*day/i);
    const requestedDays = dayMatch ? parseInt(dayMatch[1]) : null;

    let comments = userComment;
    if (requestedDays) {
      comments += ` Please generate a ${requestedDays}-day itinerary.`;
    } else {
      comments += ' Please generate a 3-day trekking itinerary.';
    }

    console.log({ location, filters, comments });

    const outputDiv = document.getElementById('itinerary-cards');
    
    // Show enhanced loading
    showProgressiveLoading(outputDiv, location);

    try {
      let useMockData = false;
      let data = null;
      
      try {
        const response = await fetch('https://trekai-api.onrender.com/api/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location,
            filters: {
              ...filters,
              altitude: "2000–3000m"
            },
            comments,
            title: `${location} Trek`
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
      
      // Mock data fallback
      if (useMockData) {
        console.log("Using mock data for development");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const locationName = location.toLowerCase();
        const trekName = locationName.includes('french alps') ? 'Tour du Mont Blanc' : 
                         locationName.includes('himalaya') ? 'Annapurna Circuit' :
                         locationName.includes('andes') ? 'Inca Trail' :
                         locationName.includes('patagonia') ? 'Torres del Paine W Trek' :
                         locationName.includes('kilimanjaro') ? 'Machame Route' :
                         `${location} Trek`;
        
        data = {
          reply: `### Day 1: Starting Point to First Camp
- Start: Dobbiaco, 1,256m - End: Mountain Hut, 2,100m
- **Distance**: 8 km (5 miles)
- **Elevation Gain**: 600m (1,970ft)
- **Terrain**: Alpine meadows and forest trails
- **Accommodation**: ${filters.accommodation || 'Mountain hut'}
- **Difficulty**: ${filters.difficulty || 'Moderate'}
- **Highlights**: Panoramic views, local wildlife, acclimatization
- **Lunch**: Pack picnic with local specialties
- **Water Sources**: Stream at 2km, fountain at hut
- **Tips**: Start early to avoid afternoon thunderstorms

Begin your journey in the picturesque village, gradually ascending through beautiful landscapes. Take time to acclimatize to the altitude and enjoy the panoramic views of surrounding peaks.

### Day 2: First Camp to Mountain Pass
- Start: Mountain Hut, 2,100m - End: Alpine Lodge, 2,500m
- **Distance**: 12 km (7.5 miles)
- **Elevation Gain**: 800m (2,625ft)
- **Terrain**: Rocky paths and alpine terrain
- **Difficulty**: ${filters.difficulty || 'Moderate'}
- **Accommodation**: ${filters.accommodation || 'Mountain hut'}
- **Highlights**: Mountain pass views, changing ecosystems, wildflowers
- **Water Sources**: Limited - carry sufficient water
- **Tips**: Use trekking poles for stability on rocky sections

Today features the most challenging hiking of your trek. The trail climbs steadily through changing ecosystems before reaching the dramatic mountain pass.

### Day 3: Mountain Pass to Endpoint
- Start: Alpine Lodge, 2,500m - End: Valley Town, 1,200m
- **Distance**: 10 km (6.2 miles)
- **Elevation Loss**: 900m (2,950ft)
- **Terrain**: Scenic descent with river crossings
- **Accommodation**: Return to trailhead
- **Highlights**: Waterfalls, alpine lakes, celebration dinner

The final day offers a gentle descent with spectacular views throughout.

### Packing List
*Essentials:*
- Broken-in hiking boots with ankle support
- Backpack (30-40L)
- Trekking poles
- First aid kit

*Clothing:*
- Quick-dry hiking shirts and pants
- Warm layers (fleece, down jacket)
- Waterproof jacket and pants
- Hat and gloves

### Local Insights
*Culture:*
- Respect local customs and traditions
- Greet locals with a smile

*Food:*
- Try regional specialties
- Stay hydrated at altitude

### Practical Information
*Best Season:*
- June to September for most alpine regions
- Check local conditions

*Permits:*
- Check if permits are required in advance
- Consider hiring a local guide`
        };
      }
      
      clearLoadingIntervals(outputDiv);
      
      rawItineraryText = data.reply;
      const preprocessedText = preprocessRawText(rawItineraryText);

      // Extract sections
      cachedPackingList = extractSection(preprocessedText, 'Packing List');
      cachedInsights = extractSection(preprocessedText, 'Local Insights');
      cachedPracticalInfo = extractSection(preprocessedText, 'Practical Information');

      setTimeout(() => {
        processAndRenderEnhancedItinerary(preprocessedText);
      }, 500);

    } catch (error) {
      clearLoadingIntervals(outputDiv);
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
      console.error('Error generating itinerary:', error);
    }
  }

  // Helper function to create individual detail items
  function createDetailItem(icon, label, content, className = '', customStyle = '') {
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
          
          <!-- Distance at the top with better spacing -->
          ${details.distance ? `
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

    // PACKING SECTION
    if (cachedPackingList) {
      const packingSection = createEnhancedSection('packing-section', 'Packing List', '🎒', cachedPackingList);
      contentSections.appendChild(packingSection);
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
        details[field] = match[1].trim().replace(/\*\*/g, '');
        console.log(`Found ${field}:`, details[field]);
      }
    });

    // Try to extract start/end from combined format like "- Start: X - End: Y"
    if (!details.start || !details.end) {
      const startEndMatch = bodyText.match(/-\s*(?:\*\*)?Start(?:\*\*)?:\s*([^-]+)\s*-\s*(?:\*\*)?End(?:\*\*)?:\s*([^\n-]+)/i);
      if (startEndMatch) {
        details.start = startEndMatch[1].trim().replace(/\*\*/g, '');
        details.end = startEndMatch[2].trim().replace(/\*\*/g, '');
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

  // Setup navigation for results tabs
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
      if (feedback) generateItinerary(feedback);
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
      
      const location = localStorage.getItem('userLocation') || 'Trek Location';
      const title = `${location} Trek`;
      const itineraryData = {
        title,
        location,
        content: rawItineraryText,
        comments: document.getElementById('comments').value || '',
        filters: {}
      };
      
      document.querySelectorAll('.enhanced-filter-btn.active').forEach(btn => {
        const category = btn.dataset.category;
        itineraryData.filters[category] = btn.dataset.value;
      });
      
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
    const location = localStorage.getItem('userLocation') || 'Trek Location';
    const title = `${location} Trek`;
    const itineraryData = {
      title,
      location,
      content: rawItineraryText,
      comments: document.getElementById('comments').value || '',
      filters: {}
    };
    
    document.querySelectorAll('.enhanced-filter-btn.active').forEach(btn => {
      const category = btn.dataset.category;
      itineraryData.filters[category] = btn.dataset.value;
    });
    
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
  window.fixMobileFilterSpacing = fixMobileFilterSpacing;
  window.debugFilterStructure = debugFilterStructure;
  window.injectMobileCSSFix = injectMobileCSSFix;
  window.forceFixMobileSpacing = forceFixMobileSpacing;
  window.centerTabInView = centerTabInView;
  window.toggleDayCard = function(button) {
    const dayCard = button.closest('.itinerary-day-card');
    dayCard.classList.toggle('collapsed');
  };
});
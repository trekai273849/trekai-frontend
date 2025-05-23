// js/pages/customize.js
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
  // Make sure location is defined - fix for missing location error
  const location = localStorage.getItem('userLocation') || 'Mountains';
  document.getElementById('greeting').innerText = `Tell us more about your ideal trekking experience in ${location}.`;

  let cachedPackingList = '';
  let cachedInsights = '';
  let cachedPracticalInfo = '';
  let rawItineraryText = '';

  // Add custom nature-inspired colors to the stylesheet
  const style = document.createElement('style');
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
    
    /* Updated filter button styling */
    .filter-btn {
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      background-color: white;
      border: 2px solid #e5e7eb;
      color: #4b5563;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .filter-btn:hover {
      border-color: #16a34a;
      color: #16a34a;
      background-color: #f0fdf4;
    }
    
    .filter-btn.active {
      background-color: #16a34a;
      color: white;
      border-color: #16a34a;
    }
    
    /* Ensure buttons stay on single line */
    .flex.gap-3 {
      flex-wrap: nowrap !important;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    
    /* Add scrollbar styling for mobile */
    .flex.gap-3::-webkit-scrollbar {
      height: 4px;
    }
    
    .flex.gap-3::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }
    
    .flex.gap-3::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
    }
    
    .flex.gap-3::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }

    /* Progressive Loading Styles */
    .loading-container {
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .progress-bar-container {
      background-color: #f3f4f6;
      overflow: hidden;
    }
    
    .progress-bar {
      background: linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa);
      background-size: 200% 100%;
      animation: progressShimmer 2s ease-in-out infinite;
      transition: width 0.5s ease-out;
    }
    
    @keyframes progressShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .fact-container {
      background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
      border: 1px solid #e9d5ff;
      position: relative;
      overflow: hidden;
    }
    
    .fact-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #8b5cf6, #a78bfa);
      opacity: 0.6;
    }
    
    .fact-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .fact-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    }
    
    .fact-title {
      font-size: 15px;
      font-weight: 600;
      color: #4c1d95;
      letter-spacing: 0.3px;
    }
    
    .fact-content {
      color: #374151;
      line-height: 1.6;
      font-size: 14px;
      font-weight: 400;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
    }
    
    .pulse-circle {
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      animation: gentlePulse 2s ease-in-out infinite;
      margin: 0 8px;
    }
    
    .pulse-circle:nth-child(2) {
      animation-delay: 0.3s;
    }
    
    .pulse-circle:nth-child(3) {
      animation-delay: 0.6s;
    }
    
    @keyframes gentlePulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 0.7;
      }
      50% { 
        transform: scale(1.2);
        opacity: 1;
      }
    }
    
    .loading-message {
      transition: all 0.3s ease-in-out;
    }
    
    .time-estimate {
      font-size: 11px;
      color: #9ca3af;
      font-weight: 400;
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);

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
  function getLocationTip(location) {
    const tips = {
      'french alps': 'The French Alps contain the highest peak in Western Europe - Mont Blanc at 4,809m!',
      'italian alps': 'The Dolomites are a UNESCO World Heritage site known for their unique pale-colored rock.',
      'alps': 'The Alps stretch across 8 countries and are home to over 30,000 animal species.',
      'himalayas': 'The Himalayas contain the world\'s 10 highest peaks, including Mount Everest.',
      'himalaya': 'The Himalayas contain the world\'s 10 highest peaks, including Mount Everest.',
      'andes': 'The Andes is the longest continental mountain range in the world at 7,000km.',
      'patagonia': 'Patagonia is home to some of the world\'s most dramatic landscapes and unique wildlife.',
      'kilimanjaro': 'Mount Kilimanjaro is the highest free-standing mountain in the world.',
      'norway': 'Norway has over 1,000 fjords carved by glaciers over millions of years.',
      'scotland': 'Scotland has 282 Munros (mountains over 3,000 feet) to explore.',
      'switzerland': 'Switzerland has over 7,000 lakes and 48 peaks over 4,000 meters high.',
      'japan': 'Japan has over 100 active volcanoes and some of the world\'s most beautiful mountain trails.',
      'new zealand': 'New Zealand\'s South Island contains 23 peaks over 3,000 meters high.',
      'rockies': 'The Rocky Mountains extend over 3,000 miles from Canada to New Mexico.',
      'appalachian': 'The Appalachian Trail spans 2,190 miles across 14 states.',
      'default': 'Mountain trekking burns 400-700 calories per hour depending on terrain and pace.'
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

  // Function to show progressive loading with stages and tips
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
    let progress = 0;
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    let elapsedTime = 0;
    
    container.innerHTML = `
      <div class="loading-container bg-white rounded-lg p-8 text-center">
        <!-- Progress bar -->
        <div class="w-full progress-bar-container rounded-full h-3 mb-6">
          <div id="progress-bar" class="progress-bar h-3 rounded-full" style="width: 0%"></div>
        </div>
        
        <!-- Main message -->
        <div id="loading-message" class="loading-message text-xl font-semibold text-gray-800 mb-4">
          ${stages[0].message}
        </div>
        
        <!-- Progress percentage -->
        <div id="progress-text" class="text-sm text-gray-600 mb-6">0% Complete</div>
        
        <!-- Clean fact section -->
        <div class="fact-container rounded-xl p-5 mb-6">
          <div class="fact-header">
            <div class="fact-icon">🌍</div>
            <span class="fact-title">Did You Know?</span>
          </div>
          <div id="loading-tip" class="fact-content">${stages[0].tip}</div>
        </div>
        
        <!-- Elegant status indicator -->
        <div class="status-indicator">
          <div class="pulse-circle"></div>
          <div class="pulse-circle"></div>
          <div class="pulse-circle"></div>
        </div>
        
        <!-- Subtle time estimate -->
        <div class="time-estimate">Crafting your perfect adventure</div>
      </div>
    `;
    
    // Update progress and stages
    const progressInterval = setInterval(() => {
      elapsedTime += 500; // Update every 500ms
      progress = Math.min((elapsedTime / totalDuration) * 100, 95); // Cap at 95% until complete
      
      // Determine current stage based on elapsed time
      let cumulativeTime = 0;
      let newStageIndex = 0;
      
      for (let i = 0; i < stages.length; i++) {
        cumulativeTime += stages[i].duration;
        if (elapsedTime < cumulativeTime) {
          newStageIndex = i;
          break;
        }
        newStageIndex = stages.length - 1;
      }
      
      // Update stage if changed
      if (newStageIndex !== currentStage) {
        currentStage = newStageIndex;
        const messageEl = document.getElementById('loading-message');
        const tipEl = document.getElementById('loading-tip');
        
        if (messageEl && tipEl) {
          // Smooth transition effect
          messageEl.style.opacity = '0.5';
          tipEl.style.opacity = '0.5';
          
          setTimeout(() => {
            messageEl.textContent = stages[currentStage].message;
            tipEl.textContent = stages[currentStage].tip;
            messageEl.style.opacity = '1';
            tipEl.style.opacity = '1';
          }, 150);
        }
      }
      
      // Update progress bar
      const progressBar = document.getElementById('progress-bar');
      const progressText = document.getElementById('progress-text');
      
      if (progressBar && progressText) {
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% Complete`;
      }
      
    }, 500);
    
    // Store interval ID to clear it when done
    container.dataset.progressInterval = progressInterval;
  }

  // Function to clear loading intervals
  function clearLoadingIntervals(container) {
    const progressInterval = container.dataset.progressInterval;
    
    if (progressInterval) {
      clearInterval(progressInterval);
      container.removeAttribute('data-progress-interval');
    }
  }

  // Function to complete loading animation
  function completeLoadingAnimation(container) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const messageEl = document.getElementById('loading-message');
    
    if (progressBar && progressText && messageEl) {
      // Complete the progress bar
      progressBar.style.width = '100%';
      progressText.textContent = '100% Complete';
      messageEl.textContent = '✅ Your adventure is ready!';
      
      // Brief delay before clearing
      setTimeout(() => {
        clearLoadingIntervals(container);
      }, 1000);
    } else {
      clearLoadingIntervals(container);
    }
  }

  // Initialize filter buttons
  const setupFilterButtons = () => {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.category;
        document.querySelectorAll(`.filter-btn[data-category="${group}"]`).forEach(el => {
          el.classList.remove('active');
        });
        btn.classList.add('active');
      });
    });
  };

  // Call setupFilterButtons immediately after DOM is loaded
  setupFilterButtons();

  document.getElementById('customization-form').addEventListener('submit', function (e) {
    e.preventDefault();
    generateItinerary();
  });

  async function generateItinerary(additionalFeedback = '') {
    // Get the location from localStorage - fix for missing location error
    const location = localStorage.getItem('userLocation') || 'Mountains';
    if (!location) {
      console.error('No location specified');
      return;
    }

    // Get selected filters - ensure at least one filter is active
    const filters = {};
    document.querySelectorAll('.filter-btn.active').forEach(btn => {
      const category = btn.dataset.category;
      filters[category] = btn.dataset.value;
    });

    // If no filters are selected, provide defaults - fix for missing filters error
    if (Object.keys(filters).length === 0) {
      // Select default buttons and add active class
      const defaultDifficultyBtn = document.querySelector('.filter-btn[data-category="difficulty"][data-value="Moderate"]');
      const defaultAccommodationBtn = document.querySelector('.filter-btn[data-category="accommodation"][data-value="Camping"]');
      
      if (defaultDifficultyBtn) {
        defaultDifficultyBtn.classList.add('active');
        filters.difficulty = 'Moderate';
      }
      
      if (defaultAccommodationBtn) {
        defaultAccommodationBtn.classList.add('active');
        filters.accommodation = 'Camping';
      }
      
      // Add a default technical value
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
    
    // Show progressive loading instead of simple message
    showProgressiveLoading(outputDiv, location);

    try {
      // First try the actual API
      let useMockData = false;
      let data = null;
      
      try {
        // Use direct API URL for production
        const response = await fetch('https://trekai-api-staging.onrender.com/api/finalize', {
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
          
          // Check if we got a valid response
          if (!data || !data.reply) {
            console.warn('API returned empty response. Using mock data instead.');
            useMockData = true;
          }
        }
      } catch (apiError) {
        console.warn('API request failed:', apiError);
        useMockData = true;
      }
      
      // If API call failed or returned invalid data, use mock data
      if (useMockData) {
        console.log("Using mock data for development");
        
        // Simulate API delay (shorter since we already have loading animation)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate location-specific mock data
        const locationName = location.toLowerCase();
        
        // Create a mock trek name based on the location
        const trekName = locationName.includes('french alps') ? 'Tour du Mont Blanc' : 
                         locationName.includes('himalaya') ? 'Annapurna Circuit' :
                         locationName.includes('andes') ? 'Inca Trail' :
                         locationName.includes('patagonia') ? 'Torres del Paine W Trek' :
                         locationName.includes('kilimanjaro') ? 'Machame Route' :
                         `${location} Trek`;
        
        // Basic template that changes slightly based on location
        data = {
          reply: `### Day 1: Starting Point to First Camp
- **Distance**: 8 km (5 miles)
- **Elevation Gain**: 600m (1,970ft)
- **Terrain**: ${locationName.includes('alps') ? 'Alpine meadows and forest trails' : 
                 locationName.includes('himalaya') ? 'Terraced fields and rhododendron forests' :
                 locationName.includes('desert') ? 'Sandy terrain and rocky outcrops' :
                 locationName.includes('coast') ? 'Coastal cliffs and beaches' :
                 'Forest trails and rocky paths'}
- **Accommodation**: ${filters.accommodation || 'Mountain hut'}

Begin your journey in the picturesque village, gradually ascending through beautiful landscapes. Take time to acclimatize to the altitude and enjoy the panoramic views of surrounding peaks. Your guide will share information about local flora and fauna. End the day at a comfortable ${filters.accommodation === 'Camping' ? 'campsite' : 'mountain hut'} with stunning sunset views.

### Day 2: First Camp to Mountain Pass
- **Distance**: 12 km (7.5 miles)
- **Elevation Gain**: 800m (2,625ft)
- **Elevation Loss**: 300m (984ft)
- **Terrain**: ${locationName.includes('alps') ? 'Rocky paths and snowfields' : 
                 locationName.includes('himalaya') ? 'High mountain trails and suspension bridges' :
                 locationName.includes('desert') ? 'Slot canyons and dry riverbeds' :
                 locationName.includes('coast') ? 'Sand dunes and forested sections' :
                 'Alpine terrain with some scrambling required'}
- **Difficulty**: ${filters.difficulty || 'Moderate'}
- **Accommodation**: ${filters.accommodation || 'Mountain hut'}

Today features the most challenging hiking of your trek. The trail climbs steadily through changing ecosystems before reaching the dramatic mountain pass with exceptional views. Lunch will be at a picturesque spot overlooking the valley. In the afternoon, descend to your accommodation, located in a protected valley surrounded by towering peaks.

### Day 3: Mountain Pass to Endpoint
- **Distance**: 10 km (6.2 miles)
- **Elevation Loss**: 900m (2,950ft)
- **Terrain**: ${locationName.includes('alps') ? 'High mountain valleys and glacial moraines' : 
                 locationName.includes('himalaya') ? 'Rhododendron forests and terraced villages' :
                 locationName.includes('desert') ? 'Rocky plateaus and juniper forests' :
                 locationName.includes('coast') ? 'Cliff-top paths and sheltered coves' :
                 'Scenic descent with river crossings'}
- **Accommodation**: Return to trailhead

The final day offers a gentle descent with spectacular views throughout. Enjoy the changing landscape as you make your way back to civilization. There will be plenty of opportunities for photography and wildlife spotting. Celebrate your achievement with a farewell meal featuring local cuisine.

### Packing List
- **Essential Gear**
  - Broken-in hiking boots with ankle support
  - Backpack (30-40L)
  - Trekking poles
  - Headlamp/flashlight
  - First aid kit

- **Clothing**
  - Quick-dry hiking shirts and pants
  - Warm layers (fleece, down jacket)
  - Waterproof jacket and pants
  - Hat and gloves
  - Extra socks

- **Other Items**
  - Water bottles/hydration system (2L minimum)
  - Sunscreen and sunglasses
  - Camera
  - Snacks
  - Personal medications

### Local Insights
- **Culture**: Respect local customs and traditions. Greet locals with a smile and basic phrases in their language.
- **Food**: Try the regional specialties like ${locationName.includes('alps') ? 'fondue and raclette' : 
                                               locationName.includes('himalaya') ? 'momos and dal bhat' :
                                               locationName.includes('andes') ? 'ceviche and lomo saltado' :
                                               locationName.includes('patagonia') ? 'asado and empanadas' :
                                               'local cuisine'}.
- **Wildlife**: Watch for ${locationName.includes('alps') ? 'ibex and marmots' : 
                            locationName.includes('himalaya') ? 'blue sheep and snow leopard tracks' :
                            locationName.includes('andes') ? 'condors and vicuñas' :
                            locationName.includes('patagonia') ? 'guanacos and Andean condors' :
                            locationName.includes('africa') ? 'zebra and various antelope species' :
                            'local wildlife'} along the trail.

### Practical Information
- **Best Season**: ${locationName.includes('alps') ? 'June to September' : 
                     locationName.includes('himalaya') ? 'March-May and September-November' :
                     locationName.includes('desert') ? 'Spring and Fall' :
                     locationName.includes('patagonia') ? 'December to February' :
                     'During dry season'}
- **Permits**: Check if permits are required in advance.
- **Guides**: Consider hiring a local guide for enhanced safety and cultural insights.
- **Altitude**: Proper acclimatization is essential for high-altitude treks.
- **Water**: Bring water purification tablets or a filter for refilling from streams.`
        };
      }
      
      // Complete the loading animation
      completeLoadingAnimation(outputDiv);
      
      // Now process the data (whether from API or mock)
      rawItineraryText = data.reply;
      
      // Preprocess the raw text to normalize format issues and remove markdown
      const preprocessedText = preprocessRawText(rawItineraryText);

      // Extract all sections
      cachedPackingList = extractSection(preprocessedText, 'Packing List');
      cachedInsights = extractSection(preprocessedText, 'Local Insights');
      cachedPracticalInfo = extractSection(preprocessedText, 'Practical Information');

      // Small delay for UX, then show results
      setTimeout(() => {
        // Process and render the enhanced itinerary
        processAndRenderEnhancedItinerary(preprocessedText);
      }, 1000);

    } catch (error) {
      clearLoadingIntervals(outputDiv);
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
      console.error('Error generating itinerary:', error);
    }
  }

  function processAndRenderEnhancedItinerary(text) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    // Add itinerary header
    const itineraryHeader = document.createElement('h2');
    itineraryHeader.className = 'text-2xl font-bold text-gray-800 mb-4 mt-6';
    itineraryHeader.innerText = 'Itinerary';
    container.appendChild(itineraryHeader);

    // Extract and display intro text if present
    const introRegex = /^([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+:|$)/i;
    const introMatch = text.match(introRegex);
    const intro = introMatch && introMatch[1].trim();
    
    if (intro && intro.length > 10) { // Only show if it has meaningful content
      // Clean up intro text by removing markdown
      const cleanedIntro = intro.replace(/#{1,3}/g, '').trim();
      
      const introBlock = document.createElement('div');
      introBlock.className = 'mb-6 text-gray-700';
      introBlock.innerHTML = `<p class="mb-4">${cleanedIntro.replace(/\n/g, '<br>')}</p>`;
      container.appendChild(introBlock);
    }

    // Enhanced day extraction regex to handle more variations
    const dayRegex = /(?:(?:\*\*\*|\#{1,3}|\*\*|\*)?\s*Day\s+(\d+)[:\s]+([^\n]*?)(?:\*\*\*|\*\*|\*)?)(?:\n)([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+[:\s]|#{1,3}\s*Packing List|#{1,3}\s*Local Insights|#{1,3}\s*Practical Information|$)/gi;
    
    let dayMatch;
    let dayCount = 0;
    let dayCards = [];

    while ((dayMatch = dayRegex.exec(text)) !== null) {
      dayCount++;
      const dayNum = dayMatch[1];
      const title = dayMatch[2].trim();
      let bodyText = dayMatch[3].trim();
      
      // Remove any markdown characters from the body text
      bodyText = bodyText.replace(/#{1,3}/g, '');

      // Create a better formatted day content with improved styling
      let formattedDetails = '';
      
      // Process the body text into structured items
      const itemsArray = [];
      
      // List of known field names
      const knownFields = [
        'Start', 'End', 'Distance', 'Elevation gain', 'Elevation gain/loss', 'Elevation loss',
        'Terrain', 'Difficulty', 'Highlights', 'Lunch', 'Accommodation',
        'Water sources', 'Tips'
      ];
      
      // Extract fields with special handling for field boundaries
      const fieldContents = {};
      
      // First pass: extract all field contents into a structured object
      knownFields.forEach(field => {
        // This pattern matches each field and captures its content up to the next field
        const fieldPattern = new RegExp(`(?:^|\\n)\\s*-?\\s*${field}:\\s*([\\s\\S]*?)(?=(?:\\n\\s*-?\\s*(?:${knownFields.join('|')}):|\\n\\n\\*|$))`, 'i');
        const match = bodyText.match(fieldPattern);
        if (match) {
          let content = match[1].trim();
          
          // Special handling for Tips field
          if (field === 'Tips' && content.includes('Packing List')) {
            // Only keep content up to "Packing List"
            content = content.split(/Packing List|\*/)[0].trim();
          }
          
          // Clean up content
          fieldContents[field] = content.replace(/\*.*?\*/g, '').replace(/#{1,3}/g, '');
        }
      });
      
      // Second pass: render each field in proper order with appropriate styling
      knownFields.forEach(field => {
        if (fieldContents[field]) {
          // Style fields based on their type
          if (field === 'Highlights' || field === 'Terrain' || field === 'Water sources') {
            itemsArray.push(`<li class="mb-2"><strong class="text-earthy-green">${field}:</strong> <span class="text-gray-700">${fieldContents[field]}</span></li>`);
          } else if (field === 'Difficulty') {
            let difficultyClass = 'text-green-600';
            if (fieldContents[field].toLowerCase().includes('moderate')) {
              difficultyClass = 'text-yellow-600';
            } else if (fieldContents[field].toLowerCase().includes('challenging') || fieldContents[field].toLowerCase().includes('difficult')) {
              difficultyClass = 'text-red-600';
            }
            itemsArray.push(`<li class="mb-2"><strong>${field}:</strong> <span class="${difficultyClass}">${fieldContents[field]}</span></li>`);
          } else {
            itemsArray.push(`<li class="mb-2"><strong>${field}:</strong> ${fieldContents[field]}</li>`);
          }
        }
      });
      
      formattedDetails = itemsArray.join('');
      
      // If we couldn't parse structured items, try a simpler approach
      if (!formattedDetails) {
        // Alternative parsing for less structured content
        const lines = bodyText.split('\n').filter(line => line.trim());
        const simpleItems = [];
        
        lines.forEach(line => {
          // Remove markdown and clean up line
          const cleanLine = line.replace(/^[-•–*]\s*/, '').replace(/#{1,3}/g, '').trim();
          
          if (cleanLine.includes(':')) {
            const [key, ...valueParts] = cleanLine.split(':');
            const value = valueParts.join(':').trim();
            if (key && value) {
              simpleItems.push(`<li class="mb-2"><strong>${key.trim()}:</strong> ${value}</li>`);
            } else {
              simpleItems.push(`<li class="mb-1">${cleanLine}</li>`);
            }
          } else if (cleanLine) {
            simpleItems.push(`<li class="mb-1">${cleanLine}</li>`);
          }
        });
        
        formattedDetails = simpleItems.join('');
      }
      
      // If still no structured content, show the raw text
      if (!formattedDetails) {
        formattedDetails = `<p>${bodyText}</p>`;
      } else {
        formattedDetails = `<ul class="list-none py-2">${formattedDetails}</ul>`;
      }

      // Create the enhanced accordion card
      const card = document.createElement('div');
      card.className = 'mb-4 border border-gray-200 rounded shadow-sm';

      card.innerHTML = `
        <button class="w-full flex justify-between items-center px-4 py-3 bg-mountain-blue text-left font-semibold text-gray-800 focus:outline-none accordion-toggle">
          <span>Day ${dayNum}: ${title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div class="accordion-body max-h-0 overflow-hidden transition-all duration-300 bg-white px-4">
          ${formattedDetails}
        </div>
      `;

      const toggle = card.querySelector('.accordion-toggle');
      const body = card.querySelector('.accordion-body');
      const icon = card.querySelector('svg');

      toggle.addEventListener('click', () => {
        body.classList.toggle('max-h-0');
        icon.classList.toggle('rotate-180');
      });

      dayCards.push({ day: parseInt(dayNum), card });
    }

    // Sort and append the day cards in order
    dayCards.sort((a, b) => a.day - b.day).forEach(item => {
      container.appendChild(item.card);
    });

    // Render additional sections and add event handlers for feedback and save buttons
    renderAdditionalSections(container, dayCount);
  }

  // Function to render additional sections (extracted for clarity)
  function renderAdditionalSections(container, dayCount) {
    // Handle case where day parsing fails or returns zero days
    if (dayCount === 0) {
      renderFallbackContent(container);
      return;
    }

    // Add additional information section if we have packing list, insights, or practical info
    if (cachedPackingList || cachedInsights || cachedPracticalInfo) {
      const extrasHeader = document.createElement('h2');
      extrasHeader.className = 'text-2xl font-bold text-gray-800 mb-4 mt-10';
      extrasHeader.innerText = 'Additional Information';
      container.appendChild(extrasHeader);
    }

    // Format and render packing list with subsections
    if (cachedPackingList) {
      // Process subsections if they exist
      let formattedPackingList = processSubsections(cachedPackingList);
      container.appendChild(renderAccordionBlock('Packing List', formattedPackingList, false, 'bg-earthy-green'));
    }

    // Format and render local insights with subsections
    if (cachedInsights) {
      let formattedInsights = processSubsections(cachedInsights);
      container.appendChild(renderAccordionBlock('Local Insights', formattedInsights, false, 'bg-earthy-tan'));
    }

    // Format and render practical information with subsections
    if (cachedPracticalInfo) {
      let formattedInfo = processSubsections(cachedPracticalInfo);
      container.appendChild(renderAccordionBlock('Practical Information', formattedInfo, false, 'bg-earthy-blue'));
    }

    // Show accordion controls if we have sections
    if (dayCount > 0 || cachedPackingList || cachedInsights || cachedPracticalInfo) {
      const accordionControls = document.getElementById('accordion-controls');
      if (accordionControls) {
        accordionControls.classList.remove('hidden');
      }
    }

    addFeedbackAndSaveButtons(container);
  }

  // Function to render fallback content when day parsing fails
  function renderFallbackContent(container) {
    // Fallback: Try a more lenient approach to extracting days
    const text = rawItineraryText; // Use the original raw text
    const simpleDayRegex = /Day\s+(\d+)[:\s]+([^\n]*?)(?:\n)([\s\S]*?)(?=Day\s+\d+[:\s]|Packing List|Local Insights|Practical Information|$)/gi;
    let simpleDayMatch;
    let simpleDayCards = [];
    
    while ((simpleDayMatch = simpleDayRegex.exec(text)) !== null) {
      const dayNum = simpleDayMatch[1];
      const title = simpleDayMatch[2].trim();
      // Clean markdown from content
      const content = simpleDayMatch[3].trim().replace(/#{1,3}/g, '');
      
      const card = document.createElement('div');
      card.className = 'mb-4 border border-gray-200 rounded shadow-sm';
      
      card.innerHTML = `
        <button class="w-full flex justify-between items-center px-4 py-3 bg-mountain-blue text-left font-semibold text-gray-800 focus:outline-none accordion-toggle">
          <span>Day ${dayNum}: ${title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div class="accordion-body max-h-0 overflow-hidden transition-all duration-300 bg-white px-4">
          <div class="py-3 whitespace-pre-wrap">${content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
      
      const toggle = card.querySelector('.accordion-toggle');
      const body = card.querySelector('.accordion-body');
      const icon = card.querySelector('svg');
      
      toggle.addEventListener('click', () => {
        body.classList.toggle('max-h-0');
        icon.classList.toggle('rotate-180');
      });
      
      simpleDayCards.push({ day: parseInt(dayNum), card });
    }
    
    if (simpleDayCards.length > 0) {
      // Found days with simpler regex
      simpleDayCards.sort((a, b) => a.day - b.day).forEach(item => {
        container.appendChild(item.card);
      });
      
      // Add additional sections
      renderAdditionalSections(container, simpleDayCards.length);
    } else {
      // Ultimate fallback: Just show the whole text with markdown removed
      const cleanText = text.replace(/#{1,3}/g, '');
      const fallbackCard = document.createElement('div');
      fallbackCard.className = 'mb-4 border rounded shadow-sm p-4 bg-white';
      fallbackCard.innerHTML = `<pre class="whitespace-pre-wrap">${cleanText}</pre>`;
      container.appendChild(fallbackCard);
      
      // Add feedback and save buttons
      addFeedbackAndSaveButtons(container);
    }
  }

  // Function to add feedback and save buttons
  function addFeedbackAndSaveButtons(container) {
    // Add feedback input
    const feedbackInput = document.createElement('div');
    feedbackInput.className = 'mt-6 mb-8';
    feedbackInput.innerHTML = `
      <input type="text" id="feedback" placeholder="Add feedback to adjust your itinerary" class="w-full border px-3 py-2 rounded mb-2" />
    `;
    container.appendChild(feedbackInput);

    // Add buttons container with requested buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'mt-6 flex flex-col md:flex-row gap-3';
    buttonsContainer.innerHTML = `
      <button id="regenerate-itinerary" class="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex-1">
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Update Itinerary
      </button>
      <button id="save-itinerary" class="flex items-center justify-center border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg transition-colors flex-1">
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Save My Adventure
      </button>
      <button id="talk-to-guide" class="flex items-center justify-center border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg transition-colors flex-1">
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Chat to Pro Guide
      </button>
    `;
    container.appendChild(buttonsContainer);

    // Event listeners for the buttons
    const regenerateBtn = document.getElementById('regenerate-itinerary');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
        const feedback = document.getElementById('feedback').value;
        if (feedback) generateItinerary(feedback);
      });
    }

    const saveBtn = document.getElementById('save-itinerary');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await handleSaveItinerary();
      });
    }

    const guideBtn = document.getElementById('talk-to-guide');
    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        alert('Pro Guide Chat feature coming soon! Get personalized advice from our trekking experts.');
        // Future implementation: Open chat interface or redirect to guide page
      });
    }
  }

  // NEW FUNCTION: Handle save itinerary with authentication check
  async function handleSaveItinerary() {
    try {
      // Check if user is authenticated
      if (!auth || !auth.currentUser) {
        // Store the current itinerary data before redirecting
        storeItineraryForLater();
        // Show authentication modal instead of basic alert
        showAuthModal();
        return;
      }

      const token = await auth.currentUser.getIdToken();
      
      // Prepare data to save
      const location = localStorage.getItem('userLocation') || 'Trek Location';
      const title = `${location} Trek`;
      const itineraryData = {
        title,
        location,
        content: rawItineraryText,
        comments: document.getElementById('comments').value || '',
        filters: {}
      };
      
      // Get active filters
      document.querySelectorAll('.filter-btn.active').forEach(btn => {
        const category = btn.dataset.category;
        itineraryData.filters[category] = btn.dataset.value;
      });
      
      // Use direct URL for production
      const response = await fetch('https://trekai-api-staging.onrender.com/api/itineraries', {
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

  // Function to store itinerary data for saving after authentication
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
    
    // Get active filters
    document.querySelectorAll('.filter-btn.active').forEach(btn => {
      const category = btn.dataset.category;
      itineraryData.filters[category] = btn.dataset.value;
    });
    
    // Store in localStorage with a special key
    localStorage.setItem('pendingItinerary', JSON.stringify(itineraryData));
    localStorage.setItem('returnToCustomize', 'true');
  }

  // Function to show authentication modal
  function showAuthModal() {
    const modal = document.getElementById('auth-required-modal');
    modal.style.display = 'flex';
  }

  // Function to close authentication modal
  function closeAuthModal() {
    const modal = document.getElementById('auth-required-modal');
    modal.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.style.animation = '';
    }, 200);
  }

  // Function to redirect to sign up
  function redirectToSignUp() {
    window.location.href = 'sign-up.html';
  }

  // Function to redirect to sign in
  function redirectToSignIn() {
    window.location.href = 'sign-up.html'; // They can switch to login on the sign-up page
  }

  // Function to show welcome back modal
  function showWelcomeModal() {
    const modal = document.getElementById('welcome-back-modal');
    modal.style.display = 'flex';
  }

  // Function to close welcome modal
  function closeWelcomeModal() {
    const modal = document.getElementById('welcome-back-modal');
    modal.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.style.animation = '';
    }, 200);
  }

  // Function to handle auto-save after authentication
  async function handlePendingItinerary() {
    const pendingItinerary = localStorage.getItem('pendingItinerary');
    const returnToCustomize = localStorage.getItem('returnToCustomize');
    
    if (pendingItinerary && returnToCustomize && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        const itineraryData = JSON.parse(pendingItinerary);
        
        const response = await fetch('https://trekai-api-staging.onrender.com/api/itineraries', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(itineraryData)
        });
        
        if (response.ok) {
          // Clear the pending data
          localStorage.removeItem('pendingItinerary');
          localStorage.removeItem('returnToCustomize');
          
          // Show welcome modal
          setTimeout(() => {
            showWelcomeModal();
          }, 1000); // Delay to ensure page is loaded
        }
      } catch (error) {
        console.error('Error auto-saving itinerary:', error);
        // Clear the pending data even on error to prevent infinite loops
        localStorage.removeItem('pendingItinerary');
        localStorage.removeItem('returnToCustomize');
      }
    }
  }

  // Check for pending itinerary on page load
  setTimeout(() => {
    // Wait for Firebase auth to initialize
    onAuthStateChanged(auth, (user) => {
      if (user) {
        handlePendingItinerary();
      }
    });
  }, 2000);

  function renderAccordionBlock(title, content, open = false, bgColor = 'bg-mountain-blue') {
    const card = document.createElement('div');
    card.className = `mb-4 border border-gray-200 rounded shadow-sm`;

    card.innerHTML = `
      <button class="w-full flex justify-between items-center px-4 py-3 ${bgColor} text-left font-semibold text-gray-800 focus:outline-none accordion-toggle">
        <span>${title}</span>
        <svg class="w-5 h-5 transform transition-transform ${open ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div class="accordion-body ${open ? '' : 'max-h-0 overflow-hidden'} transition-all duration-300 bg-white px-4">
        <div class="py-3 whitespace-pre-wrap">${content}</div>
      </div>
    `;

    const toggle = card.querySelector('.accordion-toggle');
    const body = card.querySelector('.accordion-body');
    const icon = card.querySelector('svg');

    toggle.addEventListener('click', () => {
      body.classList.toggle('max-h-0');
      icon.classList.toggle('rotate-180');
    });

    return card;
  }

  // Set default filters on page load
  setTimeout(() => {
    // Set default filters if none are selected
    const activeFilters = document.querySelectorAll('.filter-btn.active');
    if (activeFilters.length === 0) {
      // Select default buttons
      const defaultDifficultyBtn = document.querySelector('.filter-btn[data-category="difficulty"][data-value="Moderate"]');
      const defaultAccommodationBtn = document.querySelector('.filter-btn[data-category="accommodation"][data-value="Camping"]');
      const defaultTechnicalBtn = document.querySelector('.filter-btn[data-category="technical"][data-value="None"]');
      
      if (defaultDifficultyBtn) defaultDifficultyBtn.classList.add('active');
      if (defaultAccommodationBtn) defaultAccommodationBtn.classList.add('active');
      if (defaultTechnicalBtn) defaultTechnicalBtn.classList.add('active');
    }
  }, 100);

  // Success Modal Functions
  function showSuccessModal() {
    const modal = document.getElementById('itinerary-success-modal');
    modal.style.display = 'flex';
  }

  function closeSuccessModal() {
    const modal = document.getElementById('itinerary-success-modal');
    modal.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.style.animation = '';
    }, 200);
  }

  // Make functions globally available
  window.showSuccessModal = showSuccessModal;
  window.closeSuccessModal = closeSuccessModal;
  window.showAuthModal = showAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.redirectToSignUp = redirectToSignUp;
  window.redirectToSignIn = redirectToSignIn;
  window.showWelcomeModal = showWelcomeModal;
  window.closeWelcomeModal = closeWelcomeModal;

  // Close modal when clicking outside
  document.addEventListener('click', function(e) {
    const successModal = document.getElementById('itinerary-success-modal');
    const authModal = document.getElementById('auth-required-modal');
    const welcomeModal = document.getElementById('welcome-back-modal');
    
    if (e.target === successModal) {
      closeSuccessModal();
    }
    if (e.target === authModal) {
      closeAuthModal();
    }
    if (e.target === welcomeModal) {
      closeWelcomeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const successModal = document.getElementById('itinerary-success-modal');
      const authModal = document.getElementById('auth-required-modal');
      const welcomeModal = document.getElementById('welcome-back-modal');
      
      if (successModal.style.display === 'flex') {
        closeSuccessModal();
      }
      if (authModal.style.display === 'flex') {
        closeAuthModal();
      }
      if (welcomeModal.style.display === 'flex') {
        closeWelcomeModal();
      }
    }
  });
});
// js/pages/customize.js

import { AdaptivePackingListGenerator } from '../services/packingListService.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { preprocessRawText, extractSection, processSubsections, extractDays } from '../utils/itinerary.js';

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

// Global variables
let firebase = { app, auth };
let currentQuizData = null;

const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    } else {
        return 'https://trekai-api.onrender.com';
    }
};

function mapQuizDataToInputs(quizData) {
    const tripStyleMapping = {
        '1-3': 'camping-short', '4-7': 'hut-trek', '8+': 'expedition', 'day-hike': 'day'
    };
    const terrainMapping = {
        'mountains': 'alpine', 'forest': 'forest', 'coast': 'coastal', 'desert': 'desert', 'jungle': 'jungle', 'any': 'alpine'
    };
    const weatherMapping = {
        'spring': 'sunny-cold', 'summer': 'sunny-warm', 'autumn': 'rainy', 'winter': 'snow'
    };
    const basic = {
        tripStyle: tripStyleMapping[quizData.length] || tripStyleMapping[quizData.trekType] || 'camping-short',
        terrain: terrainMapping[quizData.terrain] || 'alpine',
        weather: weatherMapping[quizData.season] || 'sunny-cold',
        specialNeeds: quizData.interests || []
    };
    const advanced = {
        temperature: { specified: false, dayHigh: null, nightLow: null },
        elevation: { specified: false, start: null, max: null, camp: null },
        physical: { specified: false, dailyDistance: '', elevationGain: '' },
        logistics: { specified: false, waterSources: '', resupplyFreq: '' },
        accommodation: { types: quizData.accommodation ? [quizData.accommodation] : [], specified: !!quizData.accommodation },
        activities: { photography: (quizData.interests || []).includes('photography'), wildlife: (quizData.interests || []).includes('wildlife'), specified: (quizData.interests || []).length > 0 },
        group: { specified: false, size: '', experience: '' },
        preferences: { specified: false, ultralight: false, comfort: false, safety: false, minimalist: false },
        context: ''
    };
    return { basic, advanced };
}

document.addEventListener('DOMContentLoaded', () => {
  let itineraryState = {
    rawItineraryText: '',
    parsedDays: [],
    cachedInsights: '',
    cachedPracticalInfo: '',
    packingData: null,
  };

  function getLocationTip(location) {
    const tips = { 'europe': 'The Alps contain Mont Blanc, Western Europe\'s highest peak at 4,809m!', 'asia': 'The Himalayas contain 14 peaks over 8,000m, formed by tectonic plate collision.', 'americas': 'The Andes stretch 7,000km - longer than the distance from New York to Paris!', 'oceania': 'New Zealand was the last landmass on Earth to be discovered by humans.', 'africa': 'Kilimanjaro has three distinct climate zones: tropical, temperate, and arctic.', 'default': 'Mountain air contains less oxygen, which is why you might feel breathless at first.' };
    if (!location) return tips.default;
    const locationLower = location.toLowerCase();
    for (const [key, tip] of Object.entries(tips)) {
      if (key !== 'default' && locationLower.includes(key)) return tip;
    }
    return tips.default;
  }

  function showProgressiveLoading(container, location) {
    const stages = [
      { message: "🗺️ Analyzing your preferences...", tip: getLocationTip(location), duration: 4000 },
      { message: "🥾 Planning optimal routes...", tip: "The best trekking routes balance scenic beauty with safety, avoiding steep drop-offs and unstable terrain.", duration: 5000 },
      { message: "🏔️ Selecting scenic highlights...", tip: "Dawn and dusk provide the most dramatic mountain lighting - photographers call it 'alpenglow'.", duration: 4500 },
      { message: "🎒 Customizing your experience...", tip: "Every 1000m of elevation gain requires an extra day for proper acclimatization.", duration: 4000 },
      { message: "📋 Finalizing your itinerary...", tip: "The 'leave no trace' principle helps preserve these incredible landscapes for future generations.", duration: 3000 }
    ];
    let currentStage = 0;
    container.innerHTML = `<div class="loading-card"><div class="loading-spinner"></div><h3 id="loading-message" style="font-size: 1.3em; color: var(--text-dark); margin-bottom: 15px;">${stages[0].message}</h3><p id="loading-tip" style="color: var(--text-light); max-width: 500px; margin: 0 auto;">${stages[0].tip}</p></div>`;
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      let cumulative = 0;
      for (let i = 0; i < stages.length; i++) {
        cumulative += stages[i].duration;
        if (elapsed < cumulative) {
          if (i !== currentStage) {
            currentStage = i;
            const msgEl = document.getElementById('loading-message');
            const tipEl = document.getElementById('loading-tip');
            if(msgEl) msgEl.textContent = stages[i].message;
            if(tipEl) tipEl.textContent = stages[i].tip;
          }
          break;
        }
      }
      if (elapsed >= totalDuration) clearInterval(interval);
    }, 100);
    container.dataset.loadingInterval = interval;
  }

  function clearLoadingIntervals(container) {
    const interval = container.dataset.loadingInterval;
    if (interval) {
      clearInterval(interval);
      container.removeAttribute('data-loadingInterval');
    }
  }

  window.generateItineraryFromQuiz = async function(quizData) {
    currentQuizData = quizData;
    let location = quizData.specificLocation || quizData.location;
    if (location === 'any' || location === 'anywhere') location = 'a beautiful mountain region';
    let duration = quizData.trekType === 'day-hike' ? 'day hike' : `${quizData.trekLength || 'a few'} day trek`;
    let prompt = `Create a ${duration} itinerary specifically for ${location}. IMPORTANT: The itinerary MUST be in ${location}, not any other location. Preferences: Difficulty: ${quizData.difficulty}, Season: ${quizData.season}`;
    if (quizData.trekType === 'multi-day') prompt += `\n- Accommodation: ${quizData.accommodation}`;
    if (quizData.interests && quizData.interests.length > 0) prompt += `\n- Interests: ${quizData.interests.join(', ')}`;
    if (quizData.locationDetails) {
        if (quizData.locationDetails.specificArea) prompt += `\n- Specific area: ${quizData.locationDetails.specificArea}`;
        if (quizData.locationDetails.originalInput) prompt += `\n- User specified: "${quizData.locationDetails.originalInput}"`;
    }
    if (quizData.details) prompt += `\n- Special requirements: ${quizData.details}`;
    prompt += `\n\nPlease format the itinerary with: - Day-by-day breakdown with clear titles - Distance, elevation gain/loss, terrain, difficulty, accommodation for each day - Highlights, tips, water sources, and lunch suggestions - A packing list section - Local insights section - Practical information section`;

    const outputDiv = document.getElementById('itinerary-cards');
    showProgressiveLoading(outputDiv, location);

    try {
      const { basic, advanced } = mapQuizDataToInputs(quizData);
      const packingListGenerator = new AdaptivePackingListGenerator(basic, advanced);
      itineraryState.packingData = packingListGenerator.generate();
      console.log('✅ Packing list generated locally.', itineraryState.packingData);

      let useMockData = false;
      let data = null;
      const API_BASE_URL = getApiBaseUrl();

      try {
        const response = await fetch(`${API_BASE_URL}/api/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: location,
            filters: { difficulty: quizData.difficulty, accommodation: quizData.accommodation || 'Not applicable', technical: 'None', altitude: "2000–3000m" },
            comments: prompt,
            title: `${location} ${duration}`
          })
        });
        if (!response.ok) { console.warn(`Server returned status ${response.status}. Using mock data instead.`); useMockData = true; }
        else {
          data = await response.json();
          if (!data || !data.reply) { console.warn('API returned empty response. Using mock data instead.'); useMockData = true; }
        }
      } catch (apiError) {
        console.warn('API request failed:', apiError);
        useMockData = true;
      }
      
      if (useMockData) {
        console.log("Using mock data for development");
        await new Promise(resolve => setTimeout(resolve, 2000));
        const dayCount = quizData.trekType === 'day-hike' ? 1 : parseInt(quizData.trekLength.split('-')[0]) || 3;
        let mockItinerary = `# ${location} ${duration} Itinerary\n\n`;
        for (let i = 1; i <= dayCount; i++) {
          mockItinerary += `### Day ${i}: ${i === 1 ? 'Starting Point' : 'Continuing Journey'} to ${i === dayCount ? 'Final Destination' : `Camp ${i}`}\n- Start: Village at 1,200m - End: ${quizData.accommodation || 'Scenic viewpoint'} at ${1200 + (i * 400)}m\n- **Distance**: ${8 + (i * 2)} km (${5 + (i * 1.2)} miles)\n- **Elevation Gain**: ${400 + (i * 100)}m\n- **Terrain**: ${quizData.difficulty === 'easy' ? 'Well-marked paths' : quizData.difficulty === 'challenging' ? 'Rocky alpine terrain' : 'Mixed forest and meadow trails'}\n- **Accommodation**: ${quizData.accommodation || 'Not applicable'}\n- **Difficulty**: ${quizData.difficulty}\n- **Highlights**: ${quizData.interests.includes('wildlife') ? 'Wildlife viewing opportunities, ' : ''}${quizData.interests.includes('photography') ? 'Stunning photo spots, ' : ''}panoramic mountain views\n- **Lunch**: Pack lunch with local specialties\n- **Water Sources**: Stream at ${Math.floor(i * 2.5)}km mark\n- **Tips**: ${quizData.season === 'winter' ? 'Check snow conditions before departure' : quizData.season === 'summer' ? 'Start early to avoid afternoon heat' : 'Layer clothing for changing conditions'}\n\nBegin your adventure in ${location} with gradual elevation gain through beautiful landscapes.\n\n`;
        }
        mockItinerary += `\n### Local Insights\n*Culture:*\n- Respect local customs in ${location}\n- Learn basic greetings in local language\n*Food:*\n- Try regional mountain specialties\n- Carry energy snacks\n### Practical Information\n*Best Season:*\n- ${quizData.season} offers ${quizData.season === 'spring' ? 'wildflowers and mild weather' : quizData.season === 'summer' ? 'long days and warm conditions' : quizData.season === 'autumn' ? 'stunning fall colors' : 'snow-covered landscapes'}\n*Permits:*\n- Check local requirements for ${location}\n- Book accommodations in advance for ${quizData.season} season`;
        data = { reply: mockItinerary };
      }
      
      clearLoadingIntervals(outputDiv);
      
      const preprocessedText = preprocessRawText(data.reply);
      itineraryState.rawItineraryText = data.reply;
      itineraryState.cachedInsights = extractSection(preprocessedText, 'Local Insights');
      itineraryState.cachedPracticalInfo = extractSection(preprocessedText, 'Practical Information');
      itineraryState.parsedDays = extractDays(preprocessedText);

      setTimeout(() => {
        outputDiv.classList.add('show');
        processAndRenderEnhancedItinerary(preprocessedText, itineraryState.packingData);
      }, 500);

    } catch (error) {
      clearLoadingIntervals(outputDiv);
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
      console.error('Error generating itinerary:', error);
    }
  };

  function createDetailItem(icon, label, content, className = '', customStyle = '') {
    if (content && content.toString().toLowerCase().includes('not applicable')) return '';
    return `<div class="detail-item ${className}"><div class="detail-header"><span class="detail-icon">${icon}</span><span class="detail-label">${label}</span></div><div class="detail-content" ${customStyle ? `style="color: ${customStyle};"` : ''}>${content}</div></div>`;
  }

  function getDifficultyColor(difficulty) {
    if (!difficulty) return '#F39C12';
    const difficultyLevel = difficulty.toLowerCase();
    if (difficultyLevel.includes('easy')) return '#27AE60';
    if (difficultyLevel.includes('challenging') || difficultyLevel.includes('difficult')) return '#E74C3C';
    return '#F39C12';
  }

  function createGroupedDetailSections(details) {
    let essentialHTML = '';
    let trailTipsHTML = '';
    if (details.elevationGain || details.elevationLoss) {
      const elevText = [];
      if (details.elevationGain) elevText.push(`Gain: ${details.elevationGain}`);
      if (details.elevationLoss) elevText.push(`Loss: ${details.elevationLoss}`);
      essentialHTML += createDetailItem('📈', 'Elevation', elevText.join(' • '));
    }
    if (details.difficulty) essentialHTML += createDetailItem('💪', 'Difficulty', details.difficulty, 'difficulty', getDifficultyColor(details.difficulty));
    if (details.terrain) essentialHTML += createDetailItem('🏔️', 'Terrain', details.terrain);
    if (details.start || details.end || details.accommodation) {
      const routeParts = [];
      if (details.start) routeParts.push(`Start: ${details.start}`);
      if (details.end) routeParts.push(`End: ${details.end}`);
      if (details.accommodation) routeParts.push(`Stay: ${details.accommodation}`);
      essentialHTML += createDetailItem('📍', 'Route & Accommodation', routeParts.join(' → '));
    }
    if (details.highlights) trailTipsHTML += createDetailItem('⭐', 'Highlights', details.highlights, 'highlights');
    if (details.lunch) trailTipsHTML += createDetailItem('🍽️', 'Lunch', details.lunch);
    if (details.waterSources) trailTipsHTML += createDetailItem('💧', 'Water Sources', details.waterSources);
    if (details.tips) trailTipsHTML += createDetailItem('💡', 'Tips', details.tips, 'tips');
    let html = '';
    if (essentialHTML) html += `<div class="detail-group"><h4 class="detail-group-title">Essential Information</h4><div class="detail-group-content">${essentialHTML}</div></div>`;
    if (trailTipsHTML) html += `<div class="detail-group"><h4 class="detail-group-title">Trail Tips</h4><div class="detail-group-content">${trailTipsHTML}</div></div>`;
    return html;
  }

  function parseDayDetails(bodyText) {
    const details = { distance: null, elevationGain: null, elevationLoss: null, terrain: null, difficulty: null, accommodation: null, highlights: null, lunch: null, tips: null, waterSources: null, description: null, start: null, end: null };
    const fieldPatterns = { distance: /(?:-\s*)?(?:\*\*)?(?:Distance|Trek)(?:\*\*)?:\s*([^\n]+)/i, elevationGain: /(?:-\s*)?(?:\*\*)?Elevation\s+(?:gain|Gain)(?:\*\*)?:\s*([^\n]+)/i, elevationLoss: /(?:-\s*)?(?:\*\*)?Elevation\s+(?:loss|Loss)(?:\*\*)?:\s*([^\n]+)/i, terrain: /(?:-\s*)?(?:\*\*)?Terrain(?:\*\*)?:\s*([^\n]+)/i, difficulty: /(?:-\s*)?(?:\*\*)?Difficulty(?:\*\*)?:\s*([^\n]+)/i, accommodation: /(?:-\s*)?(?:\*\*)?Accommodation(?:\*\*)?:\s*([^\n]+)/i, highlights: /(?:-\s*)?(?:\*\*)?Highlights?(?:\*\*)?:\s*([^\n]+)/i, lunch: /(?:-\s*)?(?:\*\*)?Lunch(?:\*\*)?:\s*([^\n]+)/i, tips: /(?:-\s*)?(?:\*\*)?Tips?(?:\*\*)?:\s*([^\n]+)/i, waterSources: /(?:-\s*)?(?:\*\*)?Water\s+sources?(?:\*\*)?:\s*([^\n]+)/i, start: /(?:-\s*)?(?:\*\*)?Start(?:\*\*)?:\s*([^\n\-]+)/i, end: /(?:-\s*)?(?:\*\*)?End(?:\*\*)?:\s*([^\n\-]+)/i };
    Object.keys(fieldPatterns).forEach(field => {
        const match = bodyText.match(fieldPatterns[field]);
        if (match) {
            const value = match[1].trim().replace(/\*\*/g, '');
            if (!value.toLowerCase().includes('not applicable')) details[field] = value;
        }
    });
    const startEndMatch = bodyText.match(/-\s*(?:\*\*)?Start(?:\*\*)?:\s*([^-]+)\s*-\s*(?:\*\*)?End(?:\*\*)?:\s*([^\n-]+)/i);
    if (startEndMatch) {
        const startValue = startEndMatch[1].trim().replace(/\*\*/g, '');
        const endValue = startEndMatch[2].trim().replace(/\*\*/g, '');
        if (!startValue.toLowerCase().includes('not applicable')) details.start = startValue;
        if (!endValue.toLowerCase().includes('not applicable')) details.end = endValue;
    }
    const fieldsRegex = /(?:-\s*)?(?:\*\*)?(?:Distance|Trek|Elevation\s+(?:gain|loss)|Terrain|Difficulty|Accommodation|Highlights?|Lunch|Tips?|Water\s+sources?|Start|End)(?:\*\*)?:\s*[^\n]+/gi;
    const remainingText = bodyText.replace(fieldsRegex, '').replace(/-\s*(?:\*\*)?Start(?:\*\*)?:.*?(?:\*\*)?End(?:\*\*)?:[^\n]+/i, '').trim();
    if (remainingText && remainingText.length > 20) details.description = remainingText;
    return details;
  }

  function processAndRenderEnhancedItinerary(text, packingData) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';
    const resultsWrapper = document.createElement('div');
    resultsWrapper.className = 'results-wrapper';
    resultsWrapper.innerHTML = `<h2 class="section-header">Your Custom Itinerary</h2><p class="section-subtitle">Explore your personalized adventure with day-by-day details</p><div class="results-nav-tabs"><div class="results-nav-container"><button class="results-nav-tab active" data-section="itinerary">Itinerary</button><button class="results-nav-tab" data-section="map">Route Map</button><button class="results-nav-tab" data-section="packing">What to Pack</button><button class="results-nav-tab" data-section="insights">Local Insights</button><button class="results-nav-tab" data-section="practical">Practical Info</button></div></div>`;
    const contentSections = document.createElement('div');
    contentSections.className = 'content-sections';

    const itinerarySection = document.createElement('div');
    itinerarySection.className = 'content-section-result active';
    itinerarySection.id = 'itinerary-section';
    const introRegex = /^([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+:|$)/i;
    const introMatch = text.match(introRegex);
    const intro = introMatch && introMatch[1].trim();
    if (intro && intro.length > 10) {
        const cleanedIntro = intro.replace(/#{1,3}/g, '').trim();
        const introCard = document.createElement('div');
        introCard.className = 'info-card';
        introCard.innerHTML = `<h3><span class="info-card-icon">🏔️</span> Overview</h3><p style="line-height: 1.8; color: var(--text-light);">${cleanedIntro.replace(/\n/g, '<br>')}</p>`;
        itinerarySection.appendChild(introCard);
    }
    const timeline = document.createElement('div');
    timeline.className = 'itinerary-timeline';
    itineraryState.parsedDays.forEach(dayData => {
        const dayCard = document.createElement('div');
        dayCard.className = 'itinerary-day-card';
        const details = parseDayDetails(dayData.body);
        dayCard.innerHTML = `<div class="day-card-header"><div class="day-number">Day ${dayData.dayNum}</div><h3 class="day-title-enhanced">${dayData.title}</h3><button class="day-card-toggle" onclick="toggleDayCard(this)" aria-label="Toggle day details"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button></div><div class="day-card-content">${details.description ? `<div class="day-description-box"><p class="day-description-enhanced">${details.description}</p></div>` : ''}${details.distance && !details.distance.toLowerCase().includes('not applicable') ? `<div class="distance-section"><span class="distance-icon">📏</span><span class="distance-text">${details.distance}</span></div>` : ''}<div class="grouped-details-container">${createGroupedDetailSections(details)}</div></div>`;
        timeline.appendChild(dayCard);
    });
    itinerarySection.appendChild(timeline);
    contentSections.appendChild(itinerarySection);

    const mapSection = document.createElement('div');
    mapSection.className = 'content-section-result';
    mapSection.id = 'map-section';
    mapSection.innerHTML = `<div class="info-card"><h3><span class="info-card-icon">🗺️</span> Route Map</h3><div id="route-map-container" style="text-align: center;"><img src="images/illustrations/maps-coming-soon.png" alt="Maps coming soon" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"><p style="margin-top: 20px; color: var(--text-secondary); font-size: 0.95em; line-height: 1.6;">Interactive route maps are coming soon! We're working on bringing you detailed trail maps with waypoints, elevation profiles, and GPS coordinates for your adventures.</p></div></div>`;
    contentSections.appendChild(mapSection);

    if (packingData && packingData.items) {
        const packingSection = document.createElement('div');
        packingSection.className = 'content-section-result';
        packingSection.id = 'packing-section';
        const packingCard = document.createElement('div');
        packingCard.className = 'info-card';
        packingCard.innerHTML = `<h3><span class="info-card-icon">🎒</span> Packing List</h3><div style="background: linear-gradient(135deg, #D1FAE5 0%, #DBEAFE 100%); border-radius: 12px; padding: 20px; margin: 20px 0;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"><span style="font-weight: 600; color: var(--text-dark);">Packing Progress</span><span style="font-weight: 700; color: var(--primary);" id="packing-progress">0%</span></div><div style="width: 100%; height: 12px; background: white; border-radius: 9999px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);"><div id="packing-progress-bar" style="height: 100%; background: linear-gradient(to right, var(--primary), var(--primary-light)); border-radius: 9999px; transition: width 0.5s ease-out; width: 0%;"></div></div></div><div id="packing-categories" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 24px;">${renderPackingCategories(packingData.items)}</div><div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;"><button onclick="resetPackingList()" style="padding: 12px 24px; border-radius: 8px; border: 2px solid var(--primary); background: white; color: var(--primary); font-weight: 600; cursor: pointer; transition: all 0.3s ease;"><i class="fas fa-redo" style="margin-right: 8px;"></i>Reset Checklist</button><button onclick="copyPackingList()" style="padding: 12px 24px; border-radius: 8px; border: none; background: var(--primary); color: white; font-weight: 600; cursor: pointer; transition: all 0.3s ease;"><i class="fas fa-copy" style="margin-right: 8px;"></i>Copy List</button></div>`;
        packingSection.appendChild(packingCard);
        contentSections.appendChild(packingSection);
        window.packingListState = { totalItems: Object.values(packingData.items).flat().length, checkedItems: new Set(), categories: packingData.items };
        setTimeout(initializePackingListeners, 100);
    }
    
    if (itineraryState.cachedInsights) contentSections.appendChild(createEnhancedSection('insights-section', 'Local Insights', '🌍', itineraryState.cachedInsights));
    if (itineraryState.cachedPracticalInfo) contentSections.appendChild(createEnhancedSection('practical-section', 'Practical Information', '📋', itineraryState.cachedPracticalInfo));
    
    resultsWrapper.appendChild(contentSections);
    container.appendChild(resultsWrapper);
    setupResultsNavigation();
    addEnhancedActionButtons(container);
  }

  function createEnhancedSection(id, title, icon, content) {
    const section = document.createElement('div');
    section.className = 'content-section-result';
    section.id = id;
    const card = document.createElement('div');
    card.className = 'info-card';
    card.innerHTML = `<h3><span class="info-card-icon">${icon}</span> ${title}</h3><div class="enhanced-content">${processSubsectionsEnhanced(content)}</div>`;
    section.appendChild(card);
    return section;
  }
  
  function processSubsectionsEnhanced(content) {
    const lines = content.split('\n');
    let html = '';
    let currentSubsection = null;
    let currentItems = [];
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^\*(.+?):\*$/) || trimmedLine.match(/^(.+?):$/)) {
            if (currentSubsection) html += createSubsection(currentSubsection, currentItems);
            currentSubsection = trimmedLine.replace(/^\*|\*$/g, '').replace(/:$/, '');
            currentItems = [];
        } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
            currentItems.push(trimmedLine.substring(1).trim());
        } else if (trimmedLine) {
            if (currentSubsection) currentItems.push(trimmedLine);
            else html += `<p style="margin-bottom: 15px; line-height: 1.8;">${trimmedLine}</p>`;
        }
    });
    if (currentSubsection) html += createSubsection(currentSubsection, currentItems);
    return html || `<div style="white-space: pre-wrap; line-height: 1.8;">${content}</div>`;
  }

  function createSubsection(title, items) {
    return `<div style="margin-bottom: 25px;"><h4 style="font-weight: 600; color: var(--text-dark); margin-bottom: 15px; font-size: 1.1em;">${title}</h4><ul style="list-style: none; padding: 0;">${items.map(item => `<li style="padding: 8px 0; padding-left: 20px; position: relative; color: var(--text-light);"><span style="position: absolute; left: 0; color: var(--primary);">•</span>${item}</li>`).join('')}</ul></div>`;
  }

  function renderPackingCategories(categories) {
    let html = '';
    let itemIndex = 0;
    const categoryInfo = { essentials: { icon: '🎯', name: 'Essentials' }, clothing: { icon: '👕', name: 'Clothing' }, footwear: { icon: '🥾', name: 'Footwear' }, camping: { icon: '🏕️', name: 'Camping Gear' }, navigation: { icon: '🧭', name: 'Navigation' }, safety: { icon: '⛑️', name: 'Safety & First Aid' }, personal: { icon: '🧴', name: 'Personal Care' }, food: { icon: '🍲', name: 'Food & Water' }, optional: { icon: '✨', name: 'Optional' } };
    Object.entries(categories).forEach(([catKey, categoryItems]) => {
      if (categoryItems.length === 0) return;
      const category = categoryInfo[catKey] || { icon: '✔️', name: catKey.charAt(0).toUpperCase() + catKey.slice(1) };
      html += `<div style="border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px; ${category.background || ''}">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--text-dark);">
              <span style="font-size: 24px;">${category.icon}</span><span>${category.name}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">`;
      categoryItems.forEach(item => {
          const itemId = `pack-item-${itemIndex++}`;
          html += `<label style="display: flex; align-items: flex-start; background: white; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'" onmouseout="this.style.boxShadow='none'">
              <input type="checkbox" id="${itemId}" data-item="${item}" onchange="updatePackingProgress(this)" style="width: 18px; height: 18px; margin-right: 12px; margin-top: 2px; cursor: pointer;">
              <span class="packing-item-text" style="flex: 1; color: var(--text-dark); transition: all 0.2s ease;">${item}</span>
          </label>`;
      });
      html += `</div></div>`;
    });
    return html;
  }

  function initializePackingListeners() {
      updatePackingProgress(); 
  }

  window.updatePackingProgress = function(checkbox) {
      if (!window.packingListState) return;
      const item = checkbox.dataset.item;
      const textSpan = checkbox.nextElementSibling;
      if (checkbox.checked) {
          window.packingListState.checkedItems.add(item);
          if (textSpan) { textSpan.style.textDecoration = 'line-through'; textSpan.style.opacity = '0.6'; }
      } else {
          window.packingListState.checkedItems.delete(item);
          if (textSpan) { textSpan.style.textDecoration = 'none'; textSpan.style.opacity = '1'; }
      }
      if(window.packingListState.totalItems > 0) {
        const progress = Math.round((window.packingListState.checkedItems.size / window.packingListState.totalItems) * 100);
        document.getElementById('packing-progress').textContent = `${progress}%`;
        document.getElementById('packing-progress-bar').style.width = `${progress}%`;
      }
  };

  window.resetPackingList = function() {
      document.querySelectorAll('#packing-categories input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = false;
          const textSpan = checkbox.nextElementSibling;
          if (textSpan) { textSpan.style.textDecoration = 'none'; textSpan.style.opacity = '1'; }
      });
      if(window.packingListState) window.packingListState.checkedItems.clear();
      document.getElementById('packing-progress').textContent = '0%';
      document.getElementById('packing-progress-bar').style.width = '0%';
  };

  window.copyPackingList = function(event) {
    let listText = `PACKING LIST\n${'='.repeat(50)}\n`;
    listText += `Trek: ${currentQuizData?.specificLocation || currentQuizData?.location || 'Trek'}\n`;
    listText += `Duration: ${currentQuizData?.trekLength || 'Multi-day'}\n`;
    listText += `Season: ${currentQuizData?.season || 'All season'}\n`;
    listText += `Difficulty: ${currentQuizData?.difficulty || 'Moderate'}\n`;
    listText += `${'='.repeat(50)}\n\n`;
    Object.entries(window.packingListState.categories).forEach(([catKey, categoryData]) => {
        if (categoryData.items.length > 0) {
            listText += `${(categoryData.name || catKey).toUpperCase()}:\n`;
            categoryData.items.forEach(item => {
                const isChecked = window.packingListState.checkedItems.has(item);
                listText += `${isChecked ? '☑' : '☐'} ${item}\n`;
            });
            listText += '\n';
        }
    });
    navigator.clipboard.writeText(listText).then(() => {
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

  function setupResultsNavigation() {
    const tabs = document.querySelectorAll('.results-nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.results-nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.content-section-result').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const targetId = `${tab.dataset.section}-section`;
            const targetElement = document.getElementById(targetId);
            if(targetElement) targetElement.classList.add('active');
        });
    });
  }

  function addEnhancedActionButtons(container) {
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.innerHTML = `<div style="margin-top: 20px;"><label for="feedback" style="font-weight: 600; color: var(--text-dark); display: block; margin-bottom: 10px;">Refine your itinerary</label><input type="text" id="feedback" placeholder="Add feedback to adjust your itinerary (e.g., 'make it easier', 'add more cultural experiences')" style="width: 100%; padding: 15px; border: 2px solid #E0E0E0; border-radius: 12px; font-size: 1em; transition: border-color 0.3s ease;"><div class="action-buttons-container"><button id="regenerate-itinerary" class="action-btn action-btn-primary"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Update Itinerary</button><button id="save-itinerary" class="action-btn action-btn-secondary"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Save My Adventure</button></div></div>`;
    container.appendChild(buttonsWrapper);
    document.getElementById('regenerate-itinerary')?.addEventListener('click', () => {
        const feedback = document.getElementById('feedback').value;
        if (feedback && currentQuizData) {
            const updatedQuizData = { ...currentQuizData, details: (currentQuizData.details || '') + ' ' + feedback };
            window.generateItineraryFromQuiz(updatedQuizData);
        }
    });
    document.getElementById('save-itinerary')?.addEventListener('click', handleSaveItinerary);
  }

  async function handleSaveItinerary() {
    try {
        if (!auth || !auth.currentUser) { storeItineraryForLater(); showAuthModal(); return; }
        const token = await auth.currentUser.getIdToken();
        const location = currentQuizData?.specificLocation || currentQuizData?.location || 'Trek Location';
        const title = `${location} Trek`;
        const itineraryData = { title, location, content: itineraryState.rawItineraryText, comments: currentQuizData?.details || '', filters: { difficulty: currentQuizData?.difficulty || 'Moderate', accommodation: currentQuizData?.accommodation || 'Not applicable', trekType: currentQuizData?.trekType || 'multi-day', season: currentQuizData?.season || 'Summer' } };
        const response = await fetch(`${getApiBaseUrl()}/api/itineraries`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(itineraryData) });
        if (!response.ok) throw new Error(`Server returned status ${response.status}`);
        showSuccessModal();
    } catch (error) {
        console.error('Error saving itinerary:', error);
        alert('Failed to save itinerary. Please try again.');
    }
  }

  function storeItineraryForLater() {
    const location = currentQuizData?.specificLocation || currentQuizData?.location || 'Trek Location';
    const title = `${location} Trek`;
    const itineraryData = { title, location, content: itineraryState.rawItineraryText, comments: currentQuizData?.details || '', filters: { difficulty: currentQuizData?.difficulty || 'Moderate', accommodation: currentQuizData?.accommodation || 'Not applicable', trekType: currentQuizData?.trekType || 'multi-day', season: currentQuizData?.season || 'Summer' } };
    localStorage.setItem('pendingItinerary', JSON.stringify(itineraryData));
    localStorage.setItem('returnToCustomize', 'true');
  }

  function showAuthModal() { document.getElementById('auth-required-modal').style.display = 'flex'; }
  function showSuccessModal() { document.getElementById('itinerary-success-modal').style.display = 'flex'; }
  function showWelcomeModal() { document.getElementById('welcome-back-modal').style.display = 'flex'; }

  async function handlePendingItinerary() {
    const pendingItinerary = localStorage.getItem('pendingItinerary');
    const returnToCustomize = localStorage.getItem('returnToCustomize');
    if (pendingItinerary && returnToCustomize && auth.currentUser) {
        try {
            const token = await auth.currentUser.getIdToken();
            const itineraryData = JSON.parse(pendingItinerary);
            const response = await fetch(`${getApiBaseUrl()}/api/itineraries`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(itineraryData) });
            if (response.ok) {
                localStorage.removeItem('pendingItinerary');
                localStorage.removeItem('returnToCustomize');
                setTimeout(() => { showWelcomeModal(); }, 1000);
            }
        } catch (error) {
            console.error('Error auto-saving itinerary:', error);
            localStorage.removeItem('pendingItinerary');
            localStorage.removeItem('returnToCustomize');
        }
    }
  }

  onAuthStateChanged(auth, user => { if (user) handlePendingItinerary(); });
});
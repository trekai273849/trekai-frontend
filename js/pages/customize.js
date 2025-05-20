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
  `;
  document.head.appendChild(style);

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
    outputDiv.innerHTML = `<div class="text-center text-blue-600 font-semibold animate-pulse">Building your adventure...</div>`;

    try {
      // Use direct API URL for production
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
          title: `${location} Trek`  // Add title to request
        })
      });

      if (!response.ok) {
        console.error(`Server returned status ${response.status}`);
        throw new Error(`Server returned status ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.reply) {
        outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
        return;
      }

      rawItineraryText = data.reply;
      
      // Preprocess the raw text to normalize format issues and remove markdown
      const preprocessedText = preprocessRawText(rawItineraryText);

      // Extract all sections
      cachedPackingList = extractSection(preprocessedText, 'Packing List');
      cachedInsights = extractSection(preprocessedText, 'Local Insights');
      cachedPracticalInfo = extractSection(preprocessedText, 'Practical Information');

      // Process and render the enhanced itinerary
      processAndRenderEnhancedItinerary(preprocessedText);

    } catch (error) {
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
    feedbackInput.className = 'mt-6';
    feedbackInput.innerHTML = `
      <input type="text" id="feedback" placeholder="Add feedback to adjust your itinerary" class="w-full border px-3 py-2 rounded mb-4" />
      <button id="regenerate-itinerary" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Update Itinerary</button>
    `;
    container.appendChild(feedbackInput);

    document.getElementById('regenerate-itinerary').addEventListener('click', () => {
      const feedback = document.getElementById('feedback').value;
      if (feedback) generateItinerary(feedback);
    });

    // Add Save Itinerary button
    const saveButtonContainer = document.createElement('div');
    saveButtonContainer.className = 'mt-4 text-center';
    saveButtonContainer.innerHTML = `
      <button id="save-itinerary" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-4">Save Itinerary</button>
    `;
    container.appendChild(saveButtonContainer);

    document.getElementById('save-itinerary').addEventListener('click', async () => {
      try {
        // Check if user is authenticated
        if (!auth || !auth.currentUser) {
          alert('Please log in to save itineraries');
          window.location.href = '/sign-up.html';
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
        alert('Itinerary saved successfully!');
        
        // Optionally, redirect to the saved itineraries page
        // window.location.href = '/my-itineraries.html';
      } catch (error) {
        console.error('Error saving itinerary:', error);
        alert('Failed to save itinerary. Please try again.');
      }
    });
  }

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
});
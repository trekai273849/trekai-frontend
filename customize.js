// FULLY UPDATED customize.js with enhanced content display

document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = "Tell us more about your ideal trekking experience.";

  let cachedPackingList = '';
  let cachedInsights = '';
  let cachedPracticalInfo = '';
  let rawItineraryText = '';

  document.getElementById('customization-form').addEventListener('submit', function (e) {
    e.preventDefault();
    generateItinerary();
  });

  async function generateItinerary(additionalFeedback = '') {
    const filters = {};
    document.querySelectorAll('.filter-btn.active').forEach(btn => {
      const category = btn.dataset.category;
      filters[category] = btn.dataset.value;
    });

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
      const response = await fetch('https://trekai-api-staging.onrender.com/api/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          filters: {
            ...filters,
            altitude: "2000–3000m"
          },
          comments
        })
      });

      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      const data = await response.json();

      if (!data.reply) {
        outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
        return;
      }

      rawItineraryText = data.reply;
      console.log('[GPT Raw Reply]:', rawItineraryText);

      // Extract all sections
      cachedPackingList = extractSection(rawItineraryText, 'Packing List');
      cachedInsights = extractSection(rawItineraryText, 'Local Insights');
      cachedPracticalInfo = extractSection(rawItineraryText, 'Practical Information');

      // Process and render the enhanced itinerary
      processAndRenderEnhancedItinerary(rawItineraryText);

    } catch (error) {
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
      console.error(error);
    }
  }

  function extractSection(text, header) {
    // More robust section extraction
    const regex = new RegExp(`#{1,3}\\s*${header}[\\s\\S]*?(?=\\n#{1,3}\\s|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[0].replace(new RegExp(`#{1,3}\\s*${header}`, 'i'), '').trim();
    }
    
    // Try alternate format (without ### but with header)
    const altRegex = new RegExp(`${header}[\\s\\S]*?(?=\\n#{1,3}\\s|$)`, 'i');
    const altMatch = text.match(altRegex);
    return altMatch ? altMatch[0].replace(new RegExp(`${header}:?`, 'i'), '').trim() : '';
  }

  function renderAccordionBlock(title, content, open = false, bgColor = 'bg-blue-100') {
    const card = document.createElement('div');
    card.className = `mb-4 border rounded shadow-sm`;

    card.innerHTML = `
      <button class="w-full flex justify-between items-center px-4 py-3 ${bgColor} text-left font-semibold text-blue-800 focus:outline-none accordion-toggle">
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

  function processAndRenderEnhancedItinerary(text) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    // Add itinerary header
    const itineraryHeader = document.createElement('h2');
    itineraryHeader.className = 'text-2xl font-bold text-blue-900 mb-4 mt-6';
    itineraryHeader.innerText = 'Itinerary';
    container.appendChild(itineraryHeader);

    // Extract and display intro text if present
    const introRegex = /^([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+:|$)/i;
    const introMatch = text.match(introRegex);
    const intro = introMatch && introMatch[1].trim();
    
    if (intro && intro.length > 10) { // Only show if it has meaningful content
      const introBlock = document.createElement('div');
      introBlock.className = 'mb-6 text-gray-700';
      introBlock.innerHTML = `<p class="mb-4">${intro.replace(/\n/g, '<br>')}</p>`;
      container.appendChild(introBlock);
    }

    // Extract days with a more robust regex
    // This pattern matches various day formats
    const dayRegex = /(?:(?:\*\*\*|\#{1,3}|\*\*|\*)?\s*Day\s+(\d+)[:\s]+([^\n]*?)(?:\*\*\*|\*\*|\*)?)(?:\n)([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+[:\s]|#{1,3}\s*Packing List|#{1,3}\s*Local Insights|#{1,3}\s*Practical Information|$)/gi;
    
    let dayMatch;
    let dayCount = 0;

    while ((dayMatch = dayRegex.exec(text)) !== null) {
      dayCount++;
      const dayNum = dayMatch[1];
      const title = dayMatch[2].trim();
      let bodyText = dayMatch[3].trim();

      // Create a better formatted day content with improved styling
      let formattedDetails = '';
      
      // Process the body text into structured items
      const itemsArray = [];
      
      // Split by newlines and process each line
      const lines = bodyText.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        // Remove any bullet points or dashes at start
        const cleanLine = line.replace(/^[-•–*]\s*/, '').trim();
        
        // Check if line contains a key-value pair (with colon)
        if (cleanLine.includes(':')) {
          const colonIndex = cleanLine.indexOf(':');
          const key = cleanLine.substring(0, colonIndex).trim();
          const value = cleanLine.substring(colonIndex + 1).trim();
          
          if (key && value) {
            // Add special styling to highlight certain fields
            if (key === 'Highlights' || key === 'Terrain' || key === 'Water sources') {
              itemsArray.push(`<li class="mb-2"><strong class="text-blue-700">${key}:</strong> <span class="text-blue-600">${value}</span></li>`);
            } else if (key === 'Difficulty') {
              // Style difficulty differently based on value
              let difficultyClass = 'text-green-600'; // Default for Easy
              if (value.toLowerCase().includes('moderate')) {
                difficultyClass = 'text-yellow-600';
              } else if (value.toLowerCase().includes('challenging') || value.toLowerCase().includes('difficult')) {
                difficultyClass = 'text-red-600';
              }
              itemsArray.push(`<li class="mb-2"><strong>${key}:</strong> <span class="${difficultyClass}">${value}</span></li>`);
            } else {
              itemsArray.push(`<li class="mb-2"><strong>${key}:</strong> ${value}</li>`);
            }
          } else {
            itemsArray.push(`<li class="mb-1">${cleanLine}</li>`);
          }
        } else if (cleanLine) {
          itemsArray.push(`<li class="mb-1">${cleanLine}</li>`);
        }
      });
      
      formattedDetails = itemsArray.join('');
      
      // If we couldn't parse structured items, show the raw text
      if (!formattedDetails) {
        formattedDetails = `<p>${bodyText}</p>`;
      } else {
        formattedDetails = `<ul class="list-none py-2">${formattedDetails}</ul>`;
      }

      // Create the enhanced accordion card
      const card = document.createElement('div');
      card.className = 'mb-4 border rounded shadow-sm';

      card.innerHTML = `
        <button class="w-full flex justify-between items-center px-4 py-3 bg-blue-100 text-left font-semibold text-blue-800 focus:outline-none accordion-toggle">
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

      container.appendChild(card);
    }

    // Handle case where day parsing fails or returns zero days
    if (dayCount === 0) {
      // Fallback: Just show the whole text as pre-formatted
      const fallbackCard = document.createElement('div');
      fallbackCard.className = 'mb-4 border rounded shadow-sm p-4 bg-white';
      fallbackCard.innerHTML = `<pre class="whitespace-pre-wrap">${text}</pre>`;
      container.appendChild(fallbackCard);
    }

    // Add additional information section if we have packing list, insights, or practical info
    if (cachedPackingList || cachedInsights || cachedPracticalInfo) {
      const extrasHeader = document.createElement('h2');
      extrasHeader.className = 'text-2xl font-bold text-blue-900 mb-4 mt-10';
      extrasHeader.innerText = 'Additional Information';
      container.appendChild(extrasHeader);
    }

    // Format and render packing list with subsections
    if (cachedPackingList) {
      // Process subsections if they exist
      let formattedPackingList = processSubsections(cachedPackingList);
      container.appendChild(renderAccordionBlock('Packing List', formattedPackingList, false, 'bg-green-50'));
    }

    // Format and render local insights with subsections
    if (cachedInsights) {
      let formattedInsights = processSubsections(cachedInsights);
      container.appendChild(renderAccordionBlock('Local Insights', formattedInsights, false, 'bg-yellow-50'));
    }

    // Format and render practical information with subsections
    if (cachedPracticalInfo) {
      let formattedInfo = processSubsections(cachedPracticalInfo);
      container.appendChild(renderAccordionBlock('Practical Information', formattedInfo, false, 'bg-blue-50'));
    }

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
  }

  // Helper function to process subsections with enhanced formatting
  function processSubsections(content) {
    if (!content) return '';
    
    // Format subsection headers (e.g., *Essentials:* to styled headings)
    let formatted = content.replace(/\*(.*?):\*/g, '<h4 class="font-bold text-blue-700 mt-3 mb-2">$1</h4>');
    
    // Format bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
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
          htmlContent += '<ul class="list-disc pl-5 mb-4">';
          inList = true;
        }
        htmlContent += `<li class="mb-1">${line.substring(1).trim()}</li>`;
      } else if (line) {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        htmlContent += `<p class="mb-2">${line}</p>`;
      }
    });
    
    // Close any open list
    if (inList) {
      htmlContent += '</ul>';
    }
    
    return htmlContent;
  }
});
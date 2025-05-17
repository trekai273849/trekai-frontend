document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = "Tell us more about your ideal trekking experience.";

  let cachedPackingList = '';
  let cachedInsights = '';
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

      // Extract sections with improved robustness
      cachedPackingList = extractSection(rawItineraryText, 'Packing List');
      cachedInsights = extractSection(rawItineraryText, 'Local Insights');

      // Process the itinerary with our enhanced parser
      processAndRenderItinerary(rawItineraryText);

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
        <p class="py-3 whitespace-pre-wrap">${content}</p>
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

  function processAndRenderItinerary(text) {
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
    // This pattern matches various day formats like "### Day 1: Title", "Day 1: Title", "**Day 1: Title**", etc.
    const dayRegex = /(?:(?:\*\*\*|\#{1,3}|\*\*|\*)?\s*Day\s+(\d+)[:\s]+([^\n]*?)(?:\*\*\*|\*\*|\*)?)(?:\n)([\s\S]*?)(?=(?:\*\*\*|\#{1,3}|\*\*|\*)?Day\s+\d+[:\s]|#{1,3}\s*Packing List|#{1,3}\s*Local Insights|$)/gi;
    
    let dayMatch;
    let dayCount = 0;

    while ((dayMatch = dayRegex.exec(text)) !== null) {
      dayCount++;
      const dayNum = dayMatch[1];
      const title = dayMatch[2].trim();
      let bodyText = dayMatch[3].trim();

      // Create a structured HTML list for the day details
      let formattedDetails = '';
      
      // Process the body text into structured items
      // Look for items in format "- Key: Value" or "Key: Value"
      const itemsArray = [];
      
      // Split by newlines and process each line
      const lines = bodyText.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        // Remove any bullet points or dashes at start
        const cleanLine = line.replace(/^[-•–*]\s*/, '').trim();
        
        // Check if line contains a key-value pair (with colon)
        if (cleanLine.includes(':')) {
          const [key, ...valueParts] = cleanLine.split(':');
          const value = valueParts.join(':').trim();
          
          if (key && value) {
            itemsArray.push(`<li class="mb-1"><strong>${key.trim()}:</strong> ${value}</li>`);
          } else {
            // If not properly formatted, just add as is
            itemsArray.push(`<li class="mb-1">${cleanLine}</li>`);
          }
        } else if (cleanLine) {
          // If there's no colon, just add the line as is
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

      // Create the accordion card
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

    // Add additional information section if we have packing list or insights
    if (cachedPackingList || cachedInsights) {
      const extrasHeader = document.createElement('h2');
      extrasHeader.className = 'text-2xl font-bold text-blue-900 mb-4 mt-10';
      extrasHeader.innerText = 'Additional Information';
      container.appendChild(extrasHeader);
    }

    if (cachedPackingList) {
      // Format packing list as bullet points if it isn't already
      let formattedPackingList = cachedPackingList;
      if (!formattedPackingList.includes('<li>') && !formattedPackingList.includes('<ul>')) {
        // Convert plain text to HTML list if needed
        const items = formattedPackingList.split('\n')
          .map(item => item.trim())
          .filter(item => item)
          .map(item => {
            // Remove bullet points if present
            return `<li>${item.replace(/^[-•–*]\s*/, '')}</li>`;
          });
        formattedPackingList = `<ul class="list-disc pl-5">${items.join('')}</ul>`;
      }
      container.appendChild(renderAccordionBlock('Packing List', formattedPackingList, false, 'bg-blue-50'));
    }

    if (cachedInsights) {
      // Format insights as bullet points if it isn't already
      let formattedInsights = cachedInsights;
      if (!formattedInsights.includes('<li>') && !formattedInsights.includes('<ul>')) {
        // Convert plain text to HTML list if needed
        const items = formattedInsights.split('\n')
          .map(item => item.trim())
          .filter(item => item)
          .map(item => {
            // Remove bullet points if present
            return `<li>${item.replace(/^[-•–*]\s*/, '')}</li>`;
          });
        formattedInsights = `<ul class="list-disc pl-5">${items.join('')}</ul>`;
      }
      container.appendChild(renderAccordionBlock('Local Insights', formattedInsights, false, 'bg-blue-50'));
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
});
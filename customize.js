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

    const comments = document.getElementById('comments').value + (additionalFeedback ? ' ' + additionalFeedback : '');
    const outputDiv = document.getElementById('itinerary-cards');
    outputDiv.innerHTML = `<div class="text-center text-blue-600 font-semibold animate-pulse">Building your adventure...</div>`;

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

      cachedPackingList = extractSection(data.reply, 'Packing List');
      cachedInsights = extractSection(data.reply, 'Local Insights');

      const itineraryTextOnly = data.reply
        .replace(/### Packing List[\s\S]*?(?=###|$)/, '')
        .replace(/### Local Insights[\s\S]*?(?=###|$)/, '');

      renderItineraryAccordion(itineraryTextOnly);

    } catch (error) {
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
      console.error(error);
    }
  }

  function extractSection(text, header) {
    const regex = new RegExp(`### ${header}[\\s\\S]*?(?=###|$)`);
    const match = text.match(regex);
    return match ? match[0].replace(`### ${header}`, '').trim() : '';
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
      const isOpen = !body.classList.contains('max-h-0');
      if (isOpen) {
        body.classList.add('max-h-0');
        icon.classList.remove('rotate-180');
      } else {
        body.classList.remove('max-h-0');
        icon.classList.add('rotate-180');
      }
    });

    return card;
  }

  function renderItineraryAccordion(text) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    const itineraryHeader = document.createElement('h2');
    itineraryHeader.className = 'text-2xl font-bold text-blue-900 mb-4 mt-6';
    itineraryHeader.innerText = 'Itinerary';
    container.appendChild(itineraryHeader);

    const sections = text.split(/Day \d+:/).filter(Boolean);
    let intro = sections.shift();

    const introBlock = document.createElement('div');
    introBlock.className = 'mb-6 text-gray-700';
    introBlock.innerHTML = `<p class="mb-4">${intro.replace(/\n/g, '<br>')}</p>`;
    container.appendChild(introBlock);

    sections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(Boolean);
      const title = lines.shift().trim();
      const listItems = lines.map(line => {
        const [label, ...rest] = line.replace(/^[-•–*]\s*/, '').split(':');
        return `<li class="mb-1"><strong>${label.trim()}:</strong> ${rest.join(':').trim()}</li>`;
      }).join('');

      const card = document.createElement('div');
      card.className = 'mb-4 border rounded shadow-sm';

      card.innerHTML = `
        <button class="w-full flex justify-between items-center px-4 py-3 bg-blue-100 text-left font-semibold text-blue-800 focus:outline-none accordion-toggle">
          <span>Day ${index + 1}: ${title}</span>
          <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div class="accordion-body max-h-0 overflow-hidden transition-all duration-300 bg-white px-4">
          <ul class="list-none py-2">${listItems}</ul>
        </div>
      `;

      const toggle = card.querySelector('.accordion-toggle');
      const body = card.querySelector('.accordion-body');
      const icon = card.querySelector('svg');

      toggle.addEventListener('click', () => {
        const isOpen = !body.classList.contains('max-h-0');
        if (isOpen) {
          body.classList.add('max-h-0');
          icon.classList.remove('rotate-180');
        } else {
          body.classList.remove('max-h-0');
          icon.classList.add('rotate-180');
        }
      });

      container.appendChild(card);
    });

    if (cachedPackingList || cachedInsights) {
      const extrasHeader = document.createElement('h2');
      extrasHeader.className = 'text-2xl font-bold text-blue-900 mb-4 mt-10';
      extrasHeader.innerText = 'Additional Information';
      container.appendChild(extrasHeader);
    }

    if (cachedPackingList) {
      container.appendChild(renderAccordionBlock('Packing List', cachedPackingList, false, 'bg-blue-50'));
    }
    if (cachedInsights) {
      container.appendChild(renderAccordionBlock('Local Insights', cachedInsights, false, 'bg-blue-50'));
    }

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

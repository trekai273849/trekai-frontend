document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = "Tell us more about your ideal trekking experience.";

  document.querySelectorAll('[data-category]').forEach(group => {
    const cards = group.querySelectorAll('.filter-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
  });

  document.getElementById('customization-form').addEventListener('submit', function (e) {
    e.preventDefault();
    generateItinerary();
  });

  async function generateItinerary(additionalFeedback = '') {
    const filters = {};
    document.querySelectorAll('[data-category]').forEach(group => {
      const category = group.dataset.category;
      const selected = group.querySelector('.filter-card.active');
      if (selected) {
        filters[category] = selected.dataset.value;
      }
    });

    const comments = document.getElementById('comments').value + (additionalFeedback ? ' ' + additionalFeedback : '');
    const outputDiv = document.getElementById('itinerary-cards');
    outputDiv.innerHTML = `
      <div class="text-center text-blue-600 font-semibold animate-pulse">
        Building your adventure...
      </div>`;

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
      renderItineraryAccordion(data.reply);
    } catch (error) {
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">Our site is receiving heavy traffic right now – try again in one minute.</p>';
      console.error(error);
    }
  }

  function renderItineraryAccordion(text) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

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
      container.appendChild(card);
    });

    // Expand/Collapse toggle
    document.querySelectorAll('.accordion-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const body = button.nextElementSibling;
        const icon = button.querySelector('svg');
        const open = body.classList.contains('max-h-0');
        document.querySelectorAll('.accordion-body').forEach(b => b.classList.add('max-h-0'));
        document.querySelectorAll('.accordion-toggle svg').forEach(i => i.classList.remove('rotate-180'));

        if (open) {
          body.classList.remove('max-h-0');
          icon.classList.add('rotate-180');
        }
      });
    });

    // Feedback box
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'mt-6';
    feedbackDiv.innerHTML = `
  <input type="text" id="feedback" placeholder="Add feedback to adjust your itinerary" class="w-full border px-3 py-2 rounded mb-4" />
  <div class="flex gap-3 flex-wrap">
    <button id="regenerate-itinerary" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Update Itinerary</button>
    <button id="packing-list" class="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition">Packing List</button>
    <button id="local-insights" class="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition">Local Insights</button>
  </div>
`;
// Attach event listeners after rendering
const packingBtn = document.getElementById('packing-list');
if (packingBtn) {
  packingBtn.addEventListener('click', () => {
    alert("Packing list feature coming soon!");
  });
}

const insightsBtn = document.getElementById('local-insights');
if (insightsBtn) {
  insightsBtn.addEventListener('click', () => {
    alert("Local insights feature coming soon!");
  });
}

const regenBtn = document.getElementById('regenerate-itinerary');
if (regenBtn) {
  regenBtn.addEventListener('click', () => {
    const feedback = document.getElementById('feedback').value;
    if (feedback) {
      generateItinerary(feedback);
    }
  });
}
    container.appendChild(feedbackDiv);

    document.getElementById('regenerate-itinerary').addEventListener('click', () => {
      const feedback = document.getElementById('feedback').value;
      if (feedback) {
        generateItinerary(feedback);
      }
    });
  }
});
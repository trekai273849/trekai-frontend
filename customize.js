document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = `${location} is a great idea! Tell us more about your ideal trekking experience.`;

  document.querySelectorAll('.filter-group').forEach(group => {
    const cards = group.querySelectorAll('.filter-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
  });

  document.getElementById('customization-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    generateItinerary();
  });

  async function generateItinerary(additionalFeedback = '') {
    const filters = {};
    document.querySelectorAll('.filter-group').forEach(group => {
      const category = group.dataset.category;
      const selected = group.querySelector('.filter-card.active');
      if (selected) {
        filters[category] = selected.dataset.value;
      }
    });

    const comments = document.getElementById('comments').value + (additionalFeedback ? ' ' + additionalFeedback : '');
    const outputDiv = document.getElementById('itinerary-cards');

    // 🔄 Skeleton Loader
    outputDiv.innerHTML = `
      <div class="space-y-4 animate-pulse">
        ${[...Array(3)].map(() => `
          <div class="bg-gray-200 h-6 rounded w-3/4 mx-auto"></div>
          <div class="bg-gray-200 h-4 rounded w-11/12 mx-auto"></div>
          <div class="bg-gray-200 h-4 rounded w-5/6 mx-auto mb-4"></div>
        `).join('')}
      </div>
    `;

    try {
      const response = await fetch('https://trekai-api.onrender.com/api/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, filters: { ...filters, altitude: '2000–3000m' }, comments })
      });

      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      const data = await response.json();
      renderItineraryCards(data.reply);
    } catch (error) {
      outputDiv.innerHTML = `<p class="text-red-600 text-center">❌ Failed to generate itinerary.</p>`;
      console.error(error);
    }
  }

  function renderItineraryCards(responseText) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    const toggleWrapper = document.createElement('div');
    toggleWrapper.className = 'mb-4 text-right';
    toggleWrapper.innerHTML = `<button id="toggle-all" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Expand All</button>`;
    container.appendChild(toggleWrapper);

    const parts = responseText.split(/Day \d+:/).filter(Boolean);
    const intro = parts.shift();

    const introBlock = document.createElement('div');
    introBlock.className = 'mb-6';
    introBlock.innerHTML = `
      <p class="font-semibold text-lg mb-2">${intro.split('.')[0]}.</p>
      <p class="text-gray-700">${intro.slice(intro.indexOf('.') + 1)}</p>
    `;
    container.appendChild(introBlock);

    let expanded = false;

    parts.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(l => l.trim());
      const title = lines.shift().trim();
      const content = lines.map(line => {
        const cleaned = line.replace(/^[-–•\*]\s*/, '');
        const [label, ...rest] = cleaned.split(':');
        return `<li><strong>${label.trim()}:</strong> ${rest.join(':').trim()}</li>`;
      }).join('');

      const item = document.createElement('div');
      item.className = 'border rounded mb-3 overflow-hidden';

      item.innerHTML = `
        <button class="accordion-header w-full text-left px-4 py-3 bg-gray-100 font-medium flex justify-between items-center ${index === 0 ? 'open' : ''}">
          <span>Day ${index + 1}: ${title}</span>
          <span class="accordion-icon text-xl">${index === 0 ? '−' : '+'}</span>
        </button>
        <div class="accordion-body overflow-hidden transition-all duration-300 ease-in-out bg-white px-4 ${index === 0 ? 'max-h-96 py-4' : 'max-h-0'}">
          <ul class="space-y-2">${content}</ul>
        </div>
      `;

      container.appendChild(item);
    });

    // Feedback box
    const feedbackForm = document.createElement('div');
    feedbackForm.className = 'mt-6';
    feedbackForm.innerHTML = `
      <textarea id="feedback" placeholder="Provide feedback and we can further customise this itinerary for you!" class="w-full p-3 border border-gray-300 rounded mb-4"></textarea>
      <button id="regenerate-itinerary" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Update Itinerary</button>
    `;
    container.appendChild(feedbackForm);

    document.getElementById('regenerate-itinerary').addEventListener('click', () => {
      const feedback = document.getElementById('feedback').value;
      if (feedback) generateItinerary(feedback);
    });

    // Toggle logic
    document.querySelectorAll('.accordion-header').forEach((header, i) => {
      header.addEventListener('click', () => {
        const icon = header.querySelector('.accordion-icon');
        const body = header.nextElementSibling;
        const isOpen = body.classList.contains('max-h-96');

        if (isOpen) {
          body.classList.replace('max-h-96', 'max-h-0');
          body.classList.remove('py-4');
          icon.textContent = '+';
        } else {
          body.classList.replace('max-h-0', 'max-h-96');
          body.classList.add('py-4');
          icon.textContent = '−';
        }
      });
    });

    // Expand/collapse all
    document.getElementById('toggle-all').addEventListener('click', () => {
      expanded = !expanded;
      document.getElementById('toggle-all').innerText = expanded ? 'Collapse All' : 'Expand All';

      document.querySelectorAll('.accordion-body').forEach(body => {
        body.classList.toggle('max-h-96', expanded);
        body.classList.toggle('max-h-0', !expanded);
        body.classList.toggle('py-4', expanded);
      });

      document.querySelectorAll('.accordion-icon').forEach(icon => {
        icon.textContent = expanded ? '−' : '+';
      });
    });
  }
});
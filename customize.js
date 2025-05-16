document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = `${location} is a great idea! Tell us more about your ideal trekking experience.`;

  document.querySelectorAll('[data-category]').forEach(group => {
    const cards = group.querySelectorAll('.filter-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
  });

  document.getElementById('customization-form').addEventListener('submit', async function (e) {
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
    outputDiv.innerHTML = '<div class="text-center text-gray-600">Preparing your personal itinerary...</div>';

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
      renderItineraryCards(data.reply);
    } catch (error) {
      outputDiv.innerHTML = '<p class="text-red-600">❌ Failed to generate itinerary.</p>';
      console.error(error);
    }
  }

  function renderItineraryCards(responseText) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    const accordionToggle = document.getElementById('accordion-controls');
    accordionToggle.classList.remove('hidden');

    const parts = responseText.split(/Day \d+:/).filter(Boolean);
    let intro = parts.shift();

    const introBlock = document.createElement('div');
    introBlock.className = 'mb-6';
    introBlock.innerHTML = `<p class="text-base"><strong>${intro.split('.')[0]}.</strong><br><br>${intro.slice(intro.indexOf('.') + 1).replace(/\n/g, '<br>')}</p>`;
    container.appendChild(introBlock);

    parts.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(l => l.trim());
      const title = lines.shift().trim();
      const details = lines.map(line => {
        const cleaned = line.replace(/^[-–•\*]\s*/, '');
        const [label, ...rest] = cleaned.split(':');
        return `<li><strong>${label.trim()}:</strong> ${rest.join(':').trim()}</li>`;
      }).join('');

      const isOpen = index === 0;
      const item = document.createElement('div');
      item.className = 'mb-4 border border-gray-300 rounded';

      item.innerHTML = `
        <button class="accordion-header flex justify-between items-center w-full p-4 font-semibold text-left ${isOpen ? 'open' : ''}">
          <span>Day ${index + 1}: ${title}</span>
          <span class="accordion-icon">${isOpen ? '−' : '+'}</span>
        </button>
        <div class="accordion-body overflow-hidden transition-all ${isOpen ? 'open' : ''}" style="max-height: ${isOpen ? '1000px' : '0'};">
          <ul class="p-4">${details}</ul>
        </div>
      `;
      container.appendChild(item);
    });

    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const icon = header.querySelector('.accordion-icon');
        const isOpen = body.classList.contains('open');

        header.classList.toggle('open');
        body.classList.toggle('open');
        icon.textContent = isOpen ? '+' : '−';
        body.style.maxHeight = isOpen ? null : body.scrollHeight + 'px';
      });
    });

    const toggleBtn = document.getElementById('toggle-all');
    toggleBtn.textContent = 'Expand All';
    let expanded = false;
    toggleBtn.onclick = () => {
      expanded = !expanded;
      toggleBtn.textContent = expanded ? 'Collapse All' : 'Expand All';
      document.querySelectorAll('.accordion-item').forEach(item => {
        const header = item.querySelector('.accordion-header');
        const body = item.querySelector('.accordion-body');
        const icon = header.querySelector('.accordion-icon');

        if (expanded) {
          header.classList.add('open');
          body.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
          icon.textContent = '−';
        } else {
          header.classList.remove('open');
          body.classList.remove('open');
          body.style.maxHeight = null;
          icon.textContent = '+';
        }
      });
    };

    const feedbackBox = document.createElement('div');
    feedbackBox.className = 'mt-8';
    feedbackBox.innerHTML = `
      <label for="feedback" class="block font-semibold mb-2">Further Customisation:</label>
      <textarea id="feedback" placeholder="e.g. prefer forests, need a rest day, etc..." class="w-full p-3 border border-gray-300 rounded mb-4"></textarea>
      <button id="regenerate-itinerary" class="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700">Update Itinerary</button>
    `;
    container.appendChild(feedbackBox);

    document.getElementById('regenerate-itinerary').addEventListener('click', () => {
      const feedback = document.getElementById('feedback').value;
      if (feedback) {
        generateItinerary(feedback);
      }
    });
  }
});
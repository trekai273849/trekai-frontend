document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = `${location} is a great idea! Tell us more about your ideal trekking experience.`;

  // Filter card activation
  document.querySelectorAll('.filter-group').forEach(group => {
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
    document.querySelectorAll('.filter-group').forEach(group => {
      const category = group.dataset.category;
      const selected = group.querySelector('.filter-card.active');
      if (selected) {
        filters[category] = selected.dataset.value;
      }
    });

    const comments = document.getElementById('comments').value + (additionalFeedback ? ' ' + additionalFeedback : '');
    const outputDiv = document.getElementById('itinerary-cards');
    outputDiv.innerHTML = '<div class="loading-shimmer">Preparing your personal itinerary...</div>';

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

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      renderItineraryCards(data.reply);
    } catch (error) {
      outputDiv.innerHTML = '<p style="color:red;">❌ Failed to generate itinerary.</p>';
      console.error(error);
    }
  }

  function renderItineraryCards(responseText) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    const days = responseText.split(/### Day \d+: /).filter(Boolean);
    const intro = days.shift(); // first item is the intro
    const introMessage = document.createElement('div');
    introMessage.id = 'intro-message';
    introMessage.innerText = intro.trim();
    container.appendChild(introMessage);

    days.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(l => l.trim());
      const titleLine = lines.shift();
      const shortTitle = `Day ${index + 1}: ${titleLine}`;

      const details = lines
        .filter(line => line.includes(':'))
        .map(line => {
          const cleaned = line.replace(/\*\*/g, '').replace(/^[-–]\s*/, '');
          const [label, ...rest] = cleaned.split(':');
          const value = rest.join(':').trim();
          return `<li><strong>${label.trim()}:</strong> ${value}</li>`;
        }).join('');

      const accordion = document.createElement('div');
      accordion.className = 'accordion-item';

      accordion.innerHTML = `
        <button class="accordion-header">
          <span>${shortTitle}</span>
          <span class="accordion-icon">+</span>
        </button>
        <div class="accordion-body">
          <ul>${details}</ul>
        </div>
      `;

      container.appendChild(accordion);
    });

    // Event binding must happen after DOM elements are inserted
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        header.classList.toggle('open');
        const body = header.nextElementSibling;
        body.classList.toggle('open');
      });
    });

    // Add feedback box
    const feedbackBox = document.createElement('div');
    feedbackBox.innerHTML = `
      <input type="text" id="feedback" placeholder="Provide feedback and we can further customise this itinerary for you!" style="width: 100%; padding: 10px; margin-top: 20px; border: 1px solid #ccc; border-radius: 4px;" />
      <button id="regenerate-itinerary" style="margin-top: 10px;">Update Itinerary</button>
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

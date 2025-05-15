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

    const parts = responseText
      .replace(/\*\*Day \d+: /g, '### Day ')
      .split(/### Day \d+: /)
      .filter(Boolean);

    let days = parts;
    let tipsBlock = '';

    if (parts.length > 0 && parts[parts.length - 1].includes('Additional Tips')) {
      tipsBlock = parts.pop();
    }

    const intro = days.shift();
    const introMessage = document.createElement('div');
    introMessage.id = 'intro-message';
    introMessage.innerHTML = `<p>${intro
      .trim()
      .replace(/^(.+?\.)\s*/s, '<strong>$1</strong><br><br>')
      .replace(/\n/g, '<br>')}</p>`;
    container.appendChild(introMessage);

    days.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(l => l.trim());
      const titleText = `Day ${index + 1}: ${lines.shift().trim()}`;
      const titleLine = `<strong>${titleText}</strong>`;

      const details = lines
        .filter(line => line.includes(':'))
        .map(line => {
          const cleaned = line.trim().replace(/^[-–•\*]\s*/, '');
          const [label, ...rest] = cleaned.split(':');
          const value = rest.join(':').trim();
          return `<li><strong>${label.trim()}:</strong> ${value}</li>`;
        }).join('');

      const accordion = document.createElement('div');
      accordion.className = 'accordion-item';
      accordion.innerHTML = `
        <button class="accordion-header">
          <span>${titleLine}</span>
          <span class="accordion-icon">+</span>
        </button>
        <div class="accordion-body">
          <ul>${details}</ul>
        </div>
      `;
      container.appendChild(accordion);
    });

    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const isOpen = body.classList.contains('open');

        header.classList.toggle('open');
        body.classList.toggle('open');

        if (isOpen) {
          body.style.maxHeight = null;
        } else {
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });

    if (tipsBlock) {
      const tipsDiv = document.createElement('div');
      tipsDiv.className = 'overall-tips';
      tipsDiv.innerHTML = `<h3>Overall Tips for Your Trek</h3><p>${tipsBlock.replace(/\n/g, '<br>')}</p>`;
      container.appendChild(tipsDiv);
    }

    const feedbackBox = document.createElement('div');
    feedbackBox.innerHTML = `
      <input type="text" id="feedback" placeholder="Provide feedback and we can further customise this itinerary for you!" style="width: 100%; padding: 10px; margin-top: 20px; border: 1px solid #ccc; border-radius: 4px;" />
      <button id="regenerate-itinerary" class="generate-button">Update Itinerary</button>
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
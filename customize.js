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

      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
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

    const accordionToggle = document.getElementById('accordion-controls');
    accordionToggle.style.display = 'block';

    const parts = responseText.split(/Day \d+:/).filter(Boolean);
    const intro = parts.shift();

    const introBlock = document.createElement('div');
    introBlock.id = 'intro-message';
    introBlock.innerHTML = `<p><strong>${intro.split('.')[0]}.</strong><br><br>${intro.slice(intro.indexOf('.') + 1).replace(/\n/g, '<br>')}</p>`;
    container.appendChild(introBlock);

    parts.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(l => l.trim());
      const title = lines.shift().trim();
      const details = lines.map(line => {
        const cleaned = line.replace(/^[-–•\*]\s*/, '');
        const [label, ...rest] = cleaned.split(':');
        return `<li><strong>${label.trim()}:</strong> ${rest.join(':').trim()}</li>`;
      }).join('');

      const item = document.createElement('div');
      item.className = 'accordion-item';
      item.innerHTML = `
        <button class="accordion-header ${index === 0 ? 'open' : ''}">
          <span class="accordion-title"><strong>Day ${index + 1}: ${title}</strong></span>
          <span class="accordion-icon">${index === 0 ? '−' : '+'}</span>
        </button>
        <div class="accordion-body ${index === 0 ? 'open' : ''}" style="max-height: ${index === 0 ? '1000px' : '0'};">
          <ul>${details}</ul>
        </div>
      `;
      container.appendChild(item);
    });

    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const isOpen = body.classList.contains('open');

        if (isOpen) {
          body.style.maxHeight = body.scrollHeight + 'px';
          requestAnimationFrame(() => {
            body.style.maxHeight = '0';
            body.classList.remove('open');
            header.classList.remove('open');
            header.querySelector('.accordion-icon').textContent = '+';
          });
        } else {
          body.classList.add('open');
          header.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
          header.querySelector('.accordion-icon').textContent = '−';
        }
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
        if (expanded) {
          header.classList.add('open');
          body.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
          header.querySelector('.accordion-icon').textContent = '−';
        } else {
          header.classList.remove('open');
          body.classList.remove('open');
          body.style.maxHeight = null;
          header.querySelector('.accordion-icon').textContent = '+';
        }
      });
    };

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

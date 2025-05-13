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

  // Form submission
  document.getElementById('customization-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const filters = {};
    document.querySelectorAll('.filter-group').forEach(group => {
      const category = group.dataset.category;
      const selected = group.querySelector('.filter-card.active');
      if (selected) {
        filters[category] = selected.dataset.value;
      }
    });

    const comments = document.getElementById('comments').value;
    const outputDiv = document.getElementById('itinerary-cards');
    outputDiv.innerHTML = '<p><em>Loading itinerary...</em></p>';

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
  });

  function renderItineraryCards(responseText) {
    const container = document.getElementById('itinerary-cards');
    container.innerHTML = '';

    const days = responseText.split(/### Day \d+: /).filter(Boolean);

    days.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(l => l.trim());
      const titleLine = lines.shift();
      const shortTitle = `Day ${index + 1}: ${titleLine}`;

      const details = lines
        .filter(line => line.includes(':'))
        .map(line => {
          const [label, ...rest] = line.split(':');
          const value = rest.join(':').trim().replace(/\*\*/g, '');
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

      const header = accordion.querySelector('.accordion-header');
      const body = accordion.querySelector('.accordion-body');

      header.addEventListener('click', () => {
        header.classList.toggle('open');
        body.classList.toggle('open');
      });

      container.appendChild(accordion);
    });
  }
});

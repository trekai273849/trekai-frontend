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

    // Extract selected filters
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
            altitude: "2000–3000m" // static value for now
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
      const card = document.createElement('div');
      card.className = 'day-card';

      const lines = section.trim().split('\n').filter(line => line.trim());
      const title = lines.shift();

      card.innerHTML = `<h2>Day ${index + 1}: ${title}</h2><ul></ul>`;
      const ul = card.querySelector('ul');

      lines.forEach(line => {
        if (line.includes(':')) {
          const [label, ...rest] = line.split(':');
          const value = rest.join(':').trim();
          const li = document.createElement('li');
          li.innerHTML = `<strong>${label.trim()}:</strong> ${value}`;
          ul.appendChild(li);
        }
      });

      container.appendChild(card);
    });
  }
});

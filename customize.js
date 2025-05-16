document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = `${location} is a great idea! Tell us more about your ideal trekking experience.`;

  // Filter button toggle logic
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
    outputDiv.innerHTML = '<div class="text-center text-blue-600 font-semibold animate-pulse">Preparing your personal itinerary...</div>';

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
      outputDiv.innerHTML = `<pre class="bg-gray-100 p-4 rounded whitespace-pre-wrap">${data.reply}</pre>`;
    } catch (error) {
      outputDiv.innerHTML = '<p class="text-red-600 font-semibold">❌ Failed to generate itinerary.</p>';
      console.error(error);
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation') || 'Your chosen location';
  document.getElementById('greeting').innerText = `${location} is a great idea! Tell us more about your ideal trekking experience.`;

  // Card selection handling
  document.querySelectorAll('.filter-group').forEach(group => {
    const cards = group.querySelectorAll('.filter-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active from all cards in the same group
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
  });

  // Form submission
  document.getElementById('customization-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Extract selected values
    const filters = {};
    document.querySelectorAll('.filter-group').forEach(group => {
      const category = group.dataset.category;
      const selected = group.querySelector('.filter-card.active');
      if (selected) {
        filters[category] = selected.dataset.value;
      }
    });

    const comments = document.getElementById('comments').value;
    const outputDiv = document.getElementById('output');
    outputDiv.innerText = '⏳ Generating itinerary...';

    try {
      const response = await fetch('https://trekai-api.onrender.com/api/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          filters,
          comments
        })
      });

      const data = await response.json();
      outputDiv.innerHTML = `<pre>${data.reply}</pre>`;
    } catch (error) {
      outputDiv.innerText = '❌ Failed to generate itinerary.';
      console.error(error);
    }
  });
});

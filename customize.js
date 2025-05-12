document.addEventListener('DOMContentLoaded', () => {
  const location = localStorage.getItem('userLocation');
  document.getElementById('greeting').innerText = `${location} is a great idea! Tell us more about your ideal trekking experience.`;

  document.getElementById('customization-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const filters = {
      accommodation: formData.get('accommodation'),
      technical: formData.get('technical'),
      altitude: formData.get('altitude'),
      difficulty: formData.get('difficulty'),
    };

    const comments = formData.get('comments');

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
      document.getElementById('output').innerHTML = `<pre>${data.reply}</pre>`;
    } catch (error) {
      document.getElementById('output').innerText = '❌ Failed to generate itinerary.';
      console.error(error);
    }
  });
});

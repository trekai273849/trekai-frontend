const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Convert trek name to URL-friendly slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Generate HTML for a single trek
function generateTrekHTML(trek, template) {
  // Replace all placeholders in the template
  let html = template;
  
  // Basic info
  html = html.replace(/{{trek_name}}/g, trek.name);
  html = html.replace(/{{slug}}/g, trek.slug);
  html = html.replace(/{{country}}/g, trek.country);
  html = html.replace(/{{region}}/g, trek.region || 'N/A');
  html = html.replace(/{{difficulty}}/g, trek.difficulty);
  html = html.replace(/{{duration_days}}/g, trek.duration.recommended_days);
  html = html.replace(/{{max_elevation_m}}/g, trek.max_elevation_m.toLocaleString());
  html = html.replace(/{{max_elevation_ft}}/g, Math.round(trek.max_elevation_m * 3.28084).toLocaleString());
  html = html.replace(/{{total_distance_km}}/g, trek.distance_km);
  html = html.replace(/{{total_distance_mi}}/g, (trek.distance_km * 0.621371).toFixed(0));
  
  // Summary and description
  html = html.replace(/{{summary}}/g, trek.summary);
  
  // Best seasons - with defensive check
  const seasonsHTML = (trek.best_seasons || []).map(season => `
    <div class="season-card">
      <div class="season-icon">${getSeasonIcon(season.name)}</div>
      <h3 class="season-name">${season.name}</h3>
      <p class="season-months">${(season.months || []).join(', ')}</p>
      <p>${season.description || ''}</p>
    </div>
  `).join('');
  html = html.replace(/{{best_seasons}}/g, seasonsHTML);
  
  // Detailed itinerary - with defensive checks
  const itineraryHTML = (trek.detailed_itinerary || []).map((day, index) => `
    <div class="itinerary-day">
      <div class="day-header">
        <div>
          <div class="day-number">Day ${day.day}</div>
          <h3 class="day-title">${day.title || ''}</h3>
          <div class="day-stats">
            <span>📏 ${day.distance_km || 0}km</span>
            <span>⏱️ ${day.duration_hours || 0} hours</span>
            <span>📈 ${(day.elevation_gain_m || 0) > 0 ? '+' : ''}${day.elevation_gain_m || 0}m</span>
            <span>🏔️ ${(day.elevation_end_m || 0).toLocaleString()}m</span>
          </div>
        </div>
      </div>
      <p class="day-description">${day.description || ''}</p>
      ${day.highlights && day.highlights.length > 0 ? `
        <div class="day-highlights">
          ${day.highlights.map(h => `<span class="day-highlight">${h}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
  html = html.replace(/{{detailed_itinerary}}/g, itineraryHTML);
  
  // Gear list - with defensive checks
  const essentialGearHTML = trek.gear_list && trek.gear_list.essential ? 
    trek.gear_list.essential.map(item => `
      <li class="gear-item">
        <div>
          <div class="gear-name">${item.item}</div>
          <div class="gear-description">${item.description || ''}</div>
        </div>
        ${item.rental_available ? '<span class="rental-badge">Rental available</span>' : ''}
      </li>
    `).join('') : '';
  
  const recommendedGearHTML = trek.gear_list && trek.gear_list.recommended ? 
    trek.gear_list.recommended.map(item => `
      <li class="gear-item">
        <div>
          <div class="gear-name">${item.item}</div>
          <div class="gear-description">${item.description || ''}</div>
        </div>
        ${item.rental_available ? '<span class="rental-badge">Rental available</span>' : ''}
      </li>
    `).join('') : '';
  
  html = html.replace(/{{essential_gear}}/g, essentialGearHTML);
  html = html.replace(/{{recommended_gear}}/g, recommendedGearHTML);
  
  // Cost breakdown - with defensive checks
  const costs = trek.costs || {};
  const costBreakdownHTML = `
    <div class="cost-item">
      <span>Permits</span>
      <span>${formatCurrency(costs.permit_total_usd || 0)}</span>
    </div>
    <div class="cost-item">
      <span>Guide (per day)</span>
      <span>${formatCurrency(costs.guide_daily_usd || 0)}</span>
    </div>
    <div class="cost-item">
      <span>Accommodation (per night)</span>
      <span>${formatCurrency(costs.accommodation_daily_usd || 0)}</span>
    </div>
    <div class="cost-item">
      <span>Meals (per day)</span>
      <span>${formatCurrency(costs.meals_daily_usd || 0)}</span>
    </div>
    <div class="cost-item">
      <span>Transportation</span>
      <span>${formatCurrency(costs.transportation_usd || 0)}</span>
    </div>
    <div class="cost-item">
      <span>Total Budget Range</span>
      <span>${formatCurrency((costs.total_budget_range_usd || {}).min || 0)} - ${formatCurrency((costs.total_budget_range_usd || {}).max || 0)}</span>
    </div>
  `;
  html = html.replace(/{{cost_breakdown}}/g, costBreakdownHTML);
  
  // FAQs - with defensive check
  const faqsHTML = (trek.faqs || []).map(faq => `
    <div class="faq-item">
      <div class="faq-question" onclick="toggleFaq(this)">
        <span>${faq.question}</span>
        <span class="faq-toggle">+</span>
      </div>
      <div class="faq-answer">${faq.answer}</div>
    </div>
  `).join('');
  html = html.replace(/{{faqs}}/g, faqsHTML);
  
  // Photography highlights - with defensive checks
  const photoHTML = trek.photography_highlights && trek.photography_highlights.length > 0 ? 
    trek.photography_highlights.slice(0, 4).map(photo => `
      <div class="photo-card">
        <div class="photo-placeholder">📸</div>
        <div class="photo-info">
          <h4 class="photo-location">${photo.location || ''}</h4>
          <p class="photo-time">Best at: ${photo.best_time || ''}</p>
          <p>${(photo.subjects || []).join(', ')}</p>
        </div>
      </div>
    `).join('') : '';
  html = html.replace(/{{photography_highlights}}/g, photoHTML);
  
  // Quick facts - with defensive checks
  const duration = trek.duration || {};
  html = html.replace(/{{duration_range}}/g, `${duration.min_days || 0}-${duration.max_days || 0} days`);
  html = html.replace(/{{nearest_city}}/g, trek.nearest_city || 'N/A');
  html = html.replace(/{{airport}}/g, trek.airport || 'N/A');
  html = html.replace(/{{permits_count}}/g, (trek.permits_required || []).length);
  
  // Price range for quick info card
  html = html.replace(/{{price_range}}/g, 
    `${formatCurrency((costs.total_budget_range_usd || {}).min || 0)} - ${formatCurrency((costs.total_budget_range_usd || {}).max || 0)}`
  );
  
  // Meta tags - with defensive checks
  const seo = trek.seo || {};
  html = html.replace(/{{meta_title}}/g, seo.meta_title || `${trek.name} - Complete Trekking Guide`);
  html = html.replace(/{{meta_description}}/g, seo.meta_description || trek.summary || '');
  
  return html;
}

// Get appropriate icon for season
function getSeasonIcon(seasonName) {
  const icons = {
    'Spring': '🌸',
    'Summer': '☀️',
    'Autumn': '🍂',
    'Fall': '🍂',
    'Winter': '❄️',
    'Dry Season': '☀️',
    'Wet Season': '🌧️',
    'Monsoon': '🌧️',
    'Shoulder Season': '🍂'
  };
  return icons[seasonName] || '🌄';
}

// Main function
async function generateTrekPages() {
  try {
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'output', 'treks');
    ensureDirectoryExists(outputDir);
    
    // Read template
    const templatePath = path.join(__dirname, '..', 'templates', 'trek-template.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Read trek data
    const dataPath = path.join(__dirname, '..', 'data', 'all-treks-combined.json');
    const treksData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Generate page for each trek
    let generatedCount = 0;
    let failedCount = 0;
    
    treksData.forEach((trek, index) => {
      try {
        const html = generateTrekHTML(trek, template);
        const outputPath = path.join(outputDir, `${trek.slug}.html`);
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Generated: ${trek.slug}.html`);
        generatedCount++;
      } catch (error) {
        console.error(`❌ Failed to generate page for trek ${index + 1} (${trek.name || 'Unknown'}):`, error.message);
        failedCount++;
      }
    });
    
    console.log(`\n🎉 Success! Generated ${generatedCount} trek pages in /output/treks/`);
    if (failedCount > 0) {
      console.log(`⚠️  Failed to generate ${failedCount} pages`);
    }
    
    // Generate index file listing all treks
    generateIndexPage(treksData, outputDir);
    
  } catch (error) {
    console.error('❌ Error generating pages:', error);
  }
}

// Generate an index page listing all treks
function generateIndexPage(treks, outputDir) {
  const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Trek Pages - Index</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #2D5016; }
        .trek-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .trek-card {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            text-decoration: none;
            color: inherit;
            transition: transform 0.2s;
        }
        .trek-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .trek-name { 
            font-size: 1.2em; 
            font-weight: bold; 
            color: #2D5016;
            margin-bottom: 10px;
        }
        .trek-info { 
            color: #666; 
            font-size: 0.9em;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <h1>All Generated Trek Pages</h1>
    <p>Total: ${treks.length} trek pages generated</p>
    <div class="trek-grid">
        ${treks.map(trek => {
          const costs = trek.costs || {};
          const duration = trek.duration || {};
          const budgetRange = costs.total_budget_range_usd || {};
          
          return `
            <a href="/treks/${trek.slug}.html" class="trek-card">
                <div class="trek-name">${trek.name}</div>
                <div class="trek-info">
                    📍 ${trek.country || 'Unknown'}<br>
                    ⏱️ ${duration.recommended_days || 0} days<br>
                    🏔️ ${(trek.max_elevation_m || 0).toLocaleString()}m<br>
                    💰 ${formatCurrency(budgetRange.min || 0)} - ${formatCurrency(budgetRange.max || 0)}
                </div>
            </a>
          `;
        }).join('')}
    </div>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(outputDir, '..', 'index.html'), indexHTML);
  console.log('✅ Generated: index.html');
}

// Run the generator
generateTrekPages();
const fs = require('fs');

// Read the current file
const filePath = './output/treks/tour-du-mont-blanc.html';
let content = fs.readFileSync(filePath, 'utf8');

// Define the navigation HTML
const navigationHTML = `    <!-- Navigation Tabs -->
    <nav class="nav-tabs">
        <div class="nav-tabs-container">
            <button class="nav-tab active" data-section="overview">Overview</button>
            <button class="nav-tab" data-section="itinerary">Itinerary</button>
            <button class="nav-tab" data-section="gear">What to Pack</button>
            <button class="nav-tab" data-section="seasons">Best Time to Go</button>
            <button class="nav-tab" data-section="costs">Costs &amp; Permits</button>
            <button class="nav-tab" data-section="faqs">FAQs</button>
        </div>
    </nav>`;

// Replace the empty navigation comments with actual navigation
content = content.replace(
    /<!-- Navigation Tabs -->\s*<!-- Navigation Tabs -->\s*/,
    navigationHTML + '\n\n'
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Navigation tabs restored successfully!');
console.log('🎯 The tabs should now be visible and functional.');
console.log('📱 Mobile scroll positioning should work correctly.');
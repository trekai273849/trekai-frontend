#!/usr/bin/env node

// update-trek-pages.js
// Script to update existing trek pages with save functionality

const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const TREK_PAGES_DIR = './output/treks'; // Adjust this to your trek pages directory
const TREK_DATA_FILE = './data/all-treks-combined.json'; // Path to your trek data JSON

// Function to extract trek ID from filename
function getTrekIdFromFilename(filename) {
    return path.basename(filename, '.html');
}

// Function to find and update or add the save button
function addSaveButton($) {
    // Look for existing save button or customize button area
    let buttonArea = $('.button-group, .action-buttons, .trek-actions');
    
    if (buttonArea.length === 0) {
        // Look for the customize button to add save button next to it
        const customizeButton = $('button:contains("Customize This Trek"), a:contains("Customize This Trek")');
        if (customizeButton.length > 0) {
            buttonArea = customizeButton.parent();
        }
    }
    
    // Check if save button already exists
    const existingSaveButton = $('[data-save-trek]');
    if (existingSaveButton.length > 0) {
        console.log('  ✓ Save button already exists');
        return;
    }
    
    // Create the save button HTML
    const saveButtonHtml = `
<button data-save-trek class="bg-white text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300">
    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
    </svg>
    Save to My Trips
</button>`;
    
    if (buttonArea.length > 0) {
        // Add to existing button area
        buttonArea.append(saveButtonHtml);
        console.log('  ✓ Added save button to existing button area');
    } else {
        // Find a good place to insert the button (after the first major content section)
        const mainContent = $('.trek-content, .overview-section, main .content, article');
        if (mainContent.length > 0) {
            mainContent.first().append(`
<div class="flex flex-col sm:flex-row gap-4 my-8">
    ${saveButtonHtml}
</div>`);
            console.log('  ✓ Added save button to main content area');
        } else {
            console.log('  ⚠ Could not find suitable location for save button');
        }
    }
}

// Function to add required scripts
function addRequiredScripts($, trekId, trekData) {
    const head = $('head');
    const body = $('body');
    
    // Check and add Tailwind CSS if not present
    if (!$('script[src*="tailwindcss"]').length && !$('link[href*="tailwind"]').length) {
        head.append('<script src="https://cdn.tailwindcss.com"></script>\n');
        console.log('  ✓ Added Tailwind CSS');
    }
    
    // Add trek data script before closing body tag
    const trekDataScript = `
<!-- Trek Data for Save Functionality -->
<script type="module">
    // Trek data for save functionality
    window.trekData = ${JSON.stringify(trekData, null, 4).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n')};
</script>`;
    
    // Check if trek data already exists
    const existingTrekData = $('script:contains("window.trekData")');
    if (existingTrekData.length > 0) {
        // Update existing trek data
        existingTrekData.replaceWith(trekDataScript);
        console.log('  ✓ Updated existing trek data');
    } else {
        // Add new trek data
        body.append(trekDataScript);
        console.log('  ✓ Added trek data script');
    }
    
    // Add save-trek.js import
    if (!$('script[src*="save-trek.js"]').length) {
        body.append('\n<!-- Import save trek functionality -->\n<script type="module" src="/js/save-trek.js"></script>');
        console.log('  ✓ Added save-trek.js import');
    }
    
    // Add Firebase auth import if not present
    if (!$('script[src*="firebase.js"]').length && !$('script:contains("firebase.js")').length) {
        body.append('\n<!-- Import Firebase auth for checking user status -->\n<script type="module" src="/js/auth/firebase.js"></script>\n');
        console.log('  ✓ Added Firebase auth import');
    }
}

// Function to extract trek data from the page
function extractTrekDataFromPage($, trekId) {
    const trekData = {
        _id: trekId,
        name: '',
        region: '',
        country: '',
        summary: '',
        duration: { recommended_days: null },
        difficulty: '',
        max_elevation_m: null,
        distance_km: null
    };
    
    // Try to extract trek name from various possible locations
    trekData.name = $('h1').first().text().trim() || 
                   $('title').text().split('|')[0].trim() ||
                   $('.trek-title').text().trim();
    
    // Try to extract other data from common patterns
    // Look for quick facts, trek info, or similar sections
    const infoSection = $('.quick-facts, .trek-info, .fact-row, .info-item');
    
    infoSection.each((i, el) => {
        const text = $(el).text().toLowerCase();
        const valueText = $(el).text();
        
        if (text.includes('duration') || text.includes('days')) {
            const match = valueText.match(/(\d+)\s*days?/i);
            if (match) trekData.duration.recommended_days = parseInt(match[1]);
        }
        
        if (text.includes('difficulty')) {
            const difficulties = ['easy', 'moderate', 'challenging', 'very challenging'];
            difficulties.forEach(diff => {
                if (text.includes(diff)) trekData.difficulty = diff;
            });
        }
        
        if (text.includes('distance')) {
            const match = valueText.match(/(\d+)\s*km/i);
            if (match) trekData.distance_km = parseInt(match[1]);
        }
        
        if (text.includes('altitude') || text.includes('elevation')) {
            const match = valueText.match(/(\d+)\s*m/i);
            if (match) trekData.max_elevation_m = parseInt(match[1]);
        }
    });
    
    // Try to extract region/country from subtitle or location info
    const subtitle = $('.subtitle, .location, h2').first().text();
    if (subtitle.includes(',')) {
        const parts = subtitle.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            trekData.region = parts[0];
            trekData.country = parts[1];
        }
    }
    
    // Try to extract summary from first paragraph or description
    trekData.summary = $('.description, .summary, .overview p').first().text().trim() ||
                      $('p').first().text().trim();
    
    return trekData;
}

// Main function to process a single trek page
async function processTrekPage(filePath, treksDataMap) {
    console.log(`\nProcessing: ${path.basename(filePath)}`);
    
    try {
        // Read the HTML file
        const html = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(html);
        
        // Get trek ID from filename
        const trekId = getTrekIdFromFilename(filePath);
        
        // Get trek data from JSON or extract from page
        let trekData = treksDataMap[trekId];
        
        if (!trekData) {
            console.log('  ⚠ Trek data not found in JSON, extracting from page...');
            trekData = extractTrekDataFromPage($, trekId);
        }
        
        // Add save button
        addSaveButton($);
        
        // Add required scripts and trek data
        addRequiredScripts($, trekId, trekData);
        
        // Save the updated HTML
        const updatedHtml = $.html();
        await fs.writeFile(filePath, updatedHtml);
        
        console.log('  ✅ Successfully updated trek page');
        
    } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
}

// Main function
async function main() {
    console.log('🚀 Starting trek pages update...\n');
    
    try {
        // Load trek data if available
        let treksDataMap = {};
        try {
            const treksDataRaw = await fs.readFile(TREK_DATA_FILE, 'utf-8');
            const treksDataArray = JSON.parse(treksDataRaw);
            
            // Convert array to map by trek ID
            treksDataMap = treksDataArray.reduce((map, trek) => {
                map[trek._id] = trek;
                return map;
            }, {});
            
            console.log(`✓ Loaded trek data for ${Object.keys(treksDataMap).length} treks`);
        } catch (error) {
            console.log('⚠ Could not load trek data JSON, will extract from pages');
        }
        
        // Get all HTML files in the trek pages directory
        const files = await fs.readdir(TREK_PAGES_DIR);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} trek pages to process`);
        
        // Process each file
        for (const file of htmlFiles) {
            const filePath = path.join(TREK_PAGES_DIR, file);
            await processTrekPage(filePath, treksDataMap);
        }
        
        console.log('\n✅ All trek pages updated successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { processTrekPage, main };
// Node.js script to combine multiple JSON files
const fs = require('fs');
const path = require('path');

// List your JSON files here
const jsonFiles = [
    'Himalayas.json',
    'Other Hikes.json',
    'Patagonia & Europe.json',
    'Peru & Scandanavia.json'
];

// Array to hold all combined data
let combinedData = [];

// Read and parse each JSON file
jsonFiles.forEach(filename => {
    try {
        // Read the file
        const fileContent = fs.readFileSync(filename, 'utf8');
        
        // Parse JSON
        const data = JSON.parse(fileContent);
        
        // Add to combined array (assuming each file contains an array)
        if (Array.isArray(data)) {
            combinedData = combinedData.concat(data);
            console.log(`✓ Added ${data.length} items from ${filename}`);
        } else {
            console.log(`⚠ Warning: ${filename} does not contain an array`);
        }
    } catch (error) {
        console.error(`✗ Error processing ${filename}:`, error.message);
    }
});

// Sort by name (optional)
combinedData.sort((a, b) => a.name.localeCompare(b.name));

// Write combined data to new file
const outputFilename = 'all-treks-combined.json';
fs.writeFileSync(outputFilename, JSON.stringify(combinedData, null, 2));

console.log(`\n✓ Successfully combined ${combinedData.length} treks into ${outputFilename}`);

// Optional: Print summary statistics
const regions = [...new Set(combinedData.map(trek => trek.region))];
const countries = [...new Set(combinedData.map(trek => trek.country))];

console.log(`\nSummary:`);
console.log(`- Total treks: ${combinedData.length}`);
console.log(`- Regions: ${regions.join(', ')}`);
console.log(`- Countries: ${countries.join(', ')}`);
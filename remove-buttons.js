const fs = require('fs');
const path = require('path');

// Function to process a single HTML file
function removeCustomizeButton(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the "Customize This Trek with AI" button
    // This regex looks for the button with the specific classes and text
    const customizeButtonRegex = /<button\s+class="bg-green-700[^"]*"[^>]*>\s*🤖\s*Customize This Trek with AI\s*<\/button>/gi;
    
    // Also remove any extra whitespace/newlines that might be left
    content = content.replace(customizeButtonRegex, '');
    
    // Clean up the flex container - if there's only one button left, we might want to adjust the layout
    // Update the flex container to center the remaining button
    content = content.replace(
      /<div class="flex flex-col sm:flex-row gap-4 mb-8">/g,
      '<div class="flex justify-center mb-8">'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Function to find and process all HTML files in the treks directory
function processAllTrekFiles() {
  const treksDir = path.join(process.cwd(), 'output', 'treks');
  
  if (!fs.existsSync(treksDir)) {
    console.error('❌ Treks directory not found:', treksDir);
    return;
  }
  
  try {
    const files = fs.readdirSync(treksDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      console.log('No HTML files found in the treks directory.');
      return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to process...`);
    
    htmlFiles.forEach(file => {
      const filePath = path.join(treksDir, file);
      removeCustomizeButton(filePath);
    });
    
    console.log(`\n🎉 Completed processing ${htmlFiles.length} files!`);
    
  } catch (error) {
    console.error('❌ Error reading treks directory:', error.message);
  }
}

// Also update the template file
function updateTemplate() {
  const templatePath = path.join(process.cwd(), 'trek-template.html');
  
  if (fs.existsSync(templatePath)) {
    removeCustomizeButton(templatePath);
    console.log('✅ Updated template file');
  }
}

// Run the script
console.log('🚀 Starting button removal process...\n');

// Process all existing trek files
processAllTrekFiles();

// Update the template
updateTemplate();

console.log('\n📝 Summary:');
console.log('- Removed "Customize This Trek with AI" buttons');
console.log('- Kept "Save to My Trips" buttons');
console.log('- Centered the remaining button in the container');
console.log('\nAll trek pages have been updated!');
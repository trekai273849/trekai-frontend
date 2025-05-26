const fs = require('fs');
const path = require('path');

// Function to improve button spacing and alignment
function improveCTAButton(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = [];
    
    // Find and improve the CTA button section
    const currentButtonRegex = /<div class="flex justify-center mb-8">\s*<button data-save-trek[^>]*>[\s\S]*?<\/button>\s*<\/div>/gi;
    
    if (content.match(currentButtonRegex)) {
      const improvedButton = `                <div class="flex justify-center mt-12 mb-12">
                    <button data-save-trek class="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-full border-2 border-gray-300 hover:border-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg group">
                        <svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-green-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        <span class="text-lg">Save to My Trips</span>
                    </button>
                </div>`;
      
      content = content.replace(currentButtonRegex, improvedButton);
      changes.push('Improved button spacing and styling');
    }
    
    // Also look for any buttons that might have different class structures
    const alternativeButtonRegex = /<div[^>]*justify-center[^>]*>\s*<button[^>]*data-save-trek[^>]*>[\s\S]*?<\/button>\s*<\/div>/gi;
    
    if (content.match(alternativeButtonRegex) && changes.length === 0) {
      const improvedButton = `                <div class="flex justify-center mt-12 mb-12">
                    <button data-save-trek class="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-full border-2 border-gray-300 hover:border-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg group">
                        <svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-green-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        <span class="text-lg">Save to My Trips</span>
                    </button>
                </div>`;
      
      content = content.replace(alternativeButtonRegex, improvedButton);
      changes.push('Improved button spacing and styling (alternative pattern)');
    }
    
    // Write the updated content back to the file if changes were made
    if (changes.length > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${path.basename(filePath)}: ${changes.join(', ')}`);
    } else {
      console.log(`⏭️  Skipped ${path.basename(filePath)}: No CTA button found or already updated`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Function to process all HTML files in the treks directory
function updateAllTrekPages() {
  const treksDir = path.join(process.cwd(), 'output', 'treks');
  
  if (!fs.existsSync(treksDir)) {
    console.error('❌ Treks directory not found:', treksDir);
    console.log('Make sure you run this script from your project root directory.');
    return;
  }
  
  try {
    const files = fs.readdirSync(treksDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      console.log('No HTML files found in the treks directory.');
      return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to improve...\n`);
    
    htmlFiles.forEach(file => {
      const filePath = path.join(treksDir, file);
      improveCTAButton(filePath);
    });
    
    console.log(`\n🎉 Completed improving ${htmlFiles.length} files!`);
    
  } catch (error) {
    console.error('❌ Error reading treks directory:', error.message);
  }
}

// Function to update the template file as well
function updateTemplate() {
  const templatePath = path.join(process.cwd(), 'trek-template.html');
  
  if (fs.existsSync(templatePath)) {
    console.log('📝 Updating template file...');
    improveCTAButton(templatePath);
  } else {
    console.log('⚠️  Template file not found');
  }
}

// Main execution
console.log('🎨 Starting CTA button improvement process...\n');

// Process all existing trek files
updateAllTrekPages();

// Update template file
updateTemplate();

console.log('\n✨ Button Improvements Applied:');
console.log('📏 Increased top and bottom margins (mt-12 mb-12)');
console.log('🎯 Enhanced button padding and sizing');
console.log('🎨 Added hover effects with color transitions');
console.log('💫 Added subtle scale effect on hover');
console.log('🌈 Added shadow effects for depth');
console.log('🔄 Improved icon and text spacing');
console.log('📱 Maintained mobile responsiveness');

console.log('\n🚀 Your "Save to My Trips" buttons now have:');
console.log('• Better spacing from surrounding content');
console.log('• Professional hover animations');
console.log('• Improved visual hierarchy');
console.log('• Enhanced accessibility');

console.log('\n💡 The buttons will now stand out better and feel more interactive!');
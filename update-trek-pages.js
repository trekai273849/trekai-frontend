const fs = require('fs');
const path = require('path');

// Function to clean up the CTA section in trek pages
function updateTrekPage(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = [];
    
    // 1. Remove the entire CTA section that contains multiple buttons and replace with single save button
    const ctaSectionRegex = /<div class="cta-section">[\s\S]*?<button data-save-trek[^>]*>[\s\S]*?<\/button>\s*<\/div>/gi;
    
    if (content.match(ctaSectionRegex)) {
      const replacementButton = `                <div class="flex justify-center mb-8">
                    <button data-save-trek class="bg-white text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                        </svg>
                        Save to My Trips
                    </button>
                </div>`;
      
      content = content.replace(ctaSectionRegex, replacementButton);
      changes.push('Replaced CTA section with single save button');
    }
    
    // 2. Fallback: If the above didn't work, try to remove individual buttons
    // Remove the "Customize This Trek with AI" button (with different possible class patterns)
    const customizeButtonPatterns = [
      /<button class="btn btn-primary">\s*<span>🤖<\/span>\s*<span>Customize This Trek with AI<\/span>\s*<\/button>/gi,
      /<button[^>]*>\s*<span>🤖<\/span>\s*<span>Customize This Trek with AI<\/span>\s*<\/button>/gi,
      /<button[^>]*🤖[^>]*Customize This Trek with AI[^>]*<\/button>/gi
    ];
    
    for (const pattern of customizeButtonPatterns) {
      if (content.match(pattern)) {
        content = content.replace(pattern, '');
        changes.push('Removed AI customize button (fallback)');
        break;
      }
    }
    
    // Remove the original "Save to My Trips" button (btn-secondary style)
    const saveButtonPatterns = [
      /<button class="btn btn-secondary">\s*<span>💾<\/span>\s*<span>Save to My Trips<\/span>\s*<\/button>/gi,
      /<button[^>]*>\s*<span>💾<\/span>\s*<span>Save to My Trips<\/span>\s*<\/button>/gi
    ];
    
    for (const pattern of saveButtonPatterns) {
      if (content.match(pattern)) {
        content = content.replace(pattern, '');
        changes.push('Removed original save button (fallback)');
        break;
      }
    }
    
    // 3. Add navbar if not present
    if (!content.includes('navbar.js')) {
      const bodyTagRegex = /<body[^>]*>/i;
      const bodyMatch = content.match(bodyTagRegex);
      
      if (bodyMatch) {
        const navbarScript = `${bodyMatch[0]}
  <!-- Navbar will be injected here -->
  <script type="module" src="../js/components/navbar.js"></script>`;
        
        content = content.replace(bodyTagRegex, navbarScript);
        changes.push('Added navbar');
      }
    }
    
    // 4. Add footer if not present
    if (!content.includes('footer-container') && !content.includes('footer.js')) {
      const closingBodyRegex = /<\/body>/i;
      
      if (content.match(closingBodyRegex)) {
        const footerHTML = `  
  <!-- Footer -->
  <div id="footer-container"></div>
  <script src="../js/components/footer.js" type="module"></script>
  
</body>`;
        
        content = content.replace(closingBodyRegex, footerHTML);
        changes.push('Added footer');
      }
    }
    
    // 5. Write the updated content back to the file if any changes were made
    if (changes.length > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${path.basename(filePath)}: ${changes.join(', ')}`);
    } else {
      console.log(`⏭️  Skipped ${path.basename(filePath)}: No changes needed`);
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
    
    console.log(`Found ${htmlFiles.length} HTML files to process...\n`);
    
    htmlFiles.forEach(file => {
      const filePath = path.join(treksDir, file);
      updateTrekPage(filePath);
    });
    
    console.log(`\n🎉 Completed processing ${htmlFiles.length} files!`);
    
  } catch (error) {
    console.error('❌ Error reading treks directory:', error.message);
  }
}

// Function to update the template file
function updateTemplate() {
  const templatePath = path.join(process.cwd(), 'trek-template.html');
  
  if (fs.existsSync(templatePath)) {
    let content = fs.readFileSync(templatePath, 'utf8');
    let changes = [];
    
    // Remove customize button from template
    const customizeButtonRegex = /<button[^>]*>\s*🤖\s*Customize This Trek with AI\s*<\/button>/gi;
    if (content.match(customizeButtonRegex)) {
      content = content.replace(customizeButtonRegex, '');
      changes.push('Removed AI customize button');
    }
    
    // Update flex container in template
    const flexContainerRegex = /<div class="flex flex-col sm:flex-row gap-4 mb-8">/g;
    if (content.match(flexContainerRegex)) {
      content = content.replace(flexContainerRegex, '<div class="flex justify-center mb-8">');
      changes.push('Centered save button');
    }
    
    // Ensure template has correct paths for navbar and footer (root level paths)
    if (content.includes('../js/components/navbar.js')) {
      content = content.replace('../js/components/navbar.js', 'js/components/navbar.js');
      changes.push('Fixed navbar path for template');
    }
    
    if (content.includes('../js/components/footer.js')) {
      content = content.replace('../js/components/footer.js', 'js/components/footer.js');
      changes.push('Fixed footer path for template');
    }
    
    if (changes.length > 0) {
      fs.writeFileSync(templatePath, content, 'utf8');
      console.log(`✅ Updated template: ${changes.join(', ')}`);
    } else {
      console.log('✅ Template is already up to date');
    }
  } else {
    console.log('⚠️  Template file not found');
  }
}

// Function to verify required files exist
function verifyRequiredFiles() {
  const requiredFiles = [
    'js/components/navbar.js',
    'js/components/footer.js'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('⚠️  Warning: The following required files are missing:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\nMake sure these files exist before the trek pages will work properly.\n');
    return false;
  } else {
    console.log('✅ All required navbar and footer files found.\n');
    return true;
  }
}

// Main execution
console.log('🚀 Starting trek pages cleanup...\n');

// Verify required files exist
const filesExist = verifyRequiredFiles();

// Process all existing trek files
updateAllTrekPages();

// Update template file
updateTemplate();

console.log('\n📝 Cleanup Summary:');
console.log('✂️  Removed extra buttons from CTA sections');
console.log('📍 Kept only the "Save to My Trips" button');
console.log('🧭 Ensured navbar is present on all trek pages');
console.log('🦶 Ensured footer is present on all trek pages');
console.log('🛠️  Updated template file');

if (filesExist) {
  console.log('\n🎉 All updates completed successfully!');
  console.log('Your trek pages now have clean navigation and single save buttons.');
} else {
  console.log('\n⚠️  Updates completed but some required files are missing.');
  console.log('Make sure to create the missing navbar.js and footer.js files.');
}

console.log('\n💡 After running this script:');
console.log('1. Check one of your trek pages to verify the buttons are fixed');
console.log('2. If the navbar/footer don\'t show, check the browser console for errors');
console.log('3. Make sure your js/components/ folder has the navbar.js and footer.js files');
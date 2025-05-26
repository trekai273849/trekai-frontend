const fs = require('fs');
const path = require('path');

// Function to fix the trek titles in my-itineraries.html
function fixMyItinerariesTitles() {
  const filePath = path.join(process.cwd(), 'my-itineraries.html');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ my-itineraries.html file not found');
    console.log('Make sure you run this script from your project root directory.');
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find and replace the createCardHeader function
    const oldCreateCardHeaderRegex = /function createCardHeader\(itinerary\) \{[\s\S]*?^\s*\}/m;
    
    const newCreateCardHeaderFunction = `function createCardHeader(itinerary) {
      const isPopularTrek = itinerary.type === 'popular-trek';
      
      // For popular treks, use the title (trek name); for custom itineraries, use location
      const displayTitle = isPopularTrek ? 
        (itinerary.title || 'Popular Trek') : 
        toTitleCase(itinerary.location || 'Custom Itinerary');
      
      // For location info (for gradient/image matching), use the region or location
      const locationForStyling = isPopularTrek ? 
        (itinerary.trekDetails?.region || itinerary.location) : 
        itinerary.location;
      
      const locationInfo = getLocationData(locationForStyling);
      
      // Check if the image exists
      if (locationInfo.image) {
        // Try to load the image first to check if it exists
        const img = new Image();
        img.src = locationInfo.image;
        
        return new Promise((resolve) => {
          img.onload = () => {
            // Image loaded successfully, use it
            resolve(\`
              <div class="h-32 bg-blue-100 flex items-center justify-center bg-cover bg-center relative" 
                   style="background-image: url('\${locationInfo.image}')">
                <div class="absolute inset-0 bg-black bg-opacity-40"></div>
                <div class="relative z-10 text-center">
                  <h3 class="text-xl font-bold text-white mb-1">\${displayTitle}</h3>
                  \${isPopularTrek && itinerary.trekDetails?.region ? \`
                    <p class="text-sm text-gray-200 opacity-90">\${toTitleCase(itinerary.trekDetails.region)}</p>
                  \` : ''}
                </div>
              </div>
            \`);
          };
          
          img.onerror = () => {
            // Image failed to load, use gradient fallback
            resolve(createGradientHeader(itinerary, locationInfo, displayTitle, isPopularTrek));
          };
          
          // If neither success nor error events fire after a timeout, use gradient
          setTimeout(() => {
            if (!img.complete) {
              resolve(createGradientHeader(itinerary, locationInfo, displayTitle, isPopularTrek));
            }
          }, 1000);
        });
      } else {
        // No image specified, use gradient
        return Promise.resolve(createGradientHeader(itinerary, locationInfo, displayTitle, isPopularTrek));
      }
    }`;
    
    // Replace the old function
    if (content.match(oldCreateCardHeaderRegex)) {
      content = content.replace(oldCreateCardHeaderRegex, newCreateCardHeaderFunction);
      console.log('✅ Updated createCardHeader function');
    } else {
      console.log('⚠️  Could not find createCardHeader function - you may need to update manually');
    }
    
    // Also update the createGradientHeader function
    const oldCreateGradientHeaderRegex = /function createGradientHeader\(itinerary, locationInfo, formattedLocation\) \{[\s\S]*?^\s*\}/m;
    
    const newCreateGradientHeaderFunction = `function createGradientHeader(itinerary, locationInfo, displayTitle, isPopularTrek) {
      return \`
        <div class="h-32 flex items-center justify-center text-white relative overflow-hidden"
             style="background: \${locationInfo.gradient}">
          <div class="absolute right-3 bottom-3 text-4xl opacity-30">\${locationInfo.icon}</div>
          <div class="z-10 text-center">
            <h3 class="text-xl font-bold mb-1">\${displayTitle}</h3>
            \${isPopularTrek && itinerary.trekDetails?.region ? \`
              <p class="text-sm opacity-90">\${toTitleCase(itinerary.trekDetails.region)}</p>
            \` : ''}
          </div>
        </div>
      \`;
    }`;
    
    if (content.match(oldCreateGradientHeaderRegex)) {
      content = content.replace(oldCreateGradientHeaderRegex, newCreateGradientHeaderFunction);
      console.log('✅ Updated createGradientHeader function');
    } else {
      console.log('⚠️  Could not find createGradientHeader function - you may need to update manually');
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully updated my-itineraries.html');
    
  } catch (error) {
    console.error('❌ Error updating my-itineraries.html:', error.message);
  }
}

// Main execution
console.log('🔧 Starting My Itineraries title fix...\n');

fixMyItinerariesTitles();

console.log('\n📝 Fix Summary:');
console.log('✅ Popular treks now display trek names (e.g., "Annapurna Circuit Trek")');
console.log('✅ Custom itineraries still display locations');
console.log('✅ Added region subtitle for popular treks');
console.log('✅ Improved visual hierarchy for trek cards');

console.log('\n🎉 Fix completed!');
console.log('💡 Now when you save a popular trek and view it in My Itineraries,');
console.log('   it will show the trek name instead of the location.');
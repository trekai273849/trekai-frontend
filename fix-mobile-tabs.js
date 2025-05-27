const fs = require('fs');
const path = require('path');

// Clean, corrected JavaScript for mobile tab centering
const cleanTabScript = `
    <script>
        // Enhanced tab navigation with mobile centering
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionId).classList.add('active');
            
            // Add active class to clicked tab
            const clickedTab = event.target;
            clickedTab.classList.add('active');
            
            // Center the clicked tab on mobile
            centerTabWithNextVisible(clickedTab);
            
            // Scroll to top of content
            window.scrollTo({ top: document.querySelector('.nav-tabs').offsetTop - 20, behavior: 'smooth' });
        }

        function centerTabWithNextVisible(clickedTab) {
            const tabContainer = document.querySelector('.nav-tabs-container');
            const allTabs = Array.from(document.querySelectorAll('.nav-tab'));
            const clickedIndex = allTabs.indexOf(clickedTab);
            
            if (clickedIndex === -1) return;
            
            const containerWidth = tabContainer.offsetWidth;
            const tabWidth = clickedTab.offsetWidth;
            const tabOffsetLeft = clickedTab.offsetLeft;
            
            // Calculate scroll position to show clicked tab + part of next tab
            let targetScroll;
            
            if (clickedIndex === allTabs.length - 1) {
                // Last tab - center it
                targetScroll = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);
            } else {
                // Show clicked tab with next tab partially visible
                const nextTab = allTabs[clickedIndex + 1];
                const nextTabWidth = nextTab.offsetWidth;
                const totalWidthNeeded = tabWidth + (nextTabWidth * 0.6); // Show 60% of next tab
                
                if (totalWidthNeeded <= containerWidth) {
                    // Both tabs can fit, position them optimally
                    targetScroll = tabOffsetLeft - (containerWidth - totalWidthNeeded) / 2;
                } else {
                    // Position clicked tab with as much of next tab as possible
                    targetScroll = tabOffsetLeft - (containerWidth - tabWidth) * 0.3;
                }
            }
            
            // Ensure we don't scroll past the container bounds
            const maxScroll = tabContainer.scrollWidth - containerWidth;
            targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
            
            tabContainer.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }

        function toggleFaq(element) {
            const faqItem = element.parentElement;
            faqItem.classList.toggle('active');
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Add touch-friendly scrolling for mobile
            const tabContainer = document.querySelector('.nav-tabs-container');
            if (tabContainer) {
                // Improve scrolling momentum on iOS
                tabContainer.style.webkitOverflowScrolling = 'touch';
            }
        });
    </script>`;

function fixCorruptedScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Find and replace the entire corrupted script section
        // Look for the script tag that contains the showSection function
        const scriptPattern = /<script>[\s\S]*?<\/script>(?=\s*<!-- Trek Data for Save Functionality -->)/;
        
        if (scriptPattern.test(content)) {
            content = content.replace(scriptPattern, cleanTabScript);
            modified = true;
            console.log(`✅ Fixed corrupted JavaScript in ${path.basename(filePath)}`);
        } else {
            // Fallback: look for any script with showSection
            const fallbackPattern = /<script>[\s\S]*?function showSection[\s\S]*?<\/script>/;
            if (fallbackPattern.test(content)) {
                content = content.replace(fallbackPattern, cleanTabScript);
                modified = true;
                console.log(`✅ Fixed corrupted JavaScript (fallback) in ${path.basename(filePath)}`);
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        } else {
            console.log(`⚠️  Could not find script section to fix in ${path.basename(filePath)}`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

// Process all trek files
function fixAllCorruptedScripts() {
    const treksDir = './output/treks';
    
    if (!fs.existsSync(treksDir)) {
        console.error(`❌ Directory ${treksDir} does not exist`);
        return;
    }
    
    const files = fs.readdirSync(treksDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
        console.log('No HTML files found in the treks directory');
        return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to fix:\n`);
    
    let processedCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(treksDir, file);
        const wasProcessed = fixCorruptedScript(filePath);
        if (wasProcessed) {
            processedCount++;
        }
    });
    
    console.log(`\n🎉 JavaScript cleanup complete!`);
    console.log(`📊 Files fixed: ${processedCount} out of ${htmlFiles.length}`);
    console.log(`\n🔧 Fixed issues:`);
    console.log(`   • Removed duplicate function definitions`);
    console.log(`   • Fixed syntax errors`);
    console.log(`   • Clean mobile tab centering functionality`);
    console.log(`   • Proper event handling`);
}

// Alternative manual fix for a single file
function fixSingleFile(filename) {
    const filePath = `./output/treks/${filename}`;
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File ${filePath} does not exist`);
        return;
    }
    
    const wasFixed = fixCorruptedScript(filePath);
    
    if (wasFixed) {
        console.log(`✅ Successfully fixed ${filename}`);
    } else {
        console.log(`❌ Could not fix ${filename}`);
    }
}

// Run the fix
console.log('🔧 Starting JavaScript cleanup and mobile tab fix...\n');
fixAllCorruptedScripts();

// Uncomment the line below to fix just the Tour du Mont Blanc file:
// fixSingleFile('tour-du-mont-blanc.html');
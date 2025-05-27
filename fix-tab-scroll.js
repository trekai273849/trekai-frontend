const fs = require('fs');
const path = require('path');

// Updated JavaScript with proper scroll-to-top functionality
const fixedTabScript = `
    <script>
        // Enhanced tab navigation with mobile centering and proper scroll positioning
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
            
            // Scroll to the top of the new section content
            scrollToSectionTop(sectionId);
        }

        function scrollToSectionTop(sectionId) {
            // Get the nav-tabs element to calculate offset
            const navTabs = document.querySelector('.nav-tabs');
            const navTabsHeight = navTabs ? navTabs.offsetHeight : 0;
            
            // Calculate the scroll position (nav-tabs height + small padding)
            const scrollPosition = navTabs ? navTabs.offsetTop + navTabsHeight + 10 : 0;
            
            // Smooth scroll to just below the sticky navigation
            window.scrollTo({ 
                top: scrollPosition, 
                behavior: 'smooth' 
            });
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

function fixScrollPosition(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Find and replace the script section that contains showSection
        const scriptPattern = /<script>[\s\S]*?function showSection[\s\S]*?<\/script>(?=\s*<!-- Trek Data for Save Functionality -->)/;
        
        if (scriptPattern.test(content)) {
            content = content.replace(scriptPattern, fixedTabScript);
            modified = true;
            console.log(`✅ Fixed scroll positioning in ${path.basename(filePath)}`);
        } else {
            // Alternative pattern matching
            const altPattern = /<script>[\s\S]*?showSection\(sectionId\)[\s\S]*?<\/script>/;
            if (altPattern.test(content)) {
                content = content.replace(altPattern, fixedTabScript);
                modified = true;
                console.log(`✅ Fixed scroll positioning (alt) in ${path.basename(filePath)}`);
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        } else {
            console.log(`⚠️  Could not find script section in ${path.basename(filePath)}`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Process all trek files
function fixAllScrollPositions() {
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
        const wasProcessed = fixScrollPosition(filePath);
        if (wasProcessed) {
            processedCount++;
        }
    });
    
    console.log(`\n🎉 Scroll position fix complete!`);
    console.log(`📊 Files updated: ${processedCount} out of ${htmlFiles.length}`);
    console.log(`\n✨ Improvements made:`);
    console.log(`   • Tab switching now scrolls to top of new content`);
    console.log(`   • Smooth scrolling animation`);
    console.log(`   • Proper positioning below sticky navigation`);
    console.log(`   • Mobile tab centering still works`);
    console.log(`   • No more manual scrolling up required!`);
}

// Alternative function to fix just one specific file
function fixSingleFile(filename) {
    const filePath = `./output/treks/${filename}`;
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File ${filePath} does not exist`);
        return;
    }
    
    const wasFixed = fixScrollPosition(filePath);
    
    if (wasFixed) {
        console.log(`✅ Successfully fixed scroll positioning in ${filename}`);
        console.log(`\n🔧 What changed:`);
        console.log(`   • Added scrollToSectionTop() function`);
        console.log(`   • Modified showSection() to scroll to content top`);
        console.log(`   • Maintains mobile centering functionality`);
    } else {
        console.log(`❌ Could not fix ${filename}`);
    }
}

// Run the fix
console.log('🚀 Starting tab scroll position fix...\n');
fixAllScrollPositions();

// Uncomment to fix just one file:
// fixSingleFile('tour-du-mont-blanc.html');
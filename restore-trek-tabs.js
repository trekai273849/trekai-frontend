const fs = require('fs');
const path = require('path');

// Directory containing the trek files
const trekDir = './output/treks';

function cleanTrekFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // First, let's restore the navigation if it's missing
        if (!content.includes('<!-- Navigation Tabs -->')) {
            // Find where to insert navigation (after hero section)
            const heroEndMatch = content.match(/(<\/section>)\s*(?=\s*<!-- Overview Section -->)/);
            if (heroEndMatch) {
                const insertPoint = heroEndMatch.index + heroEndMatch[1].length;
                const beforeHero = content.substring(0, insertPoint);
                const afterHero = content.substring(insertPoint);
                
                const navigationHTML = `

    <!-- Navigation Tabs -->
    <nav class="nav-tabs">
        <div class="nav-tabs-container">
            <button class="nav-tab active" data-section="overview">Overview</button>
            <button class="nav-tab" data-section="itinerary">Itinerary</button>
            <button class="nav-tab" data-section="gear">What to Pack</button>
            <button class="nav-tab" data-section="seasons">Best Time to Go</button>
            <button class="nav-tab" data-section="costs">Costs &amp; Permits</button>
            <button class="nav-tab" data-section="faqs">FAQs</button>
        </div>
    </nav>
`;
                
                content = beforeHero + navigationHTML + afterHero;
            }
        }
        
        // Remove any duplicate navigation sections with onclick attributes
        content = content.replace(
            /<nav class="nav-tabs">\s*<div class="nav-tabs-container">\s*<button class="nav-tab active" onclick="showSection\('overview'\)">Overview<\/button>[\s\S]*?<\/nav>/g,
            ''
        );
        
        // Remove broken script sections (ones with event.target issues)
        content = content.replace(
            /<script>\s*\/\/ Enhanced tab navigation with mobile centering and proper scroll positioning\s*function showSection\(sectionId\) \{[\s\S]*?const clickedTab = event\.target;[\s\S]*?<\/script>/g,
            ''
        );
        
        // Add the correct script if it's missing or replace broken ones
        const correctScript = `
    <script>
        // Enhanced tab navigation with mobile centering and proper scroll positioning
        function showSection(sectionId, clickedElement) {
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Add active class to clicked tab
            if (clickedElement) {
                clickedElement.classList.add('active');
                // Center the clicked tab on mobile
                centerTabWithNextVisible(clickedElement);
            }
            
            // Scroll to the top of the new section content
            scrollToSectionTop();
        }

        function scrollToSectionTop() {
            setTimeout(() => {
                const navTabs = document.querySelector('.nav-tabs');
                if (navTabs) {
                    // Get the height of the sticky nav
                    const navHeight = navTabs.offsetHeight;
                    // Scroll to just below the nav bar
                    const targetPosition = navTabs.offsetTop + navHeight + 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        }

        function centerTabWithNextVisible(clickedTab) {
            const tabContainer = document.querySelector('.nav-tabs-container');
            const allTabs = Array.from(document.querySelectorAll('.nav-tab'));
            const clickedIndex = allTabs.indexOf(clickedTab);
            
            if (clickedIndex === -1 || !tabContainer) return;
            
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

            // Add click event listeners to all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('data-section');
                    if (sectionId) {
                        showSection(sectionId, this);
                    }
                });
            });
            
            // Ensure Overview tab is active by default
            const overviewTab = document.querySelector('.nav-tab[data-section="overview"]');
            const overviewSection = document.getElementById('overview');
            if (overviewTab && overviewSection) {
                overviewTab.classList.add('active');
                overviewSection.classList.add('active');
            }
        });
    </script>`;
        
        // Find where to insert the script (before Trek Data section)
        const scriptInsertPoint = content.indexOf('<!-- Trek Data for Save Functionality -->');
        if (scriptInsertPoint !== -1) {
            // Check if we already have the correct script
            if (!content.includes('function showSection(sectionId, clickedElement)')) {
                const beforeScript = content.substring(0, scriptInsertPoint);
                const afterScript = content.substring(scriptInsertPoint);
                content = beforeScript + correctScript + '\n\n\n' + afterScript;
            }
        }
        
        // Clean up any multiple consecutive newlines
        content = content.replace(/\n{4,}/g, '\n\n\n');
        
        // Write the cleaned content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

// Main execution
function cleanAllTrekFiles() {
    try {
        // Check if directory exists
        if (!fs.existsSync(trekDir)) {
            console.error(`Directory ${trekDir} does not exist!`);
            return;
        }
        
        // Get all HTML files in the directory
        const files = fs.readdirSync(trekDir)
            .filter(file => file.endsWith('.html'))
            .map(file => path.join(trekDir, file));
        
        console.log(`🔧 Found ${files.length} HTML files to restore and fix...\n`);
        
        // Process each file
        files.forEach(cleanTrekFile);
        
        console.log('\n🎉 All files have been restored and fixed!');
        console.log('\n✨ What was fixed:');
        console.log('   • ✅ Navigation tabs restored');
        console.log('   • ✅ Removed duplicate/broken scripts');
        console.log('   • ✅ Fixed scroll positioning to start from top');
        console.log('   • ✅ Added proper event listeners');
        console.log('   • ✅ Mobile-friendly tab switching');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the restoration and cleanup
cleanAllTrekFiles();
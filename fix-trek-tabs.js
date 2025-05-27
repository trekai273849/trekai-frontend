const fs = require('fs');
const path = require('path');

// Directory containing the trek files
const trekDir = './output/treks';

// Fixed JavaScript code for tab navigation
const fixedScript = `
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
            document.getElementById(sectionId).classList.add('active');
            
            // Add active class to clicked tab
            if (clickedElement) {
                clickedElement.classList.add('active');
                // Center the clicked tab on mobile
                centerTabWithNextVisible(clickedElement);
            }
            
            // Scroll to the top of the new section content
            scrollToSectionTop(sectionId);
        }

        function scrollToSectionTop(sectionId) {
            setTimeout(() => {
                const navTabs = document.querySelector('.nav-tabs');
                if (navTabs) {
                    // Get the actual current position of the sticky nav
                    const rect = navTabs.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    // Calculate position just below the nav
                    const targetPosition = rect.bottom + scrollTop + 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 100);
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

            // Add click event listeners to all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('data-section') || this.onclick.toString().match(/showSection\\('(.+?)'\\)/)?.[1];
                    if (sectionId) {
                        showSection(sectionId, this);
                    }
                });
            });
        });
    </script>`;

// Updated HTML for nav tabs (to add data attributes and remove onclick)
const navTabsHTML = `
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
    </nav>`;

// Function to process each HTML file
function fixTrekFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace the existing script section
        const scriptStart = content.indexOf('<script>');
        const scriptEnd = content.indexOf('</script>') + 9;
        
        if (scriptStart !== -1 && scriptEnd !== -1) {
            const beforeScript = content.substring(0, scriptStart);
            const afterScript = content.substring(scriptEnd);
            content = beforeScript + fixedScript + afterScript;
        }
        
        // Update nav tabs to use data attributes instead of onclick
        content = content.replace(
            /<nav class="nav-tabs">[\s\S]*?<\/nav>/,
            navTabsHTML
        );
        
        // Write the fixed content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${path.basename(filePath)}`);
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Main execution
function fixAllTrekFiles() {
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
        
        console.log(`Found ${files.length} HTML files to process...`);
        
        // Process each file
        files.forEach(fixTrekFile);
        
        console.log('\\nAll files have been processed successfully!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the fix
fixAllTrekFiles();
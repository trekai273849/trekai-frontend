const fs = require('fs');
const path = require('path');

// Enhanced JavaScript for mobile tab centering
const enhancedTabScript = `
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
            centerTabOnMobile(clickedTab);
            
            // Scroll to top of content
            window.scrollTo({ top: document.querySelector('.nav-tabs').offsetTop - 20, behavior: 'smooth' });
        }

        function centerTabOnMobile(clickedTab) {
            const tabContainer = document.querySelector('.nav-tabs-container');
            const containerWidth = tabContainer.offsetWidth;
            const tabWidth = clickedTab.offsetWidth;
            const tabOffsetLeft = clickedTab.offsetLeft;
            
            // Calculate the scroll position to center the tab
            // We want the tab to be slightly left of center so the next tab is visible
            const centerPosition = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);
            
            // Adjust to show more of the next tab (shift left by 1/4 of container width)
            const adjustedPosition = centerPosition + (containerWidth / 4);
            
            // Smooth scroll to the calculated position
            tabContainer.scrollTo({
                left: Math.max(0, adjustedPosition),
                behavior: 'smooth'
            });
        }

        // Alternative function for more precise control
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

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            // Add touch-friendly scrolling for mobile
            const tabContainer = document.querySelector('.nav-tabs-container');
            if (tabContainer) {
                // Improve scrolling momentum on iOS
                tabContainer.style.webkitOverflowScrolling = 'touch';
                
                // Add scroll indicators for better UX
                addScrollIndicators();
            }
        });

        function addScrollIndicators() {
            const tabContainer = document.querySelector('.nav-tabs-container');
            const navTabs = document.querySelector('.nav-tabs');
            
            // Create scroll indicator elements
            const leftIndicator = document.createElement('div');
            leftIndicator.className = 'scroll-indicator scroll-indicator-left';
            leftIndicator.innerHTML = '‹';
            
            const rightIndicator = document.createElement('div');
            rightIndicator.className = 'scroll-indicator scroll-indicator-right';
            rightIndicator.innerHTML = '›';
            
            // Add CSS for indicators
            const indicatorStyles = \`
                .scroll-indicator {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.9);
                    color: var(--primary);
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 10;
                    opacity: 0;
                    pointer-events: none;
                }
                
                .scroll-indicator.visible {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                .scroll-indicator-left {
                    left: 10px;
                }
                
                .scroll-indicator-right {
                    right: 10px;
                }
                
                .scroll-indicator:hover {
                    background: white;
                    transform: translateY(-50%) scale(1.1);
                }
                
                @media (max-width: 768px) {
                    .nav-tabs {
                        position: relative;
                    }
                }
            \`;
            
            // Add styles to head
            const styleElement = document.createElement('style');
            styleElement.textContent = indicatorStyles;
            document.head.appendChild(styleElement);
            
            // Add indicators to nav
            navTabs.style.position = 'relative';
            navTabs.appendChild(leftIndicator);
            navTabs.appendChild(rightIndicator);
            
            // Handle indicator clicks
            leftIndicator.addEventListener('click', () => {
                tabContainer.scrollBy({ left: -150, behavior: 'smooth' });
            });
            
            rightIndicator.addEventListener('click', () => {
                tabContainer.scrollBy({ left: 150, behavior: 'smooth' });
            });
            
            // Update indicator visibility based on scroll position
            function updateIndicators() {
                const { scrollLeft, scrollWidth, clientWidth } = tabContainer;
                
                leftIndicator.classList.toggle('visible', scrollLeft > 10);
                rightIndicator.classList.toggle('visible', scrollLeft < scrollWidth - clientWidth - 10);
            }
            
            // Update indicators on scroll and resize
            tabContainer.addEventListener('scroll', updateIndicators);
            window.addEventListener('resize', updateIndicators);
            
            // Initial update
            setTimeout(updateIndicators, 100);
        }`;

function enhanceTabNavigation(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Find the existing showSection function and replace it
        const showSectionPattern = /function showSection\(sectionId\) \{[\s\S]*?\}/;
        
        if (showSectionPattern.test(content)) {
            // Replace the existing showSection function with our enhanced version
            content = content.replace(showSectionPattern, enhancedTabScript.trim());
            modified = true;
            console.log(`✅ Enhanced tab navigation in ${path.basename(filePath)}`);
        } else {
            // If showSection function not found, add the script before closing </script>
            const scriptEndPattern = /<\/script>/;
            if (scriptEndPattern.test(content)) {
                content = content.replace(scriptEndPattern, enhancedTabScript + '\n    </script>');
                modified = true;
                console.log(`✅ Added enhanced tab navigation to ${path.basename(filePath)}`);
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Process all trek files
function enhanceAllTrekTabs() {
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
    
    console.log(`Found ${htmlFiles.length} HTML files to enhance:\n`);
    
    let processedCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(treksDir, file);
        const wasProcessed = enhanceTabNavigation(filePath);
        if (wasProcessed) {
            processedCount++;
        }
    });
    
    console.log(`\n🎉 Tab navigation enhancement complete!`);
    console.log(`📊 Files enhanced: ${processedCount} out of ${htmlFiles.length}`);
    console.log(`\n✨ Enhanced features:`);
    console.log(`   • Auto-centering of selected tabs on mobile`);
    console.log(`   • Next tab visibility optimization`);
    console.log(`   • Smooth scrolling animations`);
    console.log(`   • Optional scroll indicators`);
    console.log(`   • Touch-friendly scrolling improvements`);
}

// Run the enhancement
console.log('🚀 Starting mobile tab navigation enhancement...\n');
enhanceAllTrekTabs();
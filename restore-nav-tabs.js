const fs = require('fs');
const path = require('path');

// Configuration
const TREKS_DIRECTORY = './output/treks';

// Navigation tabs HTML to insert
const NAVIGATION_TABS_HTML = `    <!-- Navigation Tabs -->
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

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function restoreNavigationTabs(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let changes = [];

        // Check if navigation tabs are already present and functional
        const hasWorkingNavTabs = content.includes('nav-tabs') && 
                                  content.includes('data-section="overview"') &&
                                  !content.includes('<!-- Navigation Tabs -->\n    \n    <!-- Navigation Tabs -->');

        if (hasWorkingNavTabs) {
            return { success: true, changes: ['Navigation tabs already present'] };
        }

        // Look for the pattern where nav tabs should be (after hero section, before overview)
        const heroSectionEnd = content.indexOf('</section>');
        const overviewSectionStart = content.indexOf('<section id="overview"');

        if (heroSectionEnd !== -1 && overviewSectionStart !== -1) {
            // Check if there are empty nav tab comments or missing nav tabs
            const sectionBetween = content.slice(heroSectionEnd, overviewSectionStart);
            
            if (sectionBetween.includes('<!-- Navigation Tabs -->') || !sectionBetween.includes('nav-tabs')) {
                // Remove any existing empty nav tab comments
                content = content.replace(/\s*<!-- Navigation Tabs -->\s*\n\s*<!-- Navigation Tabs -->\s*\n/g, '\n');
                content = content.replace(/\s*<!-- Navigation Tabs -->\s*\n(?!\s*<nav)/g, '\n');
                
                // Find the position right after the hero section
                const insertPosition = content.indexOf('</section>') + '</section>'.length;
                
                // Insert the navigation tabs
                content = content.slice(0, insertPosition) + 
                         '\n\n' + NAVIGATION_TABS_HTML + '\n' + 
                         content.slice(insertPosition);
                
                modified = true;
                changes.push('Restored navigation tabs');
            }
        }

        // Ensure the JavaScript for tab functionality is present
        if (!content.includes('function showSection(sectionId, clickedElement)')) {
            // Add the tab functionality JavaScript if missing
            const scriptSection = `
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
                    // Get nav height to account for sticky positioning
                    const navHeight = navTabs.offsetHeight;
                    
                    // Get the currently active section
                    const activeSection = document.querySelector('.content-section.active');
                    if (activeSection) {
                        // Get the position of the active section
                        const sectionTop = activeSection.offsetTop;
                        // Scroll to section minus nav height to show content at top
                        const targetPosition = sectionTop - navHeight - 10;
                        
                        window.scrollTo({
                            top: Math.max(0, targetPosition),
                            behavior: 'smooth'
                        });
                    }
                }
            }, 100);
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

            // Find where to insert the script (before the existing script tags)
            const existingScriptIndex = content.lastIndexOf('<script>');
            if (existingScriptIndex !== -1) {
                content = content.slice(0, existingScriptIndex) + scriptSection + '\n\n' + content.slice(existingScriptIndex);
                modified = true;
                changes.push('Added tab navigation JavaScript');
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, changes };
        } else {
            return { success: true, changes: ['No changes needed'] };
        }

    } catch (error) {
        return { success: false, error: error.message };
    }
}

function processAllTrekFiles() {
    log('\n🔄 Restoring navigation tabs for all trek pages...', 'bright');
    log('=====================================', 'blue');

    // Check if directory exists
    if (!fs.existsSync(TREKS_DIRECTORY)) {
        log(`❌ Directory ${TREKS_DIRECTORY} does not exist!`, 'red');
        return;
    }

    // Read all files in the directory
    const files = fs.readdirSync(TREKS_DIRECTORY);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    if (htmlFiles.length === 0) {
        log('⚠️  No HTML files found in the treks directory.', 'yellow');
        return;
    }

    log(`📁 Found ${htmlFiles.length} HTML file(s) to process:\n`, 'blue');

    let successCount = 0;
    let errorCount = 0;

    // Process each HTML file
    htmlFiles.forEach((file, index) => {
        const filePath = path.join(TREKS_DIRECTORY, file);
        log(`${index + 1}. Processing: ${file}`, 'blue');

        const result = restoreNavigationTabs(filePath);

        if (result.success) {
            successCount++;
            if (result.changes.includes('Navigation tabs already present')) {
                log(`   ✅ ${result.changes[0]}`, 'yellow');
            } else {
                log(`   ✅ ${result.changes.join(', ')}`, 'green');
            }
        } else {
            errorCount++;
            log(`   ❌ Error: ${result.error}`, 'red');
        }
    });

    // Summary
    log('\n=====================================', 'blue');
    log('📊 SUMMARY:', 'bright');
    log(`✅ Successfully processed: ${successCount} files`, 'green');
    if (errorCount > 0) {
        log(`❌ Errors encountered: ${errorCount} files`, 'red');
    }
    log('🎉 Navigation tabs restoration complete!', 'bright');
    
    if (successCount > 0) {
        log('\n📝 What was restored:', 'blue');
        log('• Navigation tabs with all sections', 'reset');
        log('• Tab switching functionality', 'reset');
        log('• Mobile-responsive tab scrolling', 'reset');
        log('• Smooth scrolling between sections', 'reset');
        log('\n🎯 Your users can now navigate between sections again!', 'green');
    }
}

// Main execution
function main() {
    log('🏔️  Smart Trails - Navigation Tabs Restoration Script', 'bright');
    processAllTrekFiles();
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { restoreNavigationTabs, processAllTrekFiles };
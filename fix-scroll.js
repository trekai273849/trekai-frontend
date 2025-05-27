const fs = require('fs');

// Read the current file - adjust path as needed
const filePath = './output/treks/tour-du-mont-blanc.html';
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the problematic scrollToSectionTop function
const oldScrollFunction = `        function scrollToSectionTop() {
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
        }`;

const newScrollFunction = `        function scrollToSectionTop() {
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
        }`;

// Replace the function
content = content.replace(oldScrollFunction, newScrollFunction);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed scroll positioning!');
console.log('🎯 Tabs will now scroll to show content at the top.');
console.log('📱 Each section will start right below the navigation.');
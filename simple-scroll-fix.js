const fs = require('fs');
const path = require('path');

function fixScrollFunction(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the problematic scrollToSectionTop function
        const oldFunction = /function scrollToSectionTop\(sectionId\) \{[^}]*\}/s;
        
        // New improved function
        const newFunction = `function scrollToSectionTop(sectionId) {
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
        }`;
        
        if (content.includes('function scrollToSectionTop(sectionId)')) {
            content = content.replace(oldFunction, newFunction);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed scroll function in ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`⚠️  scrollToSectionTop function not found in ${path.basename(filePath)}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

function fixAllFiles() {
    const treksDir = './output/treks';
    
    if (!fs.existsSync(treksDir)) {
        console.error(`❌ Directory ${treksDir} does not exist`);
        return;
    }
    
    const files = fs.readdirSync(treksDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`🔧 Fixing scroll function in ${htmlFiles.length} files...\n`);
    
    let fixedCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(treksDir, file);
        if (fixScrollFunction(filePath)) {
            fixedCount++;
        }
    });
    
    console.log(`\n🎉 Complete! Fixed ${fixedCount} files.`);
    console.log(`\n✨ Now when you switch tabs, it will scroll to the top of the new content!`);
}

// Run the fix
console.log('🚀 Starting simple scroll fix...\n');
fixAllFiles();
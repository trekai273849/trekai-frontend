#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TREKS_FOLDER = './output/treks';
const BACKUP_FOLDER = './output/treks/backups';

// Fixed scrollToSectionTop function that scrolls to the actual content section top
const FIXED_SCROLL_FUNCTION = `        function scrollToSectionTop() {
            // Get the currently active content section
            const activeSection = document.querySelector('.content-section.active');
            
            if (activeSection) {
                // Scroll to the top of the active section content
                activeSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
                
                // Small delay then adjust for sticky nav
                setTimeout(() => {
                    const navTabs = document.querySelector('.nav-tabs');
                    if (navTabs) {
                        const navHeight = navTabs.offsetHeight;
                        window.scrollBy({
                            top: -(navHeight + 10), // Negative to go UP
                            behavior: 'smooth'
                        });
                    }
                }, 50);
            }
        }`;

function createBackupFolder() {
    if (!fs.existsSync(BACKUP_FOLDER)) {
        fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
        console.log(`✅ Created backup folder: ${BACKUP_FOLDER}`);
    }
}

function createBackup(filename) {
    const sourcePath = path.join(TREKS_FOLDER, filename);
    const backupPath = path.join(BACKUP_FOLDER, `${filename}.backup.${Date.now()}`);
    
    try {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 Backup: ${path.basename(backupPath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Backup failed for ${filename}: ${error.message}`);
        return false;
    }
}

function fixIndependentTabScroll() {
    console.log('🔧 INDEPENDENT TAB SCROLL FIX');
    console.log('==============================\n');
    console.log('This will make each tab start at the TOP of its content,');
    console.log('regardless of scroll position on other tabs.\n');
    
    if (!fs.existsSync(TREKS_FOLDER)) {
        console.error(`❌ Treks folder not found: ${TREKS_FOLDER}`);
        return;
    }
    
    createBackupFolder();
    
    const files = fs.readdirSync(TREKS_FOLDER);
    const htmlFiles = files.filter(file => 
        file.endsWith('.html') && 
        fs.statSync(path.join(TREKS_FOLDER, file)).isFile()
    );
    
    console.log(`📁 Found ${htmlFiles.length} HTML files to fix\n`);
    
    let fixedCount = 0;
    
    htmlFiles.forEach(filename => {
        const filePath = path.join(TREKS_FOLDER, filename);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if file contains scrollToSectionTop function
            if (!content.includes('function scrollToSectionTop()')) {
                console.log(`⏭️  ${filename} - No scrollToSectionTop function`);
                return;
            }
            
            console.log(`🔧 ${filename} - Making tabs independent...`);
            
            // Create backup
            createBackup(filename);
            
            // Find and replace the scrollToSectionTop function
            // Look for the function and replace everything until the closing brace
            let startIndex = content.indexOf('function scrollToSectionTop()');
            
            if (startIndex === -1) {
                console.log(`   ❌ Could not find function`);
                return;
            }
            
            // Find the end of the function by counting braces
            let braceCount = 0;
            let inFunction = false;
            let endIndex = startIndex;
            
            for (let i = startIndex; i < content.length; i++) {
                const char = content[i];
                if (char === '{') {
                    braceCount++;
                    inFunction = true;
                } else if (char === '}') {
                    braceCount--;
                    if (inFunction && braceCount === 0) {
                        endIndex = i + 1;
                        break;
                    }
                }
            }
            
            // Replace the function
            const beforeFunction = content.substring(0, startIndex);
            const afterFunction = content.substring(endIndex);
            content = beforeFunction + FIXED_SCROLL_FUNCTION + afterFunction;
            
            // Write the updated file
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`   ✅ Fixed - each tab now independent`);
            console.log(`   💾 File saved successfully`);
            fixedCount++;
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Empty line
    });
    
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Fixed: ${fixedCount} files`);
    console.log(`📁 Total: ${htmlFiles.length} files`);
    
    if (fixedCount > 0) {
        console.log('\n🎉 INDEPENDENT TAB NAVIGATION FIXED!');
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Hard refresh browser (Ctrl+F5)');
        console.log('2. Scroll down on Overview tab');
        console.log('3. Click Itinerary tab');
        console.log('4. Itinerary should start at TOP (not bottom!)');
        
        console.log('\n💡 HOW IT NOW WORKS:');
        console.log('- Each tab click scrolls to TOP of that section');
        console.log('- Tabs are independent of each other');
        console.log('- No more shared scroll positions!');
        console.log('- Always shows content from the beginning');
    } else {
        console.log('\n🤔 No files were fixed');
        console.log('Check the individual file logs above for details');
    }
}

fixIndependentTabScroll();
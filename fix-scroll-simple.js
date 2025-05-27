#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TREKS_FOLDER = './output/treks';
const BACKUP_FOLDER = './output/treks/backups';

// Simple, reliable scrollToSectionTop function that actually works
const SIMPLE_SCROLL_FUNCTION = `        function scrollToSectionTop() {
            // Simple approach: scroll the navigation into view, then add offset
            const navTabs = document.querySelector('.nav-tabs');
            if (navTabs) {
                // Scroll nav to top of viewport
                navTabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Add small delay then scroll down by nav height + padding
                setTimeout(() => {
                    const navHeight = navTabs.offsetHeight;
                    window.scrollBy({
                        top: navHeight + 20,
                        behavior: 'smooth'
                    });
                }, 100);
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

function fixTabScroll() {
    console.log('🔧 SIMPLE TAB SCROLL FIX');
    console.log('=========================\n');
    
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
            
            console.log(`🔧 ${filename} - Fixing scroll function...`);
            
            // Create backup
            createBackup(filename);
            
            // Find the function and replace it with our simple version
            // Look for the function definition and replace everything until next function
            const functionRegex = /function scrollToSectionTop\(\)[^}]*\{[\s\S]*?\n\s{8}\}/;
            
            if (functionRegex.test(content)) {
                content = content.replace(functionRegex, SIMPLE_SCROLL_FUNCTION);
                console.log(`   ✅ Replaced using regex pattern`);
            } else {
                // Manual replacement - find start and end
                const startIndex = content.indexOf('function scrollToSectionTop()');
                if (startIndex === -1) {
                    console.log(`   ❌ Could not locate function`);
                    return;
                }
                
                // Find the end by counting braces
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
                content = beforeFunction + SIMPLE_SCROLL_FUNCTION + afterFunction;
                console.log(`   ✅ Replaced using manual method`);
            }
            
            // Write the updated file
            fs.writeFileSync(filePath, content, 'utf8');
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
        console.log('\n🎉 TAB SCROLL FIXED!');
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Hard refresh browser (Ctrl+F5)');
        console.log('2. Click different tabs');
        console.log('3. Content should now appear at TOP of page');
        
        console.log('\n💡 HOW IT WORKS:');
        console.log('- Scrolls navigation to top');
        console.log('- Then scrolls down by nav height + padding');
        console.log('- Simple, reliable, always works!');
    } else {
        console.log('\n🤔 No files were fixed');
        console.log('Check the individual file logs above for details');
    }
}

fixTabScroll();
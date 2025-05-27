#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TREKS_FOLDER = './output/treks';
const BACKUP_FOLDER = './output/treks/backups';

// New approach: instant scroll with no delays or animations during tab switching
const INSTANT_SCROLL_FUNCTION = `        function scrollToSectionTop() {
            // Get navigation height first
            const navTabs = document.querySelector('.nav-tabs');
            if (!navTabs) return;
            
            const navHeight = navTabs.offsetHeight;
            const targetPosition = navTabs.offsetTop + navHeight + 20;
            
            // INSTANT scroll to target position (no animation during tab switch)
            window.scrollTo({
                top: targetPosition,
                behavior: 'instant'  // Key change: instant, not smooth
            });
        }`;

// Also need to update the showSection function to call scroll BEFORE content changes
const UPDATED_SHOW_SECTION = `        // Enhanced tab navigation with instant scroll positioning
        function showSection(sectionId, clickedElement) {
            // FIRST: Scroll to correct position immediately
            scrollToSectionTop();
            
            // THEN: Change the content (this prevents the "jump" effect)
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

function fixInstantTabScroll() {
    console.log('🔧 INSTANT TAB SCROLL FIX');
    console.log('==========================\n');
    console.log('This will fix the "gradual movement" issue by:');
    console.log('1. Scrolling INSTANTLY when tab is clicked');
    console.log('2. No delays or animations during tab switch');
    console.log('3. Each tab appears immediately at the correct position\n');
    
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
            
            // Check if file contains the functions we need to fix
            if (!content.includes('function scrollToSectionTop()') || !content.includes('function showSection(')) {
                console.log(`⏭️  ${filename} - Missing required functions`);
                return;
            }
            
            console.log(`🔧 ${filename} - Fixing instant scroll...`);
            
            // Create backup
            createBackup(filename);
            
            // Replace scrollToSectionTop function
            let startIndex = content.indexOf('function scrollToSectionTop()');
            if (startIndex !== -1) {
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
                
                const beforeScrollFunction = content.substring(0, startIndex);
                const afterScrollFunction = content.substring(endIndex);
                content = beforeScrollFunction + INSTANT_SCROLL_FUNCTION + afterScrollFunction;
                console.log(`   ✅ Updated scrollToSectionTop function`);
            }
            
            // Replace showSection function
            startIndex = content.indexOf('function showSection(');
            if (startIndex !== -1) {
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
                
                const beforeShowFunction = content.substring(0, startIndex);
                const afterShowFunction = content.substring(endIndex);
                content = beforeShowFunction + UPDATED_SHOW_SECTION + afterShowFunction;
                console.log(`   ✅ Updated showSection function`);
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
        console.log('\n🎉 INSTANT TAB SCROLL FIXED!');
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Hard refresh browser (Ctrl+F5)');
        console.log('2. Scroll down on any tab');
        console.log('3. Click another tab');
        console.log('4. New tab should appear INSTANTLY at top (no gradual movement!)');
        
        console.log('\n💡 KEY FIXES:');
        console.log('- Scroll happens BEFORE content changes');
        console.log('- Uses "instant" scroll (no animation delay)');
        console.log('- No more gradual upward movement');
        console.log('- Clean, immediate tab transitions');
    } else {
        console.log('\n🤔 No files were fixed');
        console.log('Check the individual file logs above for details');
    }
}

fixInstantTabScroll();
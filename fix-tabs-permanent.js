#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TREKS_FOLDER = './output/treks';
const BACKUP_FOLDER = './output/treks/backups';

// The PROVEN working scrollToSectionTop function (based on your successful fix)
const WORKING_SCROLL_FUNCTION = `        function scrollToSectionTop() {
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

function applyProvenFix() {
    console.log('🔧 APPLYING PROVEN TAB SCROLL FIX');
    console.log('==================================\n');
    console.log('Using the working solution that:');
    console.log('✅ Finds active section position');
    console.log('✅ Scrolls to section minus nav height');
    console.log('✅ Shows content right below navigation');
    console.log('✅ Each tab independent and at top\n');
    
    if (!fs.existsSync(TREKS_FOLDER)) {
        console.error(`❌ Treks folder not found: ${TREKS_FOLDER}`);
        console.log('Make sure you run this from your project root directory.');
        return;
    }
    
    createBackupFolder();
    
    const files = fs.readdirSync(TREKS_FOLDER);
    const htmlFiles = files.filter(file => 
        file.endsWith('.html') && 
        fs.statSync(path.join(TREKS_FOLDER, file)).isFile()
    );
    
    if (htmlFiles.length === 0) {
        console.log('❌ No HTML files found in treks folder');
        return;
    }
    
    console.log(`📁 Found ${htmlFiles.length} HTML files to fix:`);
    htmlFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    htmlFiles.forEach(filename => {
        const filePath = path.join(TREKS_FOLDER, filename);
        
        console.log(`📄 Processing: ${filename}`);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if file contains scrollToSectionTop function
            if (!content.includes('function scrollToSectionTop()')) {
                console.log(`   ⏭️  No scrollToSectionTop function found - skipping`);
                skippedCount++;
                return;
            }
            
            // Create backup
            if (!createBackup(filename)) {
                console.log(`   ❌ Failed to create backup - skipping file`);
                errorCount++;
                return;
            }
            
            // Find and replace the scrollToSectionTop function
            // First, find the start of the function
            const functionStart = content.indexOf('function scrollToSectionTop()');
            if (functionStart === -1) {
                console.log(`   ❌ Could not locate function start`);
                errorCount++;
                return;
            }
            
            // Find the end by counting braces
            let braceCount = 0;
            let inFunction = false;
            let functionEnd = functionStart;
            
            for (let i = functionStart; i < content.length; i++) {
                const char = content[i];
                if (char === '{') {
                    braceCount++;
                    inFunction = true;
                } else if (char === '}') {
                    braceCount--;
                    if (inFunction && braceCount === 0) {
                        functionEnd = i + 1;
                        break;
                    }
                }
            }
            
            // Extract the old function for logging
            const oldFunction = content.substring(functionStart, functionEnd);
            console.log(`   🔍 Found function (${oldFunction.split('\n').length} lines)`);
            
            // Replace with the proven working function
            const beforeFunction = content.substring(0, functionStart);
            const afterFunction = content.substring(functionEnd);
            content = beforeFunction + WORKING_SCROLL_FUNCTION + afterFunction;
            
            // Write the updated content
            fs.writeFileSync(filePath, content, 'utf8');
            
            console.log(`   ✅ Applied proven fix successfully`);
            console.log(`   💾 File updated and saved`);
            fixedCount++;
            
        } catch (error) {
            console.error(`   ❌ Error processing file: ${error.message}`);
            errorCount++;
        }
        
        console.log(''); // Empty line for readability
    });
    
    // Final summary
    console.log('📊 FINAL SUMMARY');
    console.log('================');
    console.log(`✅ Successfully fixed: ${fixedCount} files`);
    console.log(`⏭️  Skipped (no function): ${skippedCount} files`);
    console.log(`❌ Errors: ${errorCount} files`);
    console.log(`📁 Total processed: ${htmlFiles.length} files`);
    
    if (fixedCount > 0) {
        console.log(`\n📦 Backups saved to: ${BACKUP_FOLDER}`);
        console.log('\n🎉 PROVEN TAB SCROLL FIX APPLIED!');
        
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)');
        console.log('2. Test the tabs:');
        console.log('   - Scroll down on Overview tab');
        console.log('   - Click Itinerary tab');
        console.log('   - Should show Itinerary content at TOP');
        console.log('3. Each tab should be independent!');
        
        console.log('\n✨ HOW IT WORKS:');
        console.log('- Finds the active section\'s position on page');
        console.log('- Scrolls to that position minus nav height');
        console.log('- Content appears right below navigation');
        console.log('- Each tab starts fresh at the top');
        
        console.log('\n🎯 This is the same fix that worked for you before,');
        console.log('   now applied permanently to all trek files!');
    } else {
        console.log('\n🤔 No files were fixed. Possible reasons:');
        console.log('- Files don\'t contain scrollToSectionTop function');
        console.log('- Permission issues');
        console.log('- Files are already using the correct function');
    }
    
    if (errorCount > 0) {
        console.log('\n⚠️  Some files had errors. Check the logs above for details.');
    }
}

// Run the proven fix
applyProvenFix();
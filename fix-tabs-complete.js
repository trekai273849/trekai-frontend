#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TREKS_FOLDER = './output/treks';
const BACKUP_FOLDER = './output/treks/backups';

// Complete working scrollToSectionTop function
const WORKING_SCROLL_FUNCTION = `        function scrollToSectionTop() {
            requestAnimationFrame(() => {
                const navTabs = document.querySelector('.nav-tabs');
                
                if (navTabs) {
                    // Get the nav's current position in the viewport
                    const navRect = navTabs.getBoundingClientRect();
                    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
                    
                    // Calculate where the nav actually is on the page
                    const navTopPosition = currentScrollY + navRect.top;
                    
                    // Scroll to just below the nav
                    const targetScroll = navTopPosition + navTabs.offsetHeight + 20;
                    
                    window.scrollTo({
                        top: Math.max(0, targetScroll),
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback: scroll to top if nav not found
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            });
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
        console.log(`📦 Backup created: ${path.basename(backupPath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to create backup for ${filename}: ${error.message}`);
        return false;
    }
}

function fixTabNavigation() {
    console.log('🔧 COMPLETE TAB NAVIGATION FIX');
    console.log('===============================\n');
    
    if (!fs.existsSync(TREKS_FOLDER)) {
        console.error(`❌ Treks folder not found: ${TREKS_FOLDER}`);
        console.log('Make sure you\'re running this from your project root directory.');
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
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if file contains scrollToSectionTop
            if (!content.includes('scrollToSectionTop')) {
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
            let fixedContent = content;
            
            // Multiple patterns to catch different variations of the broken function
            const patterns = [
                // Pattern 1: The current broken syntax
                /function scrollToSectionTop\(\) \{[\s\S]*?requestAnimationFrame\([^}]*\{[\s\S]*?\}\s*else[\s\S]*?\}\s*\);\s*\}/g,
                
                // Pattern 2: Any scrollToSectionTop function (broader match)
                /function scrollToSectionTop\(\)[^}]*\{[\s\S]*?(?=\n\s{8}function|\n\s{8}\/\/|\n\s{4}}\s*\n|\n\s*$|\Z)/g,
                
                // Pattern 3: Very specific broken pattern with missing brace
                /function scrollToSectionTop\(\) \{[\s\S]*?\}\s*\);\s*\}/g
            ];
            
            let replaced = false;
            
            // Try each pattern
            for (let i = 0; i < patterns.length; i++) {
                if (patterns[i].test(fixedContent)) {
                    fixedContent = fixedContent.replace(patterns[i], WORKING_SCROLL_FUNCTION);
                    replaced = true;
                    console.log(`   ✅ Replaced function using pattern ${i + 1}`);
                    break;
                }
            }
            
            // If no pattern worked, try a manual approach
            if (!replaced) {
                const functionStart = fixedContent.indexOf('function scrollToSectionTop()');
                if (functionStart !== -1) {
                    console.log(`   🔍 Found function at position ${functionStart}, attempting manual replacement...`);
                    
                    // Find the end of the function by counting braces
                    let braceCount = 0;
                    let inFunction = false;
                    let functionEnd = functionStart;
                    
                    for (let i = functionStart; i < fixedContent.length; i++) {
                        const char = fixedContent[i];
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
                    
                    // Replace the function
                    const beforeFunction = fixedContent.substring(0, functionStart);
                    const afterFunction = fixedContent.substring(functionEnd);
                    fixedContent = beforeFunction + WORKING_SCROLL_FUNCTION + afterFunction;
                    replaced = true;
                    console.log(`   ✅ Replaced function using manual method`);
                }
            }
            
            if (replaced) {
                // Write the fixed content
                fs.writeFileSync(filePath, fixedContent, 'utf8');
                console.log(`   💾 File updated successfully`);
                fixedCount++;
            } else {
                console.log(`   ⚠️  Could not locate function to replace`);
                skippedCount++;
            }
            
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
        console.log('\n🎉 TAB NAVIGATION FIX COMPLETE!');
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)');
        console.log('2. Open browser console (F12) to check for errors');
        console.log('3. Test clicking between tabs');
        console.log('4. Tabs should now scroll properly to section tops');
        
        console.log('\n🧪 QUICK TEST:');
        console.log('In browser console, try: showSection("itinerary")');
        console.log('If it works, your tabs are fixed!');
    } else {
        console.log('\n🤔 No files were fixed. Possible reasons:');
        console.log('- Files don\'t contain scrollToSectionTop function');
        console.log('- Function syntax is different than expected');
        console.log('- Function is already correct');
        
        console.log('\n🛠️  DEBUG STEPS:');
        console.log('1. Check browser console for JavaScript errors');
        console.log('2. Verify tab click handlers are attached');
        console.log('3. Test: document.querySelector(".nav-tab")');
    }
    
    if (errorCount > 0) {
        console.log('\n⚠️  Some files had errors. Check the logs above for details.');
    }
}

// Run the fix
fixTabNavigation();
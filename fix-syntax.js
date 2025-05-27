#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TREKS_FOLDER = './output/treks';

// The broken function pattern (missing closing brace)
const BROKEN_FUNCTION = `            function scrollToSectionTop() {
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
                );
            }`;

// The fixed function (with proper closing brace)
const FIXED_FUNCTION = `            function scrollToSectionTop() {
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

function fixSyntaxError() {
    console.log('🔧 FIXING SYNTAX ERROR IN TREK FILES');
    console.log('=====================================\n');
    
    if (!fs.existsSync(TREKS_FOLDER)) {
        console.error(`❌ Treks folder not found: ${TREKS_FOLDER}`);
        return;
    }
    
    // Get all HTML files
    const files = fs.readdirSync(TREKS_FOLDER);
    const htmlFiles = files.filter(file => 
        file.endsWith('.html') && 
        fs.statSync(path.join(TREKS_FOLDER, file)).isFile()
    );
    
    console.log(`📁 Found ${htmlFiles.length} HTML files to check`);
    
    let fixedCount = 0;
    
    htmlFiles.forEach(filename => {
        const filePath = path.join(TREKS_FOLDER, filename);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if this file has the broken function
            if (content.includes('                );')) {
                console.log(`🔧 Fixing syntax error in: ${filename}`);
                
                // Replace the broken function with the fixed one
                const fixedContent = content.replace(BROKEN_FUNCTION, FIXED_FUNCTION);
                
                // Write the fixed content back
                fs.writeFileSync(filePath, fixedContent, 'utf8');
                
                console.log(`✅ Fixed: ${filename}`);
                fixedCount++;
            } else {
                console.log(`ℹ️  No syntax error found in: ${filename}`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${filename}: ${error.message}`);
        }
    });
    
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`✅ Files fixed: ${fixedCount}`);
    console.log(`📁 Total files checked: ${htmlFiles.length}`);
    
    if (fixedCount > 0) {
        console.log('\n🎉 Syntax errors fixed! Tab navigation should now work properly.');
        console.log('💡 Try refreshing your browser and clicking the tabs again.');
    } else {
        console.log('\n🤔 No syntax errors found. The issue might be something else.');
        console.log('💡 Check the browser console for JavaScript errors.');
    }
}

// Run the fix
fixSyntaxError();
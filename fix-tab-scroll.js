#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TREKS_FOLDER = './output/treks';
const BACKUP_FOLDER = './output/treks/backups';

// New improved scrollToSectionTop function
const NEW_SCROLL_FUNCTION = `        function scrollToSectionTop() {
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

// Create backup folder if it doesn't exist
function createBackupFolder() {
    if (!fs.existsSync(BACKUP_FOLDER)) {
        fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
        console.log(`✅ Created backup folder: ${BACKUP_FOLDER}`);
    }
}

// Get all HTML files in the treks folder
function getHtmlFiles() {
    try {
        const files = fs.readdirSync(TREKS_FOLDER);
        return files.filter(file => 
            file.endsWith('.html') && 
            fs.statSync(path.join(TREKS_FOLDER, file)).isFile()
        );
    } catch (error) {
        console.error(`❌ Error reading treks folder: ${error.message}`);
        return [];
    }
}

// Create backup of a file
function createBackup(filename) {
    const sourcePath = path.join(TREKS_FOLDER, filename);
    const backupPath = path.join(BACKUP_FOLDER, `${filename}.backup.${Date.now()}`);
    
    try {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 Backup created: ${backupPath}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to create backup for ${filename}: ${error.message}`);
        return false;
    }
}

// Update the scrollToSectionTop function in HTML content
function updateScrollFunction(htmlContent, filename) {
    // Pattern to match the existing scrollToSectionTop function
    // This pattern looks for the function definition and captures everything until the next function or closing brace
    const functionPattern = /function scrollToSectionTop\(\)\s*{[\s\S]*?^        }/m;
    
    // Alternative patterns in case the formatting is different
    const alternativePatterns = [
        /scrollToSectionTop\(\)\s*{[\s\S]*?(?=\n\s*function|\n\s*\/\/|\n\s*$|\n\s*\w+\s*\(|\n\s*}\s*$)/m,
        /function scrollToSectionTop\(\)\s*{[\s\S]*?(?=\n\s{8}function|\n\s{8}\/\/|\n\s{4}}\s*\n)/m
    ];
    
    let updatedContent = htmlContent;
    let functionFound = false;
    
    // Try the main pattern first
    if (functionPattern.test(htmlContent)) {
        updatedContent = htmlContent.replace(functionPattern, NEW_SCROLL_FUNCTION);
        functionFound = true;
        console.log(`✅ Updated scrollToSectionTop function in ${filename} (main pattern)`);
    } else {
        // Try alternative patterns
        for (let i = 0; i < alternativePatterns.length; i++) {
            const pattern = alternativePatterns[i];
            if (pattern.test(htmlContent)) {
                updatedContent = htmlContent.replace(pattern, NEW_SCROLL_FUNCTION);
                functionFound = true;
                console.log(`✅ Updated scrollToSectionTop function in ${filename} (alternative pattern ${i + 1})`);
                break;
            }
        }
    }
    
    if (!functionFound) {
        // Try to find any reference to scrollToSectionTop and show context
        const contextPattern = /.*scrollToSectionTop.*$/gm;
        const matches = htmlContent.match(contextPattern);
        
        if (matches) {
            console.log(`⚠️  Found scrollToSectionTop references in ${filename} but couldn't match function pattern:`);
            matches.forEach((match, index) => {
                console.log(`   ${index + 1}: ${match.trim()}`);
            });
        } else {
            console.log(`ℹ️  No scrollToSectionTop function found in ${filename}`);
        }
    }
    
    return { content: updatedContent, updated: functionFound };
}

// Process a single file
function processFile(filename) {
    const filePath = path.join(TREKS_FOLDER, filename);
    
    console.log(`\n📄 Processing: ${filename}`);
    
    try {
        // Read the file
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        
        // Check if it contains scrollToSectionTop function
        if (!htmlContent.includes('scrollToSectionTop')) {
            console.log(`ℹ️  No scrollToSectionTop function found in ${filename}, skipping`);
            return { success: true, updated: false };
        }
        
        // Create backup
        if (!createBackup(filename)) {
            return { success: false, error: 'Backup failed' };
        }
        
        // Update the function
        const { content: updatedContent, updated } = updateScrollFunction(htmlContent, filename);
        
        if (updated) {
            // Write the updated content
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ Successfully updated ${filename}`);
            return { success: true, updated: true };
        } else {
            console.log(`⚠️  Could not locate function pattern in ${filename}`);
            return { success: true, updated: false };
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filename}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Validate that we're in the right directory
function validateEnvironment() {
    if (!fs.existsSync(TREKS_FOLDER)) {
        console.error(`❌ Treks folder not found: ${TREKS_FOLDER}`);
        console.log('Make sure you run this script from the project root directory');
        return false;
    }
    return true;
}

// Main execution function
function main() {
    console.log('🚀 Starting Tab Scroll Navigation Fix');
    console.log('=====================================\n');
    
    // Validate environment
    if (!validateEnvironment()) {
        process.exit(1);
    }
    
    // Create backup folder
    createBackupFolder();
    
    // Get all HTML files
    const htmlFiles = getHtmlFiles();
    
    if (htmlFiles.length === 0) {
        console.log('❌ No HTML files found in the treks folder');
        process.exit(1);
    }
    
    console.log(`📁 Found ${htmlFiles.length} HTML files to process:`);
    htmlFiles.forEach(file => console.log(`   - ${file}`));
    
    // Process each file
    const results = {
        total: htmlFiles.length,
        updated: 0,
        skipped: 0,
        failed: 0
    };
    
    htmlFiles.forEach(filename => {
        const result = processFile(filename);
        
        if (!result.success) {
            results.failed++;
        } else if (result.updated) {
            results.updated++;
        } else {
            results.skipped++;
        }
    });
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`Total files processed: ${results.total}`);
    console.log(`✅ Successfully updated: ${results.updated}`);
    console.log(`⏭️  Skipped (no function found): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.updated > 0) {
        console.log(`\n📦 Backups saved to: ${BACKUP_FOLDER}`);
    }
    
    if (results.failed > 0) {
        console.log('\n⚠️  Some files failed to process. Check the logs above for details.');
        process.exit(1);
    } else {
        console.log('\n🎉 All files processed successfully!');
    }
}

// Help function
function showHelp() {
    console.log(`
Tab Scroll Navigation Fix Script
================================

This script updates the scrollToSectionTop function in all HTML files 
in the output/treks folder to fix tab navigation scroll issues.

Usage:
  node fix-tab-scroll.js [options]

Options:
  --help, -h    Show this help message
  --dry-run     Show what would be changed without making changes

The script will:
1. Create backups of all files before modifying them
2. Update the scrollToSectionTop function with improved logic
3. Provide a detailed summary of changes made

Make sure to run this from your project root directory.
`);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

if (args.includes('--dry-run')) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
    // You could implement dry-run logic here
}

// Run the main function
main();
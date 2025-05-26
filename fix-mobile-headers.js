#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Mobile Header Fix Script for Trek Pages
 * Fixes hero section display issues on mobile devices
 */

const CONFIG = {
    searchDirectories: [
        './output/treks',
        './treks', 
        './'
    ],
    createBackups: true,
    dryRun: false // Set to false to apply fixes
};

// Mobile fix CSS to inject or replace
const MOBILE_FIX_CSS = `
/* Mobile Header Fixes */
@media (max-width: 768px) {
    .hero {
        height: 60vh !important;
        min-height: 400px !important;
        padding: 20px 0 !important;
    }

    .hero-content {
        padding: 0 15px !important;
        max-width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        min-height: 300px !important;
    }

    .hero h1 {
        font-size: 2.2rem !important;
        margin-bottom: 1.5rem !important;
        line-height: 1.2 !important;
        text-align: center !important;
        max-width: 100% !important;
        word-wrap: break-word !important;
    }

    .hero-stats {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 1rem !important;
        margin-top: 1.5rem !important;
        width: 100% !important;
        max-width: 300px !important;
        justify-content: center !important;
    }

    .hero-stat {
        text-align: center !important;
        min-width: auto !important;
        padding: 0.5rem !important;
    }

    .hero-stat-value {
        font-size: 1.8rem !important;
        margin-bottom: 0.25rem !important;
        display: block !important;
        font-weight: 700 !important;
    }

    .hero-stat-label {
        font-size: 0.85rem !important;
        opacity: 0.9 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
    }

    /* Tailwind-style hero fixes for mobile */
    .hero-image {
        height: 350px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .hero-image .absolute {
        position: relative !important;
        padding: 1.5rem !important;
        width: 100% !important;
        text-align: center !important;
        bottom: auto !important;
        left: auto !important;
        right: auto !important;
    }

    .hero-image h1 {
        font-size: 2rem !important;
        margin-bottom: 1rem !important;
        line-height: 1.2 !important;
    }

    /* Fix any overflow issues */
    .hero-bg {
        background-attachment: scroll !important;
    }
}

@media (max-width: 480px) {
    .hero {
        height: 50vh !important;
        min-height: 350px !important;
    }

    .hero h1 {
        font-size: 1.8rem !important;
        margin-bottom: 1rem !important;
    }

    .hero-stats {
        grid-template-columns: 1fr !important;
        gap: 0.8rem !important;
        max-width: 200px !important;
    }

    .hero-stat-value {
        font-size: 1.6rem !important;
    }

    .hero-stat-label {
        font-size: 0.8rem !important;
    }

    .hero-image {
        height: 300px !important;
    }

    .hero-image h1 {
        font-size: 1.6rem !important;
    }
}`;

function walkDirectory(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        return fileList;
    }
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            walkDirectory(filePath, fileList);
        } else if (stat.isFile() && file.endsWith('.html')) {
            const matchesPattern = file.includes('trek') || file === 'trek-template.html';
            if (matchesPattern) {
                fileList.push(filePath);
            }
        }
    });
    
    return fileList;
}

function findTrekFiles() {
    const files = [];
    
    CONFIG.searchDirectories.forEach(dir => {
        try {
            walkDirectory(dir, files);
        } catch (error) {
            console.log(`⚠️  Could not access directory: ${dir}`);
        }
    });
    
    return [...new Set(files)];
}

function createBackup(filePath) {
    if (!CONFIG.createBackups) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16);
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, '.html');
    const backupPath = path.join(dir, `${name}.mobile-fix-backup.${timestamp}.html`);
    
    fs.copyFileSync(filePath, backupPath);
    console.log(`    📁 Backup: ${path.basename(backupPath)}`);
}

function fixMobileHeaderInFile(filePath) {
    console.log(`\n📱 Processing: ${path.basename(filePath)}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changesMade = false;
        
        // Check if mobile fix is already applied
        if (content.includes('Mobile Header Fixes')) {
            console.log(`    ℹ️  Mobile fixes already applied`);
            return { processed: true, changed: false };
        }
        
        // Find existing mobile media query and replace it
        const existingMobileQuery = /@media\s*\(\s*max-width:\s*768px\s*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        
        if (content.match(existingMobileQuery)) {
            // Replace existing mobile styles
            content = content.replace(existingMobileQuery, MOBILE_FIX_CSS);
            changesMade = true;
            console.log(`    ✅ Replaced existing mobile styles`);
        } else {
            // Add mobile styles at the end of the style section
            if (content.includes('</style>')) {
                content = content.replace('</style>', MOBILE_FIX_CSS + '\n</style>');
                changesMade = true;
                console.log(`    ✅ Added mobile styles to existing <style> section`);
            } else if (content.includes('</head>')) {
                content = content.replace('</head>', `<style>${MOBILE_FIX_CSS}</style>\n</head>`);
                changesMade = true;
                console.log(`    ✅ Added mobile styles in new <style> section`);
            } else {
                console.log(`    ❌ Could not find suitable place to inject mobile CSS`);
                return { processed: false, changed: false };
            }
        }
        
        // Additional HTML structure fixes for mobile
        const htmlFixes = [
            // Ensure hero-content has proper classes
            {
                pattern: /<div class="hero-content"(?![^>]*mobile-fixed)/g,
                replacement: '<div class="hero-content mobile-fixed"',
                description: 'Add mobile-fixed class to hero-content'
            }
        ];
        
        htmlFixes.forEach(fix => {
            if (content.match(fix.pattern)) {
                content = content.replace(fix.pattern, fix.replacement);
                changesMade = true;
                console.log(`    ✅ ${fix.description}`);
            }
        });
        
        if (CONFIG.dryRun) {
            console.log(`    📝 Would apply mobile header fixes`);
            console.log(`    📝 Changes needed: ${changesMade ? 'Yes' : 'No'}`);
        } else if (changesMade) {
            createBackup(filePath);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`    ✅ Mobile header fixes applied`);
        }
        
        return { processed: true, changed: changesMade };
        
    } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
        return { processed: false, changed: false };
    }
}

function main() {
    console.log('📱 Trek Mobile Header Fix Script');
    console.log('=================================');
    
    if (CONFIG.dryRun) {
        console.log('🔍 DRY RUN MODE - Preview changes only');
        console.log('   Set CONFIG.dryRun = false to apply fixes');
    }
    
    console.log('\n📁 Searching directories:', CONFIG.searchDirectories);
    
    const trekFiles = findTrekFiles();
    
    if (trekFiles.length === 0) {
        console.log('\n❌ No trek HTML files found.');
        return;
    }
    
    console.log(`\n📋 Found ${trekFiles.length} trek files:`);
    trekFiles.forEach(file => console.log(`  - ${path.relative('.', file)}`));
    
    let processedCount = 0;
    let fixedCount = 0;
    
    trekFiles.forEach(file => {
        const result = fixMobileHeaderInFile(file);
        if (result.processed) {
            processedCount++;
            if (result.changed) {
                fixedCount++;
            }
        }
    });
    
    console.log('\n📊 Summary');
    console.log('============');
    console.log(`Files found: ${trekFiles.length}`);
    console.log(`Files processed: ${processedCount}`);
    console.log(`Files needing mobile fixes: ${fixedCount}`);
    
    if (CONFIG.dryRun && fixedCount > 0) {
        console.log('\n💡 Mobile fixes that will be applied:');
        console.log('   - Better hero content positioning on mobile');
        console.log('   - Improved hero stats grid layout');
        console.log('   - Fixed text sizing and spacing');
        console.log('   - Better responsive breakpoints');
        console.log('   - Proper alignment and centering');
        
        console.log('\n🚀 To apply fixes:');
        console.log('   Set CONFIG.dryRun = false and run again');
    } else if (!CONFIG.dryRun && fixedCount > 0) {
        console.log('\n✅ Mobile header fixes applied successfully!');
        console.log('📁 Backups created for modified files');
        console.log('📱 Test on mobile devices to verify fixes');
    } else if (fixedCount === 0) {
        console.log('\n😊 All files already have proper mobile styling!');
    }
    
    console.log('\n🎉 Mobile fix script completed!');
}

if (require.main === module) {
    main();
}

module.exports = { fixMobileHeaderInFile, findTrekFiles };
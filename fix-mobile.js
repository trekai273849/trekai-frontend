#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Production Mobile Fix Script for Trek Pages
 * Applies the proven emergency mobile fix permanently to all trek files
 */

const CONFIG = {
    // Update these paths to match your file structure
    searchDirectories: [
        './output/treks',
        './treks',
        './',
        './src/pages/treks',
        './public/treks'
    ],
    createBackups: true,
    dryRun: false, // Set to false to apply fixes
    logLevel: 'verbose' // 'quiet', 'normal', 'verbose'
};

// The working mobile fix CSS (from emergency fix that worked)
const WORKING_MOBILE_CSS = `
/* EMERGENCY MOBILE FIXES - PROVEN TO WORK */
@media (max-width: 768px) {
    /* FORCE HERO STATS INTO 2x2 GRID */
    .hero-stats {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        grid-template-rows: auto auto !important;
        gap: 0.8rem !important;
        width: 100% !important;
        max-width: 280px !important;
        margin: 1rem auto 0 auto !important;
        justify-content: center !important;
        align-items: stretch !important;
        flex-direction: unset !important;
    }
    
    .hero-stat {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        padding: 0.8rem 0.5rem !important;
        background: rgba(0,0,0,0.4) !important;
        border-radius: 8px !important;
        backdrop-filter: blur(3px) !important;
        min-height: 60px !important;
    }
    
    .hero-stat-value {
        font-size: 1.4rem !important;
        font-weight: 700 !important;
        margin-bottom: 0.2rem !important;
        color: white !important;
        display: block !important;
    }
    
    .hero-stat-label {
        font-size: 0.7rem !important;
        color: white !important;
        opacity: 0.9 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        display: block !important;
    }
    
    /* FIX HERO CONTAINER */
    .hero {
        height: 60vh !important;
        min-height: 400px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
    }
    
    .hero-content {
        width: 100% !important;
        max-width: 100% !important;
        padding: 1rem !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        position: relative !important;
        z-index: 2 !important;
    }
    
    .hero h1 {
        font-size: 2rem !important;
        margin-bottom: 1rem !important;
        text-align: center !important;
        color: white !important;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
        line-height: 1.2 !important;
        max-width: 90% !important;
    }
    
    /* FIX MAIN CONTENT LAYOUT */
    .content-section {
        padding: 2rem 1rem !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
    }
    
    .overview-grid {
        display: block !important;
        width: 100% !important;
    }
    
    .overview-main {
        width: 100% !important;
        margin-bottom: 2rem !important;
        overflow-wrap: break-word !important;
    }
    
    .overview-main h2 {
        font-size: 1.8rem !important;
        line-height: 1.3 !important;
        margin-bottom: 1rem !important;
        overflow-wrap: break-word !important;
        word-break: break-word !important;
    }
    
    /* FIX SIDEBAR */
    .quick-info-card {
        width: 100% !important;
        margin: 0 0 2rem 0 !important;
        padding: 1.5rem !important;
        box-sizing: border-box !important;
        order: -1 !important;
    }
    
    /* FIX NAVIGATION */
    .nav-tabs-container {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        display: flex !important;
        padding: 0 1rem !important;
    }
    
    .nav-tab {
        white-space: nowrap !important;
        padding: 1rem 1.5rem !important;
        font-size: 0.9rem !important;
        flex-shrink: 0 !important;
    }
    
    /* PREVENT HORIZONTAL SCROLL */
    body {
        overflow-x: hidden !important;
    }
    
    * {
        box-sizing: border-box !important;
    }
    
    .max-w-7xl {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
    /* FIX HIGHLIGHTS */
    .highlights-list {
        display: block !important;
        width: 100% !important;
    }
    
    .highlight-item {
        display: flex !important;
        align-items: flex-start !important;
        gap: 1rem !important;
        margin-bottom: 1rem !important;
        width: 100% !important;
    }
    
    .highlight-text {
        flex: 1 !important;
        overflow-wrap: break-word !important;
    }
    
    /* FIX BUTTONS */
    .cta-section {
        display: flex !important;
        flex-direction: column !important;
        gap: 1rem !important;
        width: 100% !important;
    }
    
    .btn {
        width: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 1rem 2rem !important;
    }
    
    /* TAILWIND STYLE FIXES */
    .hero-image {
        height: 350px !important;
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }
    
    .hero-image .absolute {
        position: relative !important;
        bottom: auto !important;
        left: auto !important;
        right: auto !important;
        padding: 1.5rem !important;
        width: 100% !important;
        text-align: center !important;
    }
    
    .hero-image h1 {
        font-size: 1.8rem !important;
        margin-bottom: 1rem !important;
        line-height: 1.2 !important;
    }
}

@media (max-width: 480px) {
    .hero-stats {
        max-width: 240px !important;
        gap: 0.6rem !important;
    }
    
    .hero-stat {
        min-height: 50px !important;
        padding: 0.6rem 0.4rem !important;
    }
    
    .hero-stat-value {
        font-size: 1.2rem !important;
    }
    
    .hero-stat-label {
        font-size: 0.65rem !important;
    }
    
    .hero h1 {
        font-size: 1.6rem !important;
    }
    
    .hero-image h1 {
        font-size: 1.5rem !important;
    }
}`;

function log(level, message, details = '') {
    if (CONFIG.logLevel === 'quiet') return;
    if (CONFIG.logLevel === 'normal' && level === 'verbose') return;
    
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`[${timestamp}] ${message}${details ? ' ' + details : ''}`);
}

function walkDirectory(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        return fileList;
    }
    
    try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                walkDirectory(filePath, fileList);
            } else if (stat.isFile() && file.endsWith('.html')) {
                // Look for trek files - be more specific about matching
                const matchesPattern = (
                    file.includes('trek') && !file.includes('backup') && !file.includes('.bak')
                ) || file === 'trek-template.html';
                
                if (matchesPattern) {
                    fileList.push(filePath);
                }
            }
        });
    } catch (error) {
        log('normal', `⚠️  Could not read directory: ${dir} - ${error.message}`);
    }
    
    return fileList;
}

function findTrekFiles() {
    const files = [];
    
    CONFIG.searchDirectories.forEach(dir => {
        log('verbose', `🔍 Searching directory: ${dir}`);
        walkDirectory(dir, files);
    });
    
    return [...new Set(files)];
}

function createBackup(filePath) {
    if (!CONFIG.createBackups) return null;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16);
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, '.html');
    const backupPath = path.join(dir, `${name}.mobile-backup.${timestamp}.html`);
    
    try {
        fs.copyFileSync(filePath, backupPath);
        log('verbose', `    📁 Backup created: ${path.basename(backupPath)}`);
        return backupPath;
    } catch (error) {
        log('normal', `    ❌ Backup failed: ${error.message}`);
        return null;
    }
}

function applyMobileFix(filePath) {
    log('normal', `\n📱 Processing: ${path.relative('.', filePath)}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changesMade = false;
        const changes = [];
        
        // Check if our fix is already applied
        if (content.includes('EMERGENCY MOBILE FIXES - PROVEN TO WORK')) {
            log('verbose', `    ℹ️  Mobile fixes already applied`);
            return { success: true, changed: false, changes: ['Already fixed'] };
        }
        
        // Remove any existing emergency fixes first
        if (content.includes('data-mobile-fix="emergency"')) {
            content = content.replace(/<style[^>]*data-mobile-fix="emergency"[^>]*>[\s\S]*?<\/style>/g, '');
            changes.push('Removed temporary emergency fixes');
            changesMade = true;
        }
        
        // Strategy 1: Replace existing mobile media queries
        const mobileQueryRegex = /@media\s*\(\s*max-width:\s*768px\s*\)\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}/gs;
        const existingQueries = content.match(mobileQueryRegex);
        
        if (existingQueries && existingQueries.length > 0) {
            log('verbose', `    🔄 Found ${existingQueries.length} existing mobile queries to replace`);
            
            // Replace the first one with our fix, remove the rest
            let replacedFirst = false;
            content = content.replace(mobileQueryRegex, (match) => {
                if (!replacedFirst) {
                    replacedFirst = true;
                    return WORKING_MOBILE_CSS;
                } else {
                    return ''; // Remove duplicate mobile queries
                }
            });
            
            changes.push(`Replaced ${existingQueries.length} mobile media queries`);
            changesMade = true;
        } else {
            // Strategy 2: Add to existing style section
            if (content.includes('</style>')) {
                const styleEndRegex = /(<\/style>)/;
                content = content.replace(styleEndRegex, `\n${WORKING_MOBILE_CSS}\n$1`);
                changes.push('Added mobile fixes to existing style section');
                changesMade = true;
            } else if (content.includes('</head>')) {
                // Strategy 3: Create new style section
                const headEndRegex = /(<\/head>)/;
                content = content.replace(headEndRegex, `<style>\n${WORKING_MOBILE_CSS}\n</style>\n$1`);
                changes.push('Created new style section with mobile fixes');
                changesMade = true;
            } else {
                log('normal', `    ❌ Could not find suitable place to inject CSS`);
                return { success: false, changed: false, changes: ['No injection point found'] };
            }
        }
        
        // Apply the changes
        if (CONFIG.dryRun) {
            log('normal', `    📝 [DRY RUN] Would apply changes: ${changes.join(', ')}`);
        } else if (changesMade) {
            const backupPath = createBackup(filePath);
            fs.writeFileSync(filePath, content, 'utf8');
            log('normal', `    ✅ Mobile fixes applied successfully`);
            if (backupPath) {
                log('verbose', `    📁 Backup: ${path.basename(backupPath)}`);
            }
        }
        
        return { success: true, changed: changesMade, changes };
        
    } catch (error) {
        log('normal', `    ❌ Error: ${error.message}`);
        return { success: false, changed: false, changes: [error.message] };
    }
}

function generateReport(results) {
    const processed = results.filter(r => r.success).length;
    const fixed = results.filter(r => r.success && r.changed).length;
    const alreadyFixed = results.filter(r => r.success && !r.changed).length;
    const errors = results.filter(r => !r.success).length;
    
    console.log('\n📊 MOBILE FIX REPORT');
    console.log('====================');
    console.log(`📁 Files found: ${results.length}`);
    console.log(`✅ Files processed: ${processed}`);
    console.log(`🔧 Files fixed: ${fixed}`);
    console.log(`😊 Already fixed: ${alreadyFixed}`);
    console.log(`❌ Errors: ${errors}`);
    
    if (CONFIG.dryRun) {
        console.log('\n🔍 DRY RUN MODE - No changes made');
        if (fixed > 0) {
            console.log('💡 Files that WILL be fixed when you set dryRun: false');
        }
    } else {
        console.log('\n🎉 FIXES APPLIED!');
        if (fixed > 0) {
            console.log('📱 Test your trek pages on mobile devices');
            console.log('📁 Backup files created automatically');
        }
    }
    
    if (errors > 0) {
        console.log('\n⚠️  Files with errors:');
        results.filter(r => !r.success).forEach((result, index) => {
            console.log(`   ${index + 1}. ${result.file}: ${result.changes.join(', ')}`);
        });
    }
}

function main() {
    console.log('🚀 PRODUCTION MOBILE FIX SCRIPT');
    console.log('================================');
    console.log('✅ Emergency fix worked - applying permanently to all files\n');
    
    if (CONFIG.dryRun) {
        console.log('🔍 DRY RUN MODE - Preview only');
        console.log('   Set CONFIG.dryRun = false to apply fixes\n');
    }
    
    // Find all trek files
    const trekFiles = findTrekFiles();
    
    if (trekFiles.length === 0) {
        console.log('❌ No trek HTML files found.');
        console.log('💡 Update CONFIG.searchDirectories to include your trek files');
        return;
    }
    
    log('normal', `📋 Found ${trekFiles.length} trek files`);
    if (CONFIG.logLevel === 'verbose') {
        trekFiles.forEach(file => log('verbose', `  - ${path.relative('.', file)}`));
    }
    
    // Apply fixes to all files
    const results = trekFiles.map(file => {
        const result = applyMobileFix(file);
        return { ...result, file: path.relative('.', file) };
    });
    
    // Generate report
    generateReport(results);
    
    if (!CONFIG.dryRun && results.some(r => r.success && r.changed)) {
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. 📱 Test trek pages on mobile devices');
        console.log('2. ✅ Verify hero stats show in 2x2 grid');
        console.log('3. ✅ Check that text is no longer cut off');
        console.log('4. 🔄 If issues persist, check browser cache');
        console.log('5. 📁 Backup files are available for rollback if needed');
    }
    
    console.log('\n🎉 Script completed!');
}

// Export for testing
if (require.main === module) {
    main();
} else {
    module.exports = { applyMobileFix, findTrekFiles, WORKING_MOBILE_CSS };
}
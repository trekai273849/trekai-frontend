#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 2x2 Grid Fix Script
 * Specifically targets the hero stats grid layout issue
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

// The specific 2x2 grid fix
const GRID_FIX_CSS = `
    /* ENHANCED 2x2 GRID FIX */
    .hero-stats {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        grid-template-rows: auto auto !important;
        gap: 0.8rem !important;
        width: 100% !important;
        max-width: 300px !important;
        margin: 1.5rem auto 0 !important;
        padding: 0 !important;
        justify-content: center !important;
        align-items: stretch !important;
        box-sizing: border-box !important;
        /* Remove conflicting flex properties */
        flex-direction: unset !important;
        flex-wrap: unset !important;
    }
    
    /* Explicit grid positioning */
    .hero-stats .hero-stat:nth-child(1) { grid-column: 1; grid-row: 1; }
    .hero-stats .hero-stat:nth-child(2) { grid-column: 2; grid-row: 1; }
    .hero-stats .hero-stat:nth-child(3) { grid-column: 1; grid-row: 2; }
    .hero-stats .hero-stat:nth-child(4) { grid-column: 2; grid-row: 2; }
    
    .hero-stat {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        padding: 1rem 0.8rem !important;
        background: rgba(0,0,0,0.6) !important;
        border-radius: 12px !important;
        backdrop-filter: blur(5px) !important;
        min-height: 70px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
    }`;

function findTrekFiles() {
    const files = [];
    
    CONFIG.searchDirectories.forEach(dir => {
        if (fs.existsSync(dir)) {
            const dirFiles = fs.readdirSync(dir);
            dirFiles.forEach(file => {
                if (file.endsWith('.html') && file.includes('trek') && !file.includes('backup')) {
                    files.push(path.join(dir, file));
                }
            });
        }
    });
    
    return [...new Set(files)];
}

function fixGridInFile(filePath) {
    console.log(`🔧 Processing: ${path.basename(filePath)}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if we need to fix the grid
        const needsGridFix = !content.includes('grid-template-columns: 1fr 1fr !important') ||
                            !content.includes('grid-column: 1; grid-row: 1;');
        
        if (!needsGridFix) {
            console.log('   ✅ Grid fix already applied');
            return true;
        }
        
        // Create backup
        if (CONFIG.createBackups && !CONFIG.dryRun) {
            const timestamp = new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-');
            const backupPath = filePath.replace('.html', `.grid-backup-${timestamp}.html`);
            fs.writeFileSync(backupPath, content);
            console.log(`   📁 Backup: ${path.basename(backupPath)}`);
        }
        
        // Find and enhance the mobile CSS section
        const mobileRegex = /(@media\s*\(\s*max-width:\s*768px\s*\)\s*{[\s\S]*?)(\.hero-stats\s*{[^}]*})/g;
        
        let foundAndFixed = false;
        content = content.replace(mobileRegex, (match, mediaStart, heroStatsRule) => {
            foundAndFixed = true;
            console.log('   🎯 Found hero-stats rule, enhancing for 2x2 grid');
            
            // Replace the hero-stats rule with our enhanced version
            const enhanced = match.replace(heroStatsRule, GRID_FIX_CSS);
            return enhanced;
        });
        
        if (!foundAndFixed) {
            // Try to find the mobile section and add our grid fix
            const mobileSection = /@media\s*\(\s*max-width:\s*768px\s*\)\s*{/;
            if (content.match(mobileSection)) {
                content = content.replace(mobileSection, (match) => {
                    return match + '\n    ' + GRID_FIX_CSS;
                });
                foundAndFixed = true;
                console.log('   ➕ Added 2x2 grid fix to existing mobile section');
            }
        }
        
        if (!foundAndFixed) {
            console.log('   ❌ Could not find mobile CSS section to update');
            return false;
        }
        
        if (CONFIG.dryRun) {
            console.log('   📝 [DRY RUN] Would apply 2x2 grid fix');
        } else {
            fs.writeFileSync(filePath, content);
            console.log('   ✅ 2x2 grid fix applied');
        }
        
        return true;
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

function main() {
    console.log('🎯 2x2 GRID FIX SCRIPT');
    console.log('======================');
    console.log('🔧 Targeting the hero stats grid layout issue\n');
    
    if (CONFIG.dryRun) {
        console.log('🔍 DRY RUN MODE - Preview only');
        console.log('   Set CONFIG.dryRun = false to apply fixes\n');
    }
    
    const trekFiles = findTrekFiles();
    
    if (trekFiles.length === 0) {
        console.log('❌ No trek files found');
        console.log('💡 Update CONFIG.searchDirectories to include your trek files');
        return;
    }
    
    console.log(`📋 Found ${trekFiles.length} trek files:\n`);
    
    let successCount = 0;
    trekFiles.forEach(file => {
        if (fixGridInFile(file)) {
            successCount++;
        }
    });
    
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`Files processed: ${successCount}/${trekFiles.length}`);
    
    if (CONFIG.dryRun) {
        console.log('\n💡 To apply the 2x2 grid fix:');
        console.log('   1. Set CONFIG.dryRun = false');
        console.log('   2. Run the script again');
    } else {
        console.log('\n🎉 2x2 Grid fixes applied!');
        console.log('📱 Test on mobile - hero stats should now show in 2x2 grid');
    }
    
    console.log('\n🎯 Expected result: 4 stats in 2 columns, 2 rows with dark backgrounds');
}

if (require.main === module) {
    main();
}
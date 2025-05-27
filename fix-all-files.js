#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 🎯 SIMPLE CONFIGURATION
const TREK_FOLDER = './output/treks';  // <-- UPDATE THIS PATH IF NEEDED
const DRY_RUN = false;  // Set to false to apply changes

// The working 2x2 grid CSS (from your successful test)
const GRID_FIX = `
@media (max-width: 768px) {
    .hero-stats {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        grid-template-rows: auto auto !important;
        gap: 0.8rem !important;
        max-width: 300px !important;
        margin: 1.5rem auto 0 !important;
        justify-content: center !important;
    }
    
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
        min-height: 70px !important;
        width: 100% !important;
        box-sizing: border-box !important;
    }
    
    .hero-stat-value {
        font-size: 1.4rem !important;
        font-weight: 700 !important;
        color: white !important;
        margin-bottom: 0.3rem !important;
    }
    
    .hero-stat-label {
        font-size: 0.75rem !important;
        color: white !important;
        text-transform: uppercase !important;
        opacity: 0.95 !important;
    }
}`;

function processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`📱 ${fileName}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Skip if already has the grid positioning fix
        if (content.includes('grid-column: 1; grid-row: 1;')) {
            console.log(`   ✅ Already has 2x2 grid fix`);
            return 'already-fixed';
        }
        
        // Skip if no hero section
        if (!content.includes('hero-stat') && !content.includes('hero-stats')) {
            console.log(`   ⏭️  No hero section found`);
            return 'skipped';
        }
        
        let modified = false;
        
        // Strategy 1: Add to existing mobile CSS
        const mobileRegex = /@media\s*\([^)]*max-width:\s*768px[^)]*\)\s*{/;
        if (content.match(mobileRegex)) {
            content = content.replace(mobileRegex, (match) => {
                return match + '\n    ' + GRID_FIX.trim();
            });
            modified = true;
            console.log(`   🔄 Added to existing mobile CSS`);
        }
        // Strategy 2: Add before closing </style>
        else if (content.includes('</style>')) {
            content = content.replace('</style>', GRID_FIX + '\n</style>');
            modified = true;
            console.log(`   ➕ Added to existing style section`);
        }
        // Strategy 3: Create new style section
        else if (content.includes('</head>')) {
            content = content.replace('</head>', `<style>${GRID_FIX}</style>\n</head>`);
            modified = true;
            console.log(`   ➕ Created new style section`);
        }
        else {
            console.log(`   ❌ Could not find place to add CSS`);
            return 'failed';
        }
        
        if (modified) {
            if (DRY_RUN) {
                console.log(`   📝 [DRY RUN] Would apply 2x2 grid fix`);
                return 'would-fix';
            } else {
                // Create backup
                const backupPath = filePath.replace('.html', '.backup.html');
                fs.writeFileSync(backupPath, fs.readFileSync(filePath));
                
                // Apply fix
                fs.writeFileSync(filePath, content);
                console.log(`   ✅ 2x2 grid fix applied`);
                return 'fixed';
            }
        }
        
        return 'no-change';
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return 'error';
    }
}

function main() {
    console.log('🎯 SIMPLE ALL FILES 2x2 GRID FIX');
    console.log('=================================');
    
    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - Preview only');
        console.log('   Set DRY_RUN = false to apply fixes\n');
    }
    
    console.log(`📂 Target folder: ${TREK_FOLDER}\n`);
    
    if (!fs.existsSync(TREK_FOLDER)) {
        console.log('❌ Folder not found!');
        console.log('💡 Update TREK_FOLDER variable to correct path');
        return;
    }
    
    // Get ALL HTML files
    const allFiles = fs.readdirSync(TREK_FOLDER);
    const htmlFiles = allFiles.filter(file => 
        file.endsWith('.html') && 
        !file.includes('backup') && 
        !file.includes('.bak')
    );
    
    console.log(`📋 Found ${htmlFiles.length} HTML files:\n`);
    
    // Process every single file
    const results = {};
    htmlFiles.forEach(file => {
        const filePath = path.join(TREK_FOLDER, file);
        const result = processFile(filePath);
        results[result] = (results[result] || 0) + 1;
    });
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`Total files: ${htmlFiles.length}`);
    
    if (results['already-fixed']) console.log(`✅ Already fixed: ${results['already-fixed']}`);
    if (results['fixed']) console.log(`🔧 Fixed: ${results['fixed']}`);
    if (results['would-fix']) console.log(`📝 Would fix: ${results['would-fix']}`);
    if (results['skipped']) console.log(`⏭️  Skipped (no hero): ${results['skipped']}`);
    if (results['failed']) console.log(`❌ Failed: ${results['failed']}`);
    
    if (DRY_RUN && results['would-fix']) {
        console.log('\n💡 To apply fixes:');
        console.log('   Set DRY_RUN = false and run again');
    } else if (!DRY_RUN && results['fixed']) {
        console.log('\n🎉 Fixes applied!');
        console.log('📱 Test trek pages - hero stats should show in 2x2 grid');
    }
}

if (require.main === module) {
    main();
}
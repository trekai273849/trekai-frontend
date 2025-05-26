#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple Trek Subheading Removal Script
 * No external dependencies required
 * 
 * Usage: node remove-trek-subheadings.js
 */

// Configuration
const CONFIG = {
  // Directories to search (adjust these paths to match your project)
  searchDirectories: [
    './output/treks',
    './treks', 
    './' // Current directory
  ],
  
  // File patterns to match
  filePatterns: [
    /.*trek.*\.html$/i,
    /trek-template\.html$/i
  ],
  
  // Create backups before modifying
  createBackups: true,
  
  // Dry run mode (preview changes without making them)
  dryRun: false // Set to false to actually make changes
};

// Patterns to remove from HTML files
const REMOVAL_PATTERNS = [
  // Template format: <p class="text-xl opacity-90">[Trek Region], [Trek Country]</p>
  {
    pattern: /<p\s+class="text-xl\s+opacity-90"[^>]*>.*?<\/p>/gi,
    description: 'Template region/country tagline'
  },
  
  // Hero tagline format: <p class="hero-tagline">...</p>
  {
    pattern: /<p\s+class="hero-tagline"[^>]*>.*?<\/p>/gis,
    description: 'Hero tagline paragraph'
  },
  
  // Alternative tagline formats
  {
    pattern: /<p\s+class="[^"]*tagline[^"]*"[^>]*>.*?<\/p>/gis,
    description: 'Any tagline class variations'
  }
];

// CSS cleanup patterns
const CSS_CLEANUP_PATTERNS = [
  {
    pattern: /\.hero-tagline\s*\{[^}]*\}/gis,
    description: 'Hero tagline CSS rules'
  }
];

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
      // Check if file matches our patterns
      const matchesPattern = CONFIG.filePatterns.some(pattern => 
        pattern.test(file)
      );
      
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
  
  // Remove duplicates
  return [...new Set(files)];
}

function createBackup(filePath) {
  if (!CONFIG.createBackups) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 16);
  const dir = path.dirname(filePath);
  const name = path.basename(filePath, '.html');
  const backupPath = path.join(dir, `${name}.backup.${timestamp}.html`);
  
  fs.copyFileSync(filePath, backupPath);
  console.log(`    📁 Backup: ${path.basename(backupPath)}`);
}

function processFile(filePath) {
  console.log(`\n🔍 Processing: ${path.basename(filePath)}`);
  
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = originalContent;
    let changesMade = false;
    const changesApplied = [];
    
    // Apply HTML removal patterns
    REMOVAL_PATTERNS.forEach(({ pattern, description }) => {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern, '');
        changesMade = true;
        changesApplied.push(`${description} (${matches.length} matches)`);
        
        // Show what would be removed in dry run
        if (CONFIG.dryRun) {
          matches.forEach(match => {
            const preview = match.length > 80 ? match.substring(0, 80) + '...' : match;
            console.log(`    🗑️  Would remove: ${preview}`);
          });
        }
      }
    });
    
    // Apply CSS cleanup patterns
    CSS_CLEANUP_PATTERNS.forEach(({ pattern, description }) => {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(pattern, '');
        changesMade = true;
        changesApplied.push(`${description} (${matches.length} matches)`);
      }
    });
    
    // Clean up extra whitespace
    if (changesMade) {
      modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    }
    
    if (changesMade) {
      if (CONFIG.dryRun) {
        console.log(`    📝 Would apply changes:`);
        changesApplied.forEach(change => console.log(`      - ${change}`));
      } else {
        createBackup(filePath);
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        console.log(`    ✅ Applied changes:`);
        changesApplied.forEach(change => console.log(`      - ${change}`));
      }
    } else {
      console.log(`    ℹ️  No matching patterns found`);
    }
    
    return { processed: true, changed: changesMade };
    
  } catch (error) {
    console.error(`    ❌ Error: ${error.message}`);
    return { processed: false, changed: false };
  }
}

function main() {
  console.log('🚀 Trek Subheading Removal Script');
  console.log('=====================================');
  
  if (CONFIG.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified');
    console.log('   Set CONFIG.dryRun = false to apply changes');
  }
  
  console.log('\n📁 Searching in directories:', CONFIG.searchDirectories);
  
  // Find all trek files
  const trekFiles = findTrekFiles();
  
  if (trekFiles.length === 0) {
    console.log('\n❌ No trek HTML files found.');
    console.log('💡 Check that your file paths in CONFIG.searchDirectories are correct');
    console.log('💡 Files should match patterns like: *trek*.html, trek-template.html');
    return;
  }
  
  console.log(`\n📋 Found ${trekFiles.length} trek files:`);
  trekFiles.forEach(file => console.log(`  - ${path.relative('.', file)}`));
  
  // Process each file
  let processedCount = 0;
  let changedCount = 0;
  
  trekFiles.forEach(file => {
    const result = processFile(file);
    if (result.processed) {
      processedCount++;
      if (result.changed) {
        changedCount++;
      }
    }
  });
  
  // Summary
  console.log('\n📊 Summary');
  console.log('============');
  console.log(`Files found: ${trekFiles.length}`);
  console.log(`Files processed: ${processedCount}`);
  console.log(`Files that would be modified: ${changedCount}`);
  
  if (CONFIG.dryRun && changedCount > 0) {
    console.log('\n💡 To apply these changes:');
    console.log('   1. Review the changes above');
    console.log('   2. Set CONFIG.dryRun = false in the script');
    console.log('   3. Run the script again');
    console.log('\n⚠️  Backups will be created automatically when applying changes');
  } else if (!CONFIG.dryRun && changedCount > 0) {
    console.log('\n✅ Changes applied successfully!');
    if (CONFIG.createBackups) {
      console.log('📁 Original files backed up with .backup extension');
    }
  }
  
  console.log('\n🎉 Script completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, findTrekFiles };
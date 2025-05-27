#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TREKS_FOLDER = './output/treks';
const BACKUP_FOLDER = './output/treks/backups';

// Function to generate the new scrollToSectionTop function with correct indentation
function generateNewScrollFunction(indentSpaces = 12) {
    const indent = ' '.repeat(indentSpaces);
    const innerIndent = ' '.repeat(indentSpaces + 4);
    const deepIndent = ' '.repeat(indentSpaces + 8);
    const deeperIndent = ' '.repeat(indentSpaces + 12);
    
    return `${indent}function scrollToSectionTop() {
${innerIndent}requestAnimationFrame(() => {
${deepIndent}const navTabs = document.querySelector('.nav-tabs');
${deepIndent}
${deepIndent}if (navTabs) {
${deeperIndent}// Get the nav's current position in the viewport
${deeperIndent}const navRect = navTabs.getBoundingClientRect();
${deeperIndent}const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
${deeperIndent}
${deeperIndent}// Calculate where the nav actually is on the page
${deeperIndent}const navTopPosition = currentScrollY + navRect.top;
${deeperIndent}
${deeperIndent}// Scroll to just below the nav
${deeperIndent}const targetScroll = navTopPosition + navTabs.offsetHeight + 20;
${deeperIndent}
${deeperIndent}window.scrollTo({
${deeperIndent}    top: Math.max(0, targetScroll),
${deeperIndent}    behavior: 'smooth'
${deeperIndent});
${deepIndent}} else {
${deeperIndent}// Fallback: scroll to top if nav not found
${deeperIndent}window.scrollTo({
${deeperIndent}    top: 0,
${deeperIndent}    behavior: 'smooth'
${deeperIndent});
${deepIndent}}
${innerIndent});
${indent}}`;
}

// Diagnostic function to analyze the file structure
function analyzeFile(filename) {
    const filePath = path.join(TREKS_FOLDER, filename);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        console.log(`\n🔍 ANALYZING: ${filename}`);
        console.log('=' + '='.repeat(filename.length + 12));
        
        // Check if file contains scrollToSectionTop
        if (!content.includes('scrollToSectionTop')) {
            console.log('❌ No scrollToSectionTop found in file');
            return false;
        }
        
        console.log('✅ Found scrollToSectionTop references');
        
        // Find all lines containing scrollToSectionTop
        const lines = content.split('\n');
        const relevantLines = [];
        
        lines.forEach((line, index) => {
            if (line.includes('scrollToSectionTop')) {
                relevantLines.push({
                    lineNumber: index + 1,
                    content: line,
                    trimmed: line.trim()
                });
            }
        });
        
        console.log(`\n📍 Found ${relevantLines.length} references:`);
        relevantLines.forEach(ref => {
            console.log(`   Line ${ref.lineNumber}: ${ref.trimmed}`);
        });
        
        // Try to extract the full function
        const functionStart = content.indexOf('function scrollToSectionTop()');
        if (functionStart === -1) {
            console.log('\n❌ Could not find function definition');
            return false;
        }
        
        console.log(`\n✅ Function starts at character position: ${functionStart}`);
        
        // Extract some context around the function
        const beforeFunction = content.substring(Math.max(0, functionStart - 100), functionStart);
        const afterStart = content.substring(functionStart);
        
        // Find the end of the function by counting braces
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
        
        const fullFunction = content.substring(functionStart, functionEnd);
        
        console.log('\n📄 CURRENT FUNCTION:');
        console.log('─'.repeat(50));
        console.log(fullFunction);
        console.log('─'.repeat(50));
        
        // Check indentation
        const functionLines = fullFunction.split('\n');
        if (functionLines.length > 1) {
            const secondLine = functionLines[1];
            const leadingSpaces = secondLine.match(/^(\s*)/)[1].length;
            console.log(`\n📏 Function indentation: ${leadingSpaces} spaces`);
        }
        
        return {
            functionStart,
            functionEnd,
            fullFunction,
            beforeFunction,
            content
        };
        
    } catch (error) {
        console.error(`❌ Error analyzing ${filename}: ${error.message}`);
        return false;
    }
}

// Function to actually replace the function
function replaceFunction(filename, analysisResult) {
    const filePath = path.join(TREKS_FOLDER, filename);
    
    try {
        const { content, functionStart, functionEnd, fullFunction } = analysisResult;
        
        console.log(`\n🔧 REPLACING function in ${filename}`);
        
        // Detect the indentation from the existing function
        const functionLines = fullFunction.split('\n');
        let indentSpaces = 12; // default
        
        if (functionLines.length > 1) {
            const secondLine = functionLines[1];
            const leadingSpaces = secondLine.match(/^(\s*)/);
            if (leadingSpaces) {
                indentSpaces = leadingSpaces[1].length;
                console.log(`📏 Using ${indentSpaces} spaces for indentation`);
            }
        }
        
        // Generate the new function with correct indentation
        const newScrollFunction = generateNewScrollFunction(indentSpaces);
        
        // Create backup first
        createBackup(filename);
        
        // Replace the function
        const beforeFunction = content.substring(0, functionStart);
        const afterFunction = content.substring(functionEnd);
        const newContent = beforeFunction + newScrollFunction + afterFunction;
        
        // Write the new content
        fs.writeFileSync(filePath, newContent, 'utf8');
        
        console.log('✅ Function replaced successfully');
        return true;
        
    } catch (error) {
        console.error(`❌ Error replacing function: ${error.message}`);
        return false;
    }
}

// Create backup folder if it doesn't exist
function createBackupFolder() {
    if (!fs.existsSync(BACKUP_FOLDER)) {
        fs.mkdirSync(BACKUP_FOLDER, { recursive: true });
        console.log(`✅ Created backup folder: ${BACKUP_FOLDER}`);
    }
}

// Create backup of a file
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

// Get all HTML files in the treks folder
function getHtmlFiles() {
    try {
        if (!fs.existsSync(TREKS_FOLDER)) {
            console.error(`❌ Treks folder not found: ${TREKS_FOLDER}`);
            return [];
        }
        
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

// Main diagnostic function
function runDiagnostic() {
    console.log('🔍 DIAGNOSTIC MODE');
    console.log('==================\n');
    
    const htmlFiles = getHtmlFiles();
    
    if (htmlFiles.length === 0) {
        console.log('❌ No HTML files found');
        return;
    }
    
    console.log(`📁 Found ${htmlFiles.length} HTML files:`);
    htmlFiles.forEach(file => console.log(`   - ${file}`));
    
    // Analyze each file
    const analysisResults = [];
    
    htmlFiles.forEach(filename => {
        const result = analyzeFile(filename);
        if (result) {
            analysisResults.push({ filename, ...result });
        }
    });
    
    console.log(`\n📊 SUMMARY: ${analysisResults.length} files contain scrollToSectionTop function`);
    
    return analysisResults;
}

// Main fix function
function runFix() {
    console.log('🔧 FIX MODE');
    console.log('===========\n');
    
    createBackupFolder();
    
    const htmlFiles = getHtmlFiles();
    
    if (htmlFiles.length === 0) {
        console.log('❌ No HTML files found');
        return;
    }
    
    let updated = 0;
    let failed = 0;
    
    htmlFiles.forEach(filename => {
        console.log(`\n📄 Processing: ${filename}`);
        
        const analysis = analyzeFile(filename);
        if (analysis) {
            if (replaceFunction(filename, analysis)) {
                updated++;
            } else {
                failed++;
            }
        } else {
            console.log(`⏭️  Skipping ${filename} (no function found)`);
        }
    });
    
    console.log('\n📊 FINAL SUMMARY');
    console.log('================');
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (updated > 0) {
        console.log(`\n📦 Backups saved to: ${BACKUP_FOLDER}`);
        console.log('🎉 Tab scroll navigation should now work correctly!');
    }
}

// Command line interface
function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Tab Scroll Navigation Fix Script
================================

Usage:
  node fix-tab-scroll.js --analyze    # Analyze files without making changes
  node fix-tab-scroll.js --fix        # Analyze and fix files
  node fix-tab-scroll.js --help       # Show this help

Examples:
  node fix-tab-scroll.js --analyze    # See what's in your files first
  node fix-tab-scroll.js --fix        # Actually fix the files
`);
        return;
    }
    
    if (args.includes('--analyze')) {
        runDiagnostic();
    } else if (args.includes('--fix')) {
        runFix();
    } else {
        console.log('❓ Please specify --analyze or --fix (use --help for more info)');
        console.log('\nRecommended: Start with --analyze to see what the script finds');
    }
}

main();
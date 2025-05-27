const fs = require('fs');
const path = require('path');

// Function to process a single HTML file
function processHtmlFile(filePath) {
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file has hero-tagline (the duplicate we want to remove)
        const heroTaglineRegex = /<p\s+class="hero-tagline"[^>]*>[\s\S]*?<\/p>/g;
        
        // Check if the pattern exists
        const matches = content.match(heroTaglineRegex);
        
        if (matches && matches.length > 0) {
            console.log(`Processing: ${path.basename(filePath)}`);
            console.log(`Found hero-tagline: ${matches[0].substring(0, 100)}...`);
            
            // Remove the hero-tagline element
            content = content.replace(heroTaglineRegex, '');
            
            // Write the updated content back to the file
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Removed duplicate description from ${path.basename(filePath)}\n`);
            return true;
        } else {
            console.log(`⏭️  No hero-tagline found in ${path.basename(filePath)}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Function to process all HTML files in the treks directory
function processAllTrekFiles() {
    const treksDir = './output/treks';
    
    // Check if directory exists
    if (!fs.existsSync(treksDir)) {
        console.error(`❌ Directory ${treksDir} does not exist`);
        return;
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(treksDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
        console.log('No HTML files found in the treks directory');
        return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to process:\n`);
    
    let processedCount = 0;
    
    // Process each HTML file
    htmlFiles.forEach(file => {
        const filePath = path.join(treksDir, file);
        const wasProcessed = processHtmlFile(filePath);
        if (wasProcessed) {
            processedCount++;
        }
    });
    
    console.log(`\n🎉 Processing complete!`);
    console.log(`📊 Files processed: ${processedCount} out of ${htmlFiles.length}`);
}

// Alternative function with more specific pattern matching
function processAllTrekFilesAdvanced() {
    const treksDir = './output/treks';
    
    if (!fs.existsSync(treksDir)) {
        console.error(`❌ Directory ${treksDir} does not exist`);
        return;
    }
    
    const files = fs.readdirSync(treksDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`Found ${htmlFiles.length} HTML files to process:\n`);
    
    let processedCount = 0;
    
    htmlFiles.forEach(file => {
        try {
            const filePath = path.join(treksDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Pattern 1: Remove hero-tagline
            const heroTaglinePattern = /<p\s+class="hero-tagline"[^>]*>[\s\S]*?<\/p>/g;
            if (heroTaglinePattern.test(content)) {
                content = content.replace(heroTaglinePattern, '');
                modified = true;
                console.log(`✅ Removed hero-tagline from ${file}`);
            }
            
            // Pattern 2: Remove any paragraph directly after hero h1 and before hero-stats
            const heroDescPattern = /<h1[^>]*>.*?<\/h1>\s*<p[^>]*>.*?<\/p>\s*(?=<div[^>]*class="hero-stats")/gs;
            if (heroDescPattern.test(content)) {
                content = content.replace(heroDescPattern, (match) => {
                    // Extract just the h1 part
                    const h1Match = match.match(/<h1[^>]*>.*?<\/h1>/s);
                    return h1Match ? h1Match[0] + '\n            ' : match;
                });
                modified = true;
                console.log(`✅ Removed hero description paragraph from ${file}`);
            }
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                processedCount++;
            } else {
                console.log(`⏭️  No changes needed for ${file}`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    });
    
    console.log(`\n🎉 Processing complete!`);
    console.log(`📊 Files modified: ${processedCount} out of ${htmlFiles.length}`);
}

// Run the script
console.log('🚀 Starting duplicate description removal...\n');

// Use the advanced version for better pattern matching
processAllTrekFilesAdvanced();

// If you want to run the basic version instead, use:
// processAllTrekFiles();
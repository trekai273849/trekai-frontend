const fs = require('fs');
const path = require('path');

// Function to enhance section headers in a single HTML file
function enhanceSectionHeaders(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // First, add enhanced styles to the CSS section if not already present
        if (!content.includes('/* Enhanced Section Headers */')) {
            const enhancedHeaderStyles = `
        /* Enhanced Section Headers */
        .content-section h2 {
            font-size: 2.5em !important;
            font-weight: 700 !important;
            color: var(--text-dark) !important;
            margin-bottom: 25px !important;
            padding-bottom: 15px !important;
            border-bottom: 3px solid var(--primary) !important;
            position: relative !important;
        }

        .content-section h2::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 60px;
            height: 3px;
            background: var(--accent);
        }

        @media (max-width: 768px) {
            .content-section h2 {
                font-size: 2em !important;
                margin-bottom: 20px !important;
                padding-bottom: 12px !important;
            }
        }`;
            
            // Find the end of the existing CSS styles and add our enhancement
            const styleEndPattern = /(\s*\/\* Animations \*\/[\s\S]*?\.content-section\.active > \* \{[\s\S]*?\}\s*<\/style>)/;
            
            if (styleEndPattern.test(content)) {
                content = content.replace(styleEndPattern, enhancedHeaderStyles + '\n$1');
                modified = true;
            } else {
                // Fallback: add before closing </style> tag
                const styleClosingPattern = /(\s*<\/style>)/;
                if (styleClosingPattern.test(content)) {
                    content = content.replace(styleClosingPattern, enhancedHeaderStyles + '\n$1');
                    modified = true;
                }
            }
        }
        
        // Patterns for the specific section headers we want to enhance
        const sectionHeaderPatterns = [
            // Itinerary section
            {
                pattern: /<h2>(\d+-Day Detailed Itinerary)<\/h2>/g,
                replacement: '<h2 class="enhanced-section-header">$1</h2>'
            },
            // Gear section  
            {
                pattern: /<h2>(Essential Gear &amp; Packing List)<\/h2>/g,
                replacement: '<h2 class="enhanced-section-header">$1</h2>'
            },
            // Best time section
            {
                pattern: /<h2>(Best Time to Trek)<\/h2>/g,
                replacement: '<h2 class="enhanced-section-header">$1</h2>'
            },
            // Costs section
            {
                pattern: /<h2>(Costs &amp; Permits)<\/h2>/g,
                replacement: '<h2 class="enhanced-section-header">$1</h2>'
            },
            // FAQs section
            {
                pattern: /<h2>(Frequently Asked Questions)<\/h2>/g,
                replacement: '<h2 class="enhanced-section-header">$1</h2>'
            }
        ];
        
        // Apply each pattern
        sectionHeaderPatterns.forEach(({pattern, replacement}) => {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Enhanced section headers in ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`⏭️  No section headers to enhance in ${path.basename(filePath)}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Alternative approach with more comprehensive styling
function enhanceSectionHeadersAdvanced(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Enhanced CSS for section headers
        const enhancedStyles = `
        /* Enhanced Section Headers Styling */
        .content-section h2 {
            font-size: 2.8em !important;
            font-weight: 800 !important;
            color: var(--text-dark) !important;
            margin-bottom: 30px !important;
            margin-top: 20px !important;
            padding-bottom: 20px !important;
            position: relative !important;
            background: linear-gradient(135deg, var(--text-dark) 0%, var(--primary) 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            border-bottom: 2px solid #E0E0E0 !important;
        }

        .content-section h2::before {
            content: '';
            position: absolute;
            left: 0;
            bottom: -2px;
            width: 80px;
            height: 4px;
            background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
            border-radius: 2px;
        }

        .content-section h2::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: -6px;
            width: 40px;
            height: 2px;
            background: var(--accent);
            border-radius: 1px;
        }

        /* Subtitle styling enhancement */
        .content-section h2 + p {
            font-size: 1.2em !important;
            color: var(--text-light) !important;
            margin-bottom: 50px !important;
            font-weight: 500 !important;
            line-height: 1.6 !important;
        }

        @media (max-width: 768px) {
            .content-section h2 {
                font-size: 2.2em !important;
                margin-bottom: 25px !important;
                padding-bottom: 15px !important;
            }
            
            .content-section h2 + p {
                font-size: 1.1em !important;
                margin-bottom: 40px !important;
            }
        }

        @media (max-width: 480px) {
            .content-section h2 {
                font-size: 1.9em !important;
                margin-bottom: 20px !important;
            }
            
            .content-section h2 + p {
                font-size: 1em !important;
                margin-bottom: 35px !important;
            }
        }`;
        
        // Check if enhanced styles already exist
        if (!content.includes('Enhanced Section Headers Styling')) {
            // Find where to insert the styles (before closing </style>)
            const styleInsertPattern = /(\s*\/\* Animations \*\/[\s\S]*?\.content-section\.active > \* \{[\s\S]*?\}\s*)(.*?<\/style>)/s;
            
            if (styleInsertPattern.test(content)) {
                content = content.replace(styleInsertPattern, `$1${enhancedStyles}\n        $2`);
                modified = true;
                console.log(`✅ Added enhanced section header styles to ${path.basename(filePath)}`);
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Function to process all trek files
function enhanceAllTrekHeaders() {
    const treksDir = './output/treks';
    
    if (!fs.existsSync(treksDir)) {
        console.error(`❌ Directory ${treksDir} does not exist`);
        return;
    }
    
    const files = fs.readdirSync(treksDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
        console.log('No HTML files found in the treks directory');
        return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to enhance:\n`);
    
    let processedCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(treksDir, file);
        const wasProcessed = enhanceSectionHeadersAdvanced(filePath);
        if (wasProcessed) {
            processedCount++;
        }
    });
    
    console.log(`\n🎉 Enhancement complete!`);
    console.log(`📊 Files enhanced: ${processedCount} out of ${htmlFiles.length}`);
    console.log(`\n✨ Section headers should now be more prominent with:`);
    console.log(`   • Larger, bolder typography`);
    console.log(`   • Gradient text effects`);
    console.log(`   • Decorative underlines`);
    console.log(`   • Better spacing and mobile responsiveness`);
}

// Run the enhancement
console.log('🚀 Starting section header enhancement...\n');
enhanceAllTrekHeaders();
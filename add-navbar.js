const fs = require('fs');
const path = require('path');

// Configuration
const TREKS_DIRECTORY = './output/treks';
const TAILWIND_SCRIPT = '<script src="https://cdn.tailwindcss.com"></script>';
const NAVBAR_SCRIPT = `    <!-- Navbar will be injected here -->
    <script type="module" src="/js/components/navbar.js"></script>`;

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function addNavbarToFile(filePath) {
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let changes = [];

        // Check if Tailwind CSS is already present
        if (!content.includes('tailwindcss.com')) {
            // Find the </head> tag and add Tailwind before it
            const headCloseIndex = content.indexOf('</head>');
            if (headCloseIndex !== -1) {
                content = content.slice(0, headCloseIndex) + 
                         '    ' + TAILWIND_SCRIPT + '\n' + 
                         content.slice(headCloseIndex);
                modified = true;
                changes.push('Added Tailwind CSS');
            }
        }

        // Check if navbar script is already present (handle both relative and absolute paths)
        const hasNavbarScript = content.includes('/js/components/navbar.js') || 
                               content.includes('../js/components/navbar.js') || 
                               content.includes('js/components/navbar.js');

        if (!hasNavbarScript) {
            // Find the opening <body> tag
            const bodyOpenMatch = content.match(/<body[^>]*>/);
            if (bodyOpenMatch) {
                const bodyOpenEnd = bodyOpenMatch.index + bodyOpenMatch[0].length;
                
                // Insert navbar script right after <body> tag
                content = content.slice(0, bodyOpenEnd) + 
                         '\n' + NAVBAR_SCRIPT + '\n' + 
                         content.slice(bodyOpenEnd);
                modified = true;
                changes.push('Added navbar script');
            }
        } else {
            // Check if we need to update the path to use absolute path
            if (content.includes('../js/components/navbar.js')) {
                content = content.replace('../js/components/navbar.js', '/js/components/navbar.js');
                modified = true;
                changes.push('Updated navbar path to absolute');
            } else if (content.includes('js/components/navbar.js') && !content.includes('/js/components/navbar.js')) {
                content = content.replace(/(?<!\/)"js\/components\/navbar\.js"/g, '"/js/components/navbar.js"');
                content = content.replace(/(?<!\/)'js\/components\/navbar\.js'/g, "'/js/components/navbar.js'");
                modified = true;
                changes.push('Updated navbar path to absolute');
            }
        }

        // Fix footer script paths too
        if (content.includes('../js/components/footer.js')) {
            content = content.replace('../js/components/footer.js', '/js/components/footer.js');
            modified = true;
            changes.push('Updated footer path to absolute');
        } else if (content.includes('js/components/footer.js') && !content.includes('/js/components/footer.js')) {
            content = content.replace(/(?<!\/)"js\/components\/footer\.js"/g, '"/js/components/footer.js"');
            content = content.replace(/(?<!\/)'js\/components\/footer\.js'/g, "'/js/components/footer.js'");
            modified = true;
            changes.push('Updated footer path to absolute');
        }

        // Write the file back if it was modified
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, changes };
        } else {
            return { success: true, changes: ['No changes needed'] };
        }

    } catch (error) {
        return { success: false, error: error.message };
    }
}

function processAllTrekFiles() {
    log('\n🚀 Starting navbar integration for all trek pages...', 'bright');
    log('=====================================', 'blue');

    // Check if directory exists
    if (!fs.existsSync(TREKS_DIRECTORY)) {
        log(`❌ Directory ${TREKS_DIRECTORY} does not exist!`, 'red');
        return;
    }

    // Read all files in the directory
    const files = fs.readdirSync(TREKS_DIRECTORY);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    if (htmlFiles.length === 0) {
        log('⚠️  No HTML files found in the treks directory.', 'yellow');
        return;
    }

    log(`📁 Found ${htmlFiles.length} HTML file(s) to process:\n`, 'blue');

    let successCount = 0;
    let errorCount = 0;

    // Process each HTML file
    htmlFiles.forEach((file, index) => {
        const filePath = path.join(TREKS_DIRECTORY, file);
        log(`${index + 1}. Processing: ${file}`, 'blue');

        const result = addNavbarToFile(filePath);

        if (result.success) {
            successCount++;
            if (result.changes.includes('No changes needed')) {
                log(`   ✅ ${result.changes[0]}`, 'yellow');
            } else {
                log(`   ✅ ${result.changes.join(', ')}`, 'green');
            }
        } else {
            errorCount++;
            log(`   ❌ Error: ${result.error}`, 'red');
        }
    });

    // Summary
    log('\n=====================================', 'blue');
    log('📊 SUMMARY:', 'bright');
    log(`✅ Successfully processed: ${successCount} files`, 'green');
    if (errorCount > 0) {
        log(`❌ Errors encountered: ${errorCount} files`, 'red');
    }
    log('🎉 Navbar integration complete!', 'bright');
    
    if (successCount > 0) {
        log('\n📝 What was added to each file:', 'blue');
        log('• Tailwind CSS script (if missing)', 'reset');
        log('• Navbar script import (if missing)', 'reset');
        log('\n🔗 Your trek pages now have:', 'blue');
        log('• Consistent navigation header', 'reset');
        log('• User authentication integration', 'reset');
        log('• Mobile-responsive design', 'reset');
        log('• Automatic user state management', 'reset');
    }
}

// Backup function
function createBackup() {
    const backupDir = './output/treks_backup_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    try {
        if (!fs.existsSync('./output/treks_backup_' + new Date().toISOString().slice(0, 10))) {
            log('💾 Creating backup...', 'yellow');
            fs.mkdirSync(backupDir, { recursive: true });
            
            const files = fs.readdirSync(TREKS_DIRECTORY);
            files.forEach(file => {
                if (file.endsWith('.html')) {
                    fs.copyFileSync(
                        path.join(TREKS_DIRECTORY, file),
                        path.join(backupDir, file)
                    );
                }
            });
            log(`✅ Backup created at: ${backupDir}`, 'green');
        }
    } catch (error) {
        log(`⚠️  Could not create backup: ${error.message}`, 'yellow');
        log('Continuing without backup...', 'yellow');
    }
}

// Main execution
function main() {
    log('🏔️  Smart Trails - Navbar Integration Script', 'bright');
    
    // Create backup first
    createBackup();
    
    // Process all files
    processAllTrekFiles();
    
    log('\n🎯 Next steps:', 'blue');
    log('1. Test a few trek pages to ensure navbar loads correctly', 'reset');
    log('2. Check mobile responsiveness', 'reset');
    log('3. Verify authentication features work', 'reset');
    log('\n✨ All done! Your trek pages now have consistent navigation.', 'green');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { addNavbarToFile, processAllTrekFiles };
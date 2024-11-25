const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to build and export the Next.js app
function exportApp() {
    try {
        // Run the build process
        console.log('Building the Next.js app...');
        execSync('next build', { stdio: 'inherit' });

        // Ensure the out directory is cleared before exporting
        const outDir = path.join(__dirname, 'out');
        if (fs.existsSync(outDir)) {
            fs.rmSync(outDir, { recursive: true, force: true });
        }

        // Run the export process
        console.log('Exporting the Next.js app to the "out" folder...');
        execSync('next export -o out', { stdio: 'inherit' });

        console.log('Successfully exported the app to the "out" folder.');
    } catch (error) {
        console.error('Error during build or export:', error);
        process.exit(1);
    }
}

// Run the export function
exportApp();

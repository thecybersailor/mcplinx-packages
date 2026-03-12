#!/usr/bin/env node
/**
 * Linktool Development Loader
 * 
 * For linktool developers: auto-detects source changes and rebuilds before execution.
 * Connector developers should use the production bundle (linktool.cjs) directly.
 */

const { execSync } = require('child_process');
const { statSync, existsSync, readdirSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');
const BUNDLE = join(__dirname, 'linktool.cjs');

/**
 * Recursively get all .ts files in a directory
 */
function getAllTsFiles(dir) {
    const files = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllTsFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Check if any source file is newer than the bundle
 */
function needsRebuild() {
    if (!existsSync(BUNDLE)) {
        return true;
    }

    const bundleMtime = statSync(BUNDLE).mtimeMs;
    const srcFiles = getAllTsFiles(SRC_DIR);

    return srcFiles.some(f => statSync(f).mtimeMs > bundleMtime);
}

/**
 * Rebuild linktool
 */
function build() {
    console.log('🔄 Linktool sources changed, rebuilding...');
    const startTime = Date.now();

    try {
        execSync('npm run build', {
            cwd: ROOT,
            stdio: 'inherit'
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Rebuild complete! (${elapsed}s)\n`);
    } catch (error) {
        console.error('❌ Build failed');
        process.exit(1);
    }
}

// Main flow
if (needsRebuild()) {
    build();
}

// Run the actual linktool bundle
require(BUNDLE);

#!/usr/bin/env node

import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chmod } from 'fs/promises';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const entryPoint = join(rootDir, 'src/index.ts');
const outfile = join(rootDir, 'bin/syntool.cjs');

// Read package.json to inject version info
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));

console.log('🔨 Building devkit...');
console.log(`   Entry: ${entryPoint}`);
console.log(`   Output: ${outfile}`);

try {
    // Get list of Node.js built-in modules
    const { builtinModules } = await import('module');
    const nodeBuiltins = builtinModules.map(m => `node:${m}`);

    await build({
        entryPoints: [entryPoint],
        bundle: true,
        platform: 'node',
        target: 'node18',
        format: 'cjs',
        outfile,
        banner: {
            js: '#!/usr/bin/env node',
        },
        minify: false,
        keepNames: true,
        sourcemap: false,
        // Define compile-time constants
        define: {
            'process.env.PKG_VERSION': JSON.stringify(pkg.version),
            'process.env.PKG_DESCRIPTION': JSON.stringify(pkg.description),
            'process.env.PKG_NAME': JSON.stringify(pkg.name),
        },
        external: [
            // Keep peer dependencies external
            '@mcplinx/connector-core',
            // Keep esbuild external (used by build command)
            'esbuild',
            // Keep tsx external (used by connector loader at runtime)
            'tsx',
            // Keep open external (ESM package)
            'open',
            // Exclude all Node.js built-in modules (both formats)
            ...builtinModules,
            ...nodeBuiltins,
        ],
        plugins: [{
            name: 'external-node-modules',
            setup(build) {
                // Externalize all node: prefixed imports
                build.onResolve({ filter: /^node:/ }, () => ({ external: true }));
            },
        }],
    });

    // Make the file executable
    await chmod(outfile, 0o755);

    console.log('✅ Devkit built successfully!');
    console.log(`   Output: ${outfile}`);
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { loadConnector } from '../lib/connector-loader.js';
import { getPackageName } from '../lib/package-name.js';
import { discoverDocs } from '../lib/doc-discovery.js';
import { chunkByHeading } from '../lib/markdown-chunker.js';

/**
 * Extract config keys from bundled code
 * Scans for bundle.vars.KEY and bundle.secrets.KEY patterns
 * Supports both direct access (bundle.vars.KEY) and optional chaining (bundle.vars?.KEY)
 * Also handles minified code where 'bundle' may be renamed
 */
function extractConfigKeys(code: string): { env_keys: string[], secret_keys: string[] } {
    // Match patterns like: bundle.vars.KEY, n.vars?.KEY, etc.
    // Supports optional chaining (?.) and handles minified variable names
    const envKeys = [...code.matchAll(/\.vars\?\.([A-Z_][A-Z0-9_]*)/g)]
        .map(m => m[1]);
    const secretKeys = [...code.matchAll(/\.secrets\?\.([A-Z_][A-Z0-9_]*)/g)]
        .map(m => m[1]);

    return {
        env_keys: [...new Set(envKeys)].sort(),
        secret_keys: [...new Set(secretKeys)].sort()
    };
}

export function buildCommand() {
    return new Command('build')
        .description('Build connector for publishing')
        .action(async () => {
            const cwd = process.cwd();
            console.log(chalk.blue('📦 Building connector...'));

            // 1. Get basic metadata without loading the connector
            const packageName = getPackageName(cwd);
            const pkgJson = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));

            console.log(chalk.gray(`Package: ${packageName}`));

            // 2. Prepare dist directory
            const distDir = join(cwd, 'dist');
            if (!existsSync(distDir)) {
                mkdirSync(distDir, { recursive: true });
            }

            // 3. Bundle with esbuild
            const entryPoint = join(cwd, 'src/index.ts');
            if (!existsSync(entryPoint)) {
                console.error(chalk.red(`Error: Entry point not found at ${entryPoint}`));
                process.exit(1);
            }

            try {
                // Lazy load esbuild to avoid initialization issues when cwd doesn't exist
                const esbuild = await import('esbuild');
                const result = await esbuild.build({
                    entryPoints: [entryPoint],
                    bundle: true,
                    outfile: join(distDir, 'bundle.js'),  // Use .js extension (CJS format)
                    platform: 'neutral',
                    format: 'cjs', // Use CJS format for Cloudflare Workers compatibility
                    target: 'es2022',
                    external: ['@mcplinx/connector-core'],
                    minify: true,
                    metafile: true,
                });

                if (result.errors.length > 0) {
                    console.error(chalk.red('Build failed:'));
                    result.errors.forEach(e => console.error(e));
                    process.exit(1);
                }

                const outputSize = result.metafile?.outputs['dist/bundle.js']?.bytes || 0;
                console.log(chalk.green(`✓ Bundled (${(outputSize / 1024).toFixed(2)} KB)`));

            } catch (e: any) {
                console.error(chalk.red('Build error:'), e.message);
                process.exit(1);
            }

            // 3.5: Scan source code for config keys
            console.log('🔍 Scanning for config keys...');
            const bundleContent = readFileSync(join(distDir, 'bundle.js'), 'utf-8');
            const configSchema = extractConfigKeys(bundleContent);
            if (configSchema.env_keys.length > 0 || configSchema.secret_keys.length > 0) {
                console.log(chalk.gray(`   Found ${configSchema.env_keys.length} env key(s), ${configSchema.secret_keys.length} secret key(s)`));
            }

            // 4. Load connector from the built bundle to get metadata
            console.log('📄 Loading connector metadata...');
            const connector = await loadConnector(cwd);
            
            // Debug: Check if inputFields are present
            if (connector.tools) {
                const toolKeys = Object.keys(connector.tools);
                console.log(chalk.gray(`   Found ${toolKeys.length} tool(s)`));
                for (const key of toolKeys) {
                    const tool = connector.tools[key];
                    const hasInputFields = tool.inputFields && Array.isArray(tool.inputFields) && tool.inputFields.length > 0;
                    console.log(chalk.gray(`   - ${key}: ${hasInputFields ? `has ${tool.inputFields.length} inputFields` : 'no inputFields'}`));
                }
            }

            // 5. Generate manifest.json
            console.log('📄 Generating manifest.json...');

            // Extract OAuth config from authentication if present
            // Note: Do NOT include credentials (clientId/clientSecret) in manifest
            // Credentials are stored in connector instance's env_config and synced to R2
            let authenticationConfig = connector.authentication;

            // If OAuth2, extract OAuth URLs and scopes (but NOT credentials or functions)
            if (authenticationConfig?.type === 'oauth2') {
                const oauth2Config = authenticationConfig.oauth2Config || {};

                authenticationConfig = {
                    ...authenticationConfig,
                    oauth2Config: {
                        authorizeUrl: oauth2Config.authorizeUrl || {},
                        scopes: (oauth2Config.authorizeUrl as any)?.params?.scope?.split(' ') || [],
                        autoRefresh: oauth2Config.autoRefresh
                    } as any,
                    // Do NOT include clientId/clientSecret or getAccessToken function here
                    // They will be injected/executed at runtime from connector bundle
                } as any;
            }

            // 5. Process documentation
            const docsDir = join(cwd, 'docs');
            const docChunks: Array<{
                source: string;
                heading: string;
                headingLevel: number;
                content: string;
            }> = [];

            if (existsSync(docsDir)) {
                const indexPath = join(docsDir, 'index.md');

                if (!existsSync(indexPath)) {
                    console.log(chalk.yellow('⚠️  docs/index.md not found, skipping docs'));
                } else {
                    console.log(chalk.blue('📚 Processing docs...'));

                    // Discover all referenced documents
                    const allDocs = discoverDocs(indexPath, docsDir);
                    console.log(chalk.gray(`   Found ${allDocs.length} document(s)`));

                    // Chunk each document
                    for (const docPath of allDocs) {
                        const content = readFileSync(docPath, 'utf-8');
                        const relativePath = relative(docsDir, docPath);
                        const chunks = chunkByHeading(content);

                        for (const chunk of chunks) {
                            docChunks.push({
                                source: relativePath,
                                heading: chunk.heading,
                                headingLevel: chunk.level,
                                content: chunk.content,
                            });
                        }

                        console.log(chalk.gray(`   ${relativePath}: ${chunks.length} chunk(s)`));
                    }
                }
            }

            const manifest: any = {
                authentication: stripFunctions(authenticationConfig),
                tools: connector.tools ? Object.values(connector.tools).map((t: any) => {
                    const toolEntry: any = {
                        key: t.key,
                        name: t.name || t.key,
                        description: t.description || '',
                        kind: t.kind || 'sync',
                    };
                    // Include inputFields if present
                    if (t.inputFields && Array.isArray(t.inputFields) && t.inputFields.length > 0) {
                        toolEntry.inputFields = t.inputFields.map((field: any) => ({
                            key: field.key,
                            label: field.label || field.key,
                            type: field.type || 'string',
                            required: field.required || false,
                            helpText: field.helpText || null,
                            placeholder: field.placeholder || null,
                            dynamic: field.dynamic || null,
                        })).filter((field: any) => field.key); // Remove fields without key
                    }
                    return toolEntry;
                }) : [],
                config_schema: configSchema,
                createdAt: new Date().toISOString(),
            };

            // Add docs information if available
            if (docChunks.length > 0) {
                manifest.hasDocs = true;
                manifest.docChunks = docChunks;
                console.log(chalk.green(`✓ Generated ${docChunks.length} doc chunk(s)`));
            } else {
                manifest.hasDocs = false;
            }

            writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
            console.log(chalk.green('✓ Generated manifest.json'));
            console.log(chalk.blue(`\nBuild complete! Output: ${distDir}`));
        });
}

/**
 * Helper: Strip function properties from object recursively
 */
function stripFunctions(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(stripFunctions);
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value !== 'function') {
            result[key] = stripFunctions(value);
        }
    }
    return result;
}


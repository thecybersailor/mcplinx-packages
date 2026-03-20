import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import type { LinktoolCoreContext } from './types.js';
import { loadConnector } from '../lib/connector-loader.js';
import { discoverDocs } from '../lib/doc-discovery.js';
import { chunkByHeading } from '../lib/markdown-chunker.js';
import { getPackageName } from '../lib/package-name.js';

export async function runTools(ctx: LinktoolCoreContext): Promise<void> {
    const logger = ctx.logger ?? console;

    const connector = await loadConnector(ctx.cwd);
    logger.log(chalk.bold.cyan('Connector loaded successfully'));

    if (connector.tools && Object.keys(connector.tools).length > 0) {
        logger.log(chalk.bold('\nTools:'));
        for (const [key, t] of Object.entries(connector.tools)) {
            const tool = t as any;
            logger.log(`  ${chalk.green(key)}: ${tool.name}`);
            if (tool.description) {
                logger.log(`    ${chalk.gray(tool.description)}`);
            }
            logger.log(`    ${chalk.gray(`Type: ${tool.kind}`)}`);
        }
    } else {
        logger.log(chalk.gray('\nNo tools defined.'));
    }

    logger.log('');
}

export async function runBuild(ctx: LinktoolCoreContext): Promise<void> {
    const logger = ctx.logger ?? console;

    logger.log(chalk.blue('📦 Building connector...'));

    const packageName = getPackageName(ctx.cwd);
    JSON.parse(readFileSync(join(ctx.cwd, 'package.json'), 'utf-8'));

    logger.log(chalk.gray(`Package: ${packageName}`));

    const distDir = join(ctx.cwd, 'dist');
    if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
    }

    const entryPoint = join(ctx.cwd, 'src/index.ts');
    if (!existsSync(entryPoint)) {
        throw new Error(`Entry point not found at ${entryPoint}`);
    }

    const esbuild = await import('esbuild');
    const result = await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        outfile: join(distDir, 'bundle.js'),
        platform: 'neutral',
        format: 'cjs',
        target: 'es2022',
        external: ['@mcplinx/connector-core'],
        minify: true,
        metafile: true,
    });

    if (result.errors.length > 0) {
        throw new Error(`Build failed with ${result.errors.length} error(s)`);
    }

    const outputSize = result.metafile?.outputs['dist/bundle.js']?.bytes || 0;
    logger.log(chalk.green(`✓ Bundled (${(outputSize / 1024).toFixed(2)} KB)`));

    logger.log('🔍 Scanning for config keys...');
    const bundleContent = readFileSync(join(distDir, 'bundle.js'), 'utf-8');
    const configSchema = extractConfigKeys(bundleContent);
    if (configSchema.env_keys.length > 0 || configSchema.secret_keys.length > 0) {
        logger.log(chalk.gray(`   Found ${configSchema.env_keys.length} env key(s), ${configSchema.secret_keys.length} secret key(s)`));
    }

    logger.log('📄 Loading connector metadata...');
    const connector = await loadConnector(ctx.cwd);

    if (connector.tools) {
        const toolKeys = Object.keys(connector.tools);
        logger.log(chalk.gray(`   Found ${toolKeys.length} tool(s)`));
        for (const key of toolKeys) {
            const tool = connector.tools[key];
            const hasInputFields = tool.inputFields && Array.isArray(tool.inputFields) && tool.inputFields.length > 0;
            logger.log(chalk.gray(`   - ${key}: ${hasInputFields ? `has ${tool.inputFields.length} inputFields` : 'no inputFields'}`));
        }
    }

    logger.log('📄 Generating manifest.json...');
    let authenticationConfig = connector.authentication;

    if (authenticationConfig?.type === 'oauth2') {
        const oauth2Config = authenticationConfig.oauth2Config || {};

        authenticationConfig = {
            ...authenticationConfig,
            oauth2Config: {
                authorizeUrl: oauth2Config.authorizeUrl || {},
                scopes: (oauth2Config.authorizeUrl as any)?.params?.scope?.split(' ') || [],
                autoRefresh: oauth2Config.autoRefresh,
            } as any,
        } as any;
    }

    const docsDir = join(ctx.cwd, 'docs');
    const docChunks: Array<{
        source: string;
        heading: string;
        headingLevel: number;
        content: string;
    }> = [];

    if (existsSync(docsDir)) {
        const indexPath = join(docsDir, 'index.md');

        if (!existsSync(indexPath)) {
            logger.log(chalk.yellow('⚠️  docs/index.md not found, skipping docs'));
        } else {
            logger.log(chalk.blue('📚 Processing docs...'));
            const allDocs = discoverDocs(indexPath, docsDir);
            logger.log(chalk.gray(`   Found ${allDocs.length} document(s)`));

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

                logger.log(chalk.gray(`   ${relativePath}: ${chunks.length} chunk(s)`));
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
            if (t.inputFields && Array.isArray(t.inputFields) && t.inputFields.length > 0) {
                toolEntry.inputFields = t.inputFields.map((field: any) => ({
                    key: field.key,
                    label: field.label || field.key,
                    type: field.type || 'string',
                    required: field.required || false,
                    helpText: field.helpText || null,
                    placeholder: field.placeholder || null,
                    dynamic: field.dynamic || null,
                })).filter((field: any) => field.key);
            }
            return toolEntry;
        }) : [],
        config_schema: configSchema,
        createdAt: new Date().toISOString(),
    };

    if (docChunks.length > 0) {
        manifest.hasDocs = true;
        manifest.docChunks = docChunks;
        logger.log(chalk.green(`✓ Generated ${docChunks.length} doc chunk(s)`));
    } else {
        manifest.hasDocs = false;
    }

    writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    logger.log(chalk.green('✓ Generated manifest.json'));
    logger.log(chalk.blue(`\nBuild complete! Output: ${distDir}`));
}

function extractConfigKeys(code: string): { env_keys: string[]; secret_keys: string[] } {
    const envKeys = [...code.matchAll(/\.vars\?\.([A-Z_][A-Z0-9_]*)/g)]
        .map((match) => match[1]);
    const secretKeys = [...code.matchAll(/\.secrets\?\.([A-Z_][A-Z0-9_]*)/g)]
        .map((match) => match[1]);

    return {
        env_keys: [...new Set(envKeys)].sort(),
        secret_keys: [...new Set(secretKeys)].sort(),
    };
}

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

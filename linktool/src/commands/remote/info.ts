import { Command } from 'commander';
import chalk from 'chalk';
import { createDeveloperApiClient, ApiError } from '../../lib/api-client.js';

export function infoCommand() {
    return new Command('info')
        .description('View connector package details')
        .argument('<pkg-id>', 'Connector package ID')
        .action(async (pkgId) => {
            try {
                const api = createDeveloperApiClient();

                console.log(chalk.blue(`📦 Fetching info for '${pkgId}'...`));

                // Fetch package details and versions using SDK
                const [pkg, versions] = await Promise.all([
                    api.developer.registryConnectorsDetail(pkgId),
                    api.developer.registryConnectorsVersionsDetail(pkgId)
                ]);

                // Display package info
                console.log(chalk.green('\n✓ Package Information:\n'));
                console.log(chalk.cyan(`  ${pkg.id}`));
                console.log(chalk.gray(`    Name: ${pkg.name}`));
                console.log(chalk.gray(`    Active Version: ${pkg.activeVersion || 'none'}`));
                console.log(chalk.gray(`    Visibility: ${pkg.visibility || 'private'}`));
                console.log(chalk.gray(`    Status: ${pkg.status || 'active'}`));
                if (pkg.description) {
                    console.log(chalk.gray(`    Description: ${pkg.description}`));
                }
                if (pkg.iconURL) {
                    console.log(chalk.gray(`    Icon: ${pkg.iconURL}`));
                }
                console.log(chalk.gray(`    Created: ${pkg.createdAt || 'unknown'}`));

                // Display versions
                if (versions.length > 0) {
                    console.log(chalk.green(`\n  Versions (${versions.length}):\n`));

                    for (const ver of versions) {
                        const isActive = ver.version === pkg.activeVersion ? chalk.green('★ ') : '  ';
                        console.log(`  ${isActive}${chalk.cyan(ver.version)}`);
                        console.log(chalk.gray(`      Bundle Size: ${formatBytes(ver.bundleSize || 0)}`));
                        console.log(chalk.gray(`      Tools: ${ver.toolCount || 0}`));
                        console.log(chalk.gray(`      Auth Type: ${ver.authType || 'none'}`));
                        console.log(chalk.gray(`      Created: ${ver.createdAt || 'unknown'}`));
                        console.log('');
                    }
                } else {
                    console.log(chalk.yellow('\n  No versions found.'));
                }

                console.log(chalk.gray(`\nRun 'syntool remote use ${pkgId} <version>' to change active version.`));

            } catch (error: any) {
                if (error instanceof ApiError) {
                    console.error(chalk.red('API Error:'), error.message);
                    if (error.statusCode === 404) {
                        console.error(chalk.yellow(`Connector '${pkgId}' not found or you don't have access to it.`));
                    } else if (error.statusCode === 401) {
                        console.error(chalk.yellow('Your session may have expired. Please run: syntool login'));
                    }
                } else {
                    console.error(chalk.red('Failed to fetch package info:'), error.message);
                }
                process.exit(1);
            }
        });
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

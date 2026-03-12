import { Command } from 'commander';
import chalk from 'chalk';
import { createDeveloperApiClient, ApiError } from '../../lib/api-client.js';

export function useCommand() {
    return new Command('use')
        .description('Set active version for a connector package')
        .argument('<pkg-id>', 'Connector package ID')
        .argument('<version>', 'Version to activate')
        .action(async (pkgId, version) => {
            try {
                const api = createDeveloperApiClient();

                console.log(chalk.blue(`🔄 Setting active version for '${pkgId}' to '${version}'...`));

                // Set active version using SDK
                const result = await api.developer.registryConnectorsActiveUpdate(pkgId, { version });

                console.log(chalk.green(`\n✓ Active version updated successfully!`));
                console.log(chalk.gray(`  Package: ${pkgId}`));
                console.log(chalk.gray(`  Active Version: ${version}`));

            } catch (error: any) {
                if (error instanceof ApiError) {
                    console.error(chalk.red('API Error:'), error.message);
                    if (error.statusCode === 404) {
                        console.error(chalk.yellow(`Connector '${pkgId}' or version '${version}' not found.`));
                    } else if (error.statusCode === 401) {
                        console.error(chalk.yellow('Your session may have expired. Please run: linktool login'));
                    }
                } else {
                    console.error(chalk.red('Failed to set active version:'), error.message);
                }
                process.exit(1);
            }
        });
}
